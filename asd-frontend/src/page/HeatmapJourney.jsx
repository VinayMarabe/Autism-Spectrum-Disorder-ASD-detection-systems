// src/page/HeatmapJourney.jsx
import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  ActivitySquare,
  FileText,
  Mic,
  MessageCircle,
} from "lucide-react";

import SeverityMeter from "../components/SeverityMeter";
import i18n from "../i18n";

const API_BASE = process.env.REACT_APP_API_BASE || "http://127.0.0.1:8001";

// Map backend severity bucket -> UI label for SeverityMeter
function mapSeverity(bucket) {
  const b = (bucket || "").toLowerCase();
  if (b === "high") return "HIGH";
  if (b === "medium") return "MODERATE";
  if (b === "low") return "MILD";
  return "UNKNOWN";
}

const HeatmapJourney = () => {
  const navigate = useNavigate();
  const { state } = useLocation();

  // slider 0–100 → how much of the colour heatmap is revealed
  const [reveal, setReveal] = useState(60);
  const [isSpeaking, setIsSpeaking] = useState(false);

  const result = state?.result || null;
  const patient = state?.patient || null;

  // ---- if user opens this route directly without data ----
  if (!result) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-sky-50 via-white to-emerald-50 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-md border px-6 py-5 max-w-md w-full text-center space-y-3">
          <p className="text-sm text-slate-700">
            No screening data available for visualisation.
          </p>
          <p className="text-xs text-slate-500">
            Please run an MRI screening from the Detection Lab first.
          </p>
          <div className="flex items-center justify-center gap-2 mt-2">
            <button
              onClick={() => navigate("/detection")}
              className="px-4 py-2 rounded-xl bg-sky-500 text-white text-sm font-semibold"
            >
              Back to Detection Lab
            </button>
            <button
              onClick={() => navigate("/dashboard")}
              className="px-4 py-2 rounded-xl bg-white border border-slate-200 text-sm text-slate-700"
            >
              Go to dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ---- derived values from result ----
  const probAsd = result.prob_asd ?? null;
  const probPct = probAsd != null ? (Number(probAsd) * 100).toFixed(1) : null;
  const sevLabel = result.severity_label || mapSeverity(result.severity_bucket);

  const raw = result.raw || {};

  // Grad-CAM image URL from backend JSON
  let heatmapUrl = null;
  if (raw.gradcam_url) {
    heatmapUrl = `${API_BASE}${raw.gradcam_url}`;
  } else if (raw.cam_images?.main) {
    const path = raw.cam_images.main.startsWith("/")
      ? raw.cam_images.main
      : `/${raw.cam_images.main}`;
    heatmapUrl = `${API_BASE}${path}`;
  }

  // Report URL for inline preview + open/download
  const reportUrl = result.report_path
    ? `${API_BASE}${result.report_path}`.replace("//reports", "/reports")
    : null;

  const explanationText = result.explanation || "";

  // ---- TTS for explanation ----
  const stopSpeaking = () => {
    try {
      window.speechSynthesis.cancel();
    } catch {
      // ignore
    }
    setIsSpeaking(false);
  };

  const handleSpeakToggle = () => {
    if (!explanationText) return;

    // stop if already speaking
    if (isSpeaking) {
      stopSpeaking();
      return;
    }

    if (!("speechSynthesis" in window)) {
      alert("Speech is not supported in this browser.");
      return;
    }

    try {
      const utter = new SpeechSynthesisUtterance(explanationText);

      // try to pick a male voice if available
      const voices = window.speechSynthesis.getVoices() || [];
      const maleLike = voices.find((v) =>
        /male|man|google uk english male|david|george/i.test(v.name)
      );
      if (maleLike) {
        utter.voice = maleLike;
      }

      utter.rate = 0.98;
      utter.pitch = 1.0;

      utter.onstart = () => setIsSpeaking(true);
      utter.onend = () => setIsSpeaking(false);
      utter.onerror = () => setIsSpeaking(false);

      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(utter);
    } catch {
      setIsSpeaking(false);
    }
  };

  // ---- open/download report ----
  const openReport = () => {
    if (!reportUrl) return;
    window.open(reportUrl, "_blank");
  };

  const downloadPdf = () => {
    if (!reportUrl) return;
    // Extract filename and use download endpoint
    const filename = reportUrl.split('/').pop();
    window.open(`${API_BASE}/download_report/${filename}`, "_blank");
  };

  // ---- navigate to Convo with Dr ----
  const goToConvoWithDr = () => {
    navigate("/convo-with-dr", {
      state: {
        result,
        patient,
      },
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-50 via-white to-emerald-50">
      <div className="max-w-7xl mx-auto px-6 py-6">
        {/* Top bar */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/detection")}
              className="inline-flex items-center gap-2 text-xs text-slate-600 hover:text-slate-900"
            >
              <ArrowLeft size={14} />
              <span>Back to Detection Lab</span>
            </button>
            {patient && (
              <div className="text-xs text-slate-600">
                {i18n.t("active_patient_label") || "Active patient:"}{" "}
                <span className="font-semibold">
                  {patient.name} • {patient.age ?? "—"}
                </span>
              </div>
            )}
          </div>

          <button
            onClick={goToConvoWithDr}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-900 text-white text-xs font-semibold shadow-sm hover:bg-slate-800"
          >
            <MessageCircle size={14} />
            <span>Convo with Dr</span>
          </button>
        </div>

        <h1 className="text-2xl font-bold text-slate-900">
          MRI heatmap journey
        </h1>
        <p className="text-xs text-slate-600 mb-6">
          See how the model transforms the MRI into a Grad-CAM brain heatmap
          and uses it to support the ASD decision.
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          {/* LEFT: explanation steps + summary */}
          <div className="lg:col-span-1 space-y-4">
            <div className="bg-white rounded-2xl border shadow-sm p-4">
              <div className="flex items-center gap-2 mb-2">
                <ActivitySquare size={16} className="text-sky-500" />
                <div className="text-sm font-semibold text-slate-800">
                  Pipeline overview
                </div>
              </div>
              <ol className="space-y-2 text-xs text-slate-600">
                <li>
                  <span className="font-semibold">1. Input MRI</span> – the
                  uploaded NIfTI brain scan is normalised and a rough brain mask
                  is applied to remove background.
                </li>
                <li>
                  <span className="font-semibold">
                    2. 3D ResNet feature mapping
                  </span>{" "}
                  – the model passes the volume through 3D convolution layers to
                  learn abstract patterns linked to ASD vs control.
                </li>
                <li>
                  <span className="font-semibold">
                    3. Grad-CAM attention
                  </span>{" "}
                  – gradients at the last convolution layer are used to build a
                  3D attention map showing where the model focuses most.
                </li>
                <li>
                  <span className="font-semibold">
                    4. 12-view brain panel
                  </span>{" "}
                  – the 3D heatmap is sliced in axial, coronal and sagittal
                  planes and overlaid on the MRI to create the figure on the
                  right.
                </li>
              </ol>
            </div>

            <div className="bg-white rounded-2xl border shadow-sm p-4 space-y-3">
              <div className="text-xs text-slate-500 uppercase tracking-wide">
                Screening summary
              </div>
              <div className="text-sm font-semibold text-slate-900">
                {result.predicted_class || "—"}
              </div>
              <div className="text-xs text-slate-600">
                ASD probability:{" "}
                {probPct != null ? `${probPct}%` : "N/A"}
              </div>
              <div className="mt-2">
                <SeverityMeter severity={sevLabel} probability={probAsd} />
              </div>
            </div>

            {/* MRI report card */}
            <div className="bg-white rounded-2xl border shadow-sm p-4 space-y-3">
              <div className="flex items-center gap-2">
                <FileText size={16} className="text-slate-500" />
                <div>
                  <div className="text-xs text-slate-500 uppercase tracking-wide">
                    MRI screening report
                  </div>
                  <div className="text-sm font-semibold text-slate-900">
                    PDF summary
                  </div>
                </div>
              </div>
              <p className="text-xs text-slate-600">
                The PDF report includes the model&apos;s probabilities, severity
                bucket, Grad-CAM thumbnails and the full clinical text
                explanation.
              </p>
              {reportUrl ? (
                <div className="flex gap-2">
                  <button
                    onClick={openReport}
                    className="px-3 py-2 rounded-2xl bg-slate-900 text-white text-sm"
                  >
                    Open report
                  </button>
                  <button
                    onClick={downloadPdf}
                    className="px-3 py-2 rounded-2xl bg-white border text-sm"
                  >
                    Download PDF
                  </button>
                </div>
              ) : (
                <div className="text-[11px] text-slate-500">
                  Report file not available for this screening.
                </div>
              )}
            </div>
          </div>

          {/* RIGHT: heatmap + slider + explanation */}
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-white rounded-2xl border shadow-sm p-4">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <div className="text-xs text-slate-500">
                    Connectivity visualisation
                  </div>
                  <div className="text-sm font-semibold text-slate-900">
                    Brain region correlation matrix
                  </div>
                </div>
              </div>

              {heatmapUrl ? (
                <>
                  <div className="relative w-full rounded-2xl overflow-hidden bg-slate-900/5 border mb-4">
                    {/* Connectivity heatmap image */}
                    <img
                      src={heatmapUrl}
                      alt="Connectivity heatmap"
                      className="w-full block"
                    />
                  </div>

                  <p className="mt-2 text-[11px] text-slate-500">
                    This heatmap shows the functional connectivity matrix between brain regions.
                    Red/blue colors indicate positive/negative correlations. The pattern of
                    connectivity was used to make the ASD vs control prediction.
                  </p>
                </>
              ) : (
                <p className="text-sm text-rose-600">
                  Connectivity heatmap not available for this screening.
                </p>
              )}
            </div>

            {/* Explanation + mic */}
            <div className="bg-white rounded-2xl border shadow-sm p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="text-xs text-slate-500">
                  Plain-language explanation
                </div>
                <button
                  type="button"
                  onClick={handleSpeakToggle}
                  disabled={!explanationText}
                  className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-full text-[11px] border ${
                    isSpeaking
                      ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                      : "bg-slate-50 border-slate-200 text-slate-600"
                  } disabled:opacity-60`}
                >
                  <Mic size={12} />
                  {isSpeaking ? "Stop reading" : "Read aloud"}
                </button>
              </div>
              <p className="text-sm text-slate-700 whitespace-pre-line">
                {explanationText}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HeatmapJourney;
