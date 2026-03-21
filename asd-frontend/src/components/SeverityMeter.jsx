import React from "react";

const SeverityMeter = ({ severity = "UNKNOWN", probability = null }) => {
  const sev = (severity || "UNKNOWN").toUpperCase();
  let color = "bg-slate-200 text-slate-700";
  if (sev === "HIGH") color = "bg-rose-100 text-rose-800";
  if (sev === "MODERATE") color = "bg-amber-100 text-amber-800";
  if (sev === "MILD") color = "bg-emerald-100 text-emerald-800";
  if (sev === "UNLIKELY") color = "bg-sky-100 text-sky-800";
  const pct = probability != null ? Math.round(probability * 100) : 0;
  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-2">
        <div className="text-xs text-slate-500 uppercase tracking-wide">Severity</div>
        <div className={`text-[11px] font-semibold px-2 py-1 rounded-full ${color}`}>{sev}</div>
      </div>
      <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
        <div className="h-full rounded-full bg-gradient-to-r from-rose-400 via-amber-400 to-emerald-400" style={{ width: `${pct}%`, minWidth: probability == null ? "6px" : undefined }} aria-hidden />
      </div>
      <div className="text-[11px] text-slate-500 mt-2">Confidence: {probability != null ? `${pct}%` : "N/A"}</div>
    </div>
  );
};

export default SeverityMeter;
