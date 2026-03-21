// src/utils/storage.js

const PATIENTS_KEY = "asd_patients";
const ACTIVE_PATIENT_KEY = "asd_active_patient";

// ------------- Helpers -------------
function safeParse(json) {
  try {
    return JSON.parse(json);
  } catch {
    return null;
  }
}

// Try to auto-detect an old patients array in localStorage
function detectLegacyPatientsArray() {
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key) continue;

      const raw = localStorage.getItem(key);
      if (!raw) continue;

      const parsed = safeParse(raw);
      if (!Array.isArray(parsed) || !parsed.length) continue;

      const first = parsed[0];
      if (
        first &&
        typeof first === "object" &&
        ("name" in first || "id" in first)
      ) {
        // Looks like a patients list – use it as legacy data
        return parsed;
      }
    }
  } catch {
    // ignore
  }
  return null;
}

// Unique ID generator
function generateId(prefix = "P") {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}

// -----------------------------
//  BASIC PATIENT OPERATIONS
// -----------------------------

export function getPatients() {
  try {
    // 1) Preferred key
    const raw = localStorage.getItem(PATIENTS_KEY);
    if (raw) {
      const parsed = safeParse(raw);
      if (Array.isArray(parsed)) return parsed;
    }

    // 2) No data under new key → try to detect legacy data
    const legacy = detectLegacyPatientsArray();
    if (legacy) {
      // Do NOT overwrite anything yet; just return for reading.
      return legacy;
    }

    return [];
  } catch {
    return [];
  }
}

export function savePatients(list) {
  try {
    localStorage.setItem(PATIENTS_KEY, JSON.stringify(list || []));
  } catch {
    // ignore write errors (storage full, etc.)
  }
}

export function savePatient(patient) {
  const all = getPatients();
  const now = Date.now();

  const copy = { ...(patient || {}) };

  if (!copy.id) {
    copy.id = generateId("P");
    copy.createdAt = now;
  }

  copy.updatedAt = now;

  if (!Array.isArray(copy.history)) {
    copy.history = [];
  }

  const idx = all.findIndex((p) => p.id === copy.id);
  if (idx >= 0) {
    all[idx] = { ...all[idx], ...copy };
  } else {
    all.unshift(copy);
  }

  savePatients(all);
  return copy;
}

// -----------------------------
//  ACTIVE PATIENT
// -----------------------------

export function setActivePatientId(id) {
  try {
    localStorage.setItem(ACTIVE_PATIENT_KEY, id || "");
  } catch {
    // ignore
  }
}

export function getActivePatientId() {
  try {
    return localStorage.getItem(ACTIVE_PATIENT_KEY) || "";
  } catch {
    return "";
  }
}

export function getActivePatient() {
  const id = getActivePatientId();
  if (!id) return null;
  return getPatients().find((p) => p.id === id) || null;
}

// -----------------------------
//  PER-PATIENT SCREENING HISTORY
// -----------------------------

export function appendScreeningToPatient(patientId, entry) {
  if (!patientId) return;

  const all = getPatients();
  const idx = all.findIndex((p) => p.id === patientId);
  if (idx === -1) return;

  const now = Date.now();
  const patient = { ...all[idx] };

  if (!Array.isArray(patient.history)) {
    patient.history = [];
  }

  patient.history.unshift({
    ...(entry || {}),
    createdAt: now,
  });

  patient.updatedAt = now;
  all[idx] = patient;

  savePatients(all);
}

// -----------------------------
//  DELETE PATIENT
// -----------------------------

export function deletePatient(patientId) {
  const updated = getPatients().filter((p) => p.id !== patientId);
  savePatients(updated);

  if (getActivePatientId() === patientId) {
    setActivePatientId("");
  }
}

// -----------------------------
//  GLOBAL HISTORY for Dashboard
// -----------------------------

export function getHistory() {
  const all = getPatients();

  const merged = all.flatMap((p) =>
    (p.history || []).map((h) => ({
      ...h,
      patientId: p.id,
      patientName: p.name,
      age: p.age,
      subjectId: p.id,
    }))
  );

  merged.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
  return merged;
}
