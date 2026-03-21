import React, { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { CalendarDays, Clock, CheckCircle2, XCircle, Clock3, MessageSquare, ChevronDown, Plus, Bell, RefreshCw } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { getAppointments, updateAppointmentStatus, saveAppointments } from "../../utils/appointmentStorage";

// Seed doctor-created appointments (permanent on doctor side)
const seedAppointments = [
  { id: "seed_dr_1", patientName: "James Park", patientAge: "10", patientGender: "Male", hospital: "Mercy Medical", date: "Mon Oct 20", time: "09:00 AM", status: "confirmed", type: "Therapy Session", symptoms: "Monthly behavioural therapy check-in.", doctorImg: "https://api.dicebear.com/7.x/notionists/svg?seed=James&backgroundColor=fef9c3" },
  { id: "seed_dr_2", patientName: "Maya Chen", patientAge: "7", patientGender: "Female", hospital: "Children's ASD Clinic", date: "Fri Oct 10", time: "10:00 AM", status: "completed", type: "Follow-up", symptoms: "Reviewed latest AI screening report.", doctorImg: "https://api.dicebear.com/7.x/notionists/svg?seed=Maya&backgroundColor=e0f2fe" },
];

const statusConfig = {
  confirmed: { label: "Confirmed", color: "text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800", icon: <CheckCircle2 size={13} /> },
  pending: { label: "Pending Approval", color: "text-amber-600 bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800", icon: <Clock3 size={13} /> },
  rejected: { label: "Declined", color: "text-red-600 bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800", icon: <XCircle size={13} /> },
  completed: { label: "Completed", color: "text-gray-500 bg-gray-100 dark:bg-gray-800 border-gray-200 dark:border-gray-700", icon: <CheckCircle2 size={13} /> },
};

export default function DoctorAppointments() {
  const navigate = useNavigate();
  const [tab, setTab] = useState("pending");
  const [expandedId, setExpandedId] = useState(null);
  const [allAppointments, setAllAppointments] = useState([]);

  const loadAppointments = useCallback(async () => {
    try {
      const stored = await getAppointments("doctor", "admin");
      setAllAppointments(stored || []);
    } catch (err) {
      console.error(err);
    }
  }, []);

  useEffect(() => {
    loadAppointments();
    const interval = setInterval(loadAppointments, 2000); // Polling for updates
    return () => clearInterval(interval);
  }, [loadAppointments]);

  const pending = allAppointments.filter(a => a.status === "pending");
  const confirmed = allAppointments.filter(a => a.status === "confirmed");
  const past = allAppointments.filter(a => a.status === "completed" || a.status === "rejected" || a.status === "cancelled");

  const lists = { pending, upcoming: confirmed, history: past };
  const shown = lists[tab] || [];

  const approve = async (id) => {
    await updateAppointmentStatus(id, "confirmed");
    loadAppointments();
  };

  const decline = async (id) => {
    await updateAppointmentStatus(id, "rejected");
    loadAppointments();
  };

  const avatarInitial = (name = "") => name ? name[0].toUpperCase() : "P";
  const bgColor = (name = "") => {
    const colors = ["from-blue-400 to-indigo-500", "from-emerald-400 to-teal-500", "from-rose-400 to-pink-500", "from-amber-400 to-orange-500", "from-purple-400 to-violet-500"];
    return colors[(name.charCodeAt(0) || 0) % colors.length];
  };

  return (
    <div className="p-5 lg:p-6 pb-8 bg-gray-50 dark:bg-gray-950 min-h-full">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-headline font-bold text-gray-900 dark:text-white mb-1">Appointments</h1>
            <p className="text-gray-500 dark:text-gray-400 text-sm">Manage your patient appointment requests</p>
          </div>
          <button onClick={loadAppointments} className="flex items-center gap-2 px-3 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 rounded-xl text-sm font-bold hover:bg-gray-50 dark:hover:bg-gray-700 transition">
            <RefreshCw size={14} /> Refresh
          </button>
        </div>

        {/* Pending alert */}
        {pending.length > 0 && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-3 p-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-2xl mb-5">
            <Bell size={18} className="text-amber-500 shrink-0 animate-pulse" />
            <div className="flex-1">
              <p className="font-bold text-amber-700 dark:text-amber-400 text-sm">{pending.length} new appointment request{pending.length > 1 ? 's' : ''} waiting</p>
              <p className="text-xs text-amber-600 dark:text-amber-500">Review and approve or decline below</p>
            </div>
            <button onClick={() => setTab("pending")} className="text-xs font-bold text-amber-700 dark:text-amber-400 underline hover:no-underline">Review Now</button>
          </motion.div>
        )}

        {/* Tabs */}
        <div className="flex gap-2 p-1 bg-gray-100 dark:bg-gray-800 rounded-2xl mb-6 w-fit flex-wrap">
          {[["pending", "Requests", pending.length, pending.length > 0], ["upcoming", "Confirmed", confirmed.length, false], ["history", "History", past.length, false]].map(([val, label, count, highlight]) => (
            <button key={val} onClick={() => setTab(val)} className={`px-5 py-2 rounded-xl text-sm font-bold transition-all ${tab === val ? 'bg-white dark:bg-gray-900 text-emerald-600 shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}>
              {label}
              {count > 0 && <span className={`ml-1.5 text-xs px-1.5 py-0.5 rounded-full font-bold ${tab === val ? 'bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600' : highlight ? 'bg-amber-400 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-500'}`}>{count}</span>}
            </button>
          ))}
        </div>

        {/* Cards */}
        {shown.length === 0 ? (
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-10 text-center">
            <CalendarDays size={36} className="text-gray-300 dark:text-gray-600 mx-auto mb-3" />
            <p className="font-semibold text-gray-400 dark:text-gray-500">
              {tab === "pending" ? "No pending requests right now" : "No appointments here"}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {shown.map((appt, i) => {
              const sc = statusConfig[appt.status] || statusConfig.pending;
              const expanded = expandedId === appt.id;
              return (
                <motion.div key={appt.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
                  className={`bg-white dark:bg-gray-900 rounded-2xl border overflow-hidden hover:shadow-lg transition-all ${appt.status === 'pending' ? 'border-amber-200 dark:border-amber-800 shadow-amber-500/10 shadow-md' : 'border-gray-100 dark:border-gray-800 hover:shadow-emerald-500/5'}`}
                >
                  <div className="flex items-start gap-4 p-5 flex-wrap">
                    {/* Avatar */}
                    <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${bgColor(appt.patient_id)} flex items-center justify-center text-white text-2xl font-bold shrink-0`}>
                      {avatarInitial(appt.patient_id)}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-3 flex-wrap">
                        <div>
                          <h3 className="font-headline font-bold text-gray-900 dark:text-white">Patient {appt.patient_id}</h3>
                          <p className="text-xs text-gray-500 dark:text-gray-400">{appt.type || "Consultation"}</p>
                        </div>
                        <span className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full border shrink-0 ${sc.color}`}>
                          {sc.icon} {sc.label}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-xs text-gray-500 dark:text-gray-400">
                        <span className="flex items-center gap-1"><CalendarDays size={11} /> {appt.date}</span>
                        <span className="flex items-center gap-1"><Clock size={11} /> {appt.time}</span>
                        <span className="text-gray-300 dark:text-gray-600">·</span>
                        <span>{appt.hospital}</span>
                      </div>
                    </div>

                    {/* Inline approve/decline for pending only */}
                    {appt.status === "pending" && (
                      <div className="flex gap-2 shrink-0">
                        <button onClick={() => approve(appt.id)} className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition active:scale-95">
                          <CheckCircle2 size={13} /> Accept
                        </button>
                        <button onClick={() => decline(appt.id)} className="flex items-center gap-1.5 px-4 py-2 bg-red-50 dark:bg-red-950/20 text-red-600 text-xs font-bold rounded-xl hover:bg-red-100 transition active:scale-95">
                          <XCircle size={13} /> Decline
                        </button>
                      </div>
                    )}

                    <button onClick={() => setExpandedId(expanded ? null : appt.id)} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition shrink-0">
                      <ChevronDown size={16} className={`transition-transform ${expanded ? 'rotate-180' : ''}`} />
                    </button>
                  </div>

                  {/* Expanded details */}
                  {expanded && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} className="border-t border-gray-50 dark:border-gray-800 px-5 py-4">
                      {appt.symptoms && (
                        <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-3 mb-4">
                          <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">Patient's Symptoms / Concern</p>
                          <p className="text-sm text-gray-700 dark:text-gray-200">{appt.symptoms}</p>
                        </div>
                      )}
                      {appt.notes && (
                        <div className="bg-teal-50 dark:bg-teal-950/20 rounded-xl p-3 mb-4">
                          <p className="text-xs font-semibold text-teal-600 mb-1">Additional Notes</p>
                          <p className="text-sm text-teal-800 dark:text-teal-300">{appt.notes}</p>
                        </div>
                      )}
                      {appt.patientPhone && (
                        <p className="text-xs text-gray-500 mb-4">📞 {appt.patientPhone}</p>
                      )}
                      <div className="flex gap-2 flex-wrap">
                        <button onClick={() => navigate('/doctor/chat')} className="flex items-center gap-1.5 px-4 py-2 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 text-xs font-bold rounded-xl hover:bg-emerald-100 transition">
                          <MessageSquare size={13} /> Chat with Patient
                        </button>
                        {appt.status === "confirmed" && (
                          <button onClick={() => decline(appt.id)} className="flex items-center gap-1.5 px-4 py-2 bg-red-50 dark:bg-red-950/20 text-red-600 text-xs font-bold rounded-xl hover:bg-red-100 transition">
                            <XCircle size={13} /> Cancel Appointment
                          </button>
                        )}
                      </div>
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
