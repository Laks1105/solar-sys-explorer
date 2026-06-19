"""
gesture_server.py — Solar System Explorer Gesture Backend
===========================================================

Opens your webcam, tracks your hand with MediaPipe, classifies it into one of
the gestures the frontend understands, and serves the latest result over a
plain HTTP endpoint that React polls.

    Webcam -> MediaPipe (this script) -> http://localhost:5000/gesture -> React (polling)

RUN:
    python gesture_server.py

Your webcam light should turn on and you'll see:
    Backend running at http://localhost:5000/gesture

Stop with Ctrl+C in the terminal — it'll release the camera and free the port
cleanly before exiting.

GESTURES RECOGNIZED
    open_palm   - all fingers spread open      -> pan / rotate camera
    two_finger  - index + middle extended only -> zoom in
    fist        - all fingers curled           -> zoom out
    point       - only index finger extended   -> select a planet

CONFIG (edit the constants below if needed):
    CAMERA_INDEX        - if the wrong camera opens (or none does), try 1 or 2
    SHOW_PREVIEW        - debug window with landmarks drawn on your hand.
                           If this freezes/crashes (can happen on some macOS
                           setups since it runs off the main thread), set False.
    GESTURE_BUFFER_SIZE - frames averaged before a gesture is reported.
                           Higher = steadier but a touch more lag.
"""

import os
import time
import math
import threading
import urllib.request
from collections import deque, Counter

import cv2
from flask import Flask, jsonify
from flask_cors import CORS
from werkzeug.serving import make_server

import mediapipe as mp
from mediapipe.tasks import python as mp_python
from mediapipe.tasks.python.vision import HandLandmarker, HandLandmarkerOptions, RunningMode

# ── Config ───────────────────────────────────────────────────────────────
CAMERA_INDEX = 0
SHOW_PREVIEW = True
PORT = 5001  # 5000 is taken by macOS AirPlay Receiver — moved off it
GESTURE_BUFFER_SIZE = 4

MODEL_PATH = os.path.join(os.getcwd(), "hand_landmarker.task")
MODEL_URL = (
    "https://storage.googleapis.com/mediapipe-models/"
    "hand_landmarker/hand_landmarker/float16/latest/hand_landmarker.task"
)

# ── Shared state between the camera thread and the Flask thread ───────────
_latest_msg = {"gesture": "none", "landmarks": [], "pointer": None}
_lock = threading.Lock()
_stop_event = threading.Event()


# ── Download the model if it's not already on disk ─────────────────────────
def ensure_model():
    if not os.path.exists(MODEL_PATH):
        print("Downloading MediaPipe hand landmark model...")
        urllib.request.urlretrieve(MODEL_URL, MODEL_PATH)
        print("Model downloaded.")
    else:
        print("Model already present.")


# ── Camera helper ────────────────────────────────────────────────────────
def open_camera(preferred_index=0):
    indices = [preferred_index] + [i for i in (0, 1, 2) if i != preferred_index]
    for idx in indices:
        cap = cv2.VideoCapture(idx)
        if cap.isOpened():
            cap.set(cv2.CAP_PROP_FRAME_WIDTH, 640)
            cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 480)
            print(f"Camera opened at index {idx}")
            return cap
        cap.release()
    return None


# ── Gesture classification ──────────────────────────────────────────────
# Each finger is judged "extended" by comparing how far its tip is from the
# wrist versus how far its knuckle is from the wrist — this works regardless
# of whether your hand is upright, sideways, or tilted toward the camera (a
# plain up/down pixel comparison only works when the hand faces the camera
# squarely). Distances are normalized by the hand's own size (wrist to
# middle-knuckle), so it behaves the same whether your hand is close to or
# far from the camera.
def _dist(a, b):
    return math.hypot(a.x - b.x, a.y - b.y)


def classify_gesture(lm):
    wrist = lm[0]
    hand_size = _dist(wrist, lm[9])  # wrist -> middle-finger knuckle, a stable reference
    if hand_size < 1e-3:
        return "none"

    tips = [4, 8, 12, 16, 20]
    refs = [3, 6, 10, 14, 18]  # thumb IP joint, then index/middle/ring/pinky PIP joints

    extended = []
    for i, (t, r) in enumerate(zip(tips, refs)):
        if i == 0:
            # thumb: how far it has swung sideways away from its own IP joint
            spread = abs(lm[t].x - lm[r].x) / hand_size
            extended.append(spread > 0.35)
        else:
            # other fingers: extended tips sit farther from the wrist than their PIP joint
            extended.append(_dist(lm[t], wrist) > _dist(lm[r], wrist) * 1.15)

    thumb, index, middle, ring, pinky = extended
    n = sum(extended)

    if n == 0:
        return "fist"
    if n >= 4:
        return "open_palm"
    if index and middle and not ring and not pinky:
        return "two_finger"
    if index and not middle and not ring and not pinky:
        return "point"
    return "none"


# ── Camera loop (runs in a background thread) ──────────────────────────────
# Reads a frame, runs hand tracking, classifies the gesture, smooths it over
# the last few frames, and writes the result into _latest_msg for Flask to
# serve. The pointer position (used for the `point` gesture) follows your
# index fingertip.
def camera_loop():
    global _latest_msg

    cap = open_camera(CAMERA_INDEX)
    if cap is None:
        print("No camera found — check CAMERA_INDEX, or that no other app (Zoom, "
              "FaceTime, Photo Booth...) is holding the webcam.")
        return

    options = HandLandmarkerOptions(
        base_options=mp_python.BaseOptions(model_asset_path=MODEL_PATH),
        running_mode=RunningMode.IMAGE,
        num_hands=1,
        min_hand_detection_confidence=0.6,
        min_tracking_confidence=0.5,
    )
    detector = HandLandmarker.create_from_options(options)
    gesture_buffer = deque(maxlen=GESTURE_BUFFER_SIZE)

    print("Gesture loop started — show your hand to the camera")

    try:
        while not _stop_event.is_set():
            ret, frame = cap.read()
            if not ret:
                time.sleep(0.05)
                continue

            frame = cv2.flip(frame, 1)
            rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            mp_image = mp.Image(image_format=mp.ImageFormat.SRGB, data=rgb)
            result = detector.detect(mp_image)

            raw_gesture = "none"
            lm_list = []
            pointer = None

            if result.hand_landmarks:
                lm = result.hand_landmarks[0]
                raw_gesture = classify_gesture(lm)
                lm_list = [[p.x, p.y, p.z] for p in lm]
                pointer = {"x": lm[8].x, "y": lm[8].y}  # index fingertip

                if SHOW_PREVIEW:
                    h, w, _ = frame.shape
                    for p in lm:
                        cv2.circle(frame, (int(p.x * w), int(p.y * h)), 4, (0, 255, 0), -1)

            gesture_buffer.append(raw_gesture)
            gesture = Counter(gesture_buffer).most_common(1)[0][0]

            if SHOW_PREVIEW:
                cv2.putText(frame, gesture, (20, 40), cv2.FONT_HERSHEY_SIMPLEX,
                            1, (0, 255, 255), 2)
                # NOTE: imshow must run on the main thread on macOS — this function
                # is now called directly from __main__, not from a background thread.
                cv2.imshow("Gesture Control (close anytime, backend keeps running)", frame)
                cv2.waitKey(1)

            with _lock:
                _latest_msg = {"gesture": gesture, "landmarks": lm_list, "pointer": pointer}
    finally:
        cap.release()
        if SHOW_PREVIEW:
            cv2.destroyAllWindows()
        print("Gesture loop stopped, camera released")


# ── Flask app ────────────────────────────────────────────────────────────
# A single GET /gesture endpoint that always returns the most recent reading.
# React polls this directly — no websocket needed.
app = Flask(__name__)
CORS(app)


@app.route("/gesture")
def get_gesture():
    with _lock:
        return jsonify(_latest_msg)


@app.route("/health")
def health():
    return jsonify({"status": "ok"})


# ── Start / stop ─────────────────────────────────────────────────────────
_server = None
_server_thread = None


def start_flask(port=PORT):
    """Runs Flask in a background thread. Safe to call from the main thread
    because, unlike the camera/OpenCV window, Flask has no main-thread
    requirement."""
    global _server, _server_thread

    _server = make_server("0.0.0.0", port, app)
    _server_thread = threading.Thread(target=_server.serve_forever, daemon=True)
    _server_thread.start()

    print(f"Backend running at http://localhost:{port}/gesture")
    print("Your frontend's GestureContext should poll this URL every ~30ms.")


def stop_flask():
    global _server, _server_thread
    if _server is not None:
        _server.shutdown()
        _server = None
        _server_thread = None


# ── Entry point ──────────────────────────────────────────────────────────
if __name__ == "__main__":
    ensure_model()
    start_flask()
    try:
        camera_loop()  # blocks here, on the main thread, until Ctrl+C
    except KeyboardInterrupt:
        print("\nCtrl+C received, shutting down...")
    finally:
        _stop_event.set()
        stop_flask()
        print("Backend stopped, port freed.")