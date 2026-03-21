import React, { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { getPatients, getActivePatient } from "../../utils/storage";
import { useActivePatient } from "../../context/ActivePatientContext";
import {
  Users, CalendarDays, BrainCircuit, MessageSquare, ClipboardList,
  TrendingUp, Clock, ArrowRight, Activity, ChevronRight, UserRound,
  Star, AlertCircle, CheckCircle2, Zap
} from "lucide-react";

function timeAgo(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const diff = Math.floor((Date.now() - d.getTime()) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

const mockAppointments = [
  { id: 1, patient: "Sarah Johnson", type: "Follow-up", time: "10:30 AM", status: "confirmed", avatar: "https://api.dicebear.com/7.x/notionists/svg?seed=Sarah&backgroundColor=dbeafe" },
  { id: 2, patient: "Alex Martinez", type: "First Visit", time: "11:15 AM", status: "pending", avatar: "https://api.dicebear.com/7.x/notionists/svg?seed=Alex&backgroundColor=dcfce7" },
  { id: 3, patient: "Priya Sharma", type: "AI Review", time: "02:00 PM", status: "confirmed", avatar: "https://api.dicebear.com/7.x/notionists/svg?seed=Priya&backgroundColor=fce7f3" },
];

const mockMessages = [
  { id: 1, patient: "Sarah Johnson", msg: "I had a question about my MRI results...", time: "5m", unread: true },
  { id: 2, patient: "Alex Martinez", msg: "Thank you for the prescription, doctor.", time: "1h", unread: false },
];

export default function DoctorDashboard() {
  const navigate = useNavigate();
  const { patients: ctxPatients } = useActivePatient();
  const patients = useMemo(() => {
    if (Array.isArray(ctxPatients) && ctxPatients.length > 0) return ctxPatients;
    const stored = getPatients();
    return Array.isArray(stored) ? stored : [];
  }, [ctxPatients]);

  const screenings = useMemo(() => {
    const all = [];
    patients.forEach(p => { if (Array.isArray(p.history)) all.push(...p.history.map(h => ({ ...h, patientName: p.name }))); });
    return all.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
  }, [patients]);

  const stagger = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.1 } } };
  const item = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0, transition: { duration: 0.5 } } };

  const stats = [
    { label: "Total Patients", value: patients.length || 12, icon: <Users size={20} />, color: "from-emerald-500 to-teal-700", bg: "bg-emerald-50 dark:bg-emerald-950/30", textColor: "text-emerald-600", trend: "+2 this week" },
    { label: "AI Screenings", value: screenings.length || 28, icon: <BrainCircuit size={20} />, color: "from-purple-500 to-violet-700", bg: "bg-purple-50 dark:bg-purple-950/30", textColor: "text-purple-600", trend: "+5 this week" },
    { label: "Appointments Today", value: mockAppointments.length, icon: <CalendarDays size={20} />, color: "from-emerald-500 to-teal-700", bg: "bg-emerald-50 dark:bg-emerald-950/30", textColor: "text-emerald-600", trend: "3 confirmed" },
    { label: "Unread Messages", value: mockMessages.filter(m => m.unread).length, icon: <MessageSquare size={20} />, color: "from-orange-400 to-rose-600", bg: "bg-orange-50 dark:bg-orange-950/30", textColor: "text-orange-600", trend: "Reply pending" },
  ];

  return (
    <motion.div variants={stagger} initial="hidden" animate="show" className="p-5 lg:p-8 space-y-6 pb-8 bg-gray-50 dark:bg-gray-950 min-h-full">

      {/* Welcome Banner */}
      <motion.div variants={item} className="relative overflow-hidden bg-gradient-to-br from-emerald-600 via-teal-700 to-cyan-800 rounded-3xl p-6 text-white shadow-xl shadow-emerald-500/20">
        <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/10 rounded-full blur-xl" />
        <div className="absolute right-10 bottom-0 w-24 h-24 bg-emerald-400/20 rounded-full blur-lg" />
        <div className="relative z-10 flex items-start justify-between gap-4">
          <div>
            <p className="text-emerald-200 text-sm font-medium mb-1">Good Morning 👨‍⚕️</p>
            <h1 className="text-3xl font-headline font-extrabold mb-2">Dr. Alex Smith</h1>
            <p className="text-emerald-200 text-sm">You have <strong className="text-white">{mockAppointments.length} appointments</strong> and <strong className="text-white">{mockMessages.filter(m=>m.unread).length} unread messages</strong> today.</p>
          </div>
          <div className="hidden sm:flex gap-3 shrink-0">
            <div className="bg-white/15 backdrop-blur-sm rounded-2xl p-3 text-center border border-white/20">
              <p className="text-2xl font-bold">{patients.length || 12}</p>
              <p className="text-xs text-emerald-200">Patients</p>
            </div>
            <div className="bg-white/15 backdrop-blur-sm rounded-2xl p-3 text-center border border-white/20">
              <p className="text-2xl font-bold">{screenings.length || 28}</p>
              <p className="text-xs text-emerald-200">Screenings</p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Stats Grid */}
      <motion.div variants={item} className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s, i) => (
          <div key={i} className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-4 hover:shadow-lg hover:shadow-gray-900/5 transition-all">
            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${s.color} flex items-center justify-center text-white mb-3 shadow-md`}>
              {s.icon}
            </div>
            <p className="text-2xl font-headline font-bold text-gray-900 dark:text-white">{s.value}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{s.label}</p>
            <p className={`text-xs font-semibold mt-2 ${s.textColor}`}>{s.trend}</p>
          </div>
        ))}
      </motion.div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 space-y-6">

          {/* Today's Appointments */}
          <motion.div variants={item}>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Today's Appointments</h2>
              <button onClick={() => navigate('/doctor/appointments')} className="text-xs font-semibold text-emerald-600 hover:underline flex items-center gap-1">View All <ChevronRight size={14} /></button>
            </div>
            <div className="space-y-3">
              {mockAppointments.map((a, i) => (
                <div key={a.id} className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 px-5 py-4 flex items-center gap-4 hover:shadow-md transition-all">
                  <img src={a.avatar} alt={a.patient} className="w-12 h-12 rounded-2xl border-2 border-gray-100 dark:border-gray-700 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 dark:text-white">{a.patient}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{a.type} · {a.time}</p>
                  </div>
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-full shrink-0 ${a.status === 'confirmed' ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600' : 'bg-amber-50 dark:bg-amber-950/30 text-amber-600'}`}>
                    {a.status === 'confirmed' ? '✓ Confirmed' : '⏳ Pending'}
                  </span>
                  <button onClick={() => navigate('/doctor/chat')} className="p-2 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/20 rounded-xl transition shrink-0">
                    <MessageSquare size={16} />
                  </button>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Recent Patients */}
          <motion.div variants={item}>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Recent Patients</h2>
              <button onClick={() => navigate('/doctor/patients')} className="text-xs font-semibold text-emerald-600 hover:underline flex items-center gap-1">View All <ChevronRight size={14} /></button>
            </div>
            {patients.length > 0 ? (
              <div className="space-y-2">
                {patients.slice(0, 4).map((p, i) => (
                  <div key={p.id || i} className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 px-5 py-3.5 flex items-center gap-4 hover:shadow-md transition-all">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white font-bold shrink-0">
                      {(p.name || "?")[0].toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm text-gray-900 dark:text-white truncate">{p.name || "Unknown"}</p>
                      <p className="text-xs text-gray-400">Age: {p.age || "—"} · ID: {p.id}</p>
                    </div>
                    <span className="text-xs text-gray-400 shrink-0 hidden sm:block">{timeAgo(p.updatedAt)}</span>
                    <button onClick={() => navigate('/doctor/patients')} className="p-2 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/20 rounded-xl transition"><ArrowRight size={15} /></button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-8 text-center">
                <Users size={32} className="text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                <p className="font-semibold text-gray-500 dark:text-gray-400">No patients yet</p>
                <button onClick={() => navigate('/doctor/patient-form')} className="mt-3 px-4 py-2 bg-emerald-600 text-white rounded-xl text-sm font-bold hover:bg-emerald-700 transition">
                  Add First Patient
                </button>
              </div>
            )}
          </motion.div>
        </div>

        <div className="space-y-6">
          {/* AI Insights Card */}
          <motion.div variants={item}>
            <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">Clinical AI Insights</h2>
            <div className="bg-gradient-to-br from-violet-600 via-purple-700 to-indigo-800 rounded-2xl p-5 text-white shadow-xl shadow-purple-500/20">
              <div className="flex items-center gap-2 mb-3"><Zap size={18} className="text-yellow-300" /><span className="text-sm font-bold text-purple-200">AI Summary</span></div>
              <div className="space-y-3">
                {[
                  { text: `${screenings.length || 0} AI screenings run this month`, icon: <CheckCircle2 size={13} className="text-emerald-300" /> },
                  { text: "Behavioral pattern analysis updated", icon: <CheckCircle2 size={13} className="text-emerald-300" /> },
                  { text: "2 patients need follow-up reviews", icon: <AlertCircle size={13} className="text-yellow-300" /> },
                ].map((ins, i) => (
                  <div key={i} className="flex items-start gap-2.5 text-sm text-purple-100">
                    <span className="shrink-0 mt-0.5">{ins.icon}</span><p>{ins.text}</p>
                  </div>
                ))}
              </div>
              <button onClick={() => navigate('/doctor/detection')} className="mt-4 flex items-center gap-1.5 text-xs font-bold text-purple-200 hover:text-white transition">
                Run Detection <ArrowRight size={14} />
              </button>
            </div>
          </motion.div>

          {/* Patient Messages */}
          <motion.div variants={item}>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Patient Messages</h2>
              <button onClick={() => navigate('/doctor/chat')} className="text-xs font-semibold text-emerald-600 hover:underline">Open Chat</button>
            </div>
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden">
              {mockMessages.map((m, i) => (
                <div key={m.id} onClick={() => navigate('/doctor/chat')} className={`flex items-start gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition ${m.unread ? 'bg-emerald-50/30 dark:bg-emerald-950/10' : ''} ${i > 0 ? 'border-t border-gray-50 dark:border-gray-800' : ''}`}>
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white text-xs font-bold shrink-0">{m.patient[0]}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className={`text-sm ${m.unread ? 'font-bold text-gray-900 dark:text-white' : 'font-medium text-gray-700 dark:text-gray-300'}`}>{m.patient}</p>
                      <span className="text-[10px] text-gray-400">{m.time}</span>
                    </div>
                    <p className="text-xs text-gray-500 truncate">{m.msg}</p>
                  </div>
                  {m.unread && <span className="w-2 h-2 bg-emerald-500 rounded-full shrink-0 mt-1" />}
                </div>
              ))}
            </div>
          </motion.div>

          {/* Recent Activity */}
          <motion.div variants={item}>
            <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">Recent Screenings</h2>
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden">
              {screenings.length > 0 ? screenings.slice(0, 3).map((s, i) => (
                <div key={i} className={`px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800 transition ${i > 0 ? 'border-t border-gray-50 dark:border-gray-800' : ''}`}>
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">{s.patientName || "Patient"}</p>
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${s.predicted_class === 'ASD' ? 'bg-orange-50 text-orange-600' : 'bg-emerald-50 text-emerald-600'}`}>
                      {s.predicted_class || "Pending"}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5">{timeAgo(s.createdAt)}</p>
                </div>
              )) : (
                <div className="px-4 py-6 text-center text-sm text-gray-400">No screenings yet</div>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}
