import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { useGesture } from "./GestureContext";

// ── Planet data ────────────────────────────────────────────────────────────────
const PLANETS = [
  { name:"MERCURY", dist:5.5,  size:0.22, speed:0.047, color:0x9e9e9e, emissive:0x3a3535, roughness:0.9, metalness:0.1, type:"Rocky Planet", info:{dist:"57.9M km",  moons:0,   temp:"+167°C",day:"58.6d", year:"88d"   }, rings:false, clouds:false },
  { name:"VENUS",   dist:8.5,  size:0.38, speed:0.035, color:0xe8cda0, emissive:0x3a1a00, roughness:0.8, metalness:0.0, type:"Rocky Planet", info:{dist:"108.2M km", moons:0,   temp:"+462°C",day:"243d",  year:"225d"  }, rings:false, clouds:true  },
  { name:"EARTH",   dist:7.2,  size:0.42, speed:0.029, color:0x2a6fd6, emissive:0x001a3a, roughness:0.6, metalness:0.1, type:"Rocky Planet", info:{dist:"149.6M km", moons:1,   temp:"+15°C", day:"24h",   year:"365d"  }, rings:false, clouds:true  },
  { name:"MARS",    dist:9.8,  size:0.30, speed:0.024, color:0xc1440e, emissive:0x3a0800, roughness:0.9, metalness:0.0, type:"Rocky Planet", info:{dist:"227.9M km", moons:2,   temp:"-60°C", day:"24.6h", year:"687d"  }, rings:false, clouds:false },
  { name:"JUPITER", dist:16.5, size:1.20, speed:0.013, color:0xc88b3a, emissive:0x281200, roughness:0.5, metalness:0.1, type:"Gas Giant",    info:{dist:"778.5M km", moons:95,  temp:"-108°C",day:"9.9h",  year:"11.86y"}, rings:false, clouds:true  },
  { name:"SATURN",  dist:22.5, size:0.95, speed:0.009, color:0xe4d191, emissive:0x282400, roughness:0.5, metalness:0.1, type:"Gas Giant",    info:{dist:"1.43B km",  moons:146, temp:"-138°C",day:"10.7h", year:"29.5y" }, rings:true,  clouds:false },
  { name:"URANUS",  dist:29.0, size:0.62, speed:0.006, color:0x7de8e8, emissive:0x002828, roughness:0.4, metalness:0.2, type:"Ice Giant",    info:{dist:"2.87B km",  moons:28,  temp:"-195°C",day:"17.2h", year:"84y"   }, rings:false, clouds:true  },
  { name:"NEPTUNE", dist:36.0, size:0.58, speed:0.005, color:0x3f54d1, emissive:0x000f38, roughness:0.4, metalness:0.2, type:"Ice Giant",    info:{dist:"4.50B km",  moons:16,  temp:"-200°C",day:"16h",   year:"164.8y"}, rings:false, clouds:false },
];

// ── Dwarf planets (Kuiper Belt + Ceres) ─────────────────────────────────────────
const DWARF_PLANETS = [
  { name:"CERES",   dist:12.6, size:0.10, speed:0.018, color:0x9a9488, emissive:0x1a1814, roughness:0.95, metalness:0.0, type:"Dwarf Planet (Asteroid Belt)", info:{dist:"414M km",   moons:0, temp:"-105°C", day:"9h",    year:"4.6y"  } },
  { name:"PLUTO",    dist:46.0, size:0.16, speed:0.0028,color:0xd9c2a3, emissive:0x241c12, roughness:0.85, metalness:0.0, type:"Dwarf Planet (Kuiper Belt)",   info:{dist:"5.91B km",  moons:5, temp:"-225°C", day:"6.4d",  year:"248y"  } },
  { name:"HAUMEA",   dist:51.5, size:0.12, speed:0.0024,color:0xcfcfd6, emissive:0x1c1c20, roughness:0.7,  metalness:0.0, type:"Dwarf Planet (Kuiper Belt)",   info:{dist:"6.45B km",  moons:2, temp:"-241°C", day:"3.9h",  year:"285y"  } },
  { name:"MAKEMAKE", dist:55.0, size:0.13, speed:0.0021,color:0xb89070, emissive:0x1d150c, roughness:0.9,  metalness:0.0, type:"Dwarf Planet (Kuiper Belt)",   info:{dist:"6.85B km",  moons:1, temp:"-239°C", day:"22.5h", year:"305y"  } },
  { name:"ERIS",     dist:64.0, size:0.13, speed:0.0017,color:0xe8e4da, emissive:0x201f1c, roughness:0.6,  metalness:0.0, type:"Dwarf Planet (Scattered Disk)",info:{dist:"10.1B km",  moons:1, temp:"-243°C", day:"25.9h", year:"559y"  } },
];

// ── Notable moons shown as labeled satellites (beyond Earth's Moon) ────────────
const EXTRA_MOONS = [
  { name:"TITAN",   parent:"SATURN",  size:0.085, orbitR:1.55, speed:0.9,  color:0xc99a4a },
  { name:"EUROPA",  parent:"JUPITER", size:0.06,  orbitR:1.65, speed:1.3,  color:0xcdbfa0 },
  { name:"TRITON",  parent:"NEPTUNE", size:0.07,  orbitR:1.35, speed:-1.1, color:0xb9c6d6 },
];

// ── Nearby stars (deep zoom field, matches reference constellation view) ───────
const NEARBY_STARS = [
  { name:"RASALHAGUE", ra: 0.55, dec: 0.55, dist:0.92, color:0xbfd8ff },
  { name:"ARCTURUS",   ra: 0.95, dec: 0.42, dist:0.97, color:0xffd9a0 },
  { name:"DENEBOLA",   ra: 1.25, dec: 0.18, dist:0.85, color:0xeaf2ff },
  { name:"REGULUS",    ra: 1.55, dec:-0.30, dist:1.00, color:0xcfe0ff },
  { name:"POLLUX",     ra: 1.35, dec:-0.55, dist:0.78, color:0xffdfae },
  { name:"CAPELLA",    ra: 0.30, dec:-0.62, dist:0.83, color:0xfff2cf },
  { name:"FOMALHAUT",  ra:-0.20, dec:-0.68, dist:0.90, color:0xcfe8ff },
  { name:"HAMAL",      ra:-0.55, dec:-0.40, dist:0.80, color:0xffe6c2 },
  { name:"MENKALINAN", ra: 0.05, dec: 0.85, dist:0.95, color:0xeaf0ff },
  { name:"24 ETA CAS", ra:-0.05, dec: 0.32, dist:0.55, color:0xdfe8ff },
];

const GESTURE_META = {
  open_palm:  { label:"OPEN PALM",  action:"Pan / Rotate",  color:"#00e678" },
  two_finger: { label:"2-FINGER",   action:"Zoom in",       color:"#ffaa00" },
  fist:       { label:"FIST",       action:"Zoom out",      color:"#6655ff" },
  point:      { label:"POINT",      action:"Select planet", color:"#ffd200" },
  none:       { label:"—",          action:"",              color:"#555566" },
};

// ── Zoom tiers ───────────────────────────────────────────────────────────────
// Camera distance ranges that progressively reveal larger structures.
// The Sun + inner solar system is the most-zoomed-in state; zooming out
// reveals the Kuiper Belt / dwarf planets, then the Oort Cloud + nearby
// stars, then finally the Milky Way galaxy at maximum zoom-out.
const ZOOM = {
  MIN: 5,
  MAX: 4200,
  SOLAR_SYS_MAX: 150,      // existing planets/asteroid belt fully solid below this
  KUIPER_FADE_START: 60,   // dwarf planets / kuiper belt begin fading in
  KUIPER_FADE_END: 140,
  KUIPER_MAX: 600,         // kuiper belt still visible up to here
  OORT_FADE_START: 220,
  OORT_FADE_END: 480,
  OORT_MAX: 1700,
  STARS_FADE_START: 380,
  STARS_FADE_END: 900,
  GALAXY_FADE_START: 1300,
  GALAXY_FADE_END: 2400,

  // Labels disappear earlier than the bodies themselves so that once you've
  // pulled back far enough to see the *next* tier's structure, only the Sun
  // stays labeled at the center — individual planet/dwarf-planet names don't
  // clutter the wider view.
  PLANET_LABELS_FADE_END: 90,    // inner planet names gone by here
  DWARF_LABELS_FADE_END: 380,    // kuiper belt object names gone by here
};

function clamp01(v) { return Math.max(0, Math.min(1, v)); }
function smoothFade(zoom, start, end) { return clamp01((zoom - start) / Math.max(1e-6, end - start)); }

// ── Texture helpers ────────────────────────────────────────────────────────────
function makePlanetTex(name, hex) {
  const S = 512;
  const c = document.createElement("canvas");
  c.width = c.height = S;
  const ctx = c.getContext("2d");
  const r = (hex >> 16) & 0xff, g = (hex >> 8) & 0xff, b = hex & 0xff;
  ctx.fillStyle = `rgb(${r},${g},${b})`;
  ctx.fillRect(0, 0, S, S);
  if (["JUPITER","SATURN","URANUS","NEPTUNE"].includes(name)) {
    for (let i = 0; i < 18; i++) {
      const y = (i / 18) * S, h = S / 18, v = (Math.random() - 0.5) * 40;
      ctx.fillStyle = `rgba(${(r+v)|0},${(g+v)|0},${(b+v)|0},0.45)`;
      ctx.fillRect(0, y, S, h);
    }
  }
  for (let i = 0; i < 3000; i++) {
    const v = (Math.random() - 0.5) * 60;
    ctx.fillStyle = `rgba(${(r+v)|0},${(g+v)|0},${(b+v)|0},0.40)`;
    ctx.fillRect(Math.random() * S, Math.random() * S, 2, 2);
  }
  if (["MERCURY","MARS","EARTH"].includes(name)) {
    for (let i = 0; i < 12; i++) {
      ctx.beginPath();
      ctx.arc(Math.random()*S, Math.random()*S, 4 + Math.random()*20, 0, Math.PI*2);
      ctx.strokeStyle = "rgba(0,0,0,0.25)";
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }
  }
  return new THREE.CanvasTexture(c);
}

// Small rough rocky texture for dwarf planets (cratered, no atmosphere bands)
function makeDwarfTex(hex) {
  const S = 256;
  const c = document.createElement("canvas");
  c.width = c.height = S;
  const ctx = c.getContext("2d");
  const r = (hex >> 16) & 0xff, g = (hex >> 8) & 0xff, b = hex & 0xff;
  ctx.fillStyle = `rgb(${r},${g},${b})`;
  ctx.fillRect(0, 0, S, S);
  for (let i = 0; i < 1600; i++) {
    const v = (Math.random() - 0.5) * 50;
    ctx.fillStyle = `rgba(${(r+v)|0},${(g+v)|0},${(b+v)|0},0.4)`;
    ctx.fillRect(Math.random() * S, Math.random() * S, 1.5, 1.5);
  }
  for (let i = 0; i < 22; i++) {
    ctx.beginPath();
    ctx.arc(Math.random()*S, Math.random()*S, 2 + Math.random()*10, 0, Math.PI*2);
    ctx.strokeStyle = "rgba(0,0,0,0.3)";
    ctx.lineWidth = 1;
    ctx.stroke();
  }
  return new THREE.CanvasTexture(c);
}

function makeCloudTex() {
  const c = document.createElement("canvas");
  c.width = c.height = 512;
  const ctx = c.getContext("2d");
  for (let i = 0; i < 40; i++) {
    const x = Math.random()*512, y = Math.random()*512;
    const w = 40 + Math.random()*120, h = 10 + Math.random()*30;
    const gr = ctx.createRadialGradient(x, y, 0, x, y, w*0.6);
    gr.addColorStop(0, "rgba(255,255,255,0.18)");
    gr.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = gr;
    ctx.beginPath();
    ctx.ellipse(x, y, w*0.6, h*0.6, Math.random()*Math.PI, 0, Math.PI*2);
    ctx.fill();
  }
  return new THREE.CanvasTexture(c);
}

// Galaxy disc texture: bright core + spiral arm dust lanes, like reference image
function makeGalaxyTex() {
  const S = 1536;
  const c = document.createElement("canvas");
  c.width = c.height = S;
  const ctx = c.getContext("2d");
  const cx = S/2, cy = S/2;
  ctx.fillStyle = "rgba(0,0,0,0)";
  ctx.fillRect(0,0,S,S);

  // ── Faint outer halo (very diffuse, large) ─────────────────────────────
  const halo = ctx.createRadialGradient(cx,cy,0,cx,cy,S*0.52);
  halo.addColorStop(0,   "rgba(140,150,210,0.05)");
  halo.addColorStop(0.7, "rgba(90,100,170,0.035)");
  halo.addColorStop(1,   "rgba(60,70,140,0)");
  ctx.fillStyle = halo;
  ctx.beginPath(); ctx.arc(cx,cy,S*0.52,0,Math.PI*2); ctx.fill();

  // ── Broad disc glow (galactic plane) ───────────────────────────────────
  const disc = ctx.createRadialGradient(cx,cy,0,cx,cy,S*0.38);
  disc.addColorStop(0,   "rgba(255,230,190,0.30)");
  disc.addColorStop(0.35,"rgba(230,205,210,0.16)");
  disc.addColorStop(0.7, "rgba(170,180,225,0.09)");
  disc.addColorStop(1,   "rgba(120,140,210,0)");
  ctx.fillStyle = disc;
  ctx.beginPath(); ctx.arc(cx,cy,S*0.38,0,Math.PI*2); ctx.fill();

  // ── Spiral structure: 2 dominant arms + 2 minor, drawn as dense star
  //    fields that thin and bluen toward the edge, with dust lanes ──────
  const drawArmStars = (baseAngle, windCount, density, hueShiftFn, widthFn) => {
    for (let i = 0; i < density; i++) {
      const t = Math.pow(i / density, 0.85); // bias toward outer radius for realistic density falloff
      const radius = t * S * 0.46;
      const angle = baseAngle + t * windCount * Math.PI * 2 * 0.5 + (Math.random()-0.5)*0.12;
      const width = widthFn(t);
      const spread = (Math.random()-0.5) * width;
      const perp = angle + Math.PI/2;
      const x = cx + Math.cos(angle)*radius + Math.cos(perp)*spread;
      const y = cy + Math.sin(angle)*radius + Math.sin(perp)*spread;
      const edgeFade = 1 - Math.pow(t, 1.6);
      const [r,g,b] = hueShiftFn(t);
      const a = (0.06 + edgeFade*0.30) * (0.5 + Math.random()*0.7);
      const size = t < 0.15 ? 2.2 : 1.1 + Math.random()*1.1;
      ctx.fillStyle = `rgba(${r},${g},${b},${a.toFixed(3)})`;
      ctx.fillRect(x, y, size, size);
    }
  };

  // Major arms: warm near core fading to cool blue-white star-forming regions outward
  const majorHue = (t) => {
    const core = [255, 224, 180];
    const mid  = [235, 220, 225];
    const edge = [175, 200, 255];
    if (t < 0.4) {
      const k = t/0.4;
      return [core[0]+(mid[0]-core[0])*k, core[1]+(mid[1]-core[1])*k, core[2]+(mid[2]-core[2])*k].map(v=>v|0);
    }
    const k = (t-0.4)/0.6;
    return [mid[0]+(edge[0]-mid[0])*k, mid[1]+(edge[1]-mid[1])*k, mid[2]+(edge[2]-mid[2])*k].map(v=>v|0);
  };
  drawArmStars(0.3,            2.1, 7000, majorHue, t => 26 + t*120);
  drawArmStars(0.3 + Math.PI,  2.1, 7000, majorHue, t => 26 + t*120);
  // Minor arms: sparser, slightly offset
  drawArmStars(0.3 + 1.7,      2.0, 2600, majorHue, t => 18 + t*90);
  drawArmStars(0.3 + 1.7+Math.PI, 2.0, 2600, majorHue, t => 18 + t*90);

  // ── Dust lanes: dark reddish-brown streaks tracing just inside each arm ──
  const drawDustLane = (baseAngle, windCount) => {
    ctx.save();
    ctx.globalCompositeOperation = "multiply";
    for (let i = 0; i < 1400; i++) {
      const t = Math.pow(i/1400, 0.7);
      const radius = t * S * 0.44;
      const angle = baseAngle + t * windCount * Math.PI * 2 * 0.5 + 0.05 + (Math.random()-0.5)*0.05;
      const spread = (Math.random()-0.5) * (8 + t*30);
      const perp = angle + Math.PI/2;
      const x = cx + Math.cos(angle)*radius + Math.cos(perp)*spread;
      const y = cy + Math.sin(angle)*radius + Math.sin(perp)*spread;
      const fade = 1 - t*0.6;
      ctx.fillStyle = `rgba(60,40,35,${(0.10*fade).toFixed(3)})`;
      ctx.fillRect(x, y, 2.4, 2.4);
    }
    ctx.restore();
  };
  drawDustLane(0.3, 2.1);
  drawDustLane(0.3 + Math.PI, 2.1);

  // ── Bright core with central bulge glow ────────────────────────────────
  const core = ctx.createRadialGradient(cx,cy,0,cx,cy,S*0.10);
  core.addColorStop(0,    "rgba(255,248,225,0.98)");
  core.addColorStop(0.45, "rgba(255,230,185,0.65)");
  core.addColorStop(1,    "rgba(255,210,150,0)");
  ctx.fillStyle = core;
  ctx.beginPath(); ctx.arc(cx,cy,S*0.10,0,Math.PI*2); ctx.fill();
  // tight bright nucleus
  const nucleus = ctx.createRadialGradient(cx,cy,0,cx,cy,S*0.022);
  nucleus.addColorStop(0, "rgba(255,255,245,1)");
  nucleus.addColorStop(1, "rgba(255,240,210,0)");
  ctx.fillStyle = nucleus;
  ctx.beginPath(); ctx.arc(cx,cy,S*0.022,0,Math.PI*2); ctx.fill();

  // ── Scattered foreground/background field stars across whole disc ──────
  for (let i = 0; i < 1400; i++) {
    const r = Math.pow(Math.random(), 0.5) * S * 0.5;
    const ang = Math.random()*Math.PI*2;
    const x = cx + Math.cos(ang)*r, y = cy + Math.sin(ang)*r;
    const tw = Math.random();
    const col = tw < 0.7 ? "255,255,255" : tw < 0.9 ? "200,215,255" : "255,225,190";
    ctx.fillStyle = `rgba(${col},${0.2+Math.random()*0.5})`;
    ctx.fillRect(x, y, 1 + Math.random()*0.6, 1 + Math.random()*0.6);
  }

  return new THREE.CanvasTexture(c);
}

// ── Shooting star helpers ──────────────────────────────────────────────────────
function makeShootingStar(scene) {
  const pts = [new THREE.Vector3(0,0,0), new THREE.Vector3(1,0,0)];
  const geo = new THREE.BufferGeometry().setFromPoints(pts);
  const mat = new THREE.LineBasicMaterial({ transparent: true, opacity: 0, color: 0xffffff });
  const line = new THREE.Line(geo, mat);
  scene.add(line);
  return { line, geo, active:false, t:0, duration:0, start:new THREE.Vector3(), dir:new THREE.Vector3() };
}

function fireShootingStar(star) {
  const theta = Math.random() * Math.PI * 2;
  const phi   = Math.random() * 0.5;
  const R = 80 + Math.random() * 40;
  star.start.set(R*Math.sin(phi)*Math.cos(theta), R*Math.cos(phi)*0.6+10, R*Math.sin(phi)*Math.sin(theta));
  star.dir.set((Math.random()-0.5)*2, -0.6-Math.random()*0.4, (Math.random()-0.5)*2)
    .normalize().multiplyScalar(15 + Math.random()*12);
  star.duration = 0.6 + Math.random()*0.5;
  star.t = 0; star.active = true; star.line.material.opacity = 1;
}

function updateShootingStar(star, dt) {
  if (!star.active) return;
  star.t += dt;
  const prog = Math.min(star.t / star.duration, 1);
  const headPos = star.start.clone().add(star.dir.clone().multiplyScalar(prog));
  const tailPos = star.start.clone().add(star.dir.clone().multiplyScalar(Math.max(0, prog - 0.35)));
  const pos = star.geo.attributes.position;
  pos.setXYZ(0, tailPos.x, tailPos.y, tailPos.z);
  pos.setXYZ(1, headPos.x, headPos.y, headPos.z);
  pos.needsUpdate = true;
  star.line.material.opacity = prog > 0.7 ? (1-(prog-0.7)/0.3)*0.9 : 0.9;
  if (prog >= 1) { star.active = false; star.line.material.opacity = 0; }
}

// ── Main component ─────────────────────────────────────────────────────────────
export default function SolarSystem() {
  const mountRef   = useRef(null);
  const threeRef   = useRef({});
  const gestureCtx = useGesture();
  const gestureRef = useRef(gestureCtx);

  const S = useRef({
    rotX: 0.18, rotY: 0, zoom: 55,
    targetRotX: 0.18, targetRotY: 0, targetZoom: 55,
    simSpeed: 1.0, paused: false,
    angles: PLANETS.map((_, i) => (i / PLANETS.length) * Math.PI * 2),
    dwarfAngles: DWARF_PLANETS.map((_, i) => (i / DWARF_PLANETS.length) * Math.PI * 2),
    selectedPlanet: null,
    selectedKind: null, // "planet" | "dwarf"
    lastPalmX: null, lastPalmY: null,
    lastPinchD: null, lastTwoDist: null,
    prevGesture: "none",
    isDragging: false, lastMouseX: 0, lastMouseY: 0,
    fps: 60, lastTime: performance.now(),
    elapsedTime: 0,
    nextShootStar: 3 + Math.random() * 5,
  });

  const [ui, setUi] = useState({
    gesture: "none", fps: 60, selectedPlanet: null, selectedKind: null,
    simSpeed: 1.0, paused: false, wsConnected: false, zoom: 55,
  });
  const [infoPanelMinimized, setInfoPanelMinimized] = useState(false);

  useEffect(() => { gestureRef.current = gestureCtx; }, [gestureCtx]);

  useEffect(() => {
    const el = mountRef.current;
    if (!el) return;
    const W = el.clientWidth, H = el.clientHeight;
    const state = S.current;

    // ── Renderer ────────────────────────────────────────────────────────────
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setSize(W, H);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.0;
    el.appendChild(renderer.domElement);

    // ── Scene ───────────────────────────────────────────────────────────────
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000008);

    // ── Camera ──────────────────────────────────────────────────────────────
    const camera = new THREE.PerspectiveCamera(45, W / H, 0.01, 20000);

    // ── Lighting (bright) ───────────────────────────────────────────────────
    scene.add(new THREE.AmbientLight(0x3a3a6a, 2.5));
    const sunLight = new THREE.PointLight(0xfff5e0, 12.0, 800);
    sunLight.castShadow = true;
    scene.add(sunLight);
    const dirLight = new THREE.DirectionalLight(0x6688cc, 1.2);
    dirLight.position.set(-10, 5, -10);
    scene.add(dirLight);
    const fillLight = new THREE.DirectionalLight(0x223366, 0.9);
    fillLight.position.set(10, -5, 10);
    scene.add(fillLight);

    // ── Background starfield (near) ────────────────────────────────────────
    const starGeo = new THREE.BufferGeometry();
    const sp = [], sc = [];
    for (let i = 0; i < 8000; i++) {
      const r = 150 + Math.random()*500;
      const th = Math.acos(2*Math.random()-1), ph = Math.random()*Math.PI*2;
      sp.push(r*Math.sin(th)*Math.cos(ph), r*Math.sin(th)*Math.sin(ph), r*Math.cos(th));
      const v = 0.5 + Math.random()*0.5;
      sc.push(v, v, Math.min(1, v*1.1));
    }
    starGeo.setAttribute("position", new THREE.Float32BufferAttribute(sp, 3));
    starGeo.setAttribute("color",    new THREE.Float32BufferAttribute(sc, 3));
    scene.add(new THREE.Points(starGeo,
      new THREE.PointsMaterial({ size:0.4, vertexColors:true, sizeAttenuation:true, transparent:true, opacity:0.85 })));

    // ── Far backdrop starfield (for deep-zoom tiers, much larger radius) ────
    const farStarGeo = new THREE.BufferGeometry();
    const fsp = [], fsc = [];
    for (let i = 0; i < 6000; i++) {
      const r = 1200 + Math.random()*3000;
      const th = Math.acos(2*Math.random()-1), ph = Math.random()*Math.PI*2;
      fsp.push(r*Math.sin(th)*Math.cos(ph), r*Math.sin(th)*Math.sin(ph), r*Math.cos(th));
      const v = 0.4 + Math.random()*0.6;
      fsc.push(v, v, Math.min(1, v*1.05));
    }
    farStarGeo.setAttribute("position", new THREE.Float32BufferAttribute(fsp, 3));
    farStarGeo.setAttribute("color",    new THREE.Float32BufferAttribute(fsc, 3));
    const farStarsMat = new THREE.PointsMaterial({ size:1.4, vertexColors:true, sizeAttenuation:true, transparent:true, opacity:0 });
    const farStarsPoints = new THREE.Points(farStarGeo, farStarsMat);
    scene.add(farStarsPoints);

    // ── Sun ─────────────────────────────────────────────────────────────────
    const sunMesh = new THREE.Mesh(
      new THREE.SphereGeometry(1.6, 64, 64),
      new THREE.MeshStandardMaterial({ color:0xff8800, emissive:0xff6600, emissiveIntensity:3.0, roughness:0.2 })
    );
    scene.add(sunMesh);
    // Glow halos
    [2.2, 2.8, 3.5, 4.3].forEach((r, i) => {
      scene.add(new THREE.Mesh(
        new THREE.SphereGeometry(r, 32, 32),
        new THREE.MeshBasicMaterial({
          color: new THREE.Color(`hsl(38,100%,${70-i*14}%)`),
          transparent:true, opacity:0.08-i*0.012, side:THREE.BackSide,
        })
      ));
    });

    // Sun HTML label
    const sunLabelDiv = document.createElement("div");
    sunLabelDiv.textContent = "SUN";
    sunLabelDiv.style.cssText = `
      position:absolute; color:#ffcc44;
      font-family:'Helvetica Neue',Arial,sans-serif;
      font-size:11px; font-weight:300; letter-spacing:3px;
      pointer-events:none; white-space:nowrap;
      text-shadow:0 0 10px rgba(255,200,60,0.8);
      opacity:0.9; transform:translate(-50%, 28px); font-size:9px; letter-spacing:2px;
    `;
    el.appendChild(sunLabelDiv);

    // ── Ecliptic grid ────────────────────────────────────────────────────────
    const gridMat = new THREE.LineBasicMaterial({ color:0x1a3a7a, transparent:true, opacity:0.25 });
    const gridLines = [];
    for (let v = -40; v <= 40; v += 4) {
      const l1 = new THREE.Line(new THREE.BufferGeometry().setFromPoints(
        [new THREE.Vector3(v,0,-40), new THREE.Vector3(v,0,40)]), gridMat);
      const l2 = new THREE.Line(new THREE.BufferGeometry().setFromPoints(
        [new THREE.Vector3(-40,0,v), new THREE.Vector3(40,0,v)]), gridMat);
      scene.add(l1); scene.add(l2);
      gridLines.push(l1, l2);
    }

    // ── Wide outer grid (visible at Kuiper/Oort tiers, like reference shot) ──
    const outerGridMat = new THREE.LineBasicMaterial({ color:0x1a3a7a, transparent:true, opacity:0 });
    const outerGridLines = [];
    for (let v = -640; v <= 640; v += 40) {
      const l1 = new THREE.Line(new THREE.BufferGeometry().setFromPoints(
        [new THREE.Vector3(v,0,-640), new THREE.Vector3(v,0,640)]), outerGridMat);
      const l2 = new THREE.Line(new THREE.BufferGeometry().setFromPoints(
        [new THREE.Vector3(-640,0,v), new THREE.Vector3(640,0,v)]), outerGridMat);
      scene.add(l1); scene.add(l2);
      outerGridLines.push(l1, l2);
    }

    // ── Asteroid belt ────────────────────────────────────────────────────────
    const astGeo = new THREE.BufferGeometry();
    const ap = [], ac = [];
    for (let i = 0; i < 1500; i++) {
      const r = 11.5 + Math.random()*1.2, a = Math.random()*Math.PI*2;
      ap.push(Math.cos(a)*r, (Math.random()-0.5)*0.22, Math.sin(a)*r);
      const gv = 0.22 + Math.random()*0.28;
      ac.push(gv, gv*0.95, gv*0.88);
    }
    astGeo.setAttribute("position", new THREE.Float32BufferAttribute(ap, 3));
    astGeo.setAttribute("color",    new THREE.Float32BufferAttribute(ac, 3));
    scene.add(new THREE.Points(astGeo, new THREE.PointsMaterial({ size:0.06, vertexColors:true })));

    // ── Kuiper belt (sparse ring beyond Neptune, fades in on zoom-out) ──────
    const kuiperGeo = new THREE.BufferGeometry();
    const kp = [], kc = [];
    for (let i = 0; i < 2600; i++) {
      const r = 42 + Math.random()*34, a = Math.random()*Math.PI*2;
      kp.push(Math.cos(a)*r, (Math.random()-0.5)*1.6, Math.sin(a)*r);
      const gv = 0.45 + Math.random()*0.3;
      kc.push(gv*0.85, gv*0.88, gv);
    }
    kuiperGeo.setAttribute("position", new THREE.Float32BufferAttribute(kp, 3));
    kuiperGeo.setAttribute("color",    new THREE.Float32BufferAttribute(kc, 3));
    const kuiperMat = new THREE.PointsMaterial({ size:0.10, vertexColors:true, transparent:true, opacity:0 });
    const kuiperPoints = new THREE.Points(kuiperGeo, kuiperMat);
    scene.add(kuiperPoints);

    // Kuiper belt label
    const kuiperLabelDiv = document.createElement("div");
    kuiperLabelDiv.textContent = "KUIPER BELT";
    kuiperLabelDiv.style.cssText = `
      position:absolute; color:#8fb8ff; font-family:'Helvetica Neue',Arial,sans-serif;
      font-size:9px; font-weight:300; letter-spacing:3px; pointer-events:none;
      white-space:nowrap; text-shadow:0 0 8px rgba(120,170,255,0.7);
      opacity:0; transition:opacity 0.3s;
    `;
    el.appendChild(kuiperLabelDiv);

    // ── Oort Cloud (huge sparse spherical shell, far zoom only) ─────────────
    const oortGeo = new THREE.BufferGeometry();
    const op = [], oc = [];
    for (let i = 0; i < 3500; i++) {
      const r = 280 + Math.random()*320;
      const th = Math.acos(2*Math.random()-1), ph = Math.random()*Math.PI*2;
      op.push(r*Math.sin(th)*Math.cos(ph), r*Math.sin(th)*Math.sin(ph)*0.6, r*Math.cos(th));
      const gv = 0.5 + Math.random()*0.35;
      oc.push(gv*0.9, gv*0.93, gv);
    }
    oortGeo.setAttribute("position", new THREE.Float32BufferAttribute(op, 3));
    oortGeo.setAttribute("color",    new THREE.Float32BufferAttribute(oc, 3));
    const oortMat = new THREE.PointsMaterial({ size:0.9, vertexColors:true, transparent:true, opacity:0 });
    const oortPoints = new THREE.Points(oortGeo, oortMat);
    scene.add(oortPoints);

    const oortLabelDiv = document.createElement("div");
    oortLabelDiv.textContent = "OORT CLOUD";
    oortLabelDiv.style.cssText = `
      position:absolute; color:#aad4ff; font-family:'Helvetica Neue',Arial,sans-serif;
      font-size:10px; font-weight:300; letter-spacing:4px; pointer-events:none;
      white-space:nowrap; text-shadow:0 0 10px rgba(150,200,255,0.7);
      opacity:0; transition:opacity 0.3s;
    `;
    el.appendChild(oortLabelDiv);

    // ── Distance/scale rule, right edge (like reference UI) ─────────────────
    const scaleLabelDiv = document.createElement("div");
    scaleLabelDiv.style.cssText = `
      position:absolute; right:14px; top:60px; color:rgba(180,210,255,0.55);
      font-family:'Helvetica Neue',Arial,sans-serif; font-size:10px; font-weight:300;
      letter-spacing:2px; pointer-events:none; text-align:right;
      writing-mode: vertical-rl;
    `;
    el.appendChild(scaleLabelDiv);

    // ── Meteoroids ───────────────────────────────────────────────────────────
    const meteoroidMeshes = [], meteoroidStates = [];
    for (let i = 0; i < 30; i++) {
      const angle  = Math.random()*Math.PI*2;
      const radius = 11.4 + Math.random()*1.6;
      const yOff   = (Math.random()-0.5)*0.5;
      const size   = 0.04 + Math.random()*0.10;
      const gv = 0.3 + Math.random()*0.35;
      const mesh = new THREE.Mesh(
        new THREE.IcosahedronGeometry(size, 0),
        new THREE.MeshStandardMaterial({ color:new THREE.Color(gv,gv*0.95,gv*0.88), roughness:0.9, metalness:0.05 })
      );
      mesh.position.set(Math.cos(angle)*radius, yOff, Math.sin(angle)*radius);
      scene.add(mesh);
      meteoroidMeshes.push(mesh);
      meteoroidStates.push({
        angle, radius, yOff,
        speed: 0.010 + Math.random()*0.008,
        tumbleAxis: new THREE.Vector3(Math.random()-0.5, Math.random()-0.5, Math.random()-0.5).normalize(),
        tumbleSpeed: (Math.random()-0.5)*4.0,
      });
    }

    // ── Orbit rings + Planet meshes + HTML labels ────────────────────────────
    const cloudTex    = makeCloudTex();
    const planetMeshes = [];
    const labelDivs    = [];

    PLANETS.forEach((pd, i) => {
      // Orbit ring
      const orbitRing = new THREE.Mesh(
        new THREE.RingGeometry(pd.dist - 0.015, pd.dist + 0.015, 220),
        new THREE.MeshBasicMaterial({ color:0x1a3a70, side:THREE.DoubleSide, transparent:true, opacity:0.45 })
      );
      orbitRing.rotation.x = -Math.PI/2;
      scene.add(orbitRing);

      // Planet sphere
      const mesh = new THREE.Mesh(
        new THREE.SphereGeometry(pd.size, 64, 64),
        new THREE.MeshStandardMaterial({
          map: makePlanetTex(pd.name, pd.color),
          emissive: new THREE.Color(pd.emissive),
          emissiveIntensity: 1.2,
          roughness: pd.roughness,
          metalness: pd.metalness,
        })
      );
      mesh.castShadow = true;
      mesh.userData = { planetIdx: i, data: pd, kind:"planet" };

      // Atmosphere
      mesh.add(new THREE.Mesh(
        new THREE.SphereGeometry(pd.size*1.07, 32, 32),
        new THREE.MeshBasicMaterial({
          color: pd.type==="Ice Giant" ? 0x44aacc : pd.type==="Gas Giant" ? 0x997744 : 0x3366cc,
          transparent:true, opacity:0.08, side:THREE.BackSide,
        })
      ));

      // Clouds
      if (pd.clouds) {
        const cm = new THREE.Mesh(
          new THREE.SphereGeometry(pd.size*1.014, 32, 32),
          new THREE.MeshStandardMaterial({ map:cloudTex, transparent:true, opacity:0.25, roughness:1, depthWrite:false })
        );
        mesh.add(cm);
        mesh.userData.clouds = cm;
      }

      // Saturn rings
      if (pd.rings) {
        const rc = document.createElement("canvas");
        rc.width = 256; rc.height = 1;
        const rctx = rc.getContext("2d");
        const rg = rctx.createLinearGradient(0,0,256,0);
        rg.addColorStop(0,    "rgba(180,160,80,0.9)");
        rg.addColorStop(0.3,  "rgba(220,200,120,0.6)");
        rg.addColorStop(0.55, "rgba(160,140,70,0.3)");
        rg.addColorStop(0.65, "rgba(200,180,90,0.5)");
        rg.addColorStop(1,    "rgba(140,120,55,0.2)");
        rctx.fillStyle = rg; rctx.fillRect(0,0,256,1);
        const ringMesh = new THREE.Mesh(
          new THREE.RingGeometry(pd.size*1.45, pd.size*2.6, 128, 3),
          new THREE.MeshBasicMaterial({ map:new THREE.CanvasTexture(rc), side:THREE.DoubleSide, transparent:true, opacity:0.88 })
        );
        ringMesh.rotation.x = Math.PI/4;
        mesh.add(ringMesh);
      }

      // Earth moon
      if (pd.name === "EARTH") {
        const moon = new THREE.Mesh(
          new THREE.SphereGeometry(0.13, 16, 16),
          new THREE.MeshStandardMaterial({ color:0xaaaaaa, roughness:0.95, emissive:0x111111, emissiveIntensity:0.3 })
        );
        scene.add(moon);
        mesh.userData.moon = moon;
        const moonLabelDiv = document.createElement("div");
        moonLabelDiv.textContent = "MOON";
        moonLabelDiv.style.cssText = `
          position:absolute; color:#aaaaaa;
          font-family:'Helvetica Neue',Arial,sans-serif;
          font-size:8px; font-weight:300; letter-spacing:2px;
          pointer-events:none; white-space:nowrap;
          text-shadow:0 0 8px rgba(180,180,180,0.7);
          opacity:0.7; transform:translate(8px,-50%);
        `;
        el.appendChild(moonLabelDiv);
        mesh.userData.moonLabel = moonLabelDiv;
      }

      scene.add(mesh);
      planetMeshes.push(mesh);

      // HTML label (no CSS2DRenderer dependency — plain positioned div)
      const labelDiv = document.createElement("div");
      labelDiv.textContent = pd.name;
      labelDiv.style.cssText = `
        position:absolute;
        color:#7dd4fc;
        font-family:'Helvetica Neue',Arial,sans-serif;
        font-size:9px; font-weight:300; letter-spacing:2px;
        pointer-events:none; white-space:nowrap;
        text-shadow:0 0 12px rgba(0,200,255,0.8);
        opacity:0.88; transform:translate(10px,-50%);
        transition:opacity 0.2s;
      `;
      el.appendChild(labelDiv);
      labelDivs.push(labelDiv);
    });

    // ── Extra notable moons (Titan, Europa, Triton) orbiting their planets ──
    const extraMoonMeshes = [], extraMoonLabels = [];
    EXTRA_MOONS.forEach(md => {
      const parentMesh = planetMeshes[PLANETS.findIndex(p => p.name === md.parent)];
      const mesh = new THREE.Mesh(
        new THREE.SphereGeometry(md.size, 16, 16),
        new THREE.MeshStandardMaterial({ color: md.color, roughness:0.9, emissive:new THREE.Color(md.color).multiplyScalar(0.15) })
      );
      scene.add(mesh);
      mesh.userData.parentMesh = parentMesh;
      mesh.userData.orbitR = md.orbitR;
      mesh.userData.speed = md.speed;
      extraMoonMeshes.push(mesh);

      const labelDiv = document.createElement("div");
      labelDiv.textContent = md.name;
      labelDiv.style.cssText = `
        position:absolute; color:#cfcfcf; font-family:'Helvetica Neue',Arial,sans-serif;
        font-size:7px; font-weight:300; letter-spacing:1.5px; pointer-events:none;
        white-space:nowrap; text-shadow:0 0 6px rgba(200,200,200,0.6);
        opacity:0; transform:translate(7px,-50%); transition:opacity 0.2s;
      `;
      el.appendChild(labelDiv);
      extraMoonLabels.push(labelDiv);
    });

    // ── Dwarf planets (Ceres + Kuiper Belt objects) ─────────────────────────
    const dwarfMeshes = [], dwarfLabelDivs = [], dwarfOrbitRings = [];
    DWARF_PLANETS.forEach((pd, i) => {
      const orbitRing = new THREE.Mesh(
        new THREE.RingGeometry(pd.dist - 0.04, pd.dist + 0.04, 200),
        new THREE.MeshBasicMaterial({ color:0x6a4a8a, side:THREE.DoubleSide, transparent:true, opacity:0 })
      );
      orbitRing.rotation.x = -Math.PI/2;
      orbitRing.rotation.z = i * 0.4; // slight inclination variety
      scene.add(orbitRing);
      dwarfOrbitRings.push(orbitRing);

      const mesh = new THREE.Mesh(
        new THREE.SphereGeometry(pd.size, 32, 32),
        new THREE.MeshStandardMaterial({
          map: makeDwarfTex(pd.color),
          emissive: new THREE.Color(pd.emissive),
          emissiveIntensity: 1.0,
          roughness: pd.roughness, metalness: pd.metalness,
          transparent:true, opacity:0,
        })
      );
      mesh.userData = { planetIdx: i, data: pd, kind:"dwarf" };
      scene.add(mesh);
      dwarfMeshes.push(mesh);

      const labelDiv = document.createElement("div");
      labelDiv.textContent = pd.name;
      labelDiv.style.cssText = `
        position:absolute; color:#cbb8ff; font-family:'Helvetica Neue',Arial,sans-serif;
        font-size:9px; font-weight:300; letter-spacing:2px; pointer-events:none;
        white-space:nowrap; text-shadow:0 0 10px rgba(180,140,255,0.7);
        opacity:0; transform:translate(10px,-50%); transition:opacity 0.2s;
      `;
      el.appendChild(labelDiv);
      dwarfLabelDivs.push(labelDiv);
    });

    // ── Nearby stars (deep zoom point field with labels) ───────────────────
    const STAR_FIELD_R = 900;
    const nearbyStarMeshes = [], nearbyStarLabels = [];
    NEARBY_STARS.forEach(st => {
      const r = STAR_FIELD_R * st.dist;
      const pos = new THREE.Vector3(
        Math.cos(st.ra) * Math.cos(st.dec) * r,
        Math.sin(st.dec) * r * 0.5,
        Math.sin(st.ra) * Math.cos(st.dec) * r
      );
      const mesh = new THREE.Mesh(
        new THREE.SphereGeometry(2.6, 12, 12),
        new THREE.MeshBasicMaterial({ color: st.color, transparent:true, opacity:0 })
      );
      mesh.position.copy(pos);
      scene.add(mesh);
      nearbyStarMeshes.push(mesh);

      // soft glow sprite-like halo via larger transparent sphere
      const halo = new THREE.Mesh(
        new THREE.SphereGeometry(7, 12, 12),
        new THREE.MeshBasicMaterial({ color: st.color, transparent:true, opacity:0 })
      );
      halo.position.copy(pos);
      scene.add(halo);
      mesh.userData.halo = halo;

      const labelDiv = document.createElement("div");
      labelDiv.textContent = st.name;
      labelDiv.style.cssText = `
        position:absolute; color:#bcd6ff; font-family:'Helvetica Neue',Arial,sans-serif;
        font-size:9px; font-weight:300; letter-spacing:2px; pointer-events:none;
        white-space:nowrap; text-shadow:0 0 8px rgba(150,190,255,0.7);
        opacity:0; transform:translate(8px,-50%); transition:opacity 0.3s;
      `;
      el.appendChild(labelDiv);
      nearbyStarLabels.push(labelDiv);
    });

    // ── Constellation lines connecting some nearby stars (visual flavor) ───
    const constellationMat = new THREE.LineBasicMaterial({ color:0x3a6a9a, transparent:true, opacity:0 });
    const constellationPairs = [[0,1],[1,2],[2,3],[3,4],[4,5],[5,6],[6,7],[0,8],[8,9]];
    const constellationLines = constellationPairs.map(([a,b]) => {
      const geo = new THREE.BufferGeometry().setFromPoints([
        nearbyStarMeshes[a].position, nearbyStarMeshes[b].position,
      ]);
      const line = new THREE.Line(geo, constellationMat);
      scene.add(line);
      return line;
    });

    // ── Milky Way galaxy (revealed at maximum zoom-out) ─────────────────────
    const GALAXY_R = 1900;
    const galaxyTex = makeGalaxyTex();
    const galaxyMesh = new THREE.Mesh(
      new THREE.PlaneGeometry(GALAXY_R*2, GALAXY_R*2),
      new THREE.MeshBasicMaterial({ map:galaxyTex, transparent:true, opacity:0, blending:THREE.AdditiveBlending, depthWrite:false })
    );
    galaxyMesh.rotation.x = -Math.PI/2;
    scene.add(galaxyMesh);

    const galaxyLabelDiv = document.createElement("div");
    galaxyLabelDiv.textContent = "MILKY WAY GALAXY";
    galaxyLabelDiv.style.cssText = `
      position:absolute; color:#dfe6ff; font-family:'Helvetica Neue',Arial,sans-serif;
      font-size:11px; font-weight:300; letter-spacing:5px; pointer-events:none;
      white-space:nowrap; text-shadow:0 0 14px rgba(190,200,255,0.8);
      opacity:0; transition:opacity 0.4s;
    `;
    el.appendChild(galaxyLabelDiv);

    // Messier objects (globular clusters) shown near galaxy view, matching reference
    const MESSIER = [
      { name:"MESSIER 79", x:-260, z:-90 },
      { name:"MESSIER 54", x: 360, z: 60 },
    ];
    const messierMeshes = [], messierLabels = [];
    MESSIER.forEach(m => {
      const mesh = new THREE.Mesh(
        new THREE.SphereGeometry(5, 12, 12),
        new THREE.MeshBasicMaterial({ color:0xcdb6ff, transparent:true, opacity:0 })
      );
      mesh.position.set(m.x, 0, m.z);
      scene.add(mesh);
      messierMeshes.push(mesh);
      const labelDiv = document.createElement("div");
      labelDiv.textContent = m.name;
      labelDiv.style.cssText = `
        position:absolute; color:#cdb6ff; font-family:'Helvetica Neue',Arial,sans-serif;
        font-size:9px; font-weight:300; letter-spacing:2px; pointer-events:none;
        white-space:nowrap; text-shadow:0 0 8px rgba(190,160,255,0.7);
        opacity:0; transform:translate(8px,-50%); transition:opacity 0.3s;
      `;
      el.appendChild(labelDiv);
      messierLabels.push(labelDiv);
    });

    // Sun marker box for galaxy view (small bracket like reference screenshot)
    const sunMarkerGeo = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(-14,0,-10), new THREE.Vector3(14,0,-10),
      new THREE.Vector3(14,0,-10),  new THREE.Vector3(14,0,14),
      new THREE.Vector3(14,0,14),   new THREE.Vector3(-14,0,14),
      new THREE.Vector3(-14,0,14),  new THREE.Vector3(-14,0,-10),
    ]);
    const sunMarkerMat = new THREE.LineBasicMaterial({ color:0x9ab8ff, transparent:true, opacity:0 });
    const sunMarkerLines = new THREE.LineSegments(sunMarkerGeo, sunMarkerMat);
    scene.add(sunMarkerLines);

    // ── Selection ring ───────────────────────────────────────────────────────
    const selRingMesh = new THREE.Mesh(
      new THREE.RingGeometry(0.9, 1.0, 64),
      new THREE.MeshBasicMaterial({ color:0x00ffcc, side:THREE.DoubleSide, transparent:true, opacity:0.9, blending:THREE.AdditiveBlending })
    );
    selRingMesh.visible = false;
    scene.add(selRingMesh);

    // ── Shooting stars ───────────────────────────────────────────────────────
    const shootingStars = Array.from({ length: 6 }, () => makeShootingStar(scene));

    threeRef.current = { scene, camera, renderer, planetMeshes, dwarfMeshes, selRingMesh };

    // ── Raycaster ────────────────────────────────────────────────────────────
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const pickPlanet = (cx, cy) => {
      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x =  ((cx - rect.left) / rect.width)  * 2 - 1;
      mouse.y = -((cy - rect.top)  / rect.height) * 2 + 1;
      raycaster.setFromCamera(mouse, camera);
      const targets = [...planetMeshes, ...dwarfMeshes];
      const hits = raycaster.intersectObjects(targets, true);
      if (hits.length) {
        let obj = hits[0].object;
        while (obj && obj.userData.planetIdx === undefined && obj.parent) obj = obj.parent;
        if (obj?.userData.planetIdx !== undefined) {
          state.selectedPlanet = obj.userData.planetIdx;
          state.selectedKind = obj.userData.kind;
          setUi(u => ({ ...u, selectedPlanet: obj.userData.planetIdx, selectedKind: obj.userData.kind }));
          return;
        }
      }
      state.selectedPlanet = null;
      state.selectedKind = null;
      setUi(u => ({ ...u, selectedPlanet: null, selectedKind: null }));
    };

    // ── Project 3D → 2D for HTML labels ────────────────────────────────────
    const vec = new THREE.Vector3();
    const projectToScreen = (pos3d) => {
      vec.copy(pos3d).project(camera);
      const rect = renderer.domElement.getBoundingClientRect();
      return {
        x: (vec.x*0.5+0.5)*rect.width  + rect.left - el.getBoundingClientRect().left,
        y: (-vec.y*0.5+0.5)*rect.height + rect.top  - el.getBoundingClientRect().top,
        visible: vec.z < 1,
      };
    };

    // ── Animation loop ──────────────────────────────────────────────────────
    let rafId;
    const SENS_ROT = 5.0;

    const animate = () => {
      rafId = requestAnimationFrame(animate);
      const now = performance.now();
      const dt  = Math.min((now - state.lastTime) / 1000, 0.1);
      state.lastTime = now;
      state.fps = state.fps * 0.92 + (1/dt) * 0.08;
      state.elapsedTime += dt;

      // Gesture
      const { gesture, landmarks, pointer, wsConnected } =
        gestureRef.current ?? { gesture:"none", landmarks:[], pointer:null, wsConnected:false };

      // Zoom step scales with current distance so deep zoom tiers are reachable
      const zoomStep = Math.max(0.7, state.targetZoom * 0.032);

      if (gesture === "open_palm" && landmarks?.length) {
        const px = landmarks[0][0], py = landmarks[0][1];
        if (state.lastPalmX !== null) {
          state.targetRotY += (px - state.lastPalmX) * SENS_ROT * -1;
          state.targetRotX  = Math.max(-1.5, Math.min(1.5, state.targetRotX + (py - state.lastPalmY) * SENS_ROT * 0.5));
        }
        state.lastPalmX = px; state.lastPalmY = py;
        state.lastPinchD = null; state.lastTwoDist = null;
      } else if (gesture === "two_finger") {
        // zoom in continuously while holding two fingers (scales with distance)
        state.targetZoom = Math.max(ZOOM.MIN, state.targetZoom - zoomStep);
        state.lastPalmX = null; state.lastPinchD = null; state.lastTwoDist = null;
      } else if (gesture === "fist") {
        // zoom out continuously while fist is held (scales with distance)
        state.targetZoom = Math.min(ZOOM.MAX, state.targetZoom + zoomStep);
        state.lastPalmX = null; state.lastPinchD = null; state.lastTwoDist = null;
      } else if (gesture === "point" && pointer && state.prevGesture !== "point") {
        const rect = renderer.domElement.getBoundingClientRect();
        pickPlanet(pointer.x * rect.width + rect.left, pointer.y * rect.height + rect.top);
        state.lastPalmX = null; state.lastPinchD = null; state.lastTwoDist = null;
      } else if (!["open_palm","two_finger","fist"].includes(gesture)) {
        state.lastPalmX = null; state.lastPinchD = null; state.lastTwoDist = null;
      }
      state.prevGesture = gesture;

      // Smooth camera
      state.rotX = state.rotX + (state.targetRotX - state.rotX) * 0.1;
      state.rotY = state.rotY + (state.targetRotY - state.rotY) * 0.1;
      state.zoom = state.zoom + (state.targetZoom  - state.zoom) * 0.16;
      camera.position.set(
        state.zoom * Math.sin(state.rotY) * Math.cos(state.rotX),
        state.zoom * Math.sin(state.rotX),
        state.zoom * Math.cos(state.rotY) * Math.cos(state.rotX)
      );
      camera.lookAt(0, 0, 0);

      const zoom = state.zoom;

      // ── Fade factors per tier ─────────────────────────────────────────────
      const kuiperOpacity = smoothFade(zoom, ZOOM.KUIPER_FADE_START, ZOOM.KUIPER_FADE_END) *
                             (1 - smoothFade(zoom, ZOOM.OORT_FADE_START*0.7, ZOOM.OORT_FADE_END*0.9));
      const oortOpacity   = smoothFade(zoom, ZOOM.OORT_FADE_START, ZOOM.OORT_FADE_END) *
                             (1 - smoothFade(zoom, ZOOM.GALAXY_FADE_START*0.55, ZOOM.GALAXY_FADE_START*0.85));
      const starsOpacity  = smoothFade(zoom, ZOOM.STARS_FADE_START, ZOOM.STARS_FADE_END) *
                             (1 - smoothFade(zoom, ZOOM.GALAXY_FADE_START*0.7, ZOOM.GALAXY_FADE_START));
      const galaxyOpacity = smoothFade(zoom, ZOOM.GALAXY_FADE_START, ZOOM.GALAXY_FADE_END);
      const innerOpacity  = 1 - smoothFade(zoom, ZOOM.GALAXY_FADE_START*0.9, ZOOM.GALAXY_FADE_END); // fade inner solar system out at max zoom
      const outerGridOpacity = smoothFade(zoom, ZOOM.KUIPER_FADE_START, ZOOM.OORT_FADE_END*0.6) * (1 - galaxyOpacity);

      // Name labels fade out earlier than their bodies — once pulled back far
      // enough to reveal the next tier, only the Sun stays labeled at center.
      const planetLabelOpacity = 1 - smoothFade(zoom, ZOOM.PLANET_LABELS_FADE_END*0.65, ZOOM.PLANET_LABELS_FADE_END);
      const dwarfLabelOpacity  = 1 - smoothFade(zoom, ZOOM.DWARF_LABELS_FADE_END*0.7, ZOOM.DWARF_LABELS_FADE_END);

      kuiperMat.opacity = kuiperOpacity * 0.9;
      kuiperLabelDiv.style.opacity = String(kuiperOpacity * 0.9);
      oortMat.opacity = oortOpacity * 0.85;
      oortLabelDiv.style.opacity = String(oortOpacity * 0.85);
      outerGridMat.opacity = outerGridOpacity * 0.18;
      farStarsMat.opacity = clamp01(starsOpacity*0.5 + galaxyOpacity*0.6);

      galaxyMesh.material.opacity = galaxyOpacity * 0.95;
      galaxyLabelDiv.style.opacity = String(galaxyOpacity);
      sunMarkerMat.opacity = galaxyOpacity * 0.8;
      sunMarkerLines.scale.setScalar(1);
      sunMarkerLines.position.set(0,0,0);

      // dim/hide deep inner objects (sun glow, planets) progressively at extreme zoom-out
      sunMesh.material.opacity = 1;

      // Update planets
      PLANETS.forEach((pd, i) => {
        if (!state.paused) state.angles[i] += pd.speed * dt * state.simSpeed * 0.25;
        const mesh = planetMeshes[i];
        mesh.position.set(Math.cos(state.angles[i])*pd.dist, 0, Math.sin(state.angles[i])*pd.dist);
        mesh.rotation.y += 0.006 * dt * 60 * state.simSpeed;
        if (mesh.userData.clouds) mesh.userData.clouds.rotation.y += 0.003 * dt * 60;
        mesh.visible = innerOpacity > 0.02;
        mesh.material.transparent = true;
        mesh.material.opacity = innerOpacity;

        // Moon
        if (mesh.userData.moon) {
          const ma = now * 0.001;
          const moonX = mesh.position.x + Math.cos(ma)*(pd.size+0.9);
          const moonY = Math.sin(ma*0.5)*0.15;
          const moonZ = mesh.position.z + Math.sin(ma)*(pd.size+0.9);
          mesh.userData.moon.position.set(moonX, moonY, moonZ);
          mesh.userData.moon.visible = innerOpacity > 0.02;
          if (mesh.userData.moonLabel) {
            const ms = projectToScreen(new THREE.Vector3(moonX, moonY, moonZ));
            if (ms.visible && innerOpacity > 0.3 && planetLabelOpacity > 0.05) {
              mesh.userData.moonLabel.style.left    = (ms.x + 10) + "px";
              mesh.userData.moonLabel.style.top     = ms.y + "px";
              mesh.userData.moonLabel.style.display = "block";
              mesh.userData.moonLabel.style.opacity = String(planetLabelOpacity);
            } else {
              mesh.userData.moonLabel.style.display = "none";
            }
          }
        }

        // Selection ring
        if (state.selectedPlanet === i && state.selectedKind === "planet") {
          selRingMesh.position.copy(mesh.position);
          selRingMesh.scale.setScalar((pd.size+0.4)*(1.5+Math.sin(now*0.003)*0.15));
          selRingMesh.rotation.copy(camera.rotation);
          selRingMesh.visible = innerOpacity > 0.3;
        }

        // HTML label — fades out on zoom-out so only the Sun stays labeled
        // once you've pulled back past the inner solar system; the selected
        // planet's label stays visible since the user is actively inspecting it.
        const screen = projectToScreen(mesh.position);
        const isSelectedPlanet = state.selectedPlanet === i && state.selectedKind === "planet";
        const thisLabelOpacity = (isSelectedPlanet ? 1 : planetLabelOpacity) * innerOpacity;
        if (screen.visible && thisLabelOpacity > 0.05) {
          labelDivs[i].style.left       = (screen.x + 14) + "px";
          labelDivs[i].style.top        = screen.y + "px";
          labelDivs[i].style.display    = "block";
          labelDivs[i].style.opacity    = String((isSelectedPlanet ? 1 : 0.85) * thisLabelOpacity);
          labelDivs[i].style.fontWeight = isSelectedPlanet ? "500" : "300";
        } else {
          labelDivs[i].style.display = "none";
        }
      });

      // Extra notable moons (Titan, Europa, Triton)
      extraMoonMeshes.forEach((mesh, i) => {
        const md = EXTRA_MOONS[i];
        const parentMesh = mesh.userData.parentMesh;
        const ma = now * 0.0006 * md.speed;
        const ox = parentMesh.position.x + Math.cos(ma) * md.orbitR;
        const oz = parentMesh.position.z + Math.sin(ma) * md.orbitR;
        const oy = parentMesh.position.y + Math.sin(ma*0.7) * md.orbitR * 0.12;
        mesh.position.set(ox, oy, oz);
        mesh.visible = innerOpacity > 0.02;
        mesh.material.transparent = true;
        mesh.material.opacity = innerOpacity;
        const sc2 = projectToScreen(mesh.position);
        if (sc2.visible && innerOpacity > 0.4 && zoom < 40) {
          extraMoonLabels[i].style.left = (sc2.x + 9) + "px";
          extraMoonLabels[i].style.top  = sc2.y + "px";
          extraMoonLabels[i].style.display = "block";
          extraMoonLabels[i].style.opacity = String(innerOpacity * 0.85);
        } else {
          extraMoonLabels[i].style.display = "none";
        }
      });

      // Dwarf planets (Ceres + Kuiper Belt objects)
      DWARF_PLANETS.forEach((pd, i) => {
        if (!state.paused) state.dwarfAngles[i] += pd.speed * dt * state.simSpeed * 0.25;
        const mesh = dwarfMeshes[i];
        const ring = dwarfOrbitRings[i];
        const incline = i * 0.12; // subtle orbital inclination per object
        const bx = Math.cos(state.dwarfAngles[i]) * pd.dist;
        const bz = Math.sin(state.dwarfAngles[i]) * pd.dist;
        mesh.position.set(bx, Math.sin(state.dwarfAngles[i]*1.0)*pd.dist*Math.sin(incline)*0.3, bz);
        mesh.rotation.y += 0.004 * dt * 60 * state.simSpeed;

        // Ceres is visible even at solar-system zoom (it's within the asteroid belt);
        // the Kuiper belt objects only fade in once zoomed out.
        const isCeres = pd.name === "CERES";
        const fadeAmt = isCeres ? clamp01(1 - smoothFade(zoom, ZOOM.SOLAR_SYS_MAX, ZOOM.GALAXY_FADE_END)) : kuiperOpacity;
        mesh.material.opacity = fadeAmt;
        mesh.visible = fadeAmt > 0.02;
        ring.material.opacity = fadeAmt * 0.35;

        if (state.selectedPlanet === i && state.selectedKind === "dwarf") {
          selRingMesh.position.copy(mesh.position);
          selRingMesh.scale.setScalar((pd.size+0.3)*(1.6+Math.sin(now*0.003)*0.15));
          selRingMesh.rotation.copy(camera.rotation);
          selRingMesh.visible = fadeAmt > 0.3;
        }

        const screen = projectToScreen(mesh.position);
        const isSelectedDwarf = state.selectedPlanet === i && state.selectedKind === "dwarf";
        const thisDwarfLabelOpacity = (isSelectedDwarf ? 1 : dwarfLabelOpacity) * fadeAmt;
        if (screen.visible && thisDwarfLabelOpacity > 0.05) {
          dwarfLabelDivs[i].style.left    = (screen.x + 12) + "px";
          dwarfLabelDivs[i].style.top     = screen.y + "px";
          dwarfLabelDivs[i].style.display = "block";
          dwarfLabelDivs[i].style.opacity = String((isSelectedDwarf ? 1 : 0.85) * thisDwarfLabelOpacity);
        } else {
          dwarfLabelDivs[i].style.display = "none";
        }
      });
      if (state.selectedPlanet === null) selRingMesh.visible = false;

      // Nearby stars + halos + labels
      nearbyStarMeshes.forEach((mesh, i) => {
        mesh.material.opacity = starsOpacity * 0.95;
        mesh.userData.halo.material.opacity = starsOpacity * 0.25;
        mesh.visible = starsOpacity > 0.02;
        mesh.userData.halo.visible = starsOpacity > 0.02;
        const sc2 = projectToScreen(mesh.position);
        if (sc2.visible && starsOpacity > 0.15) {
          nearbyStarLabels[i].style.left = (sc2.x + 8) + "px";
          nearbyStarLabels[i].style.top  = sc2.y + "px";
          nearbyStarLabels[i].style.display = "block";
          nearbyStarLabels[i].style.opacity = String(starsOpacity);
        } else {
          nearbyStarLabels[i].style.display = "none";
        }
      });
      constellationLines.forEach(l => { l.material.opacity = starsOpacity * 0.3; });

      // Messier objects
      messierMeshes.forEach((mesh, i) => {
        mesh.material.opacity = galaxyOpacity * 0.9;
        mesh.visible = galaxyOpacity > 0.02;
        const sc2 = projectToScreen(mesh.position);
        if (sc2.visible && galaxyOpacity > 0.1) {
          messierLabels[i].style.left = (sc2.x + 8) + "px";
          messierLabels[i].style.top  = sc2.y + "px";
          messierLabels[i].style.display = "block";
          messierLabels[i].style.opacity = String(galaxyOpacity);
        } else {
          messierLabels[i].style.display = "none";
        }
      });

      // The Sun is the permanent anchor — always visible at every zoom tier.
      // It shrinks visually as we pull back (so it doesn't dominate wider views)
      // but never disappears, since it's the one constant reference point.
      sunMesh.visible = true;
      const sunScaleByZoom = zoom < ZOOM.SOLAR_SYS_MAX ? 1 :
                              zoom < ZOOM.OORT_MAX ? 1 - 0.4*smoothFade(zoom, ZOOM.SOLAR_SYS_MAX, ZOOM.OORT_MAX) :
                              0.6;
      sunMesh.scale.setScalar(Math.max(0.5, sunScaleByZoom * Math.min(1, galaxyOpacity > 0.3 ? (0.4 + innerOpacity*0.6) : 1)));

      // Meteoroids
      meteoroidStates.forEach((ms, i) => {
        if (!state.paused) ms.angle += ms.speed * dt * state.simSpeed;
        const mesh = meteoroidMeshes[i];
        mesh.position.set(Math.cos(ms.angle)*ms.radius, ms.yOff, Math.sin(ms.angle)*ms.radius);
        mesh.rotateOnWorldAxis(ms.tumbleAxis, ms.tumbleSpeed * dt);
        mesh.visible = innerOpacity > 0.05;
      });

      // Shooting stars
      state.nextShootStar -= dt;
      if (state.nextShootStar <= 0) {
        const idle = shootingStars.find(s => !s.active);
        if (idle) fireShootingStar(idle);
        state.nextShootStar = 3 + Math.random()*6;
      }
      shootingStars.forEach(s => updateShootingStar(s, dt));
      shootingStars.forEach(s => { s.line.visible = innerOpacity > 0.1; });

      // Sun spin
      sunMesh.rotation.y += 0.003;

      // Sun label
      const sunScreen = projectToScreen(new THREE.Vector3(0,0,0));
      if (sunScreen.visible) {
        sunLabelDiv.style.left    = sunScreen.x + "px";
        sunLabelDiv.style.top     = sunScreen.y + "px";
        sunLabelDiv.style.display = "block";
        sunLabelDiv.style.opacity = "0.9";
      } else {
        sunLabelDiv.style.display = "none";
      }

      // Kuiper / Oort label placement (place near their respective rings on screen)
      if (kuiperOpacity > 0.05) {
        const kp2 = projectToScreen(new THREE.Vector3(58, 0, 0));
        if (kp2.visible) {
          kuiperLabelDiv.style.left = kp2.x + "px";
          kuiperLabelDiv.style.top  = kp2.y + "px";
          kuiperLabelDiv.style.display = "block";
        } else kuiperLabelDiv.style.display = "none";
      } else kuiperLabelDiv.style.display = "none";

      if (oortOpacity > 0.05) {
        const op2 = projectToScreen(new THREE.Vector3(0, 280, 0));
        if (op2.visible) {
          oortLabelDiv.style.left = op2.x + "px";
          oortLabelDiv.style.top  = op2.y + "px";
          oortLabelDiv.style.display = "block";
        } else oortLabelDiv.style.display = "none";
      } else oortLabelDiv.style.display = "none";

      if (galaxyOpacity > 0.08) {
        const gp2 = projectToScreen(new THREE.Vector3(0, 0, -GALAXY_R*0.55));
        if (gp2.visible) {
          galaxyLabelDiv.style.left = gp2.x + "px";
          galaxyLabelDiv.style.top  = gp2.y + "px";
          galaxyLabelDiv.style.display = "block";
        } else galaxyLabelDiv.style.display = "none";
      } else galaxyLabelDiv.style.display = "none";

      // Scale readout (distance from Sun in AU, approximating reference UI ruler)
      const auEquivalent = zoom < 60 ? (zoom*9).toFixed(0) + " M km" :
                            zoom < 600 ? (zoom*0.13).toFixed(0) + " AU" :
                            zoom < 1600 ? (zoom*0.6).toFixed(0) + " AU" :
                            (zoom*1.6).toFixed(0) + " LY";
      scaleLabelDiv.textContent = "DISTANCE " + auEquivalent;

      renderer.render(scene, camera);

      if (Math.floor(now/150) !== Math.floor((now-dt*1000)/150)) {
        setUi(u => ({
          ...u,
          fps: Math.round(state.fps),
          gesture,
          selectedPlanet: state.selectedPlanet,
          selectedKind: state.selectedKind,
          simSpeed: state.simSpeed,
          paused: state.paused,
          wsConnected,
          zoom: state.zoom,
        }));
      }
    };
    animate();

    // ── Mouse controls ──────────────────────────────────────────────────────
    const cvs = renderer.domElement;
    const onDown  = e => { state.isDragging = true; state.lastMouseX = e.clientX; state.lastMouseY = e.clientY; };
    const onUp    = e => {
      if (!state.isDragging) return;
      if (Math.abs(e.clientX - state.lastMouseX) < 5 && Math.abs(e.clientY - state.lastMouseY) < 5)
        pickPlanet(e.clientX, e.clientY);
      state.isDragging = false;
    };
    const onMove  = e => {
      if (!state.isDragging) return;
      state.targetRotY += (e.clientX - state.lastMouseX) * 0.004;
      state.targetRotX  = Math.max(-1.5, Math.min(1.5, state.targetRotX - (e.clientY - state.lastMouseY) * 0.004));
      state.lastMouseX = e.clientX; state.lastMouseY = e.clientY;
    };
    // Wheel zoom: multiplicative so it stays usable across the full 5→4200 range
    const onWheel = e => {
      const factor = Math.exp(e.deltaY * 0.0022);
      state.targetZoom = Math.max(ZOOM.MIN, Math.min(ZOOM.MAX, state.targetZoom * factor));
    };

    let tDist = null, tCX = null, tCY = null;
    const onTouch = e => {
      e.preventDefault();
      if (e.touches.length === 2) {
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        const d  = Math.hypot(dx, dy);
        const cx = (e.touches[0].clientX + e.touches[1].clientX)/2;
        const cy = (e.touches[0].clientY + e.touches[1].clientY)/2;
        if (tDist !== null) {
          const factor = Math.exp(-(d - tDist) * 0.02);
          state.targetZoom = Math.max(ZOOM.MIN, Math.min(ZOOM.MAX, state.targetZoom * factor));
        }
        if (tCX   !== null) {
          state.targetRotY += (cx-tCX)*0.004;
          state.targetRotX  = Math.max(-1.5, Math.min(1.5, state.targetRotX - (cy-tCY)*0.004));
        }
        tDist = d; tCX = cx; tCY = cy;
      } else if (e.touches.length === 1) {
        if (tCX !== null) {
          state.targetRotY += (e.touches[0].clientX-tCX)*0.005;
          state.targetRotX  = Math.max(-1.5, Math.min(1.5, state.targetRotX - (e.touches[0].clientY-tCY)*0.005));
        }
        tCX = e.touches[0].clientX; tCY = e.touches[0].clientY; tDist = null;
      }
    };
    const onTouchEnd = () => { tDist = null; tCX = null; tCY = null; };

    cvs.addEventListener("mousedown",  onDown);
    window.addEventListener("mouseup",   onUp);
    window.addEventListener("mousemove", onMove);
    cvs.addEventListener("wheel",      onWheel, { passive: true });
    cvs.addEventListener("touchmove",  onTouch,    { passive: false });
    cvs.addEventListener("touchend",   onTouchEnd);

    const onKey = e => {
      if (e.key === " ") { state.paused = !state.paused; setUi(u => ({ ...u, paused: state.paused })); }
      if (e.key === "+" || e.key === "=") { state.simSpeed = Math.min(10, state.simSpeed+0.5); setUi(u => ({ ...u, simSpeed: state.simSpeed })); }
      if (e.key === "-") { state.simSpeed = Math.max(0.1, state.simSpeed-0.5); setUi(u => ({ ...u, simSpeed: state.simSpeed })); }
      if (e.key === "Escape") { state.selectedPlanet = null; state.selectedKind = null; setUi(u => ({ ...u, selectedPlanet: null, selectedKind: null })); }
    };
    window.addEventListener("keydown", onKey);

    const onResize = () => {
      const W2 = el.clientWidth, H2 = el.clientHeight;
      camera.aspect = W2/H2;
      camera.updateProjectionMatrix();
      renderer.setSize(W2, H2);
    };
    window.addEventListener("resize", onResize);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener("mouseup",   onUp);
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("keydown",   onKey);
      window.removeEventListener("resize",    onResize);
      renderer.dispose();
      if (el.contains(renderer.domElement)) el.removeChild(renderer.domElement);
      labelDivs.forEach(d => { if (el.contains(d)) el.removeChild(d); });
      dwarfLabelDivs.forEach(d => { if (el.contains(d)) el.removeChild(d); });
      extraMoonLabels.forEach(d => { if (el.contains(d)) el.removeChild(d); });
      nearbyStarLabels.forEach(d => { if (el.contains(d)) el.removeChild(d); });
      messierLabels.forEach(d => { if (el.contains(d)) el.removeChild(d); });
      if (el.contains(sunLabelDiv)) el.removeChild(sunLabelDiv);
      if (el.contains(kuiperLabelDiv)) el.removeChild(kuiperLabelDiv);
      if (el.contains(oortLabelDiv)) el.removeChild(oortLabelDiv);
      if (el.contains(galaxyLabelDiv)) el.removeChild(galaxyLabelDiv);
      if (el.contains(scaleLabelDiv)) el.removeChild(scaleLabelDiv);
      planetMeshes.forEach(m => { if (m.userData.moonLabel && el.contains(m.userData.moonLabel)) el.removeChild(m.userData.moonLabel); });
    };
  }, []);

  // ── UI ──────────────────────────────────────────────────────────────────────
  const sel = ui.selectedPlanet !== null
    ? (ui.selectedKind === "dwarf" ? DWARF_PLANETS[ui.selectedPlanet] : PLANETS[ui.selectedPlanet])
    : null;
  const gm  = GESTURE_META[ui.gesture] || GESTURE_META.none;
  const HUD = { fontFamily:"'Helvetica Neue', Arial, sans-serif", position:"absolute", pointerEvents:"none", zIndex:10 };

  // Human-readable zoom tier label for the top bar
  const zoomTierLabel =
    ui.zoom < ZOOM.SOLAR_SYS_MAX ? "INNER SOLAR SYSTEM" :
    ui.zoom < ZOOM.KUIPER_MAX    ? "KUIPER BELT" :
    ui.zoom < ZOOM.OORT_MAX      ? "OORT CLOUD" :
    ui.zoom < ZOOM.GALAXY_FADE_START ? "NEARBY STARS" :
    "MILKY WAY GALAXY";

  return (
    <div style={{ width:"100vw", height:"100vh", background:"#000008", position:"relative", overflow:"hidden" }}>
      <div ref={mountRef} style={{ width:"100%", height:"100%", position:"absolute", inset:0, zIndex:0 }} />

      {/* Top bar */}
      <div style={{ ...HUD, top:0, left:0, right:0, height:48, background:"rgba(2,4,14,0.88)", borderBottom:"1px solid rgba(255,255,255,0.08)", display:"flex", alignItems:"center", padding:"0 20px", gap:28 }}>
        <span style={{ color:"#ffffff", fontSize:13, letterSpacing:3, fontWeight:300 }}>SOLAR SYSTEM EXPLORER</span>
        <span style={{ color: ui.paused ? "#5566ee" : "#33cc77", fontSize:11, letterSpacing:2, fontWeight:300 }}>
          {ui.paused ? "● PAUSED" : `● LIVE · ${ui.simSpeed.toFixed(1)}×`}
        </span>
        <span style={{ color:"#7dd4fc", fontSize:11, letterSpacing:2, fontWeight:300 }}>{zoomTierLabel}</span>
        <span style={{ display:"flex", alignItems:"center", gap:6, fontSize:11 }}>
          <span style={{ width:6, height:6, borderRadius:"50%", background: ui.wsConnected ? "#00e678" : "#ff4455", display:"inline-block" }} />
          <span style={{ color: ui.wsConnected ? "#00aa55" : "#663344", letterSpacing:1 }}>
            {ui.wsConnected ? "GESTURE CONNECTED" : "Waiting for server.py…"}
          </span>
        </span>
        <span style={{ marginLeft:"auto", color:"#334455", fontSize:11, letterSpacing:1 }}>{ui.fps} FPS</span>
      </div>

      {/* Planet / dwarf-planet info panel */}
      {sel && (
        <div style={{ ...HUD, pointerEvents:"auto", top:60, right:16, background:"rgba(2,5,18,0.90)", border:"1px solid rgba(255,255,255,0.1)", borderRadius:4, padding: infoPanelMinimized ? "10px 16px" : "18px 22px", minWidth: infoPanelMinimized ? 0 : 220 }}>
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", gap:16, marginBottom: infoPanelMinimized ? 0 : 4 }}>
            <div style={{ color: ui.selectedKind === "dwarf" ? "#cbb8ff" : "#7dd4fc", fontSize:18, letterSpacing:4, fontWeight:300 }}>{sel.name}</div>
            <button
              onClick={() => setInfoPanelMinimized(m => !m)}
              style={{
                background:"none", border:"1px solid rgba(255,255,255,0.2)", borderRadius:3,
                color:"rgba(255,255,255,0.6)", width:18, height:18, lineHeight:"16px",
                fontSize:13, cursor:"pointer", padding:0, flexShrink:0,
              }}
              title={infoPanelMinimized ? "Expand" : "Minimize"}
            >
              {infoPanelMinimized ? "+" : "−"}
            </button>
          </div>
          {!infoPanelMinimized && (
            <>
              <div style={{ color:"rgba(255,255,255,0.35)", fontSize:10, letterSpacing:3, marginBottom:14, fontWeight:300 }}>{sel.type.toUpperCase()}</div>
              {[
                ["DIST FROM SUN", sel.info.dist],
                ["MOONS",         sel.info.moons],
                ["AVG TEMP",      sel.info.temp],
                ["DAY LENGTH",    sel.info.day],
                ["YEAR LENGTH",   sel.info.year],
              ].map(([label, val]) => (
                <div key={label} style={{ display:"flex", justifyContent:"space-between", borderBottom:"1px solid rgba(255,255,255,0.06)", padding:"6px 0", gap:16 }}>
                  <span style={{ color:"rgba(255,255,255,0.3)", fontSize:10, letterSpacing:2, fontWeight:300 }}>{label}</span>
                  <span style={{ color:"rgba(255,255,255,0.88)", fontSize:12, fontWeight:300, letterSpacing:1 }}>{val}</span>
                </div>
              ))}
              <div style={{ marginTop:10, color:"rgba(255,255,255,0.2)", fontSize:10, letterSpacing:1 }}>ESC OR FIST TO DISMISS</div>
            </>
          )}
        </div>
      )}

      {/* Gesture HUD */}
      <div style={{ ...HUD, bottom:14, left:14, background:"rgba(2,4,14,0.82)", border:"1px solid rgba(255,255,255,0.08)", borderRadius:4, padding:"10px 16px", minWidth:220 }}>
        <div style={{ color:"rgba(255,255,255,0.25)", fontSize:9, letterSpacing:3, marginBottom:5, fontWeight:300 }}>GESTURE CONTROL</div>
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          <span style={{ width:8, height:8, borderRadius:"50%", background:gm.color, display:"inline-block", flexShrink:0 }} />
          <span style={{ color:gm.color, fontSize:13, fontWeight:300, letterSpacing:2 }}>{gm.label}</span>
          <span style={{ color:"rgba(255,255,255,0.3)", fontSize:11, marginLeft:"auto", letterSpacing:1 }}>{gm.action}</span>
        </div>
      </div>

      {/* Zoom scale HUD (bottom right) */}
      <div style={{ ...HUD, bottom:14, right:14, background:"rgba(2,4,14,0.82)", border:"1px solid rgba(255,255,255,0.08)", borderRadius:4, padding:"10px 16px", textAlign:"right" }}>
        <div style={{ color:"rgba(255,255,255,0.25)", fontSize:9, letterSpacing:3, marginBottom:4, fontWeight:300 }}>ZOOM LEVEL</div>
        <div style={{ color:"#7dd4fc", fontSize:12, fontWeight:300, letterSpacing:1 }}>{zoomTierLabel}</div>
      </div>
    </div>
  );
}