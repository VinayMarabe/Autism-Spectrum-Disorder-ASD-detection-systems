import React, { useState } from "react";
import { savePatient, setActivePatientId } from "../utils/storage";

const NewPatientModal = ({ open, onClose = () => {}, onCreate = () => {} }) => {
  const [name, setName] = useState("");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState("");
  const [notes, setNotes] = useState("");
  if (!open) return null;
  const handleCreate = (e) => {
    e.preventDefault();
    if (!name.trim()) {
      alert("Please enter a patient name.");
      return;
    }
    const saved = savePatient({
      name: name.trim(),
      age: age ? Number(age) : "",
      gender,
      notes,
    });
    setActivePatientId(saved.id);
    onCreate(saved);
    setName("");
    setAge("");
    setGender("");
    setNotes("");
    onClose();
  };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-lg border border-slate-100 p-5 z-10">
        <h2 className="text-lg font-semibold text-slate-900 mb-2">Create new patient</h2>
        <p className="text-xs text-slate-500 mb-4">Quickly add a patient and set them active for screening.</p>
        <form onSubmit={handleCreate} className="space-y-3">
          <div>
            <label className="text-xs font-medium text-slate-700">Name</label>
            <input value={name} onChange={(e) => setName(e.target.value)} className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400" placeholder="e.g. Aisha Khan" required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-slate-700">Age</label>
              <input type="number" min="0" max="120" value={age} onChange={(e) => setAge(e.target.value)} className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400" placeholder="e.g. 8" />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-700">Gender</label>
              <select value={gender} onChange={(e) => setGender(e.target.value)} className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400">
                <option value="">Prefer not to say</option>
                <option value="female">Female</option>
                <option value="male">Male</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-slate-700">Notes / symptoms</label>
            <textarea rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400" placeholder="Short description (social / communication / sensory concerns)" />
          </div>
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => { setName(""); setAge(""); setGender(""); setNotes(""); onClose(); }} className="inline-flex items-center px-3 py-2 rounded-2xl border border-slate-200 text-sm">Cancel</button>
            <button type="submit" className="inline-flex items-center px-4 py-2 rounded-2xl bg-sky-500 text-white text-sm font-semibold hover:bg-sky-600">Create & set active</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default NewPatientModal;
