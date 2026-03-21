import React, { useEffect, useState, useMemo, useCallback } from "react";
import { useActivePatient } from "../../context/ActivePatientContext";
import { getPatients, deletePatient } from "../../utils/storage";
import { getAppointments } from "../../utils/appointmentStorage";
import { Search, Trash2, ArrowRight, MessageSquare, CalendarDays, BrainCircuit, X, FileText } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import i18n from "../../i18n";

function timeAgo(iso) {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  const s = Math.floor((Date.now() - d.getTime()) / 1000);
  if (s < 60) return `${s}s ago`;
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

export default function Patients() {
  const { patients: ctxPatients, activePatient, selectActivePatient, reloadPatients } = useActivePatient();
  const [localPatients, setLocalPatients] = useState([]);
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState("name");
  const [selected, setSelected] = useState(null);
  const navigate = useNavigate();

  const loadLocalPatients = useCallback(async () => {
    const fromCtx = Array.isArray(ctxPatients) ? ctxPatients : [];
    const fromStorage = Array.isArray(getPatients()) ? getPatients() : [];
    
    let rawAppts = [];
    try {
      rawAppts = await getAppointments("doctor", "admin") || [];
    } catch {
      rawAppts = [];
    }

    const fromAppt = rawAppts
      .filter(a => a.status === "confirmed" || a.status === "completed")
      .map(a => ({
        id: `appt_${a.id || Date.now()}`,
        name: a.patient_id || "Unknown Patient",
        age: "",
        gender: "",
        phone: "",
        notes: a.symptoms || a.notes || "From Appointment",
        updatedAt: Date.now() // Fake recent activity
      }));

    const byId = new Map();
    fromStorage.forEach(p => { if (p?.id) byId.set(p.id, p); });
    fromCtx.forEach(p => { if (p?.id) byId.set(p.id, { ...(byId.get(p.id) || {}), ...p }); });
    fromAppt.forEach(p => { byId.set(p.name, p); }); // Use name as key to merge duplicates if id differs
    
    setLocalPatients(Array.from(byId.values()));
  }, [ctxPatients]);

  useEffect(() => {
    loadLocalPatients();
    const iv = setInterval(loadLocalPatients, 2500);
    return () => clearInterval(iv);
  }, [loadLocalPatients]);

  const filtered = useMemo(() => localPatients.filter(p => {
    if (!query) return true;
    const q = query.toLowerCase();
    return (p.name || "").toLowerCase().includes(q) || (p.id || "").toLowerCase().includes(q);
  }).sort((a, b) => sort === "name" ? (a.name || "").localeCompare(b.name || "") : (b.updatedAt || 0) - (a.updatedAt || 0)), [localPatients, query, sort]);

  const handleDelete = (p) => {
    deletePatient(p.id);
    if (typeof reloadPatients === "function") reloadPatients();
    if (selected?.id === p.id) setSelected(null);
  };

  const bgColor = (name = "") => {
    const colors = ["from-blue-400 to-indigo-500", "from-emerald-400 to-teal-500", "from-rose-400 to-pink-500", "from-amber-400 to-orange-500", "from-purple-400 to-violet-500"];
    return colors[name.charCodeAt(0) % colors.length];
  };

  return (
    <div className="p-5 lg:p-8 pb-8 bg-gray-50 dark:bg-gray-950 min-h-full">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-headline font-bold text-gray-900 dark:text-white mb-1">Patients</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm">{localPatients.length} patients registered</p>
        </div>
        <button onClick={() => navigate('/doctor/patient-form')} className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-bold shadow-sm transition active:scale-95">
          + Add Patient
        </button>
      </div>

      {/* Search + Sort */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-4 mb-5 flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search by name or ID..." className="w-full bg-gray-100 dark:bg-gray-800 rounded-xl pl-9 pr-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-emerald-500 dark:text-white dark:placeholder-gray-500 transition-all" />
        </div>
        <div className="flex gap-2">
          {["name", "last"].map(s => (
            <button key={s} onClick={() => setSort(s)} className={`px-3 py-2 rounded-xl text-xs font-bold transition ${sort === s ? 'bg-emerald-600 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'}`}>
              {s === 'name' ? 'Name' : 'Last Seen'}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Patient List */}
        <div className="lg:col-span-2 bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden">
          {filtered.length === 0 ? (
            <div className="py-16 text-center">
              <div className="w-16 h-16 bg-gray-50 dark:bg-gray-800 rounded-2xl flex items-center justify-center mx-auto mb-3">
                <Search size={24} className="text-gray-300 dark:text-gray-600" />
              </div>
              <p className="font-semibold text-gray-400 dark:text-gray-500">{query ? "No patients match your search" : "No patients added yet"}</p>
              {!query && <button onClick={() => navigate('/doctor/patient-form')} className="mt-4 px-4 py-2 bg-emerald-600 text-white text-sm font-bold rounded-xl hover:bg-emerald-700 transition">Add First Patient</button>}
            </div>
          ) : filtered.map((p, i) => (
            <motion.div key={p.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }} onClick={() => setSelected(selected?.id === p.id ? null : p)} className={`flex items-center gap-4 px-5 py-4 border-b border-gray-50 dark:border-gray-800/50 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-colors ${selected?.id === p.id ? 'bg-emerald-50 dark:bg-emerald-950/20 border-l-4 border-l-emerald-500' : ''}`}>
              <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${bgColor(p.name)} flex items-center justify-center text-white font-bold text-lg shrink-0`}>
                {(p.name || "?")[0].toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-900 dark:text-white truncate">{p.name || "Unknown"}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Age: {p.age || "—"} · ID: {p.id}</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {p.updatedAt && <span className="text-xs text-gray-400 hidden sm:block">{timeAgo(p.updatedAt)}</span>}
                {Array.isArray(p.history) && p.history.length > 0 && (
                  <span className="text-xs bg-purple-50 dark:bg-purple-950/30 text-purple-600 px-2 py-1 rounded-full font-semibold">{p.history.length} screens</span>
                )}
                <button onClick={e => { e.stopPropagation(); handleDelete(p); }} className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-lg transition">
                  <Trash2 size={14} />
                </button>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Patient Detail Panel */}
        <div>
          <AnimatePresence>
            {selected ? (
              <motion.div key="detail" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 12 }} className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden sticky top-6">
                <div className="bg-gradient-to-br from-emerald-600 to-teal-700 p-5 text-white relative">
                  <button onClick={() => setSelected(null)} className="absolute top-3 right-3 p-1.5 hover:bg-white/10 rounded-lg transition"><X size={16} /></button>
                  <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${bgColor(selected.name)} flex items-center justify-center text-white font-bold text-2xl mb-3 border-2 border-white/20`}>
                    {(selected.name || "?")[0].toUpperCase()}
                  </div>
                  <h3 className="font-headline font-bold text-xl">{selected.name}</h3>
                  <p className="text-emerald-200 text-sm">Age {selected.age || "—"} · ID: {selected.id}</p>
                </div>

                <div className="p-4 space-y-3">
                  <div className="grid grid-cols-2 gap-2">
                    <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-3">
                      <p className="text-xs text-gray-400 uppercase tracking-wide">Screenings</p>
                      <p className="text-xl font-bold text-gray-900 dark:text-white mt-1">{selected.history?.length || 0}</p>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-3">
                      <p className="text-xs text-gray-400 uppercase tracking-wide">Last Visit</p>
                      <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mt-1">{timeAgo(selected.updatedAt) || "Never"}</p>
                    </div>
                  </div>

                  {selected.notes && (
                    <div className="bg-teal-50 dark:bg-teal-950/20 rounded-xl p-3">
                      <p className="text-xs font-semibold text-teal-700 mb-1">Notes</p>
                      <p className="text-xs text-teal-900 dark:text-teal-300 leading-relaxed">{selected.notes}</p>
                    </div>
                  )}

                  <div className="space-y-2 pt-1">
                    {selected.history?.length > 0 && (
                      <button
                        onClick={() => navigate(`/doctor/patient/${selected.id}`)}
                        className="w-full flex items-center justify-center gap-2 py-2.5 bg-blue-50 dark:bg-blue-950/20 text-blue-600 hover:bg-blue-100 dark:hover:bg-blue-950/40 rounded-xl text-sm font-bold shadow-sm transition active:scale-95"
                      >
                        <FileText size={15} /> View Medical Report
                      </button>
                    )}
                    <button onClick={() => navigate('/doctor/chat')} className="w-full flex items-center justify-center gap-2 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-bold shadow-sm transition active:scale-95">
                      <MessageSquare size={15} /> Chat with Patient
                    </button>
                    <button onClick={() => navigate('/doctor/appointments')} className="w-full flex items-center justify-center gap-2 py-2.5 bg-teal-50 dark:bg-teal-950/20 text-teal-700 hover:bg-teal-100 dark:hover:bg-teal-950/40 rounded-xl text-sm font-bold transition">
                      <CalendarDays size={15} /> View Appointments
                    </button>
                    <button onClick={() => navigate('/doctor/detection')} className="w-full flex items-center justify-center gap-2 py-2.5 bg-purple-50 dark:bg-purple-950/20 text-purple-600 hover:bg-purple-100 dark:hover:bg-purple-950/40 rounded-xl text-sm font-bold transition">
                      <BrainCircuit size={15} /> Run AI Screening
                    </button>
                  </div>
                </div>
              </motion.div>
            ) : (
              <div key="placeholder" className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-10 text-center">
                <div className="w-16 h-16 bg-gray-50 dark:bg-gray-800 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <ArrowRight size={24} className="text-gray-300 dark:text-gray-600" />
                </div>
                <p className="text-sm font-semibold text-gray-400 dark:text-gray-500">Select a patient to view details</p>
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
