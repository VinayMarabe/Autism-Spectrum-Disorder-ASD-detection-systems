// src/page/Detection.jsx
import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { FileText } from "lucide-react";

import { useActivePatient } from "../context/ActivePatientContext";
import { API_BASE_URL } from "../api/client";
import SeverityMeter from "../components/SeverityMeter";
import i18n from "../i18n";

const API_BASE = API_BASE_URL;

// Map backend-style buckets to UI labels used by SeverityMeter
function mapSeverity(bucket) {
  const b = (bucket || "").toLowerCase();
  if (b === "high") return "HIGH";
  if (b === "medium") return "MODERATE";
  if (b === "low") return "MILD"; // or "UNLIKELY"
  return "UNKNOWN";
}

const Detection = () => {
  const navigate = useNavigate();
  const {
    activePatient,
    patients,
    selectActivePatient,
    appendScreening,
    refreshPatients,
  } = useActivePatient();

  const [file, setFile] = useState(null);
  const [pdfFile, setPdfFile] = useState(null);
  const [notes, setNotes] = useState("");
  const [consent, setConsent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  // keys to force React to recreate <input type="file"> on reset
  const [fileInputKey, setFileInputKey] = useState(0);
  const [pdfInputKey, setPdfInputKey] = useState(0);

  // Track which patient ID we last saw to avoid clearing result
  const lastPatientIdRef = useRef(null);

  useEffect(() => {
    if (!patients || patients.length === 0) {
      navigate("/patient-form");
    }
  }, [patients, navigate]);

  useEffect(() => {
    // Always sync notes with the active patient's stored notes
    setNotes(activePatient?.notes || "");

    // Only clear result/error if we actually switched to a *different* patient
    const currentId = activePatient?.id || null;
    if (currentId !== lastPatientIdRef.current) {
      setResult(null);
      setError("");
      lastPatientIdRef.current = currentId;
    }
  }, [activePatient]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setResult(null);

    if (!activePatient || !activePatient.id) {
      setError(
        i18n.t("error_no_active") ||
          "No active patient selected. Please choose a patient."
      );
      return;
    }

    if (!file) {
      setError(
        i18n.t("error_no_file") ||
          "Please select a NIfTI file (.nii or .nii.gz) to upload."
      );
      return;
    }

    if (!consent) {
      setError(
        i18n.t("error_no_consent") ||
          "Please confirm consent before running screening."
      );
      return;
    }

    setLoading(true);

    try {
      const formData = new FormData();

      // ✅ FastAPI endpoint: /asd_analysis
      formData.append("mri", file);
      formData.append("patient_id", activePatient.id);
      formData.append("patient_name", activePatient.name || "");
      formData.append("patient_age", String(activePatient.age ?? ""));
      formData.append("symptoms", notes || activePatient.notes || "");

      if (pdfFile) {
        formData.append("file_support", pdfFile);
      }

      const resp = await axios.post(`${API_BASE}/asd_analysis`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
        timeout: 120000,
      });

      const d = resp.data;

      const rawPredIdx =
        typeof d.pred_label === "number" ? d.pred_label : d.label;
      const probAsd =
        typeof d.asd_prob === "number"
          ? d.asd_prob
          : d?.probabilities && typeof d.probabilities.asd === "number"
          ? d.probabilities.asd
          : null;

      const sevBucket = d.severity_bucket || null;
      const sevLabel = mapSeverity(sevBucket);

      const mapped = {
        predicted_class:
          rawPredIdx === 1 ? "ASD" : rawPredIdx === 0 ? "Control" : null,
        prob_asd: probAsd,
        explanation: d.explanation,
        report_path: d.report_url, // "/reports_v2/..."
        severity_bucket: sevBucket,
        severity_label: sevLabel,
        raw: d,
      };

      setResult(mapped);

      if (typeof appendScreening === "function") {
        try {
          appendScreening(activePatient.id, mapped);
        } catch (err) {
          console.warn("appendScreening failed", err);
        }
      }

      if (typeof refreshPatients === "function") {
        try {
          refreshPatients();
        } catch (err) {
          console.warn("refreshPatients failed", err);
        }
      }
    } catch (err) {
      console.error(err);
      setError(
        err?.response?.data?.detail ||
          err?.response?.data ||
          err?.message ||
          (i18n.t("error_prediction_failed") ||
            "Prediction failed. Check backend or file format.")
      );
    } finally {
      setLoading(false);
    }
  };

  const openReport = () => {
    if (!result?.report_path) return;
    const full = `${API_BASE}${result.report_path}`.replace(
      "//reports",
      "/reports"
    );
    window.open(full, "_blank");
  };

  const downloadPdf = () => {
    if (!result?.report_path) return;
    // Extract filename from report_path like "/reports_v2/filename.html"
    const filename = result.report_path.split('/').pop();
    const downloadUrl = `${API_BASE}/download_report/${filename}`;
    window.open(downloadUrl, "_blank");
  };

  const handleReset = () => {
    setFile(null);
    setPdfFile(null);
    setNotes(activePatient?.notes || "");
    setConsent(false);
    setError("");
    setResult(null);

    setFileInputKey((k) => k + 1);
    setPdfInputKey((k) => k + 1);
  };

  // 👉 navigate to heatmap journey with data
  const goToHeatmapJourney = () => {
    if (!result) return;
    navigate("/how-it-works", {
      state: {
        result,
        patient: activePatient || null,
      },
    });
  };

  // ---- derived UI helpers ----
  const hasFile = !!file;
  const hasPdf = !!pdfFile;
  const hasConsent = !!consent;

  const panelSeverity = result?.severity_label || "UNKNOWN";
  const panelProbPercent =
    result?.prob_asd != null ? (result.prob_asd * 100).toFixed(1) : null;

  return (
    <div className="animate-fade-in pb-12">
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-8">
        {/* 🔒 Sticky step indicator */}
        <div className="sticky top-4 z-20 mb-8">
          <div className="glass-panel mx-auto max-w-fit px-5 py-2.5 flex items-center gap-4 text-xs font-semibold text-slate-500">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-primary-500 text-white flex items-center justify-center text-[11px] font-bold shadow-md shadow-primary-500/30">
                1
              </div>
              <span className="text-slate-800">
                Upload MRI &amp; notes
              </span>
            </div>
            <div className="h-px w-8 bg-slate-200" />
            <div className="flex items-center gap-2 opacity-60 hover:opacity-100 transition-opacity">
              <div className="w-6 h-6 rounded-full bg-slate-100 border border-slate-200 text-slate-500 flex items-center justify-center text-[11px] font-bold">
                2
              </div>
              <span>Run screening &amp; view report</span>
            </div>
          </div>
        </div>

        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
              {i18n.t("detection_title") || "Detection Lab"}
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              {i18n.t("detection_subtitle") ||
                "Run MRI-based screening for the active patient. Results will be saved to patient history."}
            </p>
          </div>

          <div className="md:text-right flex-1 md:flex-none">
            <div className="text-[10px] uppercase tracking-widest text-slate-400 font-semibold mb-0.5">
              {i18n.t("active_patient_label") || "Active patient"}
            </div>
            
            <div className="mt-1">
              {patients && patients.length > 0 ? (
                <select
                  value={activePatient?.id || ""}
                  onChange={(e) => selectActivePatient(e.target.value)}
                  className="input-field py-2 text-sm font-semibold text-slate-800"
                >
                  <option value="" disabled>
                    {i18n.t("select_patient") || "Select patient"}
                  </option>
                  {patients.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} • {p.age ?? "—"}
                    </option>
                  ))}
                </select>
              ) : (
                <div className="text-sm font-semibold text-slate-800">—</div>
              )}
            </div>
          </div>
        </div>

        <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
          {/* LEFT: FORM */}
          <form
            onSubmit={handleSubmit}
            className="lg:col-span-2 card space-y-6"
          >
            <div>
              <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
                {i18n.t("upload_label") || "Upload MRI image (NIfTI)"}
              </label>
              <div className="mt-2 p-4 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50 hover:bg-slate-100/50 transition-colors">
                <input
                  key={fileInputKey}
                  type="file"
                  accept=".nii,.nii.gz"
                  onChange={(e) =>
                    setFile(e.target.files[0] || null)
                  }
                  className="text-sm text-slate-600 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100 cursor-pointer"
                />
              </div>
              <p className="text-[11px] font-medium text-slate-400 mt-2">
                {i18n.t("accepted_text") ||
                  "Accepted: .nii, .nii.gz. Prefer preprocessed NIfTI; upload is sent to model as-is."}
              </p>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
                {i18n.t("behaviour_notes_label") ||
                  "Behaviour notes (optional)"}
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder={
                  i18n.t("placeholder_behaviour") ||
                  "Describe social, communication or sensory concerns — will be saved to patient notes and sent with the MRI."
                }
                className="input-field mt-2 min-h-[100px] resize-y"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
                {i18n.t("supporting_pdf_label") ||
                  "Upload supporting PDF (optional)"}
              </label>
              <div className="mt-2 p-3 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50 hover:bg-slate-100/50 transition-colors">
                <input
                  key={pdfInputKey}
                  type="file"
                  accept="application/pdf"
                  onChange={(e) =>
                    setPdfFile(e.target.files[0] || null)
                  }
                  className="text-sm text-slate-600 file:mr-4 file:py-1.5 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-slate-200 file:text-slate-700 hover:file:bg-slate-300 cursor-pointer"
                />
                <p className="text-[11px] font-medium text-slate-400 mt-2">
                  {i18n.t("optional_support_text") ||
                    "Optional supporting documents (PDF)"}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-4 bg-slate-50 rounded-xl border border-slate-100">
              <input
                id="consent"
                type="checkbox"
                checked={consent}
                onChange={(e) => setConsent(e.target.checked)}
                className="w-4 h-4 mt-0.5 rounded text-primary-500 focus:ring-primary-500 border-slate-300 cursor-pointer"
              />
              <label
                htmlFor="consent"
                className="text-sm font-medium text-slate-700 cursor-pointer"
              >
                {i18n.t("consent_text") ||
                  "I confirm I have permission to upload this MRI and consent to processing."}
              </label>
            </div>

            {error && (
              <div className="text-sm font-medium text-rose-700 bg-rose-50 border border-rose-200 p-4 rounded-xl">
                {error}
              </div>
            )}

            <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-slate-100">
              <button
                type="submit"
                disabled={loading}
                className="btn-primary"
              >
                {loading && (
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                )}
                {i18n.t("run_button") || "Run MRI screening"}
              </button>

              <button
                type="button"
                onClick={handleReset}
                className="btn-ghost"
              >
                {i18n.t("reset_button") || "Reset"}
              </button>
            </div>

            {/* Status chips */}
            <div className="mt-4 flex flex-wrap gap-2 text-[10px] uppercase tracking-wider font-bold">
              <span
                className={`px-2.5 py-1 rounded-full border ${
                  hasFile
                    ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                    : "bg-slate-50 border-slate-200 text-slate-600"
                }`}
              >
                MRI: {hasFile ? "Ready" : "Not selected"}
              </span>
              <span
                className={`px-2.5 py-1 rounded-full border ${
                  hasPdf
                    ? "bg-sky-50 border-sky-200 text-sky-700"
                    : "bg-slate-50 border-slate-200 text-slate-600"
                }`}
              >
                PDF: {hasPdf ? "Attached" : "Optional"}
              </span>
              <span
                className={`px-2.5 py-1 rounded-full border ${
                  hasConsent
                    ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                    : "bg-slate-50 border-slate-200 text-slate-600"
                }`}
              >
                Consent: {hasConsent ? "Given" : "Required"}
              </span>
            </div>
          </form>

          {/* RIGHT: RESULT / EXPLANATION */}
          <aside className="card space-y-6">
            <div>
              <div className="text-[10px] uppercase tracking-widest text-slate-400 font-semibold mb-1">
                {i18n.t("interpretation_summary") ||
                  "Interpretation summary"}
              </div>
              <h3 className="text-xl font-bold text-slate-900 tracking-tight">
                {i18n.t("model_explanation_title") ||
                  "Model explanation & report"}
              </h3>
            </div>

            {!result ? (
              <div className="mt-6 rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/50 p-6 flex flex-col items-center text-center gap-3 transition-colors hover:bg-slate-50 hover:border-slate-300">
                <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center border border-slate-200 shadow-sm mb-2">
                  <FileText size={20} className="text-slate-400" />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-800">
                    No screening run yet
                  </p>
                  <p className="text-xs font-medium text-slate-500 mt-2 max-w-[250px] mx-auto leading-relaxed">
                    Upload an MRI for the active patient and click{" "}
                    <span className="font-bold text-slate-700">
                      Run MRI screening
                    </span>{" "}
                    to generate a PDF report and explanation.
                  </p>
                </div>
              </div>
            ) : (
              <div className="mt-6 space-y-5">
                {/* Summary + severity */}
                <div className="rounded-xl bg-slate-50 p-4 border border-slate-100">
                  <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-3">
                    Screening summary
                  </div>
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                    <div className="flex-1">
                      <div className="text-xs font-semibold text-slate-500">
                        {i18n.t("predicted_class_label") ||
                          "Predicted class"}
                      </div>
                      <div className="text-lg font-extrabold text-slate-900 tracking-tight mt-0.5">
                        {result.predicted_class || "—"}
                      </div>
                      <div className="text-[11px] font-medium text-slate-500 mt-2 bg-white px-2 py-1 rounded inline-block border shadow-sm">
                        {i18n.t("asd_probability_label") ||
                          "ASD probability"}
                        : <span className="font-bold text-slate-800">
                        {panelProbPercent != null
                          ? `${panelProbPercent}%`
                          : "N/A"}
                        </span>
                      </div>
                    </div>

                    <div className="w-full sm:w-40 pt-2 sm:pt-0">
                      <SeverityMeter
                        severity={panelSeverity}
                        probability={result.prob_asd}
                      />
                    </div>
                  </div>
                </div>

                {/* Explanation text */}
                <div className="rounded-xl bg-primary-50/50 p-4 text-sm font-medium text-slate-700 border border-primary-100/50 leading-relaxed shadow-inner">
                  {result.explanation}
                </div>

                {/* Report + heatmap buttons */}
                <div className="flex flex-col gap-3 mt-4 pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={goToHeatmapJourney}
                    className="btn bg-slate-900 text-white hover:bg-slate-800 shadow-md w-full py-3"
                  >
                    View walkthrough and report
                  </button>

                  {result.report_path && (
                    <div className="flex gap-3">
                      <button
                        onClick={openReport}
                        className="btn-ghost flex-1 py-2.5 text-xs font-semibold"
                      >
                        {i18n.t("open_report") || "Open report"}
                      </button>
                      <button
                        onClick={downloadPdf}
                        className="btn-ghost flex-1 py-2.5 text-xs font-semibold"
                      >
                        {i18n.t("download_pdf") || "Download PDF"}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="text-xs text-slate-400 mt-6">
              {i18n.t("note_disclaimer") ||
                "Note: model output is for research and screening and does not replace clinical diagnosis."}
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
};

export default Detection;
