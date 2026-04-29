import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Activity,
  ArrowLeft,
  BarChart3,
  BookOpen,
  Brain,
  CheckCircle2,
  Cpu,
  ExternalLink,
  FileText,
  Layers,
  MessageCircle,
  Network,
  RefreshCw,
  Sparkles,
  Upload,
  Zap,
} from "lucide-react";

import SeverityMeter from "../components/SeverityMeter";
import { useActivePatient } from "../context/ActivePatientContext";

const API_BASE = process.env.REACT_APP_API_BASE || "http://127.0.0.1:8001";

const PIPELINE_STEPS = [
  {
    id: 1,
    icon: Upload,
    title: "fMRI input",
    subtitle: "4D resting-state NIfTI",
    description:
      "The backend accepts a 4D resting-state fMRI scan in NIfTI format and uses that scan as the starting point for atlas-based connectivity analysis.",
    details: [
      "Input format: .nii or .nii.gz",
      "4D volume: X x Y x Z x time",
      "Used by the MRI screening endpoint",
    ],
  },
  {
    id: 2,
    icon: Layers,
    title: "Multi-atlas parcellation",
    subtitle: "AAL3, Schaefer, Harvard-Oxford",
    description:
      "The system extracts ROI time series from three atlas views so it can compare anatomical and functional organization instead of relying on a single parcel scheme.",
    details: [
      "AAL3 anatomical regions",
      "Schaefer 100 functional parcels",
      "Harvard-Oxford cortical regions",
    ],
  },
  {
    id: 3,
    icon: Network,
    title: "Functional connectivity",
    subtitle: "Pearson correlation matrices",
    description:
      "ROI time series are converted into functional connectivity matrices. The backend then works with upper-triangle connectivity features rather than raw image slices.",
    details: [
      "Symmetric ROI x ROI matrix",
      "Pearson correlation strength",
      "Upper triangle retained as features",
    ],
  },
  {
    id: 4,
    icon: BarChart3,
    title: "Feature selection",
    subtitle: "Top variance features",
    description:
      "The multi-atlas pipeline narrows the connectivity vectors to the most informative features before passing them into the learned models.",
    details: [
      "Variance-based filtering",
      "Per-atlas normalization",
      "Final model-ready atlas feature blocks",
    ],
  },
  {
    id: 5,
    icon: Cpu,
    title: "SSAE encoding",
    subtitle: "Stacked sparse autoencoders",
    description:
      "Each atlas stream is encoded into a compact latent representation. In the classic backend path, the learned latent space is used with an SVM classifier.",
    details: [
      "Classic model: SSAE + SVM",
      "Latent dimension: 32 in current backend metadata",
      "Connectivity-driven representation learning",
    ],
  },
  {
    id: 6,
    icon: Sparkles,
    title: "METAFormer fusion",
    subtitle: "Cross-atlas attention",
    description:
      "The multi-atlas experimental path uses SSAE-METAFormer to fuse atlas-specific latent tokens with transformer-style attention before classification.",
    details: [
      "3 atlas token streams",
      "Attention-based fusion",
      "Separate health endpoint in backend",
    ],
  },
  {
    id: 7,
    icon: Zap,
    title: "Prediction and explanation",
    subtitle: "Probability, severity, report",
    description:
      "The output becomes an ASD probability, severity bucket, saved report, generated visualization assets, and chat-ready patient context for RAG-assisted review.",
    details: [
      "Probability and severity bucket",
      "HTML report and image artifact",
      "Patient screening history + chat retrieval context",
    ],
  },
];

const ATLAS_ROWS = [
  {
    atlas: "AAL3",
    type: "Anatomical",
    regions: "170",
    strength: "Fine-grained anatomical ROI coverage",
  },
  {
    atlas: "Schaefer-100",
    type: "Functional",
    regions: "100",
    strength: "Network-oriented functional organization",
  },
  {
    atlas: "Harvard-Oxford",
    type: "Cortical probabilistic",
    regions: "48",
    strength: "Robust cortical label boundaries",
  },
];

function mapSeverity(bucket) {
  const b = (bucket || "").toLowerCase();
  if (b === "high") return "HIGH";
  if (b === "medium") return "MODERATE";
  if (b === "low") return "MILD";
  return "UNKNOWN";
}

function percent(value) {
  if (value == null || Number.isNaN(Number(value))) return "N/A";
  return `${(Number(value) * 100).toFixed(1)}%`;
}

export default function HowItWorks() {
  const navigate = useNavigate();
  const { state } = useLocation();
  const { activePatient } = useActivePatient();

  const result = state?.result || null;
  const patient = activePatient || state?.patient || null;
  const raw = result?.raw || {};

  const [health, setHealth] = useState(null);
  const [metaformerHealth, setMetaformerHealth] = useState(null);

  useEffect(() => {
    let ignore = false;

    const loadHealth = async () => {
      try {
        const [classicRes, metaRes] = await Promise.all([
          fetch(`${API_BASE}/health`),
          fetch(`${API_BASE}/health/ssae-metaformer`),
        ]);

        const [classicJson, metaJson] = await Promise.all([
          classicRes.ok ? classicRes.json() : null,
          metaRes.ok ? metaRes.json() : null,
        ]);

        if (ignore) return;
        setHealth(classicJson);
        setMetaformerHealth(metaJson);
      } catch {
        if (!ignore) {
          setHealth(null);
          setMetaformerHealth(null);
        }
      }
    };

    loadHealth();
    return () => {
      ignore = true;
    };
  }, []);

  const heatmapUrl = raw.gradcam_url
    ? `${API_BASE}${raw.gradcam_url}`
    : raw.cam_images?.main
    ? `${API_BASE}${raw.cam_images.main.startsWith("/") ? raw.cam_images.main : `/${raw.cam_images.main}`}`
    : null;

  const reportUrl = result?.report_path
    ? `${API_BASE}${result.report_path}`.replace("//reports", "/reports")
    : null;

  const activeModel =
    raw?.metadata?.model ||
    result?.metadata?.model ||
    metaformerHealth?.model ||
    health?.model ||
    "SSAE-based MRI screening";

  const severityLabel =
    result?.severity_label || mapSeverity(result?.severity_bucket);

  const patientLabel = patient
    ? `${patient.name} • ${patient.age ?? "—"}`
    : "No patient selected";

  const openReport = () => {
    if (reportUrl) window.open(reportUrl, "_blank");
  };

  const downloadReport = () => {
    if (!reportUrl) return;
    const filename = reportUrl.split("/").pop();
    window.open(`${API_BASE}/download_report/${filename}`, "_blank");
  };

  const openConvo = () => {
    navigate("/convo-with-dr", {
      state: {
        result,
        patient,
      },
    });
  };

  return (
    <div className="animate-fade-in pb-12">
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between mb-8">
          <div className="space-y-3">
            <button
              onClick={() => navigate(-1)}
              className="inline-flex items-center gap-2 text-xs text-slate-600 hover:text-slate-900"
            >
              <ArrowLeft size={14} />
              <span>Back</span>
            </button>
            <div className="flex items-start gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-sky-500 to-emerald-400 text-white flex items-center justify-center shadow-sm">
                <Brain size={22} />
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-slate-500 font-semibold">
                  ASD Pipeline and Screening Walkthrough
                </p>
                <h1 className="text-3xl font-extrabold text-sky-900">
                  Model Flow, Evidence, and Report
                </h1>
                <p className="text-sm text-slate-600 max-w-3xl mt-2">
                  This single page now covers both the project pipeline and the
                  actual screening artifact path used by the backend. The MRI
                  workflow here reflects atlas-based connectivity, SSAE encoding,
                  and the SSAE-METAFormer branch, not a ResNet image pipeline.
                </p>
              </div>
            </div>
          </div>

          <div className="card min-w-[280px]">
            <div className="text-[10px] uppercase tracking-widest text-slate-400 font-bold">
              Active patient
            </div>
            <div className="text-xl font-bold text-slate-900 mt-1 tracking-tight">
              {patientLabel}
            </div>
            <div className="text-xs font-medium text-slate-500 mt-2">
              Current model context: <span className="font-bold text-primary-700 bg-primary-50 px-2 py-0.5 rounded ml-1">{activeModel}</span>
            </div>
            {result && (
              <button
                onClick={openConvo}
                className="mt-5 btn bg-slate-800 text-white hover:bg-slate-900 w-full"
              >
                <MessageCircle size={14} />
                <span>Open Convo with Dr</span>
              </button>
            )}
          </div>
        </div>

        {result && (
          <section className="mb-8">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <InfoCard
                label="Predicted class"
                value={result.predicted_class || "—"}
                tone={
                  String(result.predicted_class || "").toLowerCase() === "asd"
                    ? "rose"
                    : "emerald"
                }
              />
              <InfoCard
                label="ASD probability"
                value={percent(result.prob_asd)}
                tone="sky"
              />
              <InfoCard
                label="Severity"
                value={severityLabel}
                tone="amber"
              />
              <InfoCard label="Model used" value={activeModel} tone="slate" />
            </div>
          </section>
        )}

        <section className="mb-8 grid grid-cols-1 xl:grid-cols-3 gap-6 md:gap-8">
          <div className="xl:col-span-2 card">
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100">
              <div className="w-10 h-10 rounded-xl bg-sky-50 flex items-center justify-center">
                <BookOpen size={20} className="text-sky-600" />
              </div>
              <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                Actual MRI Screening Pipeline
              </h2>
            </div>
            <div className="space-y-4">
              {PIPELINE_STEPS.map((step) => {
                const Icon = step.icon;
                return (
                  <div
                    key={step.id}
                    className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4"
                  >
                    <div className="flex items-start gap-4">
                      <div className="w-11 h-11 rounded-2xl bg-white border border-slate-200 flex items-center justify-center text-sky-600">
                        <Icon size={18} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-[11px] uppercase tracking-[0.16em] text-sky-600 font-bold">
                            Step {step.id}
                          </span>
                          <span className="text-[11px] text-slate-500">
                            {step.subtitle}
                          </span>
                        </div>
                        <h3 className="text-base font-semibold text-slate-900 mt-1">
                          {step.title}
                        </h3>
                        <p className="text-sm text-slate-600 mt-2 leading-6">
                          {step.description}
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mt-3">
                          {step.details.map((detail) => (
                            <div
                              key={detail}
                              className="rounded-xl bg-white border border-slate-200 px-3 py-2 text-xs text-slate-600 flex items-start gap-2"
                            >
                              <CheckCircle2
                                size={13}
                                className="text-emerald-500 mt-0.5 shrink-0"
                              />
                              <span>{detail}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="space-y-6 md:space-y-8">
            <div className="card">
              <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center">
                  <Activity size={20} className="text-emerald-600" />
                </div>
                <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                  Live Backend Model Info
                </h2>
              </div>
              <div className="space-y-4">
                <RuntimeCard
                  title="Classic screening path"
                  model={health?.model || "Unavailable"}
                  ready={health?.ready}
                  accuracy={
                    health?.accuracy != null ? `${health.accuracy * 100}%` : "N/A"
                  }
                  extra={`Device: ${health?.device || "unknown"}`}
                />
                <RuntimeCard
                  title="Multi-atlas fusion path"
                  model={metaformerHealth?.model || "Unavailable"}
                  ready={metaformerHealth?.ready}
                  accuracy={
                    metaformerHealth?.accuracy != null
                      ? `${(metaformerHealth.accuracy * 100).toFixed(1)}%`
                      : "N/A"
                  }
                  extra={
                    metaformerHealth?.auc != null
                      ? `AUC: ${(metaformerHealth.auc * 100).toFixed(1)}%`
                      : "AUC unavailable"
                  }
                />
              </div>
            </div>

            <div className="card">
              <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100">
                <div className="w-10 h-10 rounded-xl bg-violet-50 flex items-center justify-center">
                  <Layers size={20} className="text-violet-600" />
                </div>
                <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                  Atlas Coverage
                </h2>
              </div>
              <div className="space-y-3">
                {ATLAS_ROWS.map((row) => (
                  <div
                    key={row.atlas}
                    className="rounded-2xl border border-slate-200 bg-slate-50 p-3"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <div className="font-semibold text-slate-900">
                          {row.atlas}
                        </div>
                        <div className="text-xs text-slate-500">{row.type}</div>
                      </div>
                      <div className="text-sm font-bold text-sky-700">
                        {row.regions}
                      </div>
                    </div>
                    <p className="text-xs text-slate-600 mt-2">{row.strength}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="mb-8 grid grid-cols-1 xl:grid-cols-2 gap-6 md:gap-8">
          <div className="card">
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100">
              <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center">
                <FileText size={20} className="text-slate-600" />
              </div>
              <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                Screening Artifact and Report
              </h2>
            </div>

            {!result ? (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-5 text-sm text-slate-600">
                Open this page from a completed detection result to see the
                actual patient screening summary, generated report, and saved
                visualization artifact.
              </div>
            ) : (
              <div className="space-y-4">
                <div className="rounded-2xl bg-slate-50 border border-slate-200 p-4">
                  <div className="text-xs uppercase tracking-wide text-slate-500">
                    Screening summary
                  </div>
                  <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
                    <div className="space-y-2">
                      <div className="text-sm text-slate-600">
                        Prediction:{" "}
                        <span className="font-semibold text-slate-900">
                          {result.predicted_class || "—"}
                        </span>
                      </div>
                      <div className="text-sm text-slate-600">
                        Probability:{" "}
                        <span className="font-semibold text-slate-900">
                          {percent(result.prob_asd)}
                        </span>
                      </div>
                      <div className="text-sm text-slate-600">
                        Severity bucket:{" "}
                        <span className="font-semibold text-slate-900">
                          {result.severity_bucket || "—"}
                        </span>
                      </div>
                      <div className="text-sm text-slate-600">
                        Report path:{" "}
                        <span className="font-mono text-[12px] text-slate-700">
                          {result.report_path || "Unavailable"}
                        </span>
                      </div>
                    </div>
                    <div className="rounded-2xl bg-white border border-slate-200 p-4">
                      <SeverityMeter
                        severity={severityLabel}
                        probability={result.prob_asd}
                      />
                    </div>
                  </div>
                </div>

                  {reportUrl && (
                    <div className="flex flex-wrap gap-3 w-full">
                      <button
                        onClick={openReport}
                        className="btn bg-slate-900 text-white hover:bg-slate-800 flex-1 justify-center"
                      >
                        <ExternalLink size={16} />
                        <span>Open report</span>
                      </button>
                      <button
                        onClick={downloadReport}
                        className="btn-ghost flex-1 justify-center"
                      >
                        <DownloadIcon />
                        <span>Download PDF</span>
                      </button>
                    </div>
                  )}
                  <button
                    onClick={openConvo}
                    className="btn bg-primary-50 text-primary-700 hover:bg-primary-100 border border-primary-200 w-full justify-center mt-2"
                  >
                    <MessageCircle size={16} />
                    <span>Discuss in Convo with Dr</span>
                  </button>

                <div className="rounded-2xl bg-slate-50 border border-slate-200 p-4">
                  <div className="text-xs uppercase tracking-wide text-slate-500 mb-2">
                    Backend explanation
                  </div>
                  <p className="text-sm text-slate-700 whitespace-pre-line leading-6">
                    {result.explanation || "No explanation available."}
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="card">
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100">
              <div className="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center">
                <RefreshCw size={20} className="text-primary-600" />
              </div>
              <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                Saved Visualization Artifact
              </h2>
            </div>

            {!heatmapUrl ? (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-5 text-sm text-slate-600">
                No backend-generated screening image is attached to this result.
                The current pipeline still saves reports and probability outputs
                even when an image artifact is not present.
              </div>
            ) : (
              <div className="space-y-3">
                <img
                  src={heatmapUrl}
                  alt="Saved screening artifact"
                  className="w-full rounded-2xl border border-slate-200 bg-white object-contain"
                />
                <p className="text-sm text-slate-600">
                  This image comes from the backend result payload and is shown
                  here as the saved screening artifact. The page no longer claims
                  a separate ResNet visual pipeline.
                </p>
              </div>
            )}
          </div>
        </section>

        <section className="bg-amber-50 border border-amber-200 rounded-3xl p-5 text-sm text-amber-900">
          <div className="font-semibold mb-2">Research disclaimer</div>
          <p className="leading-6">
            This workflow is for research and screening support only. It does
            not replace clinical diagnosis. The page reflects the actual backend
            model structure currently implemented in this project: atlas-based
            connectivity, SSAE-style encoding, the classic SSAE plus SVM
            screening path, and the separate SSAE-METAFormer fusion path.
          </p>
        </section>
      </div>
    </div>
  );
}

function InfoCard({ label, value, tone = "slate" }) {
  const tones = {
    rose: "text-rose-700 bg-rose-50 border-rose-100",
    emerald: "text-emerald-700 bg-emerald-50 border-emerald-100",
    sky: "text-sky-700 bg-sky-50 border-sky-100",
    amber: "text-amber-700 bg-amber-50 border-amber-100",
    slate: "text-slate-700 bg-white border-slate-200",
  };

  return (
    <div className={`rounded-2xl border shadow-sm p-4 ${tones[tone] || tones.slate}`}>
      <div className="text-xs uppercase tracking-wide opacity-75">{label}</div>
      <div className="text-lg font-bold mt-2">{value}</div>
    </div>
  );
}

function RuntimeCard({ title, model, ready, accuracy, extra }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <div className="text-xs uppercase tracking-wide text-slate-500">
        {title}
      </div>
      <div className="text-sm font-semibold text-slate-900 mt-2">{model}</div>
      <div className="text-sm text-slate-600 mt-1">
        Status:{" "}
        <span className={ready ? "text-emerald-600 font-semibold" : "text-rose-600 font-semibold"}>
          {ready ? "Ready" : "Unavailable"}
        </span>
      </div>
      <div className="text-sm text-slate-600 mt-1">Accuracy: {accuracy}</div>
      <div className="text-xs text-slate-500 mt-2">{extra}</div>
    </div>
  );
}

function DownloadIcon() {
  return <FileText size={14} />;
}
