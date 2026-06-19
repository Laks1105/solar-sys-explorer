import { createContext, useContext, useEffect, useRef, useState } from "react";

const GestureCtx = createContext(null);

const ENDPOINT = "http://localhost:5001/gesture";
const POLL_MS = 33;        // ~30Hz, matches the notebook's camera loop
const FAILS_BEFORE_DISCONNECT = 3; // tolerate a couple of dropped polls before flipping the UI

export function GestureProvider({ children }) {
  const [state, setState] = useState({
    gesture: "none",
    landmarks: [],
    pointer: null,
    wsConnected: false,
  });
  const failCount = useRef(0);

  useEffect(() => {
    let cancelled = false;
    let timer;

    const poll = async () => {
      try {
        const res = await fetch(ENDPOINT, { cache: "no-store" });
        if (!res.ok) throw new Error(`bad response: ${res.status}`);
        const data = await res.json();
        failCount.current = 0;
        if (!cancelled) {
          setState({
            gesture: data.gesture ?? "none",
            landmarks: data.landmarks ?? [],
            pointer: data.pointer ?? null,
            wsConnected: true,
          });
        }
      } catch {
        failCount.current += 1;
        if (!cancelled && failCount.current >= FAILS_BEFORE_DISCONNECT) {
          setState(s => ({ ...s, gesture: "none", pointer: null, wsConnected: false }));
        }
      } finally {
        if (!cancelled) timer = setTimeout(poll, POLL_MS);
      }
    };

    poll();
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, []);

  return <GestureCtx.Provider value={state}>{children}</GestureCtx.Provider>;
}

export function useGesture() {
  return useContext(GestureCtx);
}