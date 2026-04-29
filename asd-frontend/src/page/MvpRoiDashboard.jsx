/**
 * MvpRoiDashboard — Anatomical Brain + ROI Connectivity Viewer
 *
 * Uses the GLTF brain model (public/brain_model/brain_model_2.gltf) with
 * 5 mesh parts (Mesh_0, Frontal Lobe, Temporal Lobe, Parietal Lobe, Occipital Lobe).
 * ROI spheres from the three_js_bundle.json are placed inside the brain.
 */

import React, {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  Activity,
  AlertCircle,
  Brain,
  Link2,
  RefreshCw,
  Search,
  TrendingUp,
  Layers,
  Eye,
  EyeOff,
  Info,
  Zap,
  X,
} from "lucide-react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { gsap } from "gsap";
import { getPatient } from "../api/patients";
import { useActivePatient } from "../context/ActivePatientContext";

const API_BASE = process.env.REACT_APP_API_BASE || "http://127.0.0.1:8001";

// ─── Atlas options ────────────────────────────────────────────────────────────
const ATLAS_OPTIONS = [
  { key: "aal3", label: "AAL3", bundleFile: "three_js_bundle.json", summaryFile: "summary.json" },
  { key: "schaefer", label: "Schaefer-100", bundleFile: "three_js_bundle_schaefer.json", summaryFile: "summary_schaefer.json" },
  { key: "ho", label: "Harvard-Oxford", bundleFile: "three_js_bundle_ho.json", summaryFile: "summary_ho.json" },
];

// ─── Lobe configuration ───────────────────────────────────────────────────────
const LOBE_CONFIG = {
  "Frontal Lobe": { color: "#6366f1", emissive: "#312e81", label: "Frontal", desc: "Planning, decision-making, movement" },
  "Temporal Lobe": { color: "#10b981", emissive: "#064e3b", label: "Temporal", desc: "Memory, language, hearing" },
  "Parietal Lobe": { color: "#f59e0b", emissive: "#78350f", label: "Parietal", desc: "Sensory integration, spatial awareness" },
  "Occipital Lobe": { color: "#ec4899", emissive: "#831843", label: "Occipital", desc: "Visual processing" },
  "Mesh_0": { color: "#c8a882", emissive: "#3c2412", label: "Cortex", desc: "Overall cortical surface" },
};

// Default mapping used before the model-derived mapping is available.
const DEFAULT_BRAIN_MAPPING = {
  scale: 0.00078,
  center: { x: 0, y: 0.14, z: 0 },
  maxDim: 0.14,
  useAxisMapping: false,
  flipZ: true,
  shrink: 0.94,
  padding: 0.06,
  brainBounds: {
    min: { x: -0.07, y: 0.07, z: -0.07 },
    max: { x: 0.07, y: 0.21, z: 0.07 },
  },
  roiBounds: {
    min: { x: -90, y: -126, z: -72 },
    max: { x: 90, y: 90, z: 108 },
  },
};
const DEFAULT_LOBE_OPACITY = 0.72;
const ROI_VERTICAL_NUDGE = 0.012;

function clampNum(v, min, max) {
  return Math.min(max, Math.max(min, v));
}

function safeNorm(v, min, max) {
  if (!Number.isFinite(v) || !Number.isFinite(min) || !Number.isFinite(max)) return 0.5;
  const range = max - min;
  if (Math.abs(range) < 1e-8) return 0.5;
  return (v - min) / range;
}

function clampVecToBrainBounds(v, mapping = DEFAULT_BRAIN_MAPPING) {
  const bMin = mapping?.brainBounds?.min;
  const bMax = mapping?.brainBounds?.max;
  if (!bMin || !bMax) return v;
  if (![bMin.x, bMin.y, bMin.z, bMax.x, bMax.y, bMax.z].every(Number.isFinite)) return v;
  return new THREE.Vector3(
    clampNum(v.x, bMin.x, bMax.x),
    clampNum(v.y, bMin.y, bMax.y),
    clampNum(v.z, bMin.z, bMax.z)
  );
}

function mniToGltf(mni, mapping = DEFAULT_BRAIN_MAPPING) {
  const [mx, my, mz] = mni;
  // MNI axes:  x = Left/Right,  y = Posterior/Anterior,  z = Inferior/Superior
  // GLTF axes: x = Left/Right,  y = Up (Superior),       z = Forward (Anterior)

  // Preferred mapping: normalize ROI coordinate ranges into current brain bounds.
  if (mapping?.useAxisMapping && mapping?.brainBounds && mapping?.roiBounds) {
    const bMin = mapping.brainBounds.min;
    const bMax = mapping.brainBounds.max;
    const rMin = mapping.roiBounds.min;
    const rMax = mapping.roiBounds.max;
    const hasRanges = [
      bMin?.x, bMin?.y, bMin?.z, bMax?.x, bMax?.y, bMax?.z,
      rMin?.x, rMin?.y, rMin?.z, rMax?.x, rMax?.y, rMax?.z,
    ].every(Number.isFinite);

    if (hasRanges) {
      // Normalize each MNI axis independently
      const nLR  = clampNum(safeNorm(mx, rMin.x, rMax.x), 0, 1); // Left/Right
      const nSI  = clampNum(safeNorm(mz, rMin.z, rMax.z), 0, 1); // Superior/Inferior → GLTF Y
      const nAPraw = clampNum(safeNorm(my, rMin.y, rMax.y), 0, 1); // Anterior/Posterior → GLTF Z
      const nAP  = mapping.flipZ ? 1 - nAPraw : nAPraw;

      // Map into GLTF brain bounding box with axis swap:
      //   GLTF X ← MNI X (LR)
      //   GLTF Y ← MNI Z (SI, vertical)
      //   GLTF Z ← MNI Y (AP, depth)
      const px = THREE.MathUtils.lerp(bMin.x, bMax.x, nLR);
      const py = THREE.MathUtils.lerp(bMin.y, bMax.y, nSI);
      const pz = THREE.MathUtils.lerp(bMin.z, bMax.z, nAP);

      const center = mapping?.center || DEFAULT_BRAIN_MAPPING.center;
      const shrink = Number.isFinite(mapping?.shrink)
        ? clampNum(mapping.shrink, 0.82, 1)
        : DEFAULT_BRAIN_MAPPING.shrink;

      return new THREE.Vector3(
        center.x + (px - center.x) * shrink,
        center.y + (py - center.y) * shrink,
        center.z + (pz - center.z) * shrink
      );
    }
  }

  // Fallback: scalar mapping  (also with corrected axis swap)
  // GLTF x ← MNI x,  GLTF y ← MNI z (up),  GLTF z ← -MNI y (anterior = +z toward camera)
  const scale = Number.isFinite(mapping?.scale) && mapping.scale > 0
    ? mapping.scale
    : DEFAULT_BRAIN_MAPPING.scale;
  const center = mapping?.center || DEFAULT_BRAIN_MAPPING.center;
  return new THREE.Vector3(
    center.x + mx * scale,
    center.y + mz * scale,
    center.z - my * scale
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function pct(v) {
  if (typeof v !== "number" || Number.isNaN(v)) return "--";
  return `${(v * 100).toFixed(1)}%`;
}
function mini(v) {
  if (typeof v !== "number" || Number.isNaN(v)) return "--";
  return v.toFixed(4);
}
function toFin(v) { const n = Number(v); return Number.isFinite(n) ? n : null; }
function triplet(arr) {
  if (!Array.isArray(arr) || arr.length < 3) return null;
  const x = toFin(arr[0]), y = toFin(arr[1]), z = toFin(arr[2]);
  return (x !== null && y !== null && z !== null) ? [x, y, z] : null;
}
function resolveCoords(roi) {
  if (!roi || typeof roi !== "object") return null;
  for (const k of ["coords", "coord", "xyz", "centroid", "center", "mni"]) {
    const t = triplet(roi[k]); if (t) return t;
  }
  for (const c of [[roi.x, roi.y, roi.z], [roi.cx, roi.cy, roi.cz], [roi.mni_x, roi.mni_y, roi.mni_z]]) {
    const t = triplet(c); if (t) return t;
  }
  return null;
}
function disposeObj(root) {
  root.traverse(o => {
    if (o.geometry) o.geometry.dispose();
    if (o.material) (Array.isArray(o.material) ? o.material : [o.material]).forEach(m => m.dispose());
  });
}
function clearGroup(g) {
  while (g.children.length) { const c = g.children[g.children.length - 1]; g.remove(c); disposeObj(c); }
}
function importanceColor(ratio) {
  return new THREE.Color().setHSL((1 - ratio) * 0.58, 0.98, 0.5 + ratio * 0.18);
}
function getLobeLabel(roi) {
  const c = resolveCoords(roi);
  if (!c) return "Other";
  const [x, y, z] = c;
  // MNI coords: x=LR, y=AP (anterior+), z=SI (superior+)
  // Check in priority order — most distinctive boundaries first
  if (y < -65) return "Occipital";                                // hard posterior boundary
  if (Math.abs(x) > 28 && z < 22) return "Temporal";              // lateral + below parietal
  if (y < -5 && z > 30) return "Parietal";                        // posterior-superior
  if (y > -5) return "Frontal";                                   // anterior half
  if (Math.abs(x) < 25 && Math.abs(y) < 25 && z < 15) return "Subcortical"; // deep central
  return "Other";
}
const LOBE_COLORS_UI = {
  Frontal: "#4f46e5", Parietal: "#f59e0b", Temporal: "#10b981",
  Occipital: "#f472b6", Subcortical: "#fb923c", Other: "#64748b"
};

// ─── Embedded CSS ─────────────────────────────────────────────────────────────
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap');

.nb-root {
  min-height: calc(100vh - 64px);
  background: linear-gradient(180deg, #f0f9ff 0%, #ffffff 52%, #ecfdf5 100%);
  font-family: 'Inter', sans-serif;
  color: #0f172a;
  position: relative;
  overflow-x: hidden;
}
.nb-root::before {
  content:'';
  position:fixed;inset:0;pointer-events:none;z-index:0;
  background:
    radial-gradient(ellipse 60% 50% at 20% 20%, rgba(14,165,233,.1) 0%, transparent 62%),
    radial-gradient(ellipse 50% 40% at 80% 70%, rgba(16,185,129,.08) 0%, transparent 62%);
}

.glass { background:rgba(255,255,255,.92); backdrop-filter:blur(14px); -webkit-backdrop-filter:blur(14px);
  border:1px solid rgba(148,163,184,.22); border-radius:16px;
  box-shadow:0 12px 28px rgba(15,23,42,.08), inset 0 1px 0 rgba(255,255,255,.72); }
.glass-sm { background:rgba(255,255,255,.82); backdrop-filter:blur(10px); -webkit-backdrop-filter:blur(10px);
  border:1px solid rgba(148,163,184,.2); border-radius:12px; }

.neon-text { background:linear-gradient(135deg,#0369a1,#0ea5e9 52%, #10b981 100%);
  -webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text; }

.stat-card { background:#ffffff; border:1px solid rgba(148,163,184,.24);
  border-radius:14px; padding:16px 20px; transition:all .25s ease; }
.stat-card:hover { border-color:rgba(14,165,233,.4); box-shadow:0 12px 24px rgba(14,165,233,.12); transform:translateY(-2px); }

.roi-item { background:#ffffff; border:1px solid rgba(148,163,184,.22);
  border-radius:10px; padding:10px 12px; transition:all .2s; cursor:pointer; text-align:left; width:100%; }
.roi-item:hover,.roi-item.active { border-color:rgba(14,165,233,.45); background:rgba(14,165,233,.08);
  box-shadow:0 8px 16px rgba(14,165,233,.1); transform:translateX(2px); }
.roi-item.active { border-color:rgba(14,165,233,.65); }

.pill-btn { display:inline-flex; align-items:center; gap:5px; padding:6px 12px;
  border-radius:8px; font-size:11px; font-weight:600; border:1px solid; cursor:pointer; transition:all .2s; }
.pill-on  { background:rgba(14,165,233,.14); border-color:rgba(14,165,233,.45); color:#0369a1; }
.pill-off { background:#ffffff; border-color:rgba(148,163,184,.3); color:#475569; }
.pill-off:hover { border-color:rgba(14,165,233,.4); color:#0369a1; }

.sel-input { background:#ffffff; border:1px solid rgba(148,163,184,.35);
  border-radius:8px; color:#334155; font-family:Inter,sans-serif; font-size:11px;
  padding:6px 10px; outline:none; cursor:pointer; }
.sel-input:focus { border-color:rgba(14,165,233,.6); box-shadow:0 0 0 3px rgba(14,165,233,.12); }
option { background:#ffffff; }

.nb-range { -webkit-appearance:none; width:100%; height:4px; border-radius:2px;
  background:rgba(148,163,184,.34); outline:none; cursor:pointer; }
.nb-range::-webkit-slider-thumb { -webkit-appearance:none; width:13px; height:13px;
  border-radius:50%; background:#0ea5e9; box-shadow:0 0 0 2px rgba(255,255,255,.95), 0 0 0 4px rgba(14,165,233,.2); }

/* Opacity slider UI */
.nb-range {
  height: 6px;
  border-radius: 999px;
  box-shadow: inset 0 0 0 1px rgba(148,163,184,.22);
  transition: filter .2s ease;
}
.nb-range:hover { filter: brightness(1.03); }
.nb-range::-webkit-slider-thumb {
  width: 16px;
  height: 16px;
  border: 2px solid #ffffff;
  box-shadow: 0 2px 6px rgba(15,23,42,.2), 0 0 0 4px rgba(14,165,233,.2);
}
.nb-range::-moz-range-track {
  height: 6px;
  border-radius: 999px;
  background: rgba(148,163,184,.34);
  box-shadow: inset 0 0 0 1px rgba(148,163,184,.22);
}
.nb-range::-moz-range-thumb {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  border: 2px solid #ffffff;
  background: #0ea5e9;
  box-shadow: 0 2px 6px rgba(15,23,42,.2), 0 0 0 4px rgba(14,165,233,.2);
}

.src-input { width:100%; background:#ffffff; border:1px solid rgba(148,163,184,.32);
  border-radius:10px; color:#0f172a; font-family:Inter,sans-serif; font-size:12px;
  padding:9px 10px 9px 34px; outline:none; transition:border-color .2s; }
.src-input:focus { border-color:rgba(14,165,233,.62); box-shadow:0 0 0 3px rgba(14,165,233,.12); }
.src-input::placeholder { color:#94a3b8; }

.viewer-wrap { position:relative; border-radius:16px; overflow:hidden;
  border:1px solid rgba(148,163,184,.32);
  box-shadow:0 16px 34px rgba(15,23,42,.16), inset 0 1px 0 rgba(255,255,255,.05); }
.viewer-grid { position:absolute;inset:0;pointer-events:none;z-index:1;
  background-image:linear-gradient(rgba(148,163,184,.06) 1px,transparent 1px),
                   linear-gradient(90deg,rgba(148,163,184,.06) 1px,transparent 1px);
  background-size:52px 52px; }
.viewer-scan { position:absolute;top:0;left:0;right:0;height:2px;z-index:2;pointer-events:none;
  background:linear-gradient(90deg,transparent,rgba(14,165,233,.52),transparent);
  animation:scan 5s linear infinite; }
@keyframes scan { 0%{transform:translateY(0);opacity:0} 5%{opacity:1} 95%{opacity:1}
  100%{transform:translateY(560px);opacity:0} }

.tooltip { position:absolute;z-index:20;pointer-events:none;
  background:rgba(255,255,255,.96); border:1px solid rgba(148,163,184,.36);
  border-radius:10px; padding:10px 14px;
  box-shadow:0 12px 24px rgba(15,23,42,.2);min-width:140px;backdrop-filter:blur(10px); }

.imp-bar { height:4px; border-radius:2px; background:rgba(148,163,184,.26); overflow:hidden; margin-top:4px; }
.imp-fill { height:100%; border-radius:2px; transition:width .4s; }

.asd-badge { background:linear-gradient(135deg,rgba(239,68,68,.14),rgba(248,113,113,.08));
  border:1px solid rgba(239,68,68,.35); color:#b91c1c; padding:3px 12px;
  border-radius:999px; font-size:11px; font-weight:700; letter-spacing:.08em; text-transform:uppercase; }
.ctrl-badge { background:linear-gradient(135deg,rgba(34,197,94,.14),rgba(16,185,129,.08));
  border:1px solid rgba(34,197,94,.35); color:#166534; padding:3px 12px;
  border-radius:999px; font-size:11px; font-weight:700; letter-spacing:.08em; text-transform:uppercase; }

.tab-btn { flex:1; padding:8px 4px; border-radius:8px; font-size:11px; font-weight:600;
  display:flex; justify-content:center; align-items:center; gap:5px;
  cursor:pointer; border:none; transition:all .2s; }

.sec-title { font-size:10px; font-weight:700; letter-spacing:.1em; text-transform:uppercase;
  color:#475569; margin-bottom:10px; display:flex; align-items:center; gap:7px; }
.sec-title::after { content:''; flex:1; height:1px; background:rgba(148,163,184,.26); }

.conn-card { background:#ffffff; border:1px solid rgba(148,163,184,.22);
  border-radius:10px; padding:10px 12px; transition:border-color .2s; }
.conn-card:hover { border-color:rgba(14,165,233,.35); }

.lobe-chip { display:inline-flex; align-items:center; gap:5px; padding:3px 8px;
  border-radius:6px; font-size:10px; font-weight:600; background:#ffffff;
  border:1px solid rgba(148,163,184,.22); color:#64748b; }

.tag { display:inline-block; padding:2px 8px; border-radius:5px; font-size:10px;
  font-weight:600; letter-spacing:.05em; text-transform:uppercase; }

.lobe-highlight-label {
  position:absolute; z-index:12; pointer-events:none;
  background:rgba(255,255,255,.96); border:1px solid rgba(148,163,184,.32);
  border-radius:8px; padding:8px 12px; font-size:11px;
  box-shadow:0 8px 18px rgba(15,23,42,.18);
}

.mono { font-family:'JetBrains Mono',monospace; }
.fade-in { animation:fadeUp .4s ease both; }
@keyframes fadeUp { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }

::-webkit-scrollbar{width:4px}
::-webkit-scrollbar-track{background:rgba(226,232,240,.9);border-radius:2px}
::-webkit-scrollbar-thumb{background:rgba(100,116,139,.55);border-radius:2px}
::-webkit-scrollbar-thumb:hover{background:rgba(71,85,105,.8)}
*{box-sizing:border-box;margin:0;padding:0}
@keyframes spin{to{transform:rotate(360deg)}}
`;

// ─── COMPONENT ────────────────────────────────────────────────────────────────
export default function MvpRoiDashboard() {
  const { activePatient } = useActivePatient() || {};

  // Refs
  const viewerRef = useRef(null);
  const rendererRef = useRef(null);
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const controlsRef = useRef(null);
  const rafRef = useRef(0);
  const clockRef = useRef(new THREE.Clock());

  const brainRootRef = useRef(null);   // loaded GLTF scene
  const lobeMeshesRef = useRef({});     // name → THREE.Mesh
  const roiGroupRef = useRef(null);
  const edgeGroupRef = useRef(null);
  const roiPosMapRef = useRef(new Map());
  const roiMeshMapRef = useRef(new Map());
  const brainMappingRef = useRef({
    ...DEFAULT_BRAIN_MAPPING,
    center: { ...DEFAULT_BRAIN_MAPPING.center },
    brainBounds: {
      min: { ...DEFAULT_BRAIN_MAPPING.brainBounds.min },
      max: { ...DEFAULT_BRAIN_MAPPING.brainBounds.max },
    },
    roiBounds: {
      min: { ...DEFAULT_BRAIN_MAPPING.roiBounds.min },
      max: { ...DEFAULT_BRAIN_MAPPING.roiBounds.max },
    },
  });
  const hoveredLobeRef = useRef(null);
  const sceneReadyRef = useRef(false);

  // State
  const [bundle, setBundle] = useState(null);
  const [summary, setSummary] = useState(null);
  const [patientDetail, setPatientDetail] = useState(null);
  const [heatmap, setHeatmap] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [brainLoaded, setBrainLoaded] = useState(false);
  const [brainProgress, setBrainProgress] = useState(0);
  const [brainError, setBrainError] = useState("");
  const [activeAtlas, setActiveAtlas] = useState("aal3"); // atlas key

  const [topFilter, setTopFilter] = useState("50");
  const [showConnections, setShowConnections] = useState(true);
  const [connFilter, setConnFilter] = useState("all");
  const [showRois, setShowRois] = useState(true);
  const [lobeOpacity, setLobeOpacity] = useState(DEFAULT_LOBE_OPACITY);
  const [colorMode, setColorMode] = useState("importance"); // "importance" | "atlas"
  const [activeLobe, setActiveLobe] = useState(null);  // highlighted lobe name
  const [selectedRoi, setSelectedRoi] = useState(null);
  const [hoverInfo, setHoverInfo] = useState(null);
  const [lobeHoverInfo, setLobeHoverInfo] = useState(null);
  const [roiQuery, setRoiQuery] = useState("");
  const [renderStats, setRenderStats] = useState({ rois: 0, connections: 0 });
  const [sidebarTab, setSidebarTab] = useState("rois");
  const [mountTick, setMountTick] = useState(0);

  // Inject CSS once
  useEffect(() => {
    let s = document.getElementById("nb-css");
    if (!s) {
      s = document.createElement("style");
      s.id = "nb-css";
      document.head.appendChild(s);
    }
    if (s.textContent !== CSS) {
      s.textContent = CSS;
    }
  }, []);

  // ─── Load data ───────────────────────────────────────────────────────────────
  const loadArtifacts = async (atlasKey, patientId = activePatient?.id) => {
    const atlas = ATLAS_OPTIONS.find(a => a.key === (atlasKey || activeAtlas)) || ATLAS_OPTIONS[0];
    setLoading(true); setError(""); setSelectedRoi(null);
    try {
      let loaded = false;
      // Try API first (only for default AAL3 atlas)
      if (atlas.key === "aal3") {
        try {
          const patientParam = patientId ? `&patient_id=${encodeURIComponent(patientId)}` : "";
          const r = await fetch(`${API_BASE}/viz-cache/latest?source=mvp${patientParam}`);
          if (r.ok) {
            const row = await r.json();
            setBundle(row.three_js_bundle || null);
            setSummary(row.summary || null);
            setHeatmap(row.fc_heatmap || null);
            loaded = true;
          }
        } catch (_) { }

        if (!loaded) {
          try {
            const r = await fetch(`${API_BASE}/viz-cache/latest?source=mvp`);
            if (r.ok) {
              const row = await r.json();
              setBundle(row.three_js_bundle || null);
              setSummary(row.summary || null);
              setHeatmap(row.fc_heatmap || null);
              loaded = true;
            }
          } catch (_) { }
        }
      }
      if (!loaded) {
        const [bR, sR, hR] = await Promise.all([
          fetch(`/mvp/${atlas.bundleFile}`),
          fetch(`/mvp/${atlas.summaryFile}`),
          fetch("/mvp/fc_heatmap.json"),
        ]);
        if (!bR.ok || !sR.ok)
          throw new Error(`Could not load ${atlas.label} data files.`);
        const [b, s] = await Promise.all([bR.json(), sR.json()]);
        setBundle(b); setSummary(s);
        if (hR.ok) setHeatmap(await hR.json());
      }
    } catch (e) {
      setError(e?.message || "Unknown error loading artifacts.");
    } finally {
      setLoading(false);
    }
  };

  const handleAtlasChange = (key) => {
    setActiveAtlas(key);
    loadArtifacts(key, activePatient?.id);
  };

  const handleReload = () => {
    setMountTick(v => v + 1);
    loadArtifacts(activeAtlas, activePatient?.id);
  };

  useEffect(() => { loadArtifacts(activeAtlas, activePatient?.id); }, [activePatient?.id]); // eslint-disable-line

  useEffect(() => {
    let ignore = false;
    const loadPatient = async () => {
      if (!activePatient?.id) {
        setPatientDetail(null);
        return;
      }
      try {
        const detail = await getPatient(activePatient.id);
        if (!ignore) setPatientDetail(detail);
      } catch (_) {
        if (!ignore) setPatientDetail(activePatient);
      }
    };
    loadPatient();
    return () => {
      ignore = true;
    };
  }, [activePatient]);

  // ─── Derived data ─────────────────────────────────────────────────────────
  const allRois = useMemo(() => bundle?.rois ? [...bundle.rois] : [], [bundle]);
  const allConns = useMemo(() => bundle?.connections ? [...bundle.connections] : [], [bundle]);

  const roiCoordBounds = useMemo(() => {
    let minX = Infinity, minY = Infinity, minZ = Infinity;
    let maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity;
    let validCount = 0;

    allRois.forEach((roi) => {
      const c = resolveCoords(roi);
      if (!c) return;
      const [x, y, z] = c;
      if (![x, y, z].every(Number.isFinite)) return;
      validCount += 1;
      if (x < minX) minX = x;
      if (y < minY) minY = y;
      if (z < minZ) minZ = z;
      if (x > maxX) maxX = x;
      if (y > maxY) maxY = y;
      if (z > maxZ) maxZ = z;
    });

    if (!validCount) {
      return {
        validCount: 0,
        min: { ...DEFAULT_BRAIN_MAPPING.roiBounds.min },
        max: { ...DEFAULT_BRAIN_MAPPING.roiBounds.max },
      };
    }

    return {
      validCount,
      min: { x: minX, y: minY, z: minZ },
      max: { x: maxX, y: maxY, z: maxZ },
    };
  }, [allRois]);

  const filteredRois = useMemo(() => {
    if (!allRois.length) return [];
    const sorted = [...allRois].sort((a, b) => (b.importance || 0) - (a.importance || 0));
    const n = topFilter === "all" ? sorted.length : Math.min(sorted.length, Number(topFilter) || 50);
    return sorted.slice(0, n);
  }, [allRois, topFilter]);

  const filteredRoiIds = useMemo(() => new Set(filteredRois.map(r => Number(r.id))), [filteredRois]);

  const filteredConns = useMemo(() => {
    let cs = [...allConns].sort((a, b) => Math.abs(b.strength || 0) - Math.abs(a.strength || 0))
      .filter(c => filteredRoiIds.has(Number(c.roi_from)) && filteredRoiIds.has(Number(c.roi_to)));
    if (connFilter === "positive") cs = cs.filter(c => (c.strength || 0) >= 0);
    if (connFilter === "negative") cs = cs.filter(c => (c.strength || 0) < 0);
    return cs;
  }, [allConns, filteredRoiIds, connFilter]);

  const selectedRoiId = selectedRoi ? Number(selectedRoi.id) : null;

  const neighborIds = useMemo(() => {
    const s = new Set();
    if (selectedRoiId === null) return s;
    filteredConns.forEach(c => {
      if (Number(c.roi_from) === selectedRoiId) s.add(Number(c.roi_to));
      if (Number(c.roi_to) === selectedRoiId) s.add(Number(c.roi_from));
    });
    return s;
  }, [filteredConns, selectedRoiId]);

  const topRois = useMemo(() =>
    [...allRois].sort((a, b) => (b.importance || 0) - (a.importance || 0)).slice(0, 15), [allRois]);
  const maxImp = useMemo(() =>
    Math.max(...allRois.map(r => Number(r.importance || 0)), 1e-8), [allRois]);

  const displayConns = useMemo(() => {
    if (selectedRoiId !== null) {
      return filteredConns
        .filter(c => Number(c.roi_from) === selectedRoiId || Number(c.roi_to) === selectedRoiId)
        .sort((a, b) => Math.abs(b.strength || 0) - Math.abs(a.strength || 0))
        .slice(0, 14);
    }
    return [...filteredConns]
      .sort((a, b) => Math.abs(b.strength || 0) - Math.abs(a.strength || 0))
      .slice(0, 14);
  }, [filteredConns, selectedRoiId]);

  const selEdgeCount = useMemo(() => {
    if (selectedRoiId === null) return 0;
    return filteredConns.filter(c => Number(c.roi_from) === selectedRoiId || Number(c.roi_to) === selectedRoiId).length;
  }, [filteredConns, selectedRoiId]);

  const roiSearchResults = useMemo(() => {
    const q = roiQuery.trim().toLowerCase();
    if (!q) return [];
    return [...allRois]
      .filter(r => String(r.label || "").toLowerCase().includes(q) || String(r.id ?? "").toLowerCase().includes(q))
      .sort((a, b) => (b.importance || 0) - (a.importance || 0))
      .slice(0, 6);
  }, [allRois, roiQuery]);

  const latestScreening = patientDetail?.latest_screening || activePatient?.latest_screening || null;
  const displaySummary = useMemo(() => {
    if (!latestScreening) return summary || {};
    const latestProb = toFin(latestScreening.prob_asd);
    const metadata = latestScreening.metadata || {};
    return {
      ...(summary || {}),
      prediction: latestScreening.predicted_class || summary?.prediction,
      probability: latestProb ?? summary?.probability,
      confidence:
        toFin(metadata.confidence) ??
        (latestProb !== null ? Math.abs(latestProb - 0.5) * 2 : summary?.confidence),
      severity_bucket: latestScreening.severity_bucket || summary?.severity_bucket,
      patient_id: patientDetail?.id || activePatient?.id,
      patient_name: patientDetail?.name || activePatient?.name,
      patient_age: patientDetail?.age ?? activePatient?.age,
      created_at: latestScreening.created_at,
    };
  }, [activePatient, latestScreening, patientDetail, summary]);
  const isASD = (displaySummary?.prediction || bundle?.prediction?.label || "").toLowerCase() === "asd";
  const prob = displaySummary?.probability ?? bundle?.prediction?.probability ?? null;
  const conf = displaySummary?.confidence ?? bundle?.prediction?.confidence ?? null;
  const opacityPct = Math.round(lobeOpacity * 100);
  const atlasInfo = ATLAS_OPTIONS.find(a => a.key === activeAtlas) || ATLAS_OPTIONS[0];

  // ROI label lookup map for edges tab
  const roiLabelMap = useMemo(() => {
    const m = new Map();
    allRois.forEach(r => m.set(Number(r.id), r.label || `ROI_${r.id}`));
    return m;
  }, [allRois]);

  // Compute FC matrix stats from heatmap data
  const fcStats = useMemo(() => {
    if (!heatmap) return null;
    // heatmap may have pre-computed stats or raw matrix
    if (heatmap.shape && heatmap.mean !== undefined) {
      return { shape: heatmap.shape, mean: heatmap.mean, min: heatmap.min, max: heatmap.max, std: heatmap.std };
    }
    // Try to compute from raw data
    const mat = heatmap.matrix || heatmap.data;
    if (Array.isArray(mat) && mat.length > 0) {
      const flat = mat.flat();
      const n = flat.length;
      const mean = flat.reduce((a, b) => a + b, 0) / n;
      const mn = Math.min(...flat);
      const mx = Math.max(...flat);
      const std = Math.sqrt(flat.reduce((a, b) => a + (b - mean) ** 2, 0) / n);
      const side = Math.round(Math.sqrt(n)) || mat.length;
      return { shape: [side, side], mean, min: mn, max: mx, std };
    }
    return { shape: ["--"], mean: null, min: null, max: null, std: null };
  }, [heatmap]);

  // Per-lobe ROI counts
  const lobeCounts = useMemo(() => {
    const counts = {};
    allRois.forEach(r => {
      const lobe = getLobeLabel(r);
      counts[lobe] = (counts[lobe] || 0) + 1;
    });
    return counts;
  }, [allRois]);

  // ─── THREE.JS SETUP ─────────────────────────────────────────────────────────
  useEffect(() => {
    const container = viewerRef.current;
    if (!container || rendererRef.current) return;

    setBrainLoaded(false);
    setBrainProgress(0);
    setBrainError("");
    let isDisposed = false;
    let loadSucceeded = false;

    const W = Math.max(400, container.clientWidth || 800);
    const H = 560;

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(W, H);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    rendererRef.current = renderer;
    container.innerHTML = "";
    container.appendChild(renderer.domElement);

    // Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color("#f1f5f9");
    sceneRef.current = scene;

    // Fog for depth
    scene.fog = new THREE.FogExp2(0xf1f5f9, 0.008);

    // Camera
    const camera = new THREE.PerspectiveCamera(45, W / H, 0.001, 100);
    camera.position.set(0, 0.5, 1.0); // Stepped back significantly
    camera.lookAt(0, 0.14, 0);
    cameraRef.current = camera;

    // Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.target = new THREE.Vector3(0, 0.14, 0); // Center on brain bounding box roughly
    controls.update();
    controlsRef.current = controls;

    // Lights
    const ambient = new THREE.AmbientLight(0xffffff, 2.0); // Max temp brightness
    scene.add(ambient);
    const dir = new THREE.DirectionalLight(0xffffff, 2.0);
    dir.position.set(1, 2, 1);
    scene.add(dir);

    // ROI + edge groups (placed before brain so they render on top)
    const roiGroup = new THREE.Group();
    const edgeGroup = new THREE.Group();
    roiGroupRef.current = roiGroup;
    edgeGroupRef.current = edgeGroup;
    scene.add(edgeGroup);
    scene.add(roiGroup);

    sceneReadyRef.current = true;

    // Render Loop
    const animate = () => {
      controls.update();

      // Pulse ROI nodes
      const t = clockRef.current.getElapsedTime();
      roiGroup.children.forEach(m => {
        if (m.userData.pulseAmp) {
          const s = m.userData.baseScale * (1 + Math.sin(t * 2.2 + (m.userData.pulsePhase || 0)) * m.userData.pulseAmp);
          m.scale.setScalar(s);
        }
      });
      renderer.render(scene, camera);
      rafRef.current = requestAnimationFrame(animate);
    };
    animate();

    const loader = new GLTFLoader();
    const cacheBuster = "?v=" + Date.now();
    loader.load(
      `/brain_model/brain_model_3.gltf${cacheBuster}`,
      (gltf) => {
        if (isDisposed) return;
        loadSucceeded = true;

        const root = gltf.scene;
        brainRootRef.current = root;
        lobeMeshesRef.current = {};

        root.traverse((child) => {
          if (child.isMesh) {
            const cfg = LOBE_CONFIG[child.name];
            child.material = new THREE.MeshPhongMaterial({
              color: cfg ? cfg.color : "#c8a882",
              emissive: cfg ? cfg.emissive : "#3c2412",
              emissiveIntensity: 0,
              transparent: true,
              opacity: DEFAULT_LOBE_OPACITY,
              depthWrite: false,
              side: THREE.DoubleSide,
            });
            lobeMeshesRef.current[child.name] = child;
          }
        });

        const box = new THREE.Box3().setFromObject(root);
        const size = box.getSize(new THREE.Vector3());
        const center = box.getCenter(new THREE.Vector3());
        const roiMin = roiCoordBounds?.min || DEFAULT_BRAIN_MAPPING.roiBounds.min;
        const roiMax = roiCoordBounds?.max || DEFAULT_BRAIN_MAPPING.roiBounds.max;

        const padFrac = DEFAULT_BRAIN_MAPPING.padding;
        const brainMin = box.min.clone();
        const brainMax = box.max.clone();
        const padX = size.x * padFrac;
        const padY = size.y * padFrac;
        const padZ = size.z * padFrac;

        if (size.x - padX * 2 > 1e-6) { brainMin.x += padX; brainMax.x -= padX; }
        if (size.y - padY * 2 > 1e-6) { brainMin.y += padY; brainMax.y -= padY; }
        if (size.z - padZ * 2 > 1e-6) { brainMin.z += padZ; brainMax.z -= padZ; }

        const scale = size.x > 1e-6 ? size.x / 180 : DEFAULT_BRAIN_MAPPING.scale;
        const maxDim = Math.max(size.x, size.y, size.z, DEFAULT_BRAIN_MAPPING.maxDim);

        brainMappingRef.current = {
          scale,
          center: { x: center.x, y: center.y + ROI_VERTICAL_NUDGE, z: center.z },
          maxDim,
          useAxisMapping: true,   // ← Was false — use the proper axis-mapped path
          flipZ: false,           // ← Anterior (MNI +y) should face +z (camera), no flip
          shrink: DEFAULT_BRAIN_MAPPING.shrink,
          padding: padFrac,
          brainBounds: {
            min: { x: brainMin.x, y: brainMin.y, z: brainMin.z },
            max: { x: brainMax.x, y: brainMax.y, z: brainMax.z },
          },
          roiBounds: {
            min: { x: roiMin.x, y: roiMin.y, z: roiMin.z },
            max: { x: roiMax.x, y: roiMax.y, z: roiMax.z },
          },
        };

        controls.target.set(center.x, center.y, center.z);
        controls.update();

        // Align coordinates and add to scene
        root.scale.set(1, 1, 1);
        root.position.set(0, 0, 0);
        sceneRef.current.add(root);

        setBrainError("");
        setBrainLoaded(true);
        setBrainProgress(100);
        setMountTick(v => v + 1);
      },
      (xhr) => {
        if (isDisposed || loadSucceeded) return;
        if (xhr.total > 0 && sceneReadyRef.current) {
          setBrainProgress(Math.round((xhr.loaded / xhr.total) * 100));
        }
      },
      (err) => {
        if (isDisposed || loadSucceeded || brainRootRef.current) return;
        const message = err?.message || String(err);
        setBrainLoaded(false);
        setBrainError("Failed to load brain model: " + message);
      }
    );

    // Raycaster
    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();

    const onMove = (e) => {
      const rect = renderer.domElement.getBoundingClientRect();
      pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(pointer, camera);

      // Check ROI spheres first
      const roiHits = raycaster.intersectObjects(roiGroup.children, false);
      if (roiHits.length > 0) {
        const roi = roiHits[0].object.userData.roi;
        setHoverInfo({ roi, x: e.clientX - rect.left + 12, y: e.clientY - rect.top + 12 });
        setLobeHoverInfo(null);
        renderer.domElement.style.cursor = "pointer";
        return;
      }
      setHoverInfo(null);

      // Check lobe meshes
      const lobeMeshes = Object.values(lobeMeshesRef.current);
      const lobeHits = raycaster.intersectObjects(lobeMeshes, false);
      if (lobeHits.length > 0) {
        const mesh = lobeHits[0].object;
        const cfg = LOBE_CONFIG[mesh.name];
        if (cfg) {
          setLobeHoverInfo({ name: mesh.name, cfg, x: e.clientX - rect.left + 12, y: e.clientY - rect.top + 12 });
          renderer.domElement.style.cursor = "pointer";
          // Emissive highlight
          if (hoveredLobeRef.current !== mesh) {
            if (hoveredLobeRef.current) hoveredLobeRef.current.material.emissiveIntensity = 0;
            hoveredLobeRef.current = mesh;
            mesh.material.emissiveIntensity = 0.35;
          }
          return;
        }
      }
      setLobeHoverInfo(null);
      if (hoveredLobeRef.current) {
        hoveredLobeRef.current.material.emissiveIntensity = 0;
        hoveredLobeRef.current = null;
      }
      renderer.domElement.style.cursor = "default";
    };

    const onClick = (e) => {
      const rect = renderer.domElement.getBoundingClientRect();
      pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(pointer, camera);

      const roiHits = raycaster.intersectObjects(roiGroup.children, false);
      if (roiHits.length > 0) {
        setSelectedRoi(roiHits[0].object.userData.roi);
        return;
      }
      // Click on lobe → set activeLobe
      const lobeMeshes = Object.values(lobeMeshesRef.current);
      const lobeHits = raycaster.intersectObjects(lobeMeshes, false);
      if (lobeHits.length > 0) {
        const name = lobeHits[0].object.name;
        setActiveLobe(prev => prev === name ? null : name);
      }
    };

    renderer.domElement.addEventListener("pointermove", onMove);
    renderer.domElement.addEventListener("click", onClick);

    const onResize = () => {
      const w = Math.max(400, container.clientWidth || 800);
      camera.aspect = w / H;
      camera.updateProjectionMatrix();
      renderer.setSize(w, H);
    };
    window.addEventListener("resize", onResize);

    return () => {
      isDisposed = true;
      window.removeEventListener("resize", onResize);
      renderer.domElement.removeEventListener("pointermove", onMove);
      renderer.domElement.removeEventListener("click", onClick);
      cancelAnimationFrame(rafRef.current);
      controls.dispose();
      if (brainRootRef.current) { scene.remove(brainRootRef.current); disposeObj(brainRootRef.current); }
      disposeObj(roiGroup); disposeObj(edgeGroup);
      renderer.dispose();
      container.innerHTML = "";
      rendererRef.current = null; sceneRef.current = null;
      cameraRef.current = null; controlsRef.current = null;
      roiGroupRef.current = null; edgeGroupRef.current = null;
      brainRootRef.current = null; lobeMeshesRef.current = {};
      brainMappingRef.current = {
        ...DEFAULT_BRAIN_MAPPING,
        center: { ...DEFAULT_BRAIN_MAPPING.center },
        brainBounds: {
          min: { ...DEFAULT_BRAIN_MAPPING.brainBounds.min },
          max: { ...DEFAULT_BRAIN_MAPPING.brainBounds.max },
        },
        roiBounds: {
          min: { ...DEFAULT_BRAIN_MAPPING.roiBounds.min },
          max: { ...DEFAULT_BRAIN_MAPPING.roiBounds.max },
        },
      };
      sceneReadyRef.current = false;
    };
  }, [bundle, loading, roiCoordBounds]); // Wait for bundle + coord bounds

  // ─── Update lobe opacity + activeLobe highlight ───────────────────────────
  useEffect(() => {
    Object.entries(lobeMeshesRef.current).forEach(([name, mesh]) => {
      if (!mesh.material) return;
      const cfg = LOBE_CONFIG[name] || LOBE_CONFIG["Mesh_0"];
      mesh.material.opacity = lobeOpacity;
      // Active lobe gets brighter emissive + slight opacity boost
      if (activeLobe === name) {
        mesh.material.emissive.set(cfg.color);
        mesh.material.emissiveIntensity = 0.28;
        mesh.material.opacity = Math.min(1, lobeOpacity + 0.2);
      } else if (activeLobe && activeLobe !== name) {
        // dim other lobes
        mesh.material.opacity = Math.max(0.08, lobeOpacity - 0.35);
        mesh.material.emissiveIntensity = 0;
      } else {
        mesh.material.emissiveIntensity = 0;
      }
    });
  }, [lobeOpacity, activeLobe]);

  // ─── ROI + Edge rebuild ───────────────────────────────────────────────────
  useEffect(() => {
    if (!sceneReadyRef.current) return;
    const roiGroup = roiGroupRef.current;
    const edgeGroup = edgeGroupRef.current;
    if (!roiGroup || !edgeGroup) return;

    clearGroup(roiGroup);
    clearGroup(edgeGroup);
    roiMeshMapRef.current = new Map();
    roiPosMapRef.current = new Map();

    if (!brainLoaded) {
      setRenderStats({ rois: 0, connections: 0 });
      return;
    }

    const mapping = brainMappingRef.current;
    if (!mapping || !Number.isFinite(mapping.scale) || mapping.scale <= 0) {
      setRenderStats({ rois: 0, connections: 0 });
      return;
    }

    if (!filteredRois.length || !showRois) {
      setRenderStats({ rois: 0, connections: 0 });
      return;
    }

    const coordMap = new Map();
    const posMap = new Map();
    const maxDim = Number.isFinite(mapping.maxDim) && mapping.maxDim > 0
      ? mapping.maxDim
      : DEFAULT_BRAIN_MAPPING.maxDim;
    let rendered = 0;
    let clampedRois = 0;

    filteredRois.forEach((roi, idx) => {
      const id = Number(roi.id);
      const mni = resolveCoords(roi);
      if (!mni) return;

      // Convert MNI → GLTF world space
      const mappedPos = mniToGltf(mni, mapping);
      const wpos = clampVecToBrainBounds(mappedPos, mapping);
      if (!mappedPos.equals(wpos)) clampedRois += 1;

      const ratio = Math.min(1, Number(roi.importance || 0) / maxImp);
      const ratioBoost = 0.55 + ratio * 0.85;
      const radius = maxDim * 0.012 * ratioBoost;

      let color;
      if (colorMode === "atlas") {
        const lobe = getLobeLabel(roi);
        color = new THREE.Color(LOBE_COLORS_UI[lobe] || "#64748b");
      } else {
        color = importanceColor(ratio);
      }

      const isSelected = selectedRoiId === id;
      const isNeighbor = selectedRoiId !== null && neighborIds.has(id);

      let opacity = 0.96;
      let emissiveMul = 0.34;
      let haloOpacity = 0.1;
      if (selectedRoiId !== null) {
        if (isSelected) {
          opacity = 1.0;
          emissiveMul = 0.95;
          haloOpacity = 0.26;
        } else if (isNeighbor) {
          opacity = 0.94;
          emissiveMul = 0.55;
          haloOpacity = 0.16;
        } else {
          opacity = 0.42;
          emissiveMul = 0.2;
          haloOpacity = 0.08;
        }
      }

      const geo = new THREE.SphereGeometry(radius, 14, 14);
      const mat = new THREE.MeshStandardMaterial({
        color,
        emissive: color.clone().multiplyScalar(emissiveMul),
        roughness: 0.16,
        metalness: 0.06,
        transparent: true,
        opacity,
        depthWrite: true,
      });

      const haloGeo = new THREE.SphereGeometry(radius * 1.65, 12, 12);
      const haloMat = new THREE.MeshBasicMaterial({
        color,
        transparent: true,
        opacity: haloOpacity,
        depthWrite: false,
        depthTest: true,
        blending: THREE.AdditiveBlending,
        toneMapped: false,
      });

      const halo = new THREE.Mesh(haloGeo, haloMat);
      halo.position.copy(wpos);
      halo.renderOrder = isSelected ? 4 : 3;
      halo.userData.roi = roi;
      halo.userData.pulseAmp = ratio > 0.05 ? (0.03 + ratio * 0.08) * 0.55 : 0;
      halo.userData.pulsePhase = (id * 1.73) % (Math.PI * 2);
      halo.userData.baseScale = 1.02;
      roiGroup.add(halo);

      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.copy(wpos);
      mesh.renderOrder = isSelected ? 5 : 4;
      mesh.userData.roi = roi;
      mesh.userData.pulseAmp = ratio > 0.05 ? 0.03 + ratio * 0.08 : 0;
      mesh.userData.pulsePhase = (id * 1.73) % (Math.PI * 2);
      mesh.userData.baseScale = 1;
      roiGroup.add(mesh);
      roiMeshMapRef.current.set(id, mesh);

      coordMap.set(id, wpos);
      posMap.set(id, wpos);
      rendered++;
    });

    roiPosMapRef.current = posMap;

    // Connections
    let edgeCount = 0;
    if (showConnections) {
      const basePosArr = [], baseColArr = [];
      const hiPosArr = [], hiColArr = [];
      const dimPosArr = [], dimColArr = [];

      filteredConns.slice(0, 400).forEach(c => {
        const from = coordMap.get(Number(c.roi_from));
        const to = coordMap.get(Number(c.roi_to));
        if (!from || !to) return;
        edgeCount++;

        const str = Number(c.strength || 0);
        const posC = new THREE.Color("#f97316").lerp(new THREE.Color("#fbbf24"), Math.min(1, Math.abs(str) * 2));
        const negC = new THREE.Color("#0284c7").lerp(new THREE.Color("#06b6d4"), Math.min(1, Math.abs(str) * 2));
        const edgeColor = str >= 0 ? posC : negC;

        const addEdge = (pa, ca, col) => {
          pa.push(from.x, from.y, from.z, to.x, to.y, to.z);
          ca.push(col.r, col.g, col.b, col.r, col.g, col.b);
        };

        if (selectedRoiId === null) {
          addEdge(basePosArr, baseColArr, edgeColor);
        } else {
          const fi = Number(c.roi_from), ti = Number(c.roi_to);
          const incident = fi === selectedRoiId || ti === selectedRoiId;
          if (incident) addEdge(hiPosArr, hiColArr, edgeColor.clone().lerp(new THREE.Color("#fde68a"), 0.3));
          else addEdge(dimPosArr, dimColArr, new THREE.Color("#151c3a"));
        }
      });

      const addLayer = (pa, ca, op, ro = 1) => {
        if (!pa.length) return;
        const geo = new THREE.BufferGeometry();
        geo.setAttribute("position", new THREE.Float32BufferAttribute(pa, 3));
        geo.setAttribute("color", new THREE.Float32BufferAttribute(ca, 3));
        const mat = new THREE.LineBasicMaterial({ vertexColors: true, transparent: true, opacity: op, depthWrite: false });
        const lines = new THREE.LineSegments(geo, mat);
        lines.renderOrder = ro;
        edgeGroup.add(lines);
      };

      if (selectedRoiId === null) {
        addLayer(basePosArr, baseColArr, 0.45, 1);
      } else {
        addLayer(dimPosArr, dimColArr, 0.04, 1);
        addLayer(hiPosArr, hiColArr, 0.98, 2);
      }
    }

    setRenderStats({ rois: rendered, connections: edgeCount, clamped: clampedRois });
  }, [mountTick, filteredRois, filteredConns, showConnections, showRois, selectedRoiId, neighborIds, colorMode, maxImp, brainLoaded]); // eslint-disable-line

  // ─── Camera fly-to on ROI select ──────────────────────────────────────────
  useEffect(() => {
    if (selectedRoiId === null) return;
    const pos = roiPosMapRef.current.get(selectedRoiId);
    const camera = cameraRef.current;
    const controls = controlsRef.current;
    if (!pos || !camera || !controls) return;

    const dir = camera.position.clone().sub(controls.target);
    if (dir.length() < 1e-4) dir.set(0.1, 0.1, 0.3);
    const d = Math.max(0.08, Math.min(0.22, dir.length() * 0.85));
    const nextPos = pos.clone().add(dir.normalize().multiplyScalar(d));

    gsap.killTweensOf(camera.position);
    gsap.killTweensOf(controls.target);
    gsap.to(camera.position, { x: nextPos.x, y: nextPos.y, z: nextPos.z, duration: 0.8, ease: "power2.out" });
    gsap.to(controls.target, {
      x: pos.x, y: pos.y, z: pos.z, duration: 0.8, ease: "power2.out",
      onUpdate: () => controls.update()
    });
  }, [selectedRoiId, renderStats.rois]);

  // ─── RENDER ───────────────────────────────────────────────────────────────
  return (
    <div className="nb-root">
      <div style={{ maxWidth: 1440, margin: "0 auto", padding: "22px 18px", position: "relative", zIndex: 1 }}>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 14, marginBottom: 20 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{
              width: 40, height: 40, borderRadius: 12, background: "linear-gradient(135deg,#0ea5e9,#10b981)",
              display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0
            }}>
              <Brain size={20} color="#fff" />
            </div>
            <div>
              <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: ".12em", textTransform: "uppercase", color: "#475569", marginBottom: 2 }}>
                {atlasInfo.label} Atlas · Functional Connectivity
              </p>
              <h1 className="neon-text" style={{ fontSize: 22, fontWeight: 800, lineHeight: 1.1 }}>
                Brain ROI Visualization
              </h1>
              <p style={{ fontSize: 11, color: "#64748b", marginTop: 3 }}>
                Anatomical 3D brain with per-lobe atlas overlay and fMRI connectivity nodes
              </p>
              <p style={{ fontSize: 11, color: "#334155", marginTop: 6 }}>
                Active patient:{" "}
                <span style={{ fontWeight: 700 }}>
                  {activePatient?.name ? `${activePatient.name} • ${activePatient.age ?? "—"}` : "No patient selected"}
                </span>
              </p>
            </div>
          </div>
          <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
            <select className="sel-input" value={activeAtlas} onChange={e => handleAtlasChange(e.target.value)}
              style={{ minWidth: 120 }} id="atlas-selector">
              {ATLAS_OPTIONS.map(a => (
                <option key={a.key} value={a.key}>{a.label}</option>
              ))}
            </select>
            <button className="pill-btn pill-off" onClick={handleReload}>
              <RefreshCw size={11} /> Reload
            </button>
          </div>
        </div>

        {/* Data loading / error */}
        {loading && (
          <div className="glass" style={{ padding: "28px 20px", textAlign: "center", marginBottom: 16 }}>
            <div style={{ display: "inline-flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
              <div style={{
                width: 36, height: 36, borderRadius: "50%",
                border: "3px solid rgba(14,165,233,.18)", borderTopColor: "#0ea5e9",
                animation: "spin .8s linear infinite"
              }} />
              <p style={{ color: "#64748b", fontSize: 13 }}>Loading connectivity data…</p>
            </div>
          </div>
        )}
        {!loading && error && (
          <div className="glass" style={{ padding: "18px 20px", borderColor: "rgba(239,68,68,.3)", marginBottom: 16 }}>
            <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
              <AlertCircle color="#f87171" size={16} style={{ flexShrink: 0, marginTop: 1 }} />
              <div>
                <p style={{ fontWeight: 700, color: "#b91c1c", fontSize: 13, marginBottom: 3 }}>Load failed</p>
                <p style={{ color: "#f87171", fontSize: 11 }}>{error}</p>
              </div>
            </div>
          </div>
        )}

        {!loading && !error && bundle && summary && (
          <>
            {/* Stat strip */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(150px,1fr))", gap: 10, marginBottom: 16 }}
              className="fade-in">
              <div className="stat-card">
                <p style={{ fontSize: 9, fontWeight: 700, letterSpacing: ".1em", textTransform: "uppercase", color: "#475569", marginBottom: 6 }}>Prediction</p>
                <span className={isASD ? "asd-badge" : "ctrl-badge"}>{displaySummary.prediction || "--"}</span>
              </div>
              <div className="stat-card">
                <p style={{ fontSize: 9, fontWeight: 700, letterSpacing: ".1em", textTransform: "uppercase", color: "#475569", marginBottom: 6 }}>ASD Probability</p>
                <p style={{ fontSize: 22, fontWeight: 800, color: isASD ? "#b91c1c" : "#166534" }}>{pct(prob)}</p>
                <div className="imp-bar"><div className="imp-fill" style={{ width: `${(prob || 0) * 100}%`, background: isASD ? "#ef4444" : "#22c55e" }} /></div>
              </div>
              <div className="stat-card">
                <p style={{ fontSize: 9, fontWeight: 700, letterSpacing: ".1em", textTransform: "uppercase", color: "#475569", marginBottom: 6 }}>Confidence</p>
                <p style={{ fontSize: 22, fontWeight: 800, color: "#0284c7" }}>{pct(conf)}</p>
                <div className="imp-bar"><div className="imp-fill" style={{ width: `${(conf || 0) * 100}%`, background: "#0ea5e9" }} /></div>
              </div>
              <div className="stat-card">
                <p style={{ fontSize: 9, fontWeight: 700, letterSpacing: ".1em", textTransform: "uppercase", color: "#475569", marginBottom: 6 }}>Atlas</p>
                <p style={{ fontSize: 18, fontWeight: 700, color: "#0284c7" }}>{atlasInfo.label}</p>
                <p style={{ fontSize: 10, color: "#475569", marginTop: 2 }}>{allRois.length} regions</p>
              </div>
              <div className="stat-card">
                <p style={{ fontSize: 9, fontWeight: 700, letterSpacing: ".1em", textTransform: "uppercase", color: "#475569", marginBottom: 6 }}>Rendered</p>
                <p style={{ fontSize: 18, fontWeight: 700, color: "#10b981" }}>{renderStats.rois} <span style={{ fontSize: 11, color: "#475569" }}>ROIs</span></p>
                <p style={{ fontSize: 10, color: "#475569", marginTop: 2 }}>{renderStats.connections} connections</p>
              </div>
            </div>

            {/* Main grid */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 310px", gap: 14, marginBottom: 14 }}>

              {/* ── Viewer ─────────────────────────────────────────────────── */}
              <div className="glass" style={{ padding: 14, overflow: "hidden" }}>

                {/* Controls */}
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 12, alignItems: "center" }}>
                  <select className="sel-input" value={topFilter} onChange={e => setTopFilter(e.target.value)} id="roi-filter">
                    <option value="20">Top 20</option>
                    <option value="50">Top 50</option>
                    <option value="100">Top 100</option>
                    <option value="all">All ROIs</option>
                  </select>

                  <button className={`pill-btn ${colorMode === "importance" ? "pill-on" : "pill-off"}`}
                    onClick={() => setColorMode("importance")} id="btn-importance">
                    <TrendingUp size={10} /> Importance
                  </button>
                  <button className={`pill-btn ${colorMode === "atlas" ? "pill-on" : "pill-off"}`}
                    onClick={() => setColorMode("atlas")} id="btn-atlas">
                    <Layers size={10} /> Atlas Lobe
                  </button>

                  <button className={`pill-btn ${showRois ? "pill-on" : "pill-off"}`}
                    onClick={() => setShowRois(v => !v)} id="btn-rois">
                    {showRois ? <Eye size={10} /> : <EyeOff size={10} />} ROIs
                  </button>
                  <button className={`pill-btn ${showConnections ? "pill-on" : "pill-off"}`}
                    onClick={() => setShowConnections(v => !v)} id="btn-conns">
                    {showConnections ? <Eye size={10} /> : <EyeOff size={10} />} FC Edges
                  </button>

                  {showConnections && (
                    <select className="sel-input" value={connFilter} onChange={e => setConnFilter(e.target.value)}>
                      <option value="all">All edges</option>
                      <option value="positive">Positive only</option>
                      <option value="negative">Negative only</option>
                    </select>
                  )}

                  {/* Lobe opacity */}
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 10, color: "#475569" }}>Opacity</span>
                    <input type="range" className="nb-range" min="0.08" max="1" step="0.02"
                      value={lobeOpacity} onChange={e => setLobeOpacity(Number(e.target.value))}
                      style={{
                        width: 120,
                        background: `linear-gradient(90deg, #0ea5e9 0%, #0ea5e9 ${opacityPct}%, rgba(148,163,184,.34) ${opacityPct}%, rgba(148,163,184,.34) 100%)`,
                      }}
                      id="opacity-slider"
                      aria-label="Lobe opacity"
                      title={`${opacityPct}%`}
                    />
                    <span style={{
                      fontSize: 10,
                      color: "#0369a1",
                      minWidth: 36,
                      textAlign: "center",
                      padding: "2px 6px",
                      borderRadius: 999,
                      background: "rgba(14,165,233,.12)",
                      border: "1px solid rgba(14,165,233,.24)",
                      fontWeight: 600,
                    }}>
                      {opacityPct}%
                    </span>
                  </div>

                  {/* Brain status */}
                  {!brainLoaded && brainProgress < 100 && !brainError && (
                    <span style={{
                      fontSize: 10, padding: "3px 8px", borderRadius: 6,
                      background: "rgba(234,179,8,.12)", border: "1px solid rgba(234,179,8,.26)", color: "#a16207"
                    }}>
                      ◌ brain {brainProgress}%…
                    </span>
                  )}
                  {brainLoaded && (
                    <span style={{
                      fontSize: 10, padding: "3px 8px", borderRadius: 6,
                      background: "rgba(34,197,94,.12)", border: "1px solid rgba(34,197,94,.24)", color: "#166534"
                    }}>
                      ● brain ready
                    </span>
                  )}
                  {brainError && (
                    <span style={{
                      fontSize: 10, padding: "3px 8px", borderRadius: 6,
                      background: "rgba(239,68,68,.12)", border: "1px solid rgba(239,68,68,.24)", color: "#b91c1c",
                      maxWidth: 180, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap"
                    }} title={brainError}>
                      ✕ {brainError.slice(0, 40)}
                    </span>
                  )}
                  {activeLobe && (
                    <button className="pill-btn pill-off" style={{ fontSize: 10 }}
                      onClick={() => setActiveLobe(null)}>
                      <X size={9} /> Clear lobe
                    </button>
                  )}
                </div>

                {/* 3D Canvas */}
                <div className="viewer-wrap" style={{ position: "relative" }}>
                  <div className="viewer-grid" />
                  <div className="viewer-scan" />

                  {/* Corner labels */}
                  <div style={{ position: "absolute", top: 10, left: 12, zIndex: 3, pointerEvents: "none" }}>
                    <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: ".1em", color: "rgba(3,105,161,.68)", textTransform: "uppercase" }}>
                      {atlasInfo.label} · fMRI Connectivity
                    </span>
                  </div>
                  <div style={{ position: "absolute", top: 10, right: 12, zIndex: 3, pointerEvents: "none" }}>
                    <span className="mono" style={{ fontSize: 9, fontWeight: 700, color: "rgba(110,231,183,.45)" }}>
                      {renderStats.rois} nodes · {renderStats.connections} edges
                    </span>
                  </div>

                  {/* Orientation labels */}
                  <div style={{ position: "absolute", bottom: 46, left: "50%", transform: "translateX(-50%)", zIndex: 3, pointerEvents: "none" }}>
                    <span style={{ fontSize: 9, color: "rgba(148,163,184,.4)", fontWeight: 600 }}>ANTERIOR</span>
                  </div>
                  <div style={{ position: "absolute", top: 40, left: "50%", transform: "translateX(-50%)", zIndex: 3, pointerEvents: "none" }}>
                    <span style={{ fontSize: 9, color: "rgba(148,163,184,.4)", fontWeight: 600 }}>SUPERIOR</span>
                  </div>
                  <div style={{ position: "absolute", top: "50%", left: 10, transform: "translateY(-50%)", zIndex: 3, pointerEvents: "none" }}>
                    <span style={{ fontSize: 9, color: "rgba(148,163,184,.4)", fontWeight: 600, writingMode: "vertical-rl" }}>LEFT</span>
                  </div>
                  <div style={{ position: "absolute", top: "50%", right: 10, transform: "translateY(-50%)", zIndex: 3, pointerEvents: "none" }}>
                    <span style={{ fontSize: 9, color: "rgba(148,163,184,.4)", fontWeight: 600, writingMode: "vertical-rl" }}>RIGHT</span>
                  </div>

                  <div ref={viewerRef} style={{ width: "100%", minHeight: 560 }} />

                  {/* ROI hover tooltip */}
                  {hoverInfo?.roi && (
                    <div className="tooltip" style={{ left: hoverInfo.x, top: hoverInfo.y }}>
                      <p style={{ fontSize: 11, fontWeight: 700, color: "#0f172a", marginBottom: 4 }}>{hoverInfo.roi.label}</p>
                      <p style={{ fontSize: 10, color: "#0369a1" }}>
                        importance: <span className="mono" style={{ color: "#0ea5e9" }}>{mini(hoverInfo.roi.importance)}</span>
                      </p>
                      <p style={{ fontSize: 9, color: "#475569", marginTop: 3 }}>{getLobeLabel(hoverInfo.roi)}</p>
                    </div>
                  )}
                  {/* Lobe hover tooltip */}
                  {lobeHoverInfo && !hoverInfo && (
                    <div className="tooltip" style={{ left: lobeHoverInfo.x, top: lobeHoverInfo.y }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 5 }}>
                        <span style={{ width: 10, height: 10, borderRadius: 3, background: lobeHoverInfo.cfg.color, display: "inline-block", flexShrink: 0 }} />
                        <p style={{ fontSize: 12, fontWeight: 700, color: "#0f172a" }}>{lobeHoverInfo.cfg.label} Lobe</p>
                      </div>
                      <p style={{ fontSize: 10, color: "#475569" }}>{lobeHoverInfo.cfg.desc}</p>
                      <p style={{ fontSize: 9, color: "#64748b", marginTop: 4 }}>Click to isolate</p>
                    </div>
                  )}
                </div>

                {/* Legend */}
                <div style={{ marginTop: 10, display: "flex", flexWrap: "wrap", gap: 10, alignItems: "center" }}>
                  {/* Lobe chips */}
                  {Object.entries(LOBE_CONFIG).filter(([k]) => k !== "Mesh_0").map(([name, cfg]) => (
                    <button key={name}
                      onClick={() => setActiveLobe(prev => prev === name ? null : name)}
                      style={{
                        display: "flex", alignItems: "center", gap: 5, padding: "3px 8px", borderRadius: 6,
                        fontSize: 10, fontWeight: 600, cursor: "pointer",
                        background: activeLobe === name ? `${cfg.color}22` : "rgba(255,255,255,.95)",
                        border: `1px solid ${activeLobe === name ? `${cfg.color}66` : "rgba(148,163,184,.28)"}`,
                        color: activeLobe === name ? cfg.color : "#475569", transition: "all .2s"
                      }}>
                      <span style={{ width: 8, height: 8, borderRadius: 2, background: cfg.color, display: "inline-block" }} />
                      {cfg.label}
                    </button>
                  ))}
                  {showConnections && <>
                    <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 10, color: "#94a3b8", marginLeft: 4 }}>
                      <span style={{ width: 14, height: 2, background: "#f97316", display: "inline-block", borderRadius: 1 }} />Positive FC
                    </span>
                    <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 10, color: "#94a3b8" }}>
                      <span style={{ width: 14, height: 2, background: "#0284c7", display: "inline-block", borderRadius: 1 }} />Negative FC
                    </span>
                  </>}
                </div>
              </div>

              {/* ── Sidebar ──────────────────────────────────────────────── */}
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {/* Tabs */}
                <div className="glass-sm" style={{ display: "flex", padding: 4, gap: 2 }}>
                  {[{ k: "rois", icon: <Brain size={10} />, label: "ROIs" },
                  { k: "connections", icon: <Link2 size={10} />, label: "Edges" },
                  { k: "info", icon: <Info size={10} />, label: "Stats" }].map(tab => (
                    <button key={tab.k} className="tab-btn"
                      style={{
                        background: sidebarTab === tab.k ? "rgba(14,165,233,.18)" : "transparent",
                        color: sidebarTab === tab.k ? "#0369a1" : "#475569", border: "none"
                      }}
                      onClick={() => setSidebarTab(tab.k)} id={`tab-${tab.k}`}>
                      {tab.icon}{tab.label}
                    </button>
                  ))}
                </div>

                {/* ROIs tab */}
                {sidebarTab === "rois" && (
                  <div className="glass" style={{ padding: 14, flex: 1, overflow: "hidden" }}>
                    {/* Selected ROI */}
                    {selectedRoi ? (
                      <div style={{
                        background: "rgba(14,165,233,.08)", border: "1px solid rgba(14,165,233,.34)",
                        borderRadius: 12, padding: "12px 14px", marginBottom: 12, position: "relative"
                      }}>
                        <button onClick={() => setSelectedRoi(null)}
                          style={{ position: "absolute", top: 8, right: 8, background: "none", border: "none", color: "#475569", cursor: "pointer" }}>
                          <X size={11} />
                        </button>
                        <p style={{ fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".1em", color: "#0284c7", marginBottom: 5 }}>
                          Selected ROI
                        </p>
                        <p style={{ fontSize: 13, fontWeight: 700, color: "#0f172a", marginBottom: 3 }}>
                          {selectedRoi.label}
                          <span style={{ fontSize: 10, color: "#0284c7", marginLeft: 5 }}>ROI {selectedRoi.id}</span>
                        </p>
                        <p style={{ fontSize: 10, color: "#0369a1", marginBottom: 3 }}>
                          importance: <span className="mono" style={{ color: "#0ea5e9" }}>{mini(selectedRoi.importance)}</span>
                        </p>
                        <div className="imp-bar">
                          <div className="imp-fill" style={{
                            width: `${(Number(selectedRoi.importance || 0) / maxImp) * 100}%`,
                            background: "linear-gradient(90deg,#0284c7,#0ea5e9)"
                          }} />
                        </div>
                        <div style={{ display: "flex", gap: 6, marginTop: 6, flexWrap: "wrap" }}>
                          <span className="tag" style={{
                            background: `${LOBE_COLORS_UI[getLobeLabel(selectedRoi)] || "#64748b"}22`,
                            color: LOBE_COLORS_UI[getLobeLabel(selectedRoi)] || "#94a3b8",
                            border: `1px solid ${LOBE_COLORS_UI[getLobeLabel(selectedRoi)] || "#64748b"}44`
                          }}>
                            {getLobeLabel(selectedRoi)}
                          </span>
                          <span style={{ fontSize: 10, color: "#475569" }}>{selEdgeCount} edges</span>
                        </div>
                        {Array.isArray(selectedRoi.coords) && (
                          <p className="mono" style={{ fontSize: 9, color: "#334155", marginTop: 5 }}>
                            MNI: {selectedRoi.coords.map(c => mini(Number(c))).join("  ")}
                          </p>
                        )}
                      </div>
                    ) : (
                      <div style={{
                        background: "rgba(248,250,252,.95)", border: "1px dashed rgba(148,163,184,.35)",
                        borderRadius: 11, padding: "10px 14px", marginBottom: 12, textAlign: "center"
                      }}>
                        <p style={{ fontSize: 11, color: "#334155" }}>Click a node in the 3D scene</p>
                      </div>
                    )}

                    {/* Search */}
                    <div style={{ position: "relative", marginBottom: 10 }}>
                      <Search size={11} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "#475569" }} />
                      <input className="src-input" value={roiQuery} onChange={e => setRoiQuery(e.target.value)}
                        placeholder="Search ROI label or ID…" id="roi-search" />
                      {roiQuery.trim() && roiSearchResults.length > 0 && (
                        <div style={{
                          position: "absolute", zIndex: 20, top: "calc(100% + 3px)", left: 0, right: 0,
                          background: "rgba(255,255,255,.98)", border: "1px solid rgba(148,163,184,.35)",
                          borderRadius: 10, overflow: "hidden", boxShadow: "0 12px 24px rgba(15,23,42,.16)"
                        }}>
                          {roiSearchResults.map(roi => (
                            <button key={roi.id}
                              onClick={() => { setTopFilter("all"); setSelectedRoi(roi); setRoiQuery(""); }}
                              style={{
                                display: "block", width: "100%", textAlign: "left", padding: "8px 12px",
                                fontSize: 11, color: "#334155", background: "none", border: "none", cursor: "pointer",
                                borderBottom: "1px solid rgba(148,163,184,.14)"
                              }}
                              onMouseEnter={e => e.currentTarget.style.background = "rgba(14,165,233,.12)"}
                              onMouseLeave={e => e.currentTarget.style.background = "none"}>
                              <span style={{ fontWeight: 600 }}>{roi.label}</span>
                              <span style={{ color: "#475569", marginLeft: 6 }}>· {pct(roi.importance)}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    <p className="sec-title"><TrendingUp size={9} />Top Regions</p>
                    <div style={{ display: "flex", flexDirection: "column", gap: 5, maxHeight: 340, overflowY: "auto", paddingRight: 2 }}>
                      {topRois.map((roi, idx) => {
                        const ratio = Math.min(1, Number(roi.importance || 0) / maxImp);
                        const lobe = getLobeLabel(roi);
                        const lc = LOBE_COLORS_UI[lobe] || "#64748b";
                        return (
                          <button key={roi.id} className={`roi-item ${selectedRoiId === Number(roi.id) ? "active" : ""}`}
                            onClick={() => setSelectedRoi(roi)} id={`roi-${roi.id}`}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                              <div>
                                <p style={{ fontSize: 9, color: "#475569", marginBottom: 2 }}>#{idx + 1}</p>
                                <p style={{ fontSize: 12, fontWeight: 600, color: "#0f172a" }}>{roi.label}</p>
                              </div>
                              <span className="tag" style={{ background: `${lc}22`, color: lc, border: `1px solid ${lc}40`, fontSize: 9 }}>
                                {lobe}
                              </span>
                            </div>
                            <div className="imp-bar">
                              <div className="imp-fill" style={{ width: `${ratio * 100}%`, background: `linear-gradient(90deg,${lc}80,${lc})` }} />
                            </div>
                            <p className="mono" style={{ fontSize: 9, color: "#475569", marginTop: 2 }}>{pct(roi.importance)}</p>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Connections tab */}
                {sidebarTab === "connections" && (
                  <div className="glass" style={{ padding: 14, flex: 1, overflow: "hidden" }}>
                    <p className="sec-title"><Link2 size={9} />
                      {selectedRoiId !== null ? "ROI Neighborhood" : "Top Connections"}
                    </p>
                    <div style={{ display: "flex", flexDirection: "column", gap: 7, maxHeight: 540, overflowY: "auto", paddingRight: 2 }}>
                      {displayConns.length === 0 && (
                        <p style={{ fontSize: 11, color: "#334155", textAlign: "center", padding: "16px 0" }}>No connections</p>
                      )}
                      {displayConns.map((c, idx) => {
                        const str = Number(c.strength || 0), isPos = str >= 0;
                        const fromLabel = roiLabelMap.get(Number(c.roi_from)) || `ROI_${c.roi_from}`;
                        const toLabel = roiLabelMap.get(Number(c.roi_to)) || `ROI_${c.roi_to}`;
                        return (
                          <div key={`${c.roi_from}-${c.roi_to}-${idx}`} className="conn-card">
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                              <p style={{ fontSize: 11, fontWeight: 600, color: "#0f172a" }}>
                                {fromLabel} <span style={{ color: "#94a3b8" }}>↔</span> {toLabel}
                              </p>
                              <span className="tag" style={{
                                background: isPos ? "rgba(249,115,22,.12)" : "rgba(14,165,233,.12)",
                                color: isPos ? "#fb923c" : "#0284c7",
                                border: `1px solid ${isPos ? "rgba(249,115,22,.25)" : "rgba(14,165,233,.28)"}`
                              }}>
                                {isPos ? "+" : "−"}{mini(Math.abs(str))}
                              </span>
                            </div>
                            <div className="imp-bar">
                              <div className="imp-fill" style={{
                                width: `${Math.min(100, Math.abs(str) * 100)}%`,
                                background: isPos ? "linear-gradient(90deg,#f97316,#fbbf24)" : "linear-gradient(90deg,#0284c7,#06b6d4)"
                              }} />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Stats tab */}
                {sidebarTab === "info" && (
                  <div className="glass" style={{ padding: 14, flex: 1, overflow: "hidden" }}>
                    <p className="sec-title"><Activity size={9} />FC Matrix</p>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 7, marginBottom: 14 }}>
                      {[
                        { label: "Shape", value: fcStats ? (Array.isArray(fcStats.shape) ? fcStats.shape.join(" × ") : "--") : "--" },
                        { label: "Mean FC", value: fcStats ? mini(fcStats.mean) : "--" },
                        { label: "Min", value: fcStats ? mini(fcStats.min) : "--" },
                        { label: "Max", value: fcStats ? mini(fcStats.max) : "--" },
                      ].map(item => (
                        <div key={item.label} className="glass-sm" style={{ padding: "9px 11px" }}>
                          <p style={{ fontSize: 9, textTransform: "uppercase", letterSpacing: ".08em", color: "#475569", marginBottom: 3 }}>{item.label}</p>
                          <p className="mono" style={{ fontSize: 12, fontWeight: 700, color: "#0284c7" }}>{item.value}</p>
                        </div>
                      ))}
                    </div>

                    <p className="sec-title"><Zap size={9} />Model</p>
                    <div style={{ display: "flex", flexDirection: "column", gap: 5, marginBottom: 14 }}>
                      {[
                        { label: "Attribution", value: summary.attribution_method || "--" },
                        { label: "Atlas", value: atlasInfo.label },
                        { label: "Total ROIs", value: allRois.length },
                        { label: "Filtered", value: filteredRois.length },
                        { label: "Connections", value: filteredConns.length },
                      ].map(item => (
                        <div key={item.label} style={{
                          display: "flex", justifyContent: "space-between",
                          padding: "7px 10px", background: "rgba(248,250,252,.95)", borderRadius: 7
                        }}>
                          <span style={{ fontSize: 11, color: "#475569" }}>{item.label}</span>
                          <span className="mono" style={{ fontSize: 11, color: "#0284c7", fontWeight: 600 }}>{item.value}</span>
                        </div>
                      ))}
                    </div>

                    <p className="sec-title"><Brain size={9} />Lobes ({allRois.length} ROIs)</p>
                    <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                      {Object.entries(LOBE_CONFIG).filter(([k]) => k !== "Mesh_0").map(([name, cfg]) => {
                        const count = lobeCounts[cfg.label] || 0;
                        return (
                          <button key={name}
                            onClick={() => setActiveLobe(prev => prev === name ? null : name)}
                            style={{
                              display: "flex", alignItems: "center", gap: 8, padding: "8px 10px",
                              background: activeLobe === name ? `${cfg.color}18` : "rgba(255,255,255,.95)",
                              border: `1px solid ${activeLobe === name ? `${cfg.color}50` : "rgba(148,163,184,.26)"}`,
                              borderRadius: 8, cursor: "pointer", transition: "all .2s", textAlign: "left",
                              width: "100%"
                            }}>
                            <span style={{ width: 8, height: 8, borderRadius: 2, background: cfg.color, flexShrink: 0 }} />
                            <div style={{ flex: 1 }}>
                              <p style={{ fontSize: 12, fontWeight: 600, color: activeLobe === name ? cfg.color : "#0f172a" }}>{cfg.label}</p>
                              <p style={{ fontSize: 10, color: "#475569" }}>{cfg.desc}</p>
                            </div>
                            <span className="mono" style={{
                              fontSize: 10, fontWeight: 700, color: cfg.color,
                              background: `${cfg.color}14`, padding: "2px 7px", borderRadius: 5
                            }}>{count}</span>
                          </button>
                        );
                      })}
                      {(lobeCounts["Other"] || 0) > 0 && (
                        <div style={{
                          display: "flex", alignItems: "center", gap: 8, padding: "8px 10px",
                          background: "rgba(248,250,252,.95)", borderRadius: 8,
                          border: "1px solid rgba(148,163,184,.2)"
                        }}>
                          <span style={{ width: 8, height: 8, borderRadius: 2, background: "#64748b", flexShrink: 0 }} />
                          <div style={{ flex: 1 }}>
                            <p style={{ fontSize: 12, fontWeight: 600, color: "#64748b" }}>Other</p>
                          </div>
                          <span className="mono" style={{ fontSize: 10, fontWeight: 700, color: "#64748b" }}>{lobeCounts["Other"]}</span>
                        </div>
                      )}
                      {(lobeCounts["Subcortical"] || 0) > 0 && (
                        <div style={{
                          display: "flex", alignItems: "center", gap: 8, padding: "8px 10px",
                          background: "rgba(248,250,252,.95)", borderRadius: 8,
                          border: "1px solid rgba(148,163,184,.2)"
                        }}>
                          <span style={{ width: 8, height: 8, borderRadius: 2, background: "#fb923c", flexShrink: 0 }} />
                          <div style={{ flex: 1 }}>
                            <p style={{ fontSize: 12, fontWeight: 600, color: "#fb923c" }}>Subcortical</p>
                          </div>
                          <span className="mono" style={{ fontSize: 10, fontWeight: 700, color: "#fb923c" }}>{lobeCounts["Subcortical"]}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
