// src/page/PatientDetails.jsx

import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getPatients } from "../utils/storage";
import { useActivePatient } from "../context/ActivePatientContext";

export default function PatientDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { selectActivePatient } = useActivePatient();

  const [patient, setPatient] = useState(null);

  useEffect(() => {
    const all = getPatients();
    const p = all.find((x) => x.id === id) || null;
    setPatient(p);

    if (p) selectActivePatient(p.id);
  }, [id, selectActivePatient]);

  if (!patient) {
    return (
      <div className="p-6">
        <div className="bg-white p-6 rounded-xl shadow text-center">
          <h1 className="text-xl font-semibold text-slate-800">
            Patient not found
          </h1>
          <button
            onClick={() => navigate("/patients")}
            className="mt-4 px-4 py-2 rounded-lg bg-slate-900 text-white"
          >
            Back to Patients
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 p-6">

      {/* HEADER */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Patient Profile</h1>
          <p className="text-slate-500 mt-1">
            Complete clinical summary of the patient
          </p>
        </div>

        <button
          onClick={() => navigate("/patients")}
          className="px-4 py-2 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200"
        >
          Back to Patients
        </button>
      </div>

      {/* PROFILE CARD */}
      <div className="bg-white rounded-xl shadow-sm p-6 border space-y-4">
        <h2 className="text-xl font-semibold text-slate-800">Basic Information</h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <p className="text-sm text-slate-500">Name</p>
            <p className="text-lg font-medium">{patient.name}</p>
          </div>

          <div>
            <p className="text-sm text-slate-500">Age</p>
            <p className="text-lg font-medium">{patient.age || "—"}</p>
          </div>

          <div>
            <p className="text-sm text-slate-500">Patient ID</p>
            <p className="text-lg font-medium">{patient.id}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

          <div>
            <p className="text-sm text-slate-500">Created On</p>
            <p className="text-lg font-medium">
              {patient.createdAt
                ? new Date(patient.createdAt).toLocaleString()
                : "—"}
            </p>
          </div>

          <div>
            <p className="text-sm text-slate-500">Last Updated</p>
            <p className="text-lg font-medium">
              {patient.updatedAt
                ? new Date(patient.updatedAt).toLocaleString()
                : "—"}
            </p>
          </div>

          <div>
            <p className="text-sm text-slate-500">Total Screenings</p>
            <p className="text-lg font-medium">
              {patient.history?.length || 0}
            </p>
          </div>
        </div>
      </div>

      {/* NOTES CARD */}
      <div className="bg-white rounded-xl shadow-sm p-6 border">
        <h2 className="text-xl font-semibold text-slate-800">Clinical Notes</h2>
        <p className="text-slate-600 mt-2">
          {patient.notes || "No notes added."}
        </p>
      </div>

      {/* SCREENING HISTORY */}
      <div className="bg-white rounded-xl shadow-sm p-6 border">
        <h2 className="text-xl font-semibold text-slate-800">
          Screening History
        </h2>

        <div className="mt-4 space-y-3">
          {patient.history?.length > 0 ? (
            patient.history.map((entry, index) => (
              <div
                key={index}
                className="p-4 bg-slate-50 rounded-xl border flex flex-col"
              >
                <p className="font-medium text-slate-800">
                  {entry.summary || "Screening"}
                </p>
                <p className="text-sm text-slate-500 mt-1">
                  {new Date(entry.createdAt).toLocaleString()}
                </p>
              </div>
            ))
          ) : (
            <p className="text-slate-500 text-sm">No screenings yet.</p>
          )}
        </div>
      </div>

    </div>
  );
}
