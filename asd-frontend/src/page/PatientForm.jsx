// src/page/PatientForm.jsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useActivePatient } from "../context/ActivePatientContext";
import i18n from "../i18n";
import { getPatients, savePatients } from "../utils/storage";

const emptyPatient = {
  name: "",
  age: "",
  gender: "Male",
  notes: "",
};

function makeId() {
  return `P-${Math.random().toString(36).slice(2, 9)}-${Date.now()
    .toString(36)
    .slice(-6)}`;
}

export default function PatientForm() {
  const navigate = useNavigate();
  const ctx = useActivePatient();

  // context may provide different helpers — read them safely
  const patientsFromCtx = ctx?.patients;
  const activePatient = ctx?.activePatient;
  const selectActivePatient =
    typeof ctx?.selectActivePatient === "function"
      ? ctx.selectActivePatient
      : null;
  const addOrUpdatePatientCtx =
    typeof ctx?.addOrUpdatePatient === "function"
      ? ctx.addOrUpdatePatient
      : null;

  const [form, setForm] = useState(emptyPatient);
  const [isNew, setIsNew] = useState(true); // used to control Start detection button
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [statusMessage, setStatusMessage] = useState("");

  useEffect(() => {
    if (activePatient) {
      setForm({
        name: activePatient.name ?? "",
        age: activePatient.age ?? "",
        gender: activePatient.gender ?? "Male",
        notes: activePatient.notes ?? "",
        id: activePatient.id,
      });
      setIsNew(false); // existing patient -> already saved
    } else {
      setForm(emptyPatient);
      setIsNew(true); // new patient -> not saved yet
    }
  }, [activePatient]);

  const setField = (k, v) => setForm((s) => ({ ...s, [k]: v }));

  const validate = () => {
    if (!form.name || !String(form.name).trim()) {
      setError(i18n.t("error_enter_full_name") || "Please enter full name.");
      return false;
    }
    if (form.age && isNaN(Number(form.age))) {
      setError(i18n.t("error_age_number") || "Age must be a number.");
      return false;
    }
    return true;
  };

  // fallback storage helpers if context does not provide addOrUpdate
  async function saveLocalFallback(payload, setActive = false) {
    const all = Array.isArray(getPatients()) ? getPatients() : [];
    const idx = all.findIndex(
      (p) => p.id && payload.id && p.id === payload.id
    );
    const now = Date.now();
    if (idx >= 0) {
      const updated = { ...all[idx], ...payload, updatedAt: now };
      all[idx] = updated;
      savePatients(all);
      if (setActive) setActivePatientFallback(updated);
      return updated;
    } else {
      const id = payload.id || makeId();
      const created = { ...payload, id, createdAt: now, updatedAt: now };
      all.unshift(created);
      savePatients(all);
      if (setActive) setActivePatientFallback(created);
      return created;
    }
  }

  function setActivePatientFallback(patient) {
    try {
      localStorage.setItem("asd_active_patient", JSON.stringify(patient));
      // notify other parts of the app in same tab
      window.dispatchEvent(
        new CustomEvent("asd_active_patient_changed", {
          detail: patient.id,
        })
      );
      // extra generic events for other listeners
      window.dispatchEvent(
        new CustomEvent("app_active_patient_changed", { detail: patient })
      );
      window.dispatchEvent(
        new CustomEvent("patient_saved", { detail: patient })
      );
    } catch (e) {
      // ignore
    }
  }

  async function runSave(payload, setActive = false) {
    // try context helper first
    if (addOrUpdatePatientCtx) {
      const maybePromise = addOrUpdatePatientCtx(payload, setActive);
      const saved = await Promise.resolve(maybePromise);
      // ensure dropdowns etc update: prefer selectActivePatient
      if (setActive) {
        try {
          if (selectActivePatient && saved?.id) selectActivePatient(saved.id);
          // also write to localStorage + dispatch events so any non-context listeners update
          localStorage.setItem("asd_active_patient", JSON.stringify(saved));
          window.dispatchEvent(
            new CustomEvent("asd_active_patient_changed", {
              detail: saved.id,
            })
          );
          window.dispatchEvent(
            new CustomEvent("app_active_patient_changed", {
              detail: saved,
            })
          );
          window.dispatchEvent(
            new CustomEvent("patient_saved", { detail: saved })
          );
        } catch (e) {
          // ignore
        }
      }
      return saved;
    }

    // fallback to local storage based save
    return await saveLocalFallback(payload, setActive);
  }

  const showStatus = (msg) => {
    setStatusMessage(msg);
    setTimeout(() => setStatusMessage(""), 3000);
  };

  const handleSave = async (e) => {
    e?.preventDefault?.();
    setError("");
    if (!validate()) return;
    setSaving(true);

    try {
      const payload = {
        id: form.id,
        name: String(form.name).trim(),
        age: form.age ? Number(form.age) : null,
        gender: form.gender,
        notes: form.notes || "",
      };

      const saved = await runSave(payload, true); // set active by default on Save

      const savedId = saved?.id || payload.id;
      if (savedId) {
        // if selectActivePatient exists, call it so dropdown/context updates immediately
        if (selectActivePatient) {
          try {
            selectActivePatient(savedId);
          } catch (e) {
            // ignore
          }
        } else {
          // fallback done inside runSave already but ensure it again
          localStorage.setItem("asd_active_patient", JSON.stringify(saved));
          window.dispatchEvent(
            new CustomEvent("asd_active_patient_changed", {
              detail: savedId,
            })
          );
          window.dispatchEvent(
            new CustomEvent("app_active_patient_changed", {
              detail: saved,
            })
          );
        }
      }

      setForm((s) => ({ ...s, id: savedId }));
      setIsNew(false); // now saved -> enable Start detection
      showStatus(
        i18n.t("active_patient_text")
          ? `${i18n.t("active_patient_text")}: ${saved.name}`
          : `Patient set active: ${saved.name}`
      );
    } catch (err) {
      console.error("Save patient failed", err);
      setError(
        err?.message ||
          i18n.t("error_save_failed") ||
          "Failed to save patient. Try again."
      );
    } finally {
      setSaving(false);
    }
  };

  const handleSaveAndStart = async (e) => {
    e?.preventDefault?.();
    setError("");
    if (!validate()) return;
    setSaving(true);

    try {
      const payload = {
        id: form.id,
        name: String(form.name).trim(),
        age: form.age ? Number(form.age) : null,
        gender: form.gender,
        notes: form.notes || "",
      };

      const saved = await runSave(payload, true);
      const savedId = saved?.id || payload.id;

      if (savedId) {
        if (selectActivePatient) {
          try {
            selectActivePatient(savedId);
          } catch (e) {
            // ignore
          }
        } else {
          localStorage.setItem("asd_active_patient", JSON.stringify(saved));
          window.dispatchEvent(
            new CustomEvent("asd_active_patient_changed", {
              detail: savedId,
            })
          );
          window.dispatchEvent(
            new CustomEvent("app_active_patient_changed", {
              detail: saved,
            })
          );
        }
      }

      setIsNew(false); // already saved
      showStatus(
        i18n.t("btn_save_start") || "Saved — starting detection"
      );
      navigate("/detection");
    } catch (err) {
      console.error("Save & Start failed", err);
      setError(
        err?.message ||
          i18n.t("error_save_start_failed") ||
          "Failed to save and start detection. Try again."
      );
    } finally {
      setSaving(false);
    }
  };

  // 🔧 RESET: always clear form + messages
  const handleReset = () => {
    setError("");
    setStatusMessage("");
    setSaving(false);
    setForm(emptyPatient);
    setIsNew(true); // new blank patient -> hide Start detection
  };

  const totalPatients = (patientsFromCtx || getPatients() || []).length;

  return (
    <div className="min-h-[calc(100vh-64px)]">
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">
              {i18n.t("patientform_title") || "New patient"}
            </h1>
            <p className="text-sm text-slate-600 mt-2">
              {i18n.t("patientform_subtitle") ||
                "Enter patient demographic details and behavioural notes. This patient will be used in subsequent detections."}
            </p>
          </div>

          <div className="text-right text-sm text-slate-600">
            <div>
              {i18n.t("current_active_patient") ||
                "Current active patient:"}
            </div>
            <div className="font-semibold text-slate-800">
              {activePatient ? activePatient.name : "—"}
            </div>
          </div>
        </div>

        <form
          className="bg-white rounded-2xl p-6 border shadow-sm"
          onSubmit={handleSave}
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
            <div className="md:col-span-2">
              <label className="text-xs font-medium text-slate-700">
                {i18n.t("label_full_name") || "Full name"}
              </label>
              <input
                value={form.name}
                onChange={(e) => setField("name", e.target.value)}
                placeholder={
                  i18n.t("placeholder_full_name") || "Full name"
                }
                className="mt-2 w-full rounded-xl border px-4 py-3 text-sm"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-slate-700">
                {i18n.t("label_age") || "Age (yrs)"}
              </label>
              <input
                value={form.age ?? ""}
                onChange={(e) => setField("age", e.target.value)}
                placeholder={i18n.t("placeholder_age") || "yrs"}
                className="mt-2 w-full rounded-xl border px-4 py-3 text-sm"
              />
            </div>
          </div>

          <div className="mt-6">
            <label className="text-xs font-medium text-slate-700">
              {i18n.t("label_behaviour") ||
                "Behaviour concerns / notes"}
            </label>
            <textarea
              value={form.notes}
              onChange={(e) => setField("notes", e.target.value)}
              placeholder={
                i18n.t("placeholder_behaviour") ||
                "Describe social, communication, sensory or learning concerns"
              }
              className="mt-2 w-full rounded-xl border px-4 py-3 text-sm min-h-[120px] resize-vertical"
            />
          </div>

          <div className="mt-6 md:flex md:items-center md:justify-between">
            <div className="md:w-1/3">
              <label className="text-xs font-medium text-slate-700">
                {i18n.t("label_gender") || "Gender"}
              </label>
              <select
                value={form.gender}
                onChange={(e) => setField("gender", e.target.value)}
                className="mt-2 w-full rounded-xl border px-4 py-3 text-sm"
              >
                <option value="Male">
                  {i18n.t("gender_male") || "Male"}
                </option>
                <option value="Female">
                  {i18n.t("gender_female") || "Female"}
                </option>
                <option value="Other">
                  {i18n.t("gender_other") || "Other"}
                </option>
                <option value="Prefer not to say">
                  {i18n.t("gender_prefer_not") || "Prefer not to say"}
                </option>
              </select>
            </div>

            <div className="mt-4 md:mt-0 flex items-center gap-3">
              {/* Save */}
              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl text-sm font-semibold text-white bg-gradient-to-r from-sky-500 to-emerald-500 shadow-sm disabled:opacity-60"
              >
                {i18n.t("btn_save") || "Save"}
              </button>

              {/* Start detection appears only after first successful save for a new patient */}
              {!isNew && (
                <button
                  type="button"
                  onClick={handleSaveAndStart}
                  disabled={saving}
                  className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl text-sm font-semibold bg-slate-900 text-white disabled:opacity-60"
                >
                  Start detection
                </button>
              )}

              <button
                type="button"
                onClick={handleReset}
                className="inline-flex items-center gap-2 px-4 py-3 rounded-2xl text-sm font-medium bg-white border"
              >
                {i18n.t("btn_reset") || "Reset"}
              </button>
            </div>
          </div>

          <div className="mt-6 text-sm text-slate-500">
            {error ? (
              <div className="text-rose-600 bg-rose-50 p-3 rounded">
                {error}
              </div>
            ) : null}
            {statusMessage ? (
              <div className="text-emerald-700 bg-emerald-50 p-3 rounded mb-2">
                {statusMessage}
              </div>
            ) : null}
            <div className="mt-4">
              {totalPatients}{" "}
              {i18n.t(
                totalPatients === 1
                  ? "patient_singular"
                  : "patient_plural"
              ) ||
                (totalPatients === 1 ? "patient" : "patients")}{" "}
              {i18n.t("in_record") || "in record."}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
