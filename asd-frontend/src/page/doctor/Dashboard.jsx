// src/page/Dashboard.jsx
import React, { useEffect, useState, useMemo } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

import { getActivePatient, getPatients } from "../../utils/storage";
import { useActivePatient } from "../../context/ActivePatientContext";
import SeverityMeter from "../../components/SeverityMeter";

import {
  Server,
  Cpu,
  BarChart2,
  RefreshCw,
  Activity,
  UserPlus,
} from "lucide-react";
import i18n from "../../i18n";

const API_BASE = process.env.REACT_APP_API_BASE || "http://127.0.0.1:8001";
const SITE_NAME = "dr.THYNK";

function timeAgo(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const diff = Math.floor((Date.now() - d.getTime()) / 1000);
  if (diff < 60) return `${diff}s`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  return `${Math.floor(diff / 86400)}d`;
}

// Map backend severity_bucket -> UI labels used by SeverityMeter
function mapSeverity(bucket) {
  const b = (bucket || "").toLowerCase();
  if (b === "high") return "HIGH";
  if (b === "medium") return "MODERATE";
  if (b === "low") return "MILD"; // or "UNLIKELY" if you prefer
  return "UNKNOWN";
}

const Donut = ({ percent = 0, size = 90, stroke = 10 }) => {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const dash = (percent / 100) * c;

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      role="img"
      aria-label={`${percent}%`}
    >
      <g transform={`translate(${size / 2},${size / 2})`}>
        <circle
          r={r}
          stroke="rgba(15,23,42,0.06)"
          strokeWidth={stroke}
          fill="transparent"
        />
        <circle
          r={r}
          stroke="url(#g1)"
          strokeWidth={stroke}
          fill="transparent"
          strokeDasharray={`${dash} ${c - dash}`}
          transform="rotate(-90)"
          strokeLinecap="round"
        />
        <defs>
          <linearGradient id="g1" x1="0%" x2="100%">
            <stop offset="0%" stopColor="#06b6d4" />
            <stop offset="100%" stopColor="#10b981" />
          </linearGradient>
        </defs>
      </g>
    </svg>
  );
};

const Sparkline = ({ values = [], width = 140, height = 36 }) => {
  if (!values.length) return null;
  const max = Math.max(...values, 1);
  const min = Math.min(...values, 0);
  const pts = values
    .map((v, i) => {
      const x = (i / (values.length - 1 || 1)) * width;
      const y = height - ((v - min) / (max - min || 1)) * height;
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <svg width={width} height={height} aria-hidden="true">
      <polyline
        points={pts}
        fill="none"
        stroke="#0ea5a4"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
};

export default function Dashboard() {
  const navigate = useNavigate();
  const storageActive = getActivePatient();
  const { patients: ctxPatients } = useActivePatient();

  const [health, setHealth] = useState({ status: "unknown", device: null, accuracy: null });
  const [lastChecked, setLastChecked] = useState(null);

  // ---- choose patients source: context first, then localStorage ----
  const patients = useMemo(() => {
    if (Array.isArray(ctxPatients) && ctxPatients.length > 0) {
      return ctxPatients;
    }
    const stored = getPatients();
    return Array.isArray(stored) ? stored : [];
  }, [ctxPatients]);

  // ---- flatten all screenings from all patients ----
  const screenings = useMemo(() => {
    const all = [];

    patients.forEach((p) => {
      if (!Array.isArray(p.history)) return;

      p.history.forEach((h, idx) => {
        const createdAt =
          h.createdAt ||
          h.timestamp ||
          p.updatedAt ||
          p.createdAt ||
          new Date().toISOString();

        const prob_asd =
          h.prob_asd ??
          h.probability ??
          h.raw?.probabilities?.asd ??
          h.results?.fusion?.[1] ??
          h.results?.mri?.[1] ??
          null;

        const severity_bucket =
          h.severity_bucket ??
          h.raw?.severity_bucket ??
          null;

        const predicted_class =
          h.predicted_class ??
          (typeof h.raw?.pred_label === "number"
            ? h.raw.pred_label === 1
              ? "ASD"
              : "Control"
            : null);

        all.push({
          id: h.id || `${p.id}_${idx}_${createdAt}`,
          patientId: p.id,
          patientName: p.name,
          age: p.age,
          subjectId: p.id,
          createdAt,
          prob_asd,
          severity_bucket,
          predicted_class,
        });
      });
    });

    // newest first
    all.sort((a, b) => {
      const ta = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const tb = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return tb - ta;
    });

    return all;
  }, [patients]);

  // ---- analytics from screenings ----
  const analytics = useMemo(() => {
    if (!screenings.length) {
      return {
        total: 0,
        asdCount: 0,
        avgConfidence: null,
        recentProbs: [],
      };
    }

    let asdCount = 0;
    let sum = 0;
    let count = 0;
    const probs = [];

    screenings.forEach((s) => {
      const p =
        s.prob_asd != null ? Number(s.prob_asd) : null;
      if (p != null) {
        probs.push(p);
        sum += p;
        count++;
      }

      const bucket = (s.severity_bucket || "").toLowerCase();

      // count ASD if:
      // - bucket is medium or high, OR
      // - predicted_class is ASD, OR
      // - prob >= 0.5 (fallback)
      if (bucket === "medium" || bucket === "high") {
        asdCount++;
      } else if (s.predicted_class === "ASD") {
        asdCount++;
      } else if (p != null && p >= 0.5) {
        asdCount++;
      }
    });

    return {
      total: screenings.length,
      asdCount,
      avgConfidence: count ? sum / count : null,
      recentProbs: probs.slice(-8),
    };
  }, [screenings]);

  const asdPercent =
    analytics.total > 0
      ? Math.round((analytics.asdCount / analytics.total) * 100)
      : 0;

  // latest screening → feed severity meter & confidence
  const latestScreening = screenings[0] || null;
  const latestProb =
    latestScreening && latestScreening.prob_asd != null
      ? Number(latestScreening.prob_asd)
      : null;
  const latestSeverityBucket = latestScreening?.severity_bucket || null;
  const latestSeverityLabel = mapSeverity(latestSeverityBucket);

  // ---- backend health ----
  useEffect(() => {
    let mounted = true;

    const fetchHealth = async () => {
      try {
        const res = await axios.get(`${API_BASE}/health`, {
          timeout: 2500,
        });
        if (!mounted) return;

        const deviceStr = res.data?.device || "unknown";
        const accuracyVal = res.data?.accuracy || null;
        setHealth({ status: "ok", device: deviceStr, accuracy: accuracyVal });
        setLastChecked(new Date().toISOString());
      } catch (err) {
        if (!mounted) return;
        setHealth({ status: "down", device: null, accuracy: null });
      }
    };

    fetchHealth();
    const id = setInterval(fetchHealth, 15000);

    return () => {
      mounted = false;
      clearInterval(id);
    };
  }, []);

  const active = storageActive; // keep same behaviour as before

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }} className="min-h-[calc(100vh-64px)] bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-8">
        {/* Header row */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex-1 text-left md:text-center">
            <div className="text-xs uppercase tracking-wide text-slate-500 font-semibold">
              {SITE_NAME}
            </div>
            <h1 className="text-3xl md:text-4xl font-extrabold text-sky-900 leading-tight mt-2">
              {i18n.t("dashboard_title")}
            </h1>
            <p className="text-sm text-slate-600 mt-2 max-w-3xl mx-0 md:mx-auto">
              {i18n.t("dashboard_subtitle")}
            </p>
            {active && (
              <p className="mt-3 text-sm text-slate-700 font-semibold">
                {i18n.t("active_patient_text")}:{" "}
                <span className="font-semibold">{active.name}</span> •{" "}
                {active.age ?? "—"}
              </p>
            )}
          </div>

          {/* Backend + device + refresh */}
          <div className="flex items-center gap-3">
            <div className="flex gap-3 items-center">
              <div className="bg-white rounded-xl px-3 py-2 border shadow-sm flex items-center gap-3 min-h-[56px]">
                <Server size={18} className="text-slate-400" />
                <div className="text-left">
                  <div className="text-xs text-slate-500">
                    {i18n.t("backend")}
                  </div>
                  <div
                    className={`text-sm font-semibold ${
                      health.status === "ok"
                        ? "text-emerald-600"
                        : "text-rose-600"
                    }`}
                  >
                    {health.status === "ok"
                      ? i18n.t("backend_status_online")
                      : i18n.t("backend_status_offline") || "Offline"}
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl px-3 py-2 border shadow-sm flex items-center gap-3 min-h-[56px]">
                <Cpu size={18} className="text-slate-400" />
                <div className="text-left">
                  <div className="text-xs text-slate-500">
                    {i18n.t("device")}
                  </div>
                  <div className="text-sm font-medium text-slate-800">
                    {health.device || "—"}
                  </div>
                </div>
              </div>

              <button
                onClick={() => window.location.reload()}
                aria-label="Reload dashboard"
                className="bg-white rounded-xl px-3 py-2 border shadow-sm flex items-center gap-2 min-h-[56px]"
              >
                <RefreshCw size={16} className="text-slate-400" />
                <span className="text-sm text-slate-700">
                  {i18n.t("refresh")}
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Cards row */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* Analytics card */}
          <motion.div whileHover={{ y: -4 }} className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm hover:shadow-xl hover:shadow-sky-100/50 transition-all flex flex-col justify-between relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-sky-400/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />
            <div className="flex items-start gap-3 relative z-10">
              <BarChart2 size={18} className="text-slate-500 mt-1" />
              <div>
                <div className="text-xs text-slate-500">
                  {i18n.t("analytics")}
                </div>
                <div className="text-lg font-semibold text-slate-800">
                  {i18n.t("analytics")}
                </div>
              </div>
            </div>

            <div className="mt-4 flex items-center gap-6">
              <div className="flex-shrink-0">
                <Donut percent={health.accuracy != null ? Math.round(health.accuracy * 100) : 0} />
              </div>

              <div className="flex-1">
                <div className="text-2xl font-bold text-slate-800">
                  {health.accuracy != null ? `${Math.round(health.accuracy * 100)}%` : "N/A"}
                </div>
                <div className="text-xs text-slate-500 mt-1">
                  Model Accuracy
                </div>
                <div className="mt-3 text-xs text-slate-500">
                  Screenings: {analytics.total} ({analytics.asdCount} ASD)
                </div>
              </div>
            </div>
          </motion.div>

          {/* Quick actions */}
          <motion.div whileHover={{ y: -4 }} className="md:col-span-2 bg-white rounded-3xl p-6 border border-slate-200 shadow-sm hover:shadow-xl hover:shadow-sky-100/50 transition-all relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-400/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />
            <div className="flex items-center gap-3 relative z-10">
              <UserPlus size={18} className="text-slate-500" />
              <div>
                <div className="text-xs text-slate-500">
                  {i18n.t("quick_actions")}
                </div>
                <div className="text-sm font-semibold text-slate-800">
                  {i18n.t("start_screening")}
                </div>
              </div>
            </div>

            <div className="mt-5 grid grid-cols-1 sm:grid-cols-3 gap-3">
              <button
                onClick={() => navigate("/patient-form")}
                className="py-2.5 px-4 rounded-xl bg-slate-50 border text-left w-full hover:bg-slate-100 transition"
                aria-label="Open patient form"
              >
                {i18n.t("patient_form_short")}
              </button>

              <button
                onClick={() => navigate("/patients")}
                className="py-2.5 px-4 rounded-xl bg-slate-50 border text-left w-full hover:bg-slate-100 transition"
                aria-label="Open patients list"
              >
                {i18n.t("patients_short")}
              </button>

              <button
                onClick={() => navigate("/detection")}
                className="py-2.5 px-4 rounded-xl w-full bg-gradient-to-r from-sky-500 to-emerald-500 text-white font-semibold shadow-sm"
                aria-label="Go to detection lab"
              >
                {i18n.t("detection_short")}
              </button>
            </div>
          </motion.div>

          {/* System card */}
          <motion.div whileHover={{ y: -4 }} className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm hover:shadow-xl hover:shadow-sky-100/50 transition-all relative overflow-hidden">
            <div className="absolute bottom-0 right-0 w-32 h-32 bg-indigo-400/10 rounded-full blur-2xl translate-y-1/2 translate-x-1/2" />
            <div className="flex items-center gap-3 relative z-10">
              <Server size={18} className="text-slate-500" />
              <div>
                <div className="text-xs text-slate-500">
                  {i18n.t("system")}
                </div>
                <div className="text-sm font-semibold text-slate-800">
                  {i18n.t("runtime_health")}
                </div>
              </div>
            </div>

            <div className="mt-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="text-xs text-slate-500">
                  {i18n.t("status_label")}
                </div>
                <div
                  className={`px-2 py-1 rounded-full text-xs font-medium ${
                    health.status === "ok"
                      ? "bg-emerald-50 text-emerald-600"
                      : "bg-rose-50 text-rose-600"
                  }`}
                >
                  {health.status === "ok"
                    ? i18n.t("backend_status_online")
                    : i18n.t("backend_status_offline") || "Offline"}
                </div>
              </div>

              <div>
                <div className="text-xs text-slate-500 mb-2">
                  {i18n.t("demo_severity")}
                </div>
                <div className="flex flex-col gap-2">
                  <div className="text-xs text-slate-500 uppercase tracking-wide">
                    SEVERITY
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex-1">
                      <SeverityMeter
                        severity={latestSeverityLabel}
                        probability={latestProb}
                      />
                    </div>
                    <div className="text-xs text-slate-600 whitespace-nowrap rounded-full px-3 py-1 bg-slate-100">
                      {latestSeverityLabel}
                    </div>
                  </div>
                  <div className="text-xs text-slate-500 mt-1">
                    Confidence:{" "}
                    {latestProb != null
                      ? `${(latestProb * 100).toFixed(1)}%`
                      : "N/A"}
                  </div>
                </div>
              </div>

              <div className="text-xs text-slate-500">
                {i18n.t("last_checked") || "Last checked"}:{" "}
                {lastChecked
                  ? new Date(lastChecked).toLocaleString()
                  : "—"}
              </div>
            </div>
          </motion.div>
        </div>

        {/* Recent history */}
        <div className="mt-8 bg-white rounded-2xl p-6 border shadow-sm">
          <div className="flex items-center gap-3">
            <Activity size={18} className="text-slate-500" />
            <div>
              <div className="text-sm font-semibold text-slate-800">
                {i18n.t("recent_history")}
              </div>
              <div className="text-xs text-slate-500">
                {i18n.t("latest_screenings")}
              </div>
            </div>
          </div>

          <div className="mt-4 space-y-3">
            {screenings.length === 0 ? (
              <div className="text-sm text-slate-600">
                {i18n.t("no_recent_screenings")}
              </div>
            ) : (
              screenings.slice(0, 8).map((h) => (
                <div
                  key={h.id}
                  className="flex items-center justify-between py-3 border-b last:border-b-0"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-slate-50 rounded-lg flex items-center justify-center text-slate-600 font-medium">
                      {h.patientName
                        ? h.patientName[0].toUpperCase()
                        : "?"}
                    </div>
                    <div>
                      <div className="text-sm font-medium text-slate-800">
                        {h.patientName || i18n.t("unknown_patient")}
                      </div>
                      <div className="text-xs text-slate-500">
                        {i18n.t("age_label_short") || "Age:"}{" "}
                        {h.age ?? "—"} • {i18n.t("subject_label")}:{" "}
                        {h.subjectId || "-"}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-xs text-slate-500 text-right">
                      <div>{i18n.t("last_seen")}</div>
                      <div className="font-medium text-slate-800">
                        {timeAgo(h.createdAt)
                          ? `${timeAgo(h.createdAt)} ${
                              i18n.t("ago") || "ago"
                            }`
                          : "—"}
                      </div>
                    </div>

                    <div className="w-28">
                      <Sparkline
                        values={
                          h.prob_asd != null ? [h.prob_asd] : []
                        }
                      />
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
