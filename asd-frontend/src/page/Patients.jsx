// src/page/Patients.jsx
import React, { useEffect, useState } from "react";
import { useActivePatient } from "../context/ActivePatientContext";
import { getPatients, deletePatient } from "../utils/storage";
import { useNavigate } from "react-router-dom";
import i18n from "../i18n";

function timeAgo(iso) {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  const diffSec = Math.floor((Date.now() - d.getTime()) / 1000);
  if (diffSec < 60) return `${diffSec}s`;
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m`;
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h`;
  return `${Math.floor(diffSec / 86400)}d`;
}

export default function Patients() {
  const {
    patients: ctxPatients,
    activePatient,
    selectActivePatient,
    reloadPatients,
  } = useActivePatient();

  const [localPatients, setLocalPatients] = useState([]);
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState("name");
  const [drawerOpen, setDrawerOpen] = useState(false);

  const navigate = useNavigate();

  // ✅ 1. When Patients page mounts, ask context to reload from storage
  useEffect(() => {
    if (typeof reloadPatients === "function") {
      reloadPatients();
    }
  }, [reloadPatients]);

  // ✅ 2. Whenever ctxPatients changes, merge it with localStorage patients
  useEffect(() => {
    const fromCtx = Array.isArray(ctxPatients) ? ctxPatients : [];
    const fromStorage = Array.isArray(getPatients()) ? getPatients() : [];

    // Merge by ID: storage first, then context overrides (so it's always fresh)
    const byId = new Map();

    fromStorage.forEach((p) => {
      if (p && p.id) byId.set(p.id, p);
    });

    fromCtx.forEach((p) => {
      if (p && p.id) {
        const existing = byId.get(p.id) || {};
        byId.set(p.id, { ...existing, ...p });
      }
    });

    setLocalPatients(Array.from(byId.values()));
  }, [ctxPatients]);

  function handleView(p) {
    selectActivePatient(p.id);
    setDrawerOpen(true);
  }

  function handleSetActive(p) {
    selectActivePatient(p.id);
  }

  function handleDelete() {
    if (!activePatient) return;
    deletePatient(activePatient.id);
    if (typeof reloadPatients === "function") {
      reloadPatients();
    }
    setDrawerOpen(false);
  }

  function openDetailsPage() {
    if (!activePatient) return;
    navigate(`/patient/${activePatient.id}`);
  }

  const filtered = localPatients
    .filter((p) => {
      if (!query) return true;
      const q = query.toLowerCase();
      return (
        (p.name || "").toLowerCase().includes(q) ||
        (p.id || "").toLowerCase().includes(q) ||
        String(p.age || "").includes(q)
      );
    })
    .sort((a, b) => {
      if (sort === "name") {
        return (a.name || "").localeCompare(b.name || "");
      }
      const ta = a.updatedAt || 0;
      const tb = b.updatedAt || 0;
      return tb - ta; // latest first
    });

  return (
    <div className="animate-fade-in pb-12 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
              {i18n.t("nav_patients") || "Patients"}
            </h1>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <input
              className="input-field py-2.5 w-full md:w-72 bg-white shadow-sm"
              placeholder={
                i18n.t("search_placeholder") || "Search name, ID or age"
              }
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />

            <div className="flex gap-2">
              <button
                className={`btn px-4 py-2.5 text-sm border transition-all duration-200 shadow-sm ${
                  sort === "name" ? "bg-primary-50 text-primary-700 border-primary-200 font-medium" : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                }`}
                onClick={() => setSort("name")}
              >
                {i18n.t("name_button") || "Name"}
              </button>

              <button
                className={`btn px-4 py-2.5 text-sm border transition-all duration-200 shadow-sm ${
                  sort === "last" ? "bg-primary-50 text-primary-700 border-primary-200 font-medium" : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                }`}
                onClick={() => setSort("last")}
              >
                {i18n.t("last_seen") || "Last seen"}
              </button>
            </div>
          </div>
        </div>

        <div className="card p-0 overflow-hidden divide-y divide-slate-100/60 shadow-sm">
          {filtered.length === 0 ? (
            <div className="p-8 text-center text-slate-500 font-medium">No patients found.</div>
          ) : (
            filtered.map((p) => (
              <div
                key={p.id}
                className={`flex flex-col sm:flex-row sm:items-center justify-between p-5 transition-all duration-200 ${
                  activePatient?.id === p.id ? "bg-primary-50/50" : "bg-white hover:bg-slate-50"
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold shadow-sm ${
                    activePatient?.id === p.id ? "bg-gradient-to-br from-primary-400 to-primary-600 text-white" : "bg-primary-50 text-primary-600"
                  }`}>
                    {(p.name || "?")[0].toUpperCase()}
                  </div>

                  <div>
                    <div className="text-base font-bold text-slate-800">{p.name}</div>
                    <div className="text-[11px] font-medium uppercase tracking-wider text-slate-500 mt-0.5">
                      {i18n.t("age_label") || "Age:"} <span className="text-slate-700">{p.age || "—"}</span> •{" "}
                      {i18n.t("subject_label") || "ID:"} <span className="text-slate-700">{p.id}</span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-4 mt-4 sm:mt-0">
                  <div className="text-[11px] font-medium uppercase tracking-wider text-slate-500">
                    {p.updatedAt
                      ? `${i18n.t("last_seen") || "Last seen"} ${timeAgo(
                          p.updatedAt
                        )} ${i18n.t("ago") || "ago"}`
                      : i18n.t("never_screened") || "Never screened"}
                  </div>

                  <div className="flex items-center gap-2 border-l border-slate-200 pl-4">
                    <button
                      className="btn-ghost py-1.5 px-3 text-sm"
                      onClick={() => handleView(p)}
                    >
                      {i18n.t("view_button") || "View"}
                    </button>

                    <button
                      className={`btn py-1.5 px-4 text-sm shadow-sm ${
                        activePatient?.id === p.id ? "bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100" : "bg-slate-800 text-white hover:bg-slate-900 border border-slate-800"
                      }`}
                      onClick={() => handleSetActive(p)}
                    >
                      {activePatient?.id === p.id ? "Active" : (i18n.t("set_active") || "Set active")}
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Modal Overlay */}
      {drawerOpen && activePatient && (
        <div 
          className="fixed inset-0 bg-white/40 backdrop-blur-md z-50 flex items-center justify-center p-4 sm:p-6 transition-opacity animate-in fade-in duration-200"
          onClick={() => setDrawerOpen(false)}
        >
          {/* Centered Modal Content */}
          <div 
            className="bg-white/90 backdrop-blur-xl border border-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] w-full max-w-lg overflow-hidden flex flex-col max-h-full my-auto animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 md:p-8 flex flex-col overflow-y-auto">
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-200/50">
                <h2 className="text-xl font-bold text-slate-800">Patient Details</h2>
                <button 
                  onClick={() => setDrawerOpen(false)} 
                  className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-100/80 text-slate-500 hover:bg-slate-200 hover:text-slate-800 transition-colors"
                >
                  ✕
                </button>
              </div>

              <div className="flex items-start justify-between">
                <div>
                  <div className="text-2xl font-bold text-slate-900">
                    {activePatient.name}
                  </div>
                  <div className="text-sm font-medium text-slate-500 mt-1">
                    {i18n.t("subject_label") || "ID:"} {activePatient.id} •{" "}
                    {i18n.t("age_label") || "Age:"} {activePatient.age}
                  </div>
                </div>

                <div className="px-3 py-1 bg-emerald-50/80 text-emerald-700 text-xs font-bold uppercase tracking-wider rounded-lg border border-emerald-200 shadow-sm">
                  {i18n.t("active_label") || "Active"}
                </div>
              </div>

              <div className="mt-8 bg-slate-50 rounded-xl p-5 border border-slate-100">
                <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2">
                  Clinical Notes
                </div>
                <div className="text-sm text-slate-700">
                  {activePatient.notes || i18n.t("no_notes") || "No notes added."}
                </div>
              </div>

              <div className="mt-4 bg-slate-50 rounded-xl p-5 border border-slate-100">
                <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2">
                  {i18n.t("screening_history") || "Screening history"}
                </div>
                <div className="text-slate-700 text-sm font-semibold">
                  {activePatient.history?.length
                    ? `${activePatient.history.length} ${
                        i18n.t("screenings") || "screenings"
                      }`
                    : i18n.t("no_screenings_yet") || "No screenings yet"}
                </div>
              </div>

              <div className="mt-8 pt-6 flex gap-3 border-t border-slate-100">
                <button
                  onClick={openDetailsPage}
                  className="btn bg-white border border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50 flex-1 justify-center shadow-sm py-2.5"
                >
                  {i18n.t("open_details") || "Full Profile"}
                </button>

                <button
                  onClick={handleDelete}
                  className="btn bg-rose-50 text-rose-600 border border-rose-200 hover:bg-rose-100 hover:text-rose-700 flex-1 justify-center shadow-sm py-2.5"
                >
                  {i18n.t("delete_button") || "Delete Patient"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
