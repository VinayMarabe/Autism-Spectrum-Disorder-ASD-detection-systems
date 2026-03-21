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
    navigate("/heatmap-journey", {
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
    <div className="min-h-[calc(100vh-64px)] bg-gradient-to-b from-sky-50 via-white to-emerald-50">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* 🔒 Sticky step indicator */}
        <div className="sticky top-4 z-20 mb-4">
          <div className="flex items-center gap-4 text-xs text-slate-500 bg-gradient-to-r from-sky-50 via-white to-emerald-50/95 backdrop-blur rounded-2xl px-4 py-2 border border-slate-100 shadow-sm">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-sky-500 text-white flex items-center justify-center text-[11px] font-semibold">
                1
              </div>
              <span className="font-medium">
                Upload MRI &amp; notes
              </span>
            </div>
            <div className="h-px flex-1 bg-slate-200" />
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center text-[11px] font-semibold">
                2
              </div>
              <span>Run screening &amp; view report</span>
            </div>
          </div>
        </div>

        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              {i18n.t("detection_title") || "Detection Lab"}
            </h1>
            <p className="text-xs text-slate-600">
              {i18n.t("detection_subtitle") ||
                "Run MRI-based screening for the active patient. Results will be saved to patient history."}
            </p>
          </div>

          <div className="text-right">
            <p className="text-sm text-slate-700">
              {i18n.t("active_patient_label") || "Active patient:"}
              <span className="ml-2 font-semibold">
                {activePatient
                  ? `${activePatient.name} • ${
                      activePatient.age ?? "—"
                    }`
                  : "—"}
              </span>
            </p>

            <div className="mt-1">
              {patients && patients.length > 0 && (
                <select
                  value={activePatient?.id || ""}
                  onChange={(e) => selectActivePatient(e.target.value)}
                  className="px-3 py-1 rounded-xl border text-sm mt-2"
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
              )}
            </div>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* LEFT: FORM */}
          <form
            onSubmit={handleSubmit}
            className="lg:col-span-2 bg-white rounded-3xl shadow-md border border-slate-100 p-6 space-y-4"
          >
            <div>
              <label className="text-sm font-medium text-slate-700">
                {i18n.t("upload_label") || "Upload MRI image (NIfTI)"}
              </label>
              <div className="mt-2">
                <input
                  key={fileInputKey}
                  type="file"
                  accept=".nii,.nii.gz"
                  onChange={(e) =>
                    setFile(e.target.files[0] || null)
                  }
                />
              </div>
              <p className="text-xs text-slate-400 mt-1">
                {i18n.t("accepted_text") ||
                  "Accepted: .nii, .nii.gz. Prefer preprocessed NIfTI; upload is sent to model as-is."}
              </p>
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700">
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
                className="w-full mt-2 min-h-[100px] rounded-lg border p-3 text-sm"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700">
                {i18n.t("supporting_pdf_label") ||
                  "Upload supporting PDF (optional)"}
              </label>
              <div className="mt-2">
                <input
                  key={pdfInputKey}
                  type="file"
                  accept="application/pdf"
                  onChange={(e) =>
                    setPdfFile(e.target.files[0] || null)
                  }
                />
                <p className="text-xs text-slate-400 mt-1">
                  {i18n.t("optional_support_text") ||
                    "Optional supporting documents (PDF)"}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <input
                id="consent"
                type="checkbox"
                checked={consent}
                onChange={(e) => setConsent(e.target.checked)}
                className="w-4 h-4"
              />
              <label
                htmlFor="consent"
                className="text-sm text-slate-700"
              >
                {i18n.t("consent_text") ||
                  "I confirm I have permission to upload this MRI and consent to processing."}
              </label>
            </div>

            {error && (
              <div className="text-sm text-rose-700 bg-rose-50 border border-rose-100 p-3 rounded-lg">
                {error}
              </div>
            )}

            <div className="flex items-center gap-3">
              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl text-sm font-semibold text-white bg-gradient-to-r from-sky-500 to-emerald-500 shadow-sm disabled:opacity-60"
              >
                {loading && (
                  <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                )}
                {i18n.t("run_button") || "Run MRI screening"}
              </button>

              <button
                type="button"
                onClick={handleReset}
                className="inline-flex items-center px-4 py-2 rounded-2xl bg-white border border-slate-200 text-sm font-semibold hover:bg-slate-50"
              >
                {i18n.t("reset_button") || "Reset"}
              </button>
            </div>

            {/* Status chips */}
            <div className="mt-3 flex flex-wrap gap-2 text-[11px]">
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
          <aside className="bg-white rounded-2xl p-6 border shadow-sm">
            <div className="text-xs text-slate-500">
              {i18n.t("interpretation_summary") ||
                "Interpretation summary"}
            </div>
            <h3 className="text-lg font-semibold text-slate-900 mt-2">
              {i18n.t("model_explanation_title") ||
                "Model explanation & report"}
            </h3>

            {!result ? (
              <div className="mt-4 rounded-2xl border border-dashed border-slate-200 bg-slate-50/60 p-4 flex gap-3">
                <div className="w-9 h-9 rounded-full bg-white flex items-center justify-center border border-slate-200">
                  <FileText size={16} className="text-slate-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-800">
                    No screening run yet.
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    Upload an MRI for the active patient and click{" "}
                    <span className="font-semibold">
                      Run MRI screening
                    </span>{" "}
                    to generate a PDF report and plain-language
                    explanation.
                  </p>
                </div>
              </div>
            ) : (
              <div className="mt-4 space-y-4">
                {/* Summary + severity */}
                <div className="rounded-xl bg-slate-50 p-3">
                  <div className="text-xs text-slate-500 mb-2">
                    Screening summary
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="flex-1">
                      <div className="text-xs text-slate-500">
                        {i18n.t("predicted_class_label") ||
                          "Predicted class"}
                      </div>
                      <div className="font-semibold text-slate-900">
                        {result.predicted_class || "—"}
                      </div>
                      <div className="text-[11px] text-slate-500 mt-2">
                        {i18n.t("asd_probability_label") ||
                          "ASD probability"}
                        :{" "}
                        {panelProbPercent != null
                          ? `${panelProbPercent}%`
                          : "N/A"}
                      </div>
                    </div>

                    <div className="w-40">
                      <SeverityMeter
                        severity={panelSeverity}
                        probability={result.prob_asd}
                      />
                    </div>
                  </div>
                </div>

                {/* Explanation text */}
                <div className="rounded-xl bg-slate-50 p-3 text-sm text-slate-700">
                  {result.explanation}
                </div>

                {/* Report + heatmap buttons */}
                <div className="flex flex-wrap gap-2 mt-2">
                  {result.report_path && (
                    <>
                      <button
                        onClick={openReport}
                        className="px-3 py-2 rounded-2xl bg-slate-900 text-white text-sm"
                      >
                        {i18n.t("open_report") || "Open report"}
                      </button>
                      <button
                        onClick={downloadPdf}
                        className="px-3 py-2 rounded-2xl bg-white border text-sm"
                      >
                        {i18n.t("download_pdf") || "Download PDF"}
                      </button>
                    </>
                  )}

                  <button
                    type="button"
                    onClick={goToHeatmapJourney}
                    className="px-3 py-2 rounded-2xl bg-sky-50 border border-sky-200 text-sky-800 text-sm font-medium"
                  >
                    View heatmap journey
                  </button>
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
