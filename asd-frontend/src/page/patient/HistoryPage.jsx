import React from "react";
import { motion } from "framer-motion";
import { CalendarDays, FileText, MessageSquare, UploadCloud, BrainCircuit, CheckCircle2 } from "lucide-react";

const history = [
  {
    date: "October 2026",
    items: [
      { type: "appointment", text: "Appointment with Dr. Emily Johnson", sub: "Pediatric Neurology · City General", icon: <CalendarDays size={16} />, color: "text-blue-600 bg-blue-100 dark:bg-blue-950/60", time: "Oct 12, 10:30 AM" },
      { type: "report", text: "fMRI Report Uploaded", sub: "142 MB · Analyzed by AI", icon: <UploadCloud size={16} />, color: "text-emerald-600 bg-emerald-100 dark:bg-emerald-950/60", time: "Oct 10, 9:15 AM" },
    ]
  },
  {
    date: "September 2026",
    items: [
      { type: "ai", text: "AI Analysis Completed", sub: "Severity: Mild · 87% confidence", icon: <BrainCircuit size={16} />, color: "text-purple-600 bg-purple-100 dark:bg-purple-950/60", time: "Sep 28, 11:20 AM" },
      { type: "chat", text: "Message from Dr. Michael Chen", sub: '"Your results look promising..."', icon: <MessageSquare size={16} />, color: "text-indigo-600 bg-indigo-100 dark:bg-indigo-950/60", time: "Sep 22, 2:15 PM" },
      { type: "appointment", text: "Appointment with Dr. Sofia Rostova", sub: "Child Psychiatry · Mercy Medical", icon: <CalendarDays size={16} />, color: "text-blue-600 bg-blue-100 dark:bg-blue-950/60", time: "Sep 28, 11:00 AM", notes: "Doctor prescribed sensory therapy. Follow-up in 4 weeks." },
      { type: "report", text: "Blood Report Uploaded", sub: "0.8 MB PDF", icon: <FileText size={16} />, color: "text-orange-600 bg-orange-100 dark:bg-orange-950/60", time: "Sep 15, 3:40 PM" },
    ]
  },
  {
    date: "August 2026",
    items: [
      { type: "ai", text: "First AI Screening Complete", sub: "Initial evaluation · Mild ASD markers found", icon: <BrainCircuit size={16} />, color: "text-purple-600 bg-purple-100 dark:bg-purple-950/60", time: "Aug 20, 10:00 AM" },
    ]
  }
];

export default function HistoryPage() {
  return (
    <div className="p-5 lg:p-8 pb-24 md:pb-8 bg-gray-50 dark:bg-gray-950 min-h-full">
      <div>
        <div className="mb-6">
          <h1 className="text-2xl font-headline font-bold text-gray-900 dark:text-white mb-1">History</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm">Your complete health journey timeline</p>
        </div>

        {history.map((group, gi) => (
          <div key={gi} className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              <h2 className="font-headline font-bold text-gray-700 dark:text-gray-300 text-sm uppercase tracking-widest">{group.date}</h2>
              <div className="flex-1 h-[1px] bg-gray-200 dark:bg-gray-800" />
            </div>

            <div className="relative">
              <div className="absolute left-6 top-0 bottom-0 w-[2px] bg-gray-200 dark:bg-gray-800" />
              <div className="space-y-2">
                {group.items.map((item, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: (gi + i) * 0.06 }}
                    className="flex gap-4 items-start relative pl-2"
                  >
                    <div className={`w-10 h-10 rounded-full ${item.color} flex items-center justify-center shrink-0 z-10 border-2 border-white dark:border-gray-950`}>
                      {item.icon}
                    </div>
                    <div className="flex-1 bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 px-4 py-3 hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-semibold text-sm text-gray-900 dark:text-white">{item.text}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{item.sub}</p>
                          {item.notes && (
                            <div className="mt-2 p-2 bg-blue-50 dark:bg-blue-950/20 rounded-lg text-xs text-blue-700 dark:text-blue-300 flex items-start gap-1.5">
                              <CheckCircle2 size={12} className="mt-0.5 shrink-0" />
                              <span>Doctor note: {item.notes}</span>
                            </div>
                          )}
                        </div>
                        <span className="text-[10px] text-gray-400 whitespace-nowrap shrink-0">{item.time}</span>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
