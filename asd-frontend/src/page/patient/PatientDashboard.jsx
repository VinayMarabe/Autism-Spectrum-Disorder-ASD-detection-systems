import React, { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  CalendarDays, MessageSquare, UploadCloud, Hospital, BrainCircuit,
  Clock, MapPin, Star, ChevronRight, ArrowRight, Heart, Activity,
  FileText, Video, CheckCircle2, AlertCircle, Zap
} from "lucide-react";

const SkeletonCard = () => (
  <div className="bg-white dark:bg-gray-900 rounded-2xl p-5 animate-pulse">
    <div className="h-4 w-1/3 bg-gray-200 dark:bg-gray-700 rounded-full mb-3" />
    <div className="h-8 w-2/3 bg-gray-200 dark:bg-gray-700 rounded-full mb-4" />
    <div className="h-3 w-full bg-gray-100 dark:bg-gray-800 rounded-full" />
  </div>
);

export default function PatientDashboard() {
  const navigate = useNavigate();
  const [loading] = useState(false);

  const hospitals = [
    { id: 1, name: "City General Hospital", rating: 4.8, distance: "2.1 km", specialty: "Neurology", img: "https://images.unsplash.com/photo-1586773860418-d37222d8fce3?w=300&h=200&fit=crop" },
    { id: 2, name: "Apollo Neuro Center", rating: 4.9, distance: "3.5 km", specialty: "Pediatrics", img: "https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=300&h=200&fit=crop" },
    { id: 3, name: "Mercy Medical Hub", rating: 4.7, distance: "5.2 km", specialty: "Psychiatry", img: "https://images.unsplash.com/photo-1538108149393-fbbd81895907?w=300&h=200&fit=crop" },
    { id: 4, name: "St. Luke's Health", rating: 4.6, distance: "7.8 km", specialty: "Neurology", img: "https://images.unsplash.com/photo-1587351021759-3e566b3db4f1?w=300&h=200&fit=crop" },
  ];

  const timeline = [
    { text: "Report Uploaded", sub: "MRI Scan — Oct 10", icon: <UploadCloud size={14} />, color: "bg-blue-100 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400", time: "Today, 9:15 AM" },
    { text: "Doctor Messaged", sub: "Dr. Emily Johnson", icon: <MessageSquare size={14} />, color: "bg-emerald-100 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400", time: "Yesterday, 3:40 PM" },
    { text: "AI Analysis Complete", sub: "Severity: Mild", icon: <BrainCircuit size={14} />, color: "bg-purple-100 text-purple-600 dark:bg-purple-950/60 dark:text-purple-400", time: "Oct 8, 11:20 AM" },
    { text: "Appointment Scheduled", sub: "Dr. Chen — Oct 12", icon: <CalendarDays size={14} />, color: "bg-orange-100 text-orange-600 dark:bg-orange-950/60 dark:text-orange-400", time: "Oct 6, 2:10 PM" },
  ];

  const stagger = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };
  const item = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0, transition: { duration: 0.5 } } };

  if (loading) return (
    <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-4">
      {[1,2,3,4,5,6].map(i => <SkeletonCard key={i} />)}
    </div>
  );

  return (
    <motion.div
      variants={stagger}
      initial="hidden"
      animate="show"
      className="p-5 lg:p-8 space-y-6 pb-24 md:pb-8 bg-gray-50 dark:bg-gray-950 min-h-full"
    >
      {/* Greeting Banner */}
      <motion.div variants={item} className="relative overflow-hidden bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 rounded-3xl p-6 text-white shadow-xl shadow-blue-500/20">
        <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/10 rounded-full blur-xl" />
        <div className="absolute right-10 bottom-0 w-24 h-24 bg-blue-400/20 rounded-full blur-lg" />
        <div className="relative z-10">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-blue-200 text-sm font-medium mb-1">Good Morning 👋</p>
              <h1 className="text-3xl font-headline font-extrabold mb-3">Hello, Sarah!</h1>
              <p className="text-blue-200 text-sm leading-relaxed max-w-sm">Your next appointment is in <strong className="text-white">2 days</strong>. Stay on top of your health goals.</p>
            </div>
            <div className="text-right shrink-0 hidden sm:block">
              <div className="bg-white/15 backdrop-blur-sm rounded-2xl p-3 text-center border border-white/20">
                <p className="text-2xl font-bold">87%</p>
                <p className="text-xs text-blue-200">Profile Complete</p>
              </div>
            </div>
          </div>
          <div className="flex gap-3 mt-5 flex-wrap">
            {[
              { icon: <Heart size={14} />, label: "Heart: 72 bpm", color: "text-rose-300" },
              { icon: <Activity size={14} />, label: "Wellness: Good", color: "text-emerald-300" },
            ].map((s, i) => (
              <div key={i} className="flex items-center gap-1.5 bg-white/10 border border-white/20 rounded-full px-3 py-1.5 text-xs font-medium">
                <span className={s.color}>{s.icon}</span> {s.label}
              </div>
            ))}
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 space-y-6">

          {/* Upcoming Appointment */}
          <motion.div variants={item}>
            <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">Upcoming Appointment</h2>
            <div className="bg-white dark:bg-gray-900 rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-gray-800 hover:shadow-lg hover:shadow-blue-500/5 transition-all">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div className="flex gap-4 items-start">
                  <img
                    src="https://api.dicebear.com/7.x/notionists/svg?seed=Emily&backgroundColor=dbeafe"
                    alt="Dr. Emily"
                    className="w-14 h-14 rounded-2xl border-2 border-blue-100"
                  />
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse inline-block" /> Confirmed
                      </span>
                    </div>
                    <h3 className="font-headline font-bold text-gray-900 dark:text-white text-lg">Dr. Emily Johnson</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Pediatric Neurologist</p>
                  </div>
                </div>
                <div className="flex flex-col gap-1 text-sm text-gray-600 dark:text-gray-300">
                  <div className="flex items-center gap-1.5"><CalendarDays size={14} className="text-blue-500" /><span>October 12, 2026</span></div>
                  <div className="flex items-center gap-1.5"><Clock size={14} className="text-blue-500" /><span>10:30 AM — 11:00 AM</span></div>
                  <div className="flex items-center gap-1.5"><MapPin size={14} className="text-blue-500" /><span>City General, Room 204</span></div>
                </div>
              </div>
              <div className="mt-4 flex gap-3 flex-wrap">
                <button className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl font-semibold text-sm shadow-md shadow-blue-500/20 hover:shadow-lg hover:scale-[1.02] active:scale-95 transition-all">
                  <Video size={16} /> Join Video Call
                </button>
                <button className="flex items-center gap-2 px-5 py-2.5 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-xl font-semibold text-sm hover:bg-gray-200 dark:hover:bg-gray-700 transition-all">
                  Reschedule
                </button>
              </div>
            </div>
          </motion.div>

          {/* Quick Actions */}
          <motion.div variants={item}>
            <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">Quick Actions</h2>
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: "Book Appointment", icon: <CalendarDays size={24} />, color: "from-blue-500 to-blue-700", route: "/patient/appointments", bg: "bg-blue-50 dark:bg-blue-950/30", text: "text-blue-600 dark:text-blue-400", border: "border-blue-100 dark:border-blue-900" },
                { label: "Upload Report", icon: <UploadCloud size={24} />, color: "from-emerald-500 to-teal-600", route: "/patient/reports", bg: "bg-emerald-50 dark:bg-emerald-950/30", text: "text-emerald-600 dark:text-emerald-400", border: "border-emerald-100 dark:border-emerald-900" },
                { label: "Chat Doctor", icon: <MessageSquare size={24} />, color: "from-purple-500 to-indigo-600", route: "/patient/chat", bg: "bg-purple-50 dark:bg-purple-950/30", text: "text-purple-600 dark:text-purple-400", border: "border-purple-100 dark:border-purple-900" },
              ].map((a, i) => (
                <motion.button
                  key={i}
                  whileHover={{ y: -4 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => navigate(a.route)}
                  className={`flex flex-col items-center gap-2.5 p-4 ${a.bg} border ${a.border} rounded-2xl hover:shadow-md transition-all`}
                >
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${a.color} flex items-center justify-center text-white shadow-md`}>
                    {a.icon}
                  </div>
                  <span className={`text-xs font-semibold ${a.text} text-center leading-tight`}>{a.label}</span>
                </motion.button>
              ))}
            </div>
          </motion.div>

          {/* Nearby Hospitals */}
          <motion.div variants={item}>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Nearby Hospitals</h2>
              <button onClick={() => navigate('/patient/hospitals')} className="text-xs font-semibold text-blue-600 hover:underline flex items-center gap-1">
                View All <ChevronRight size={14} />
              </button>
            </div>
            <div className="flex gap-4 overflow-x-auto pb-2 -mx-1 px-1 scrollbar-hide">
              {hospitals.map((h) => (
                <div
                  key={h.id}
                  className="min-w-[200px] bg-white dark:bg-gray-900 rounded-2xl overflow-hidden border border-gray-100 dark:border-gray-800 hover:shadow-lg hover:border-blue-200 dark:hover:border-blue-800 transition-all group shrink-0"
                >
                  <img src={h.img} alt={h.name} className="w-full h-28 object-cover group-hover:scale-105 transition-transform duration-500" />
                  <div className="p-3">
                    <p className="font-semibold text-sm text-gray-900 dark:text-white truncate">{h.name}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">{h.specialty}</p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1">
                        <Star size={12} className="text-amber-400 fill-amber-400" />
                        <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">{h.rating}</span>
                      </div>
                      <span className="text-xs text-gray-400 flex items-center gap-1"><MapPin size={10} /> {h.distance}</span>
                    </div>
                    <button
                      onClick={() => navigate('/patient/appointments')}
                      className="mt-2 w-full px-3 py-1.5 text-xs font-semibold text-blue-600 bg-blue-50 dark:bg-blue-950/40 hover:bg-blue-600 hover:text-white rounded-lg transition-all"
                    >
                      Book Now
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        <div className="space-y-6">
          {/* AI Health Insights */}
          <motion.div variants={item}>
            <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">AI Health Insights</h2>
            <div className="bg-gradient-to-br from-indigo-600 via-purple-700 to-violet-800 rounded-2xl p-5 text-white shadow-xl shadow-purple-500/20">
              <div className="flex items-center gap-2 mb-3">
                <Zap size={18} className="text-yellow-300" />
                <span className="text-sm font-bold text-purple-200">AI Recommendations</span>
              </div>
              <h3 className="text-lg font-headline font-bold mb-2">Your Health Summary</h3>
              <div className="space-y-2.5">
                {[
                  { text: "Consistent sleep schedule improving cognitive patterns", icon: <CheckCircle2 size={13} /> },
                  { text: "Behavioral markers stable — continue current plan", icon: <CheckCircle2 size={13} /> },
                  { text: "Schedule sensory integration session this week", icon: <AlertCircle size={13} className="text-yellow-300" /> },
                ].map((ins, i) => (
                  <div key={i} className="flex items-start gap-2.5 text-sm text-purple-100">
                    <span className="shrink-0 mt-0.5 text-emerald-300">{ins.icon}</span>
                    <p>{ins.text}</p>
                  </div>
                ))}
              </div>
              <button
                onClick={() => navigate('/patient/ai-analysis')}
                className="mt-4 flex items-center gap-1.5 text-xs font-bold text-purple-200 hover:text-white transition-colors"
              >
                Full AI Report <ArrowRight size={14} />
              </button>
            </div>
          </motion.div>

          {/* Recent Activity */}
          <motion.div variants={item}>
            <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">Recent Activity</h2>
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden">
              <div className="divide-y divide-gray-50 dark:divide-gray-800">
                {timeline.map((t, i) => (
                  <div key={i} className="flex items-start gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                    <div className={`w-7 h-7 rounded-full ${t.color} flex items-center justify-center shrink-0 mt-0.5`}>
                      {t.icon}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{t.text}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{t.sub}</p>
                    </div>
                    <span className="text-[10px] text-gray-400 whitespace-nowrap shrink-0">{t.time}</span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}
