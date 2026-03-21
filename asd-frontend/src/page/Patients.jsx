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
    <div className="flex gap-8">
      <div className="flex-1">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold">
              {i18n.t("nav_patients")}
            </h1>
            <p className="text-sm text-slate-500">
              {i18n.t("settings_subtitle")}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <input
              className="border rounded-xl px-4 py-2 w-64"
              placeholder={
                i18n.t("search_placeholder") || "Search name, ID or age"
              }
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />

            <button
              className={`px-4 py-2 rounded-xl border ${
                sort === "name" ? "bg-sky-100 text-sky-700" : "bg-white"
              }`}
              onClick={() => setSort("name")}
            >
              {i18n.t("name_button") || "Name"}
            </button>

            <button
              className={`px-4 py-2 rounded-xl border ${
                sort === "last" ? "bg-sky-100 text-sky-700" : "bg-white"
              }`}
              onClick={() => setSort("last")}
            >
              {i18n.t("last_seen") || "Last seen"}
            </button>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm divide-y border">
          {filtered.map((p) => (
            <div
              key={p.id}
              className={`flex items-center justify-between p-4 transition ${
                activePatient?.id === p.id ? "bg-sky-50" : ""
              }`}
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center text-lg font-semibold">
                  {(p.name || "?")[0].toUpperCase()}
                </div>

                <div>
                  <div className="text-lg font-medium">{p.name}</div>
                  <div className="text-sm text-slate-500">
                    {i18n.t("age_label") || "Age:"} {p.age || "—"} •{" "}
                    {i18n.t("subject_label") || "ID:"} {p.id}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="text-sm text-slate-500 mr-4">
                  {p.updatedAt
                    ? `${i18n.t("last_seen") || "Last seen"} ${timeAgo(
                        p.updatedAt
                      )} ${i18n.t("ago") || "ago"}`
                    : i18n.t("never_screened") || "Never screened"}
                </div>

                <button
                  className="px-3 py-2 rounded-lg border bg-white"
                  onClick={() => handleView(p)}
                >
                  {i18n.t("view_button") || "View"}
                </button>

                <button
                  className="px-4 py-2 rounded-lg bg-slate-900 text-white"
                  onClick={() => handleSetActive(p)}
                >
                  {i18n.t("set_active") || "Set active"}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="w-96">
        <div
          className={`bg-white rounded-xl shadow-sm p-6 border transition ${
            drawerOpen && activePatient ? "block" : "hidden"
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

              <div className="mt-6 flex gap-3">
                <button
                  onClick={openDetailsPage}
                  className="px-4 py-2 rounded-lg border bg-white"
                >
                  {i18n.t("open_details") || "Open details page"}
                </button>

                <button
                  onClick={handleDelete}
                  className="px-4 py-2 rounded-lg bg-rose-50 text-rose-600 border"
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
