// src/context/ActivePatientContext.js

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";

import {
  fetchPatients,
  savePatient as savePatientRemote,
  saveScreening,
} from "../api/patients";

import {
  getPatients as getPatientsLocal,
  getActivePatient,
  getActivePatientId,
  setActivePatientId,
  appendScreeningToPatient,
  savePatients as savePatientsLocal,
  savePatient as savePatientLocal,
} from "../utils/storage";

const ActivePatientContext = createContext(null);

export function ActivePatientProvider({ children }) {
  const [patients, setPatients] = useState([]);
  const [activePatient, setActivePatient] = useState(null);
  const [loading, setLoading] = useState(true);

  const persistLocal = useCallback((list) => {
    try {
      savePatientsLocal(list || []);
    } catch (err) {
      console.warn("local persist failed", err);
    }
  }, []);

  const mergePatient = useCallback(
    (incoming) => {
      if (!incoming) return null;
      setPatients((prev) => {
        const base = Array.isArray(prev) ? [...prev] : [];
        const idx = base.findIndex((p) => p.id === incoming.id);
        if (idx >= 0) {
          base[idx] = { ...base[idx], ...incoming };
        } else {
          base.unshift(incoming);
        }
        persistLocal(base);
        return base;
      });
      setActivePatient((current) =>
        current?.id === incoming.id ? { ...current, ...incoming } : current
      );
      return incoming;
    },
    [persistLocal]
  );

  const fallbackToLocal = useCallback(() => {
    const localPatients = getPatientsLocal();
    setPatients(localPatients);
    const storedActive = getActivePatient();
    setActivePatient(storedActive);
    setActivePatientId(storedActive?.id || "");
    return localPatients;
  }, []);

  const loadRemotePatients = useCallback(async () => {
    setLoading(true);
    try {
      const remoteList = await fetchPatients();
      if (Array.isArray(remoteList) && remoteList.length) {
        setPatients(remoteList);
        persistLocal(remoteList);
        const activeId = getActivePatientId();
        const selection =
          remoteList.find((p) => p.id === activeId) || remoteList[0] || null;
        if (selection) {
          setActivePatient(selection);
          setActivePatientId(selection.id);
        } else {
          setActivePatient(null);
        }
        return remoteList;
      }
      return fallbackToLocal();
    } catch (err) {
      console.warn("Falling back to local patients", err);
      return fallbackToLocal();
    } finally {
      setLoading(false);
    }
  }, [fallbackToLocal, persistLocal]);

  const refreshActive = useCallback(() => {
    const activeId = getActivePatientId();
    const found = patients.find((p) => p.id === activeId) || null;
    setActivePatient(found);
    return found;
  }, [patients]);

  const reloadPatients = useCallback(() => {
    return loadRemotePatients();
  }, [loadRemotePatients]);

  // Change active patient
  const selectActivePatient = useCallback(
    (id) => {
      if (!id) {
        setActivePatientId("");
        setActivePatient(null);
        return null;
      }
      setActivePatientId(id);
      const found = patients.find((p) => p.id === id) || null;
      setActivePatient(found);
      return found;
    },
    [patients]
  );

  const addOrUpdatePatient = useCallback(
    async (payload, setActive = false) => {
      try {
        const saved = await savePatientRemote(payload);
        mergePatient(saved);
        if (setActive && saved?.id) {
          setActivePatientId(saved.id);
          setActivePatient(saved);
        }
        return saved;
      } catch (err) {
        console.warn("Remote save failed. Using local fallback.", err);
        const saved = savePatientLocal(payload);
        mergePatient(saved);
        if (setActive && saved?.id) {
          setActivePatientId(saved.id);
          setActivePatient(saved);
        }
        return saved;
      }
    },
    [mergePatient]
  );

  // Append new screening result to a patient + refresh state
  const appendScreening = useCallback(
    async (patientId, entry) => {
      if (!patientId) return;
      try {
        await saveScreening(patientId, {
          predicted_class: entry?.predicted_class,
          prob_asd: entry?.prob_asd,
          severity_bucket: entry?.severity_bucket,
          metadata: entry,
        });
        await loadRemotePatients();
      } catch (err) {
        console.warn("Screening sync failed; caching locally", err);
        appendScreeningToPatient(patientId, entry);
        fallbackToLocal();
      }
    },
    [fallbackToLocal, loadRemotePatients]
  );

  // Initial load on app start
  useEffect(() => {
    loadRemotePatients();
  }, [loadRemotePatients]);

  return (
    <ActivePatientContext.Provider
      value={{
        patients,
        activePatient,
        loading,
        selectActivePatient,
        refreshActive,
        reloadPatients,
        addOrUpdatePatient,
        appendScreening,
        refreshPatients: reloadPatients,
      }}
    >
      {children}
    </ActivePatientContext.Provider>
  );
}

export function useActivePatient() {
  return useContext(ActivePatientContext);
}
