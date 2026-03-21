// src/components/ActivePatientDropdown.jsx
import React from "react";
import { useActivePatient } from "../context/ActivePatientContext";

const ActivePatientDropdown = () => {
  const { patients, activePatient, selectActivePatient, loading } =
    useActivePatient();

  const handleChange = (e) => {
    const id = e.target.value || "";
    // if empty -> clear
    if (!id) return selectActivePatient(null);
    selectActivePatient(id);
  };

  return (
    <select
      className="px-4 py-2 rounded-xl border bg-white text-sm"
      value={activePatient?.id || ""}
      onChange={handleChange}
      disabled={loading}
    >
      <option value="">
        {loading ? "Loading patients…" : "Select patient"}
      </option>
      {patients.map((p) => (
        <option key={p.id} value={p.id}>
          {p.name} • {p.age ?? ""}
        </option>
      ))}
    </select>
  );
};

export default ActivePatientDropdown;
