import React, { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  CalendarDays, Clock, CheckCircle2, XCircle, Clock3,
  Hospital, ChevronDown, Plus, Bell
} from "lucide-react";
import { getAppointments, cancelAppointment } from "../../utils/appointmentStorage";
import { useActivePatient } from "../../context/ActivePatientContext";

const statusConfig = {
  confirmed: { label: "Confirmed",         bg: "bg-emerald-100 dark:bg-emerald-950/40", text: "text-emerald-700 dark:text-emerald-400", icon: <CheckCircle2 size={14} />, dot: "bg-emerald-500" },
  pending:   { label: "Pending Approval",   bg: "bg-amber-100 dark:bg-amber-950/40",   text: "text-amber-700 dark:text-amber-400",   icon: <Clock3 size={14} />,        dot: "bg-amber-400 animate-pulse" },
  rejected:  { label: "Declined",           bg: "bg-red-100 dark:bg-red-950/40",        text: "text-red-700 dark:text-red-400",        icon: <XCircle size={14} />,       dot: "bg-red-500" },
  cancelled: { label: "Cancelled",          bg: "bg-gray-100 dark:bg-gray-800",         text: "text-gray-500 dark:text-gray-400",      icon: <XCircle size={14} />,       dot: "bg-gray-400" },
  completed: { label: "Completed",          bg: "bg-gray-100 dark:bg-gray-800",         text: "text-gray-500 dark:text-gray-400",      icon: <CheckCircle2 size={14} />,  dot: "bg-gray-400" },
};

export default function PatientAppointments() {
  const navigate = useNavigate();
  const { activePatient } = useActivePatient();
  const [tab, setTab] = useState("upcoming");
  const [expanded, setExpanded] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [toast, setToast] = useState(null); 
  const prevStatusMap = useRef({});

  const load = useCallback(async () => {
    if (!activePatient) return;
    try {
      const stored = await getAppointments("patient", activePatient.id);
      
      // Detect status changes to show toast (skip on first load)
      if (Object.keys(prevStatusMap.current).length > 0) {
        stored.forEach(appt => {
          const prev = prevStatusMap.current[appt.id];
          if (prev === 'pending' && appt.status === 'confirmed') {
            setToast({ message: `✅ Appointment with Doctor confirmed!`, type: 'confirmed' });
            setTimeout(() => setToast(null), 4000);
          } else if (prev === 'pending' && appt.status === 'rejected') {
            setToast({ message: `❌ Appointment was declined.`, type: 'rejected' });
            setTimeout(() => setToast(null), 4000);
          }
        });
      }
      
      stored.forEach(appt => {
        prevStatusMap.current[appt.id] = appt.status;
      });

      setAppointments(stored || []);
    } catch(err) {
      console.error(err);
    }
  }, [activePatient]);

  useEffect(() => {
    load();
    const iv = setInterval(load, 2000); // poll every 2s
    return () => clearInterval(iv);
  }, [load]);

  const upcoming = appointments.filter(a => a.status !== "completed");
  const past     = appointments.filter(a => a.status === "completed");
  const shown    = tab === "upcoming" ? upcoming : past;
  const pending  = upcoming.filter(a => a.status === "pending");

  return (
    <div className="p-5 lg:p-6 pb-24 md:pb-6 bg-gray-50 dark:bg-gray-950 min-h-full">

      {/* Toast notification */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -40 }}
            className={`fixed top-4 right-4 z-50 flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-2xl text-white font-bold text-sm ${
              toast.type === 'confirmed' ? 'bg-emerald-600' : 'bg-red-600'
            }`}
          >
            {toast.type === 'confirmed' ? <CheckCircle2 size={18} /> : <XCircle size={18} />}
            {toast.message}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-2xl font-headline font-bold text-gray-900 dark:text-white">Appointments</h1>
          <p className="text-gray-500 text-sm mt-0.5">Track your appointment status</p>
        </div>
        <button onClick={() => navigate("/patient/hospitals")}
          className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold shadow-sm transition active:scale-95">
          <Plus size={16} /> Book New
        </button>
      </div>

      {/* Pending banner */}
      {pending.length > 0 && (
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3 p-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-2xl mb-5">
          <Clock3 size={18} className="text-amber-500 shrink-0 animate-pulse" />
          <p className="text-sm font-bold text-amber-700 dark:text-amber-400">
            {pending.length} request{pending.length > 1 ? "s" : ""} awaiting doctor approval
          </p>
        </motion.div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 p-1 bg-gray-100 dark:bg-gray-800 rounded-2xl mb-5 w-fit">
        {[["upcoming", "Upcoming", upcoming.length], ["history", "Past", past.length]].map(([val, lbl, cnt]) => (
          <button key={val} onClick={() => setTab(val)}
            className={`px-5 py-2 rounded-xl text-sm font-bold transition-all ${tab === val ? "bg-white dark:bg-gray-900 text-blue-600 shadow-sm" : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"}`}>
            {lbl} <span className={`ml-1 text-xs px-1.5 py-0.5 rounded-full ${tab === val ? "bg-blue-100 dark:bg-blue-950 text-blue-600" : "bg-gray-200 dark:bg-gray-700 text-gray-500"}`}>{cnt}</span>
          </button>
        ))}
      </div>

      {/* Cards */}
      {shown.length === 0 ? (
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-12 text-center">
          <CalendarDays size={40} className="text-gray-200 dark:text-gray-700 mx-auto mb-3" />
          <p className="font-semibold text-gray-400 text-sm mb-4">No {tab === "upcoming" ? "upcoming" : "past"} appointments</p>
          {tab === "upcoming" && (
            <button onClick={() => navigate("/patient/hospitals")} className="px-5 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 transition">
              Find a Hospital & Book
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {shown.map((appt, i) => {
            const sc = statusConfig[appt.status] || statusConfig.pending;
            const isOpen = expanded === appt.id;
            return (
              <motion.div key={appt.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
                className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden hover:shadow-md transition-all"
              >
                {/* Status bar accent */}
                <div className={`h-1 w-full ${sc.dot.replace("animate-pulse", "")}`} />

                <div className="flex items-center gap-4 p-4">
                  <img src={appt.doctorImg} alt={appt.doctor} className="w-12 h-12 rounded-xl border-2 border-gray-100 dark:border-gray-700 shrink-0" />

                  <div className="flex-1 min-w-0">
                    <p className="font-headline font-bold text-gray-900 dark:text-white text-sm">{appt.doctor}</p>
                    <p className="text-xs text-blue-600 dark:text-blue-400 font-semibold">{appt.specialty}</p>
                    <div className="flex flex-wrap gap-x-3 mt-1 text-xs text-gray-400">
                      <span className="flex items-center gap-1"><CalendarDays size={10} /> {appt.date}</span>
                      <span className="flex items-center gap-1"><Clock size={10} /> {appt.time}</span>
                      <span className="flex items-center gap-1"><Hospital size={10} /> {appt.hospital}</span>
                    </div>
                  </div>

                  {/* Status badge */}
                  <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold shrink-0 ${sc.bg} ${sc.text}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${sc.dot}`} />
                    {sc.label}
                  </div>

                  <button onClick={() => setExpanded(isOpen ? null : appt.id)} className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition shrink-0">
                    <ChevronDown size={15} className={`transition-transform ${isOpen ? "rotate-180" : ""}`} />
                  </button>
                </div>

                {/* Expanded: only show details + withdraw option */}
                {isOpen && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
                    className="border-t border-gray-50 dark:border-gray-800 px-4 py-3 text-sm text-gray-500 space-y-2">
                    {appt.symptoms && <p className="bg-gray-50 dark:bg-gray-800 rounded-xl p-3 text-xs text-gray-600 dark:text-gray-300">📋 {appt.symptoms}</p>}
                    {appt.status === "rejected" && <p className="text-xs text-red-500">Declined by doctor. You can book a new appointment.</p>}
                    {appt.status === "pending" && (
                      <button onClick={() => { if (!appt.id.startsWith("seed_")) { cancelAppointment(appt.id); load(); } }}
                        className="text-xs font-bold text-red-500 hover:text-red-700 transition">
                        ✕ Withdraw Request
                      </button>
                    )}
                    {(appt.status === "rejected" || appt.status === "completed") && (
                      <button onClick={() => navigate("/patient/hospitals")} className="text-xs font-bold text-blue-600 hover:underline">
                        + Book Again
                      </button>
                    )}
                  </motion.div>
                )}
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
