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
    <div className="animate-fade-in flex flex-col md:flex-row gap-8 pb-12">
      <div className="flex-1">
        <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
              {i18n.t("nav_patients")}
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              {i18n.t("settings_subtitle")}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <input
              className="input-field py-2 w-full md:w-64"
              placeholder={
                i18n.t("search_placeholder") || "Search name, ID or age"
              }
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />

            <div className="flex gap-2">
              <button
                className={`btn px-4 py-2 text-sm border transition-all duration-200 ${
                  sort === "name" ? "bg-primary-50 text-primary-700 border-primary-200 font-medium" : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                }`}
                onClick={() => setSort("name")}
              >
                {i18n.t("name_button") || "Name"}
              </button>

              <button
                className={`btn px-4 py-2 text-sm border transition-all duration-200 ${
                  sort === "last" ? "bg-primary-50 text-primary-700 border-primary-200 font-medium" : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                }`}
                onClick={() => setSort("last")}
              >
                {i18n.t("last_seen") || "Last seen"}
              </button>
            </div>
          </div>
        </div>

        <div className="card p-0 overflow-hidden divide-y divide-slate-100/60">
          {filtered.map((p) => (
            <div
              key={p.id}
              className={`flex flex-col sm:flex-row sm:items-center justify-between p-5 transition-all duration-200 ${
                activePatient?.id === p.id ? "bg-primary-50/50" : "hover:bg-slate-50"
              }`}
            >
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold shadow-sm ${
                  activePatient?.id === p.id ? "bg-primary-500 text-white" : "bg-primary-50 text-primary-600"
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

              <div className="flex items-center gap-3 mt-4 sm:mt-0">
                <div className="text-[11px] font-medium uppercase tracking-wider text-slate-500 mr-4">
                  {p.updatedAt
                    ? `${i18n.t("last_seen") || "Last seen"} ${timeAgo(
                        p.updatedAt
                      )} ${i18n.t("ago") || "ago"}`
                    : i18n.t("never_screened") || "Never screened"}
                </div>

                <button
                  className="btn-ghost py-1.5 px-3 text-sm"
                  onClick={() => handleView(p)}
                >
                  {i18n.t("view_button") || "View"}
                </button>

                <button
                  className={`btn py-1.5 px-3 text-sm ${
                    activePatient?.id === p.id ? "bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100" : "bg-slate-800 text-white hover:bg-slate-900 shadow-sm"
                  }`}
                  onClick={() => handleSetActive(p)}
                >
                  {activePatient?.id === p.id ? "Active" : (i18n.t("set_active") || "Set active")}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="w-full md:w-[380px] shrink-0">
        <div
          className={`card sticky top-24 transition-all duration-300 ${
            drawerOpen && activePatient ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 pointer-events-none absolute md:relative"
          }`}
        >
          {activePatient ? (
            <>
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-xl font-semibold">
                    {activePatient.name}
                  </div>
                  <div className="text-sm text-slate-500">
                    {i18n.t("subject_label")}: {activePatient.id} •{" "}
                    {i18n.t("age_label")} {activePatient.age}
                  </div>
                </div>

                <div className="text-xs text-slate-500">
                  {i18n.t("active_label") || "Active"}
                </div>
              </div>

              <div className="mt-4 text-sm text-slate-600">
                {activePatient.notes ||
                  i18n.t("no_notes") ||
                  "No notes added."}
              </div>

              <div className="mt-6">
                <div className="text-sm font-medium">
                  {i18n.t("screening_history") || "Screening history"}
                </div>
                <div className="text-slate-500 text-sm mt-1">
                  {activePatient.history?.length
                    ? `${activePatient.history.length} ${
                        i18n.t("screenings") || "screenings"
                      }`
                    : i18n.t("no_screenings_yet") || "No screenings yet"}
                </div>
              </div>

              <div className="mt-8 flex gap-3">
                <button
                  onClick={openDetailsPage}
                  className="btn-ghost flex-1 justify-center"
                >
                  {i18n.t("open_details") || "Open details"}
                </button>

                <button
                  onClick={handleDelete}
                  className="btn bg-rose-50 text-rose-600 border border-rose-200 hover:bg-rose-100 flex-1 justify-center"
                >
                  {i18n.t("delete_button") || "Delete"}
                </button>
              </div>
            </>
          ) : (
            <div className="text-slate-500 text-sm">
              {i18n.t("select_patient") ||
                "Select a patient to view details."}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
