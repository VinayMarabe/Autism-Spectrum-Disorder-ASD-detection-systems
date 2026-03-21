import React, { useEffect, useState } from "react";
import { getHistory, getActivePatient } from "../utils/storage";

const API_BASE = process.env.REACT_APP_API_BASE || "http://127.0.0.1:8001";

const History = () => {
  const [items, setItems] = useState([]);
  const [activePatient, setActivePatient] = useState(null);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    setItems(getHistory());
    setActivePatient(getActivePatient());
  }, []);

  const filtered = showAll
    ? items
    : items.filter((h) => (activePatient ? h.patientId === activePatient.id : false));

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-50 via-white to-emerald-50 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-sky-900">Screening history</h1>
            <p className="text-sm text-slate-600">Saved screening runs. Results are linked to patient profiles when available.</p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowAll((s) => !s)}
              className="px-3 py-1.5 rounded-full bg-white border border-slate-200 text-sm"
            >
              {showAll ? "Show active only" : "Show all"}
            </button>
            <div className="text-sm text-slate-500">
              {activePatient ? `Active: ${activePatient.name}` : "No active patient"}
            </div>
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="bg-white rounded-2xl p-6 border border-slate-100">
            <p className="text-sm text-slate-600">
              No screenings found for {showAll ? "any patient" : activePatient ? activePatient.name : "the active patient"}.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map((h) => {
              const sev = (h.severity || "").toLowerCase();
              let sevColor = "bg-slate-100 text-slate-700 border border-slate-200";
              if (sev === "high") sevColor = "bg-rose-100 text-rose-800 border border-rose-200";
              if (sev === "moderate") sevColor = "bg-amber-100 text-amber-800 border border-amber-200";
              if (sev === "mild") sevColor = "bg-emerald-100 text-emerald-800 border border-emerald-200";
              if (sev === "unlikely") sevColor = "bg-sky-100 text-sky-800 border border-sky-200";

              return (
                <div key={h.id} className="bg-white rounded-3xl shadow-sm border border-slate-100 p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-slate-900">{h.patientName || "Unknown patient"}</span>
                      <span className="text-xs text-slate-500">• {h.subjectId || "-"}</span>
                      <span className={"text-[11px] px-2 py-0.5 rounded-full font-semibold " + sevColor}>{h.severity || "Unknown"}</span>
                    </div>

                    <p className="text-xs text-slate-500 mb-1">{new Date(h.createdAt || "").toLocaleString() || ""}</p>

                    <p className="text-xs text-slate-600">
                      Overall probability: {h.probability != null ? `${(h.probability * 100).toFixed(1)}%` : "N/A"} • Source: {h.sourceModel || "—"}
                    </p>

                    <p className="text-[11px] text-slate-500 mt-1">
                      MRI: {h.results?.mri?.[1] != null ? `${(h.results.mri[1] * 100).toFixed(1)}%` : "N/A"}
                      {" • "}Fusion: {h.results?.fusion?.[1] != null ? `${(h.results.fusion[1] * 100).toFixed(1)}%` : "N/A"}
                    </p>
                  </div>

                  <div className="flex gap-2">
                    {h.reportPath && (
                      <a
                        href={h.reportPath.startsWith("http") ? h.reportPath : `${API_BASE}${h.reportPath}`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center px-3 py-1.5 rounded-2xl text-xs font-semibold text-sky-700 bg-sky-50 hover:bg-sky-100"
                      >
                        Open report
                      </a>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default History;
