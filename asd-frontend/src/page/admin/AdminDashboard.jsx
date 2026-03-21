import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Users, FileText, CalendarCheck, CheckCircle2, XCircle } from 'lucide-react';

const StatCard = ({ title, value, icon: Icon, colorClass, delay }) => (
  <motion.div 
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay }}
    whileHover={{ y: -4 }}
    className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm hover:shadow-xl transition-all relative overflow-hidden"
  >
    <div className={`absolute top-0 right-0 w-32 h-32 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 ${colorClass}`} />
    <div className="flex items-start justify-between relative z-10">
      <div>
        <p className="text-sm font-medium text-slate-500">{title}</p>
        <p className="mt-2 text-3xl font-bold text-slate-900">{value}</p>
      </div>
      <div className="p-3 bg-slate-50 rounded-2xl">
        <Icon size={24} className="text-slate-700" />
      </div>
    </div>
  </motion.div>
);

export default function AdminDashboard() {
  const [doctors, setDoctors] = useState([
    { id: 1, name: 'Dr. Sarah Jenkins', specialty: 'Neurologist', status: 'pending', date: 'Oct 12, 2026' },
    { id: 2, name: 'Dr. Marcus Chen', specialty: 'Pediatric specialist', status: 'approved', date: 'Oct 10, 2026' },
    { id: 3, name: 'Dr. Emily Watson', specialty: 'Psychiatrist', status: 'approved', date: 'Oct 08, 2026' },
  ]);

  const handleApprove = (id) => {
    setDoctors(docs => docs.map(d => d.id === id ? { ...d, status: 'approved' } : d));
  };

  const handleReject = (id) => {
    setDoctors(docs => docs.map(d => d.id === id ? { ...d, status: 'rejected' } : d));
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <StatCard title="Total Users" value="1,248" icon={Users} colorClass="bg-sky-400/10" delay={0.1} />
        <StatCard title="Total Reports" value="8,492" icon={FileText} colorClass="bg-indigo-400/10" delay={0.2} />
        <StatCard title="Active Appointments" value="156" icon={CalendarCheck} colorClass="bg-emerald-400/10" delay={0.3} />
      </div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.4 }}
        className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden"
      >
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-800">Doctor Approvals</h2>
          <span className="text-xs font-medium bg-slate-100 text-slate-600 px-3 py-1 rounded-full">Requires attention</span>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left text-slate-600">
            <thead className="bg-slate-50/50 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-6 py-4 font-semibold">Doctor Info</th>
                <th className="px-6 py-4 font-semibold">Date Applied</th>
                <th className="px-6 py-4 font-semibold">Status</th>
                <th className="px-6 py-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {doctors.map(doc => (
                <tr key={doc.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-medium text-slate-900">{doc.name}</div>
                    <div className="text-xs text-slate-500 mt-0.5">{doc.specialty}</div>
                  </td>
                  <td className="px-6 py-4 text-slate-500">{doc.date}</td>
                  <td className="px-6 py-4">
                    {doc.status === 'pending' && <span className="inline-flex items-center px-2 py-1 rounded-md bg-amber-50 text-amber-700 text-xs font-semibold">Pending</span>}
                    {doc.status === 'approved' && <span className="inline-flex items-center px-2 py-1 rounded-md bg-emerald-50 text-emerald-700 text-xs font-semibold">Approved</span>}
                    {doc.status === 'rejected' && <span className="inline-flex items-center px-2 py-1 rounded-md bg-rose-50 text-rose-700 text-xs font-semibold">Rejected</span>}
                  </td>
                  <td className="px-6 py-4 text-right">
                    {doc.status === 'pending' && (
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => handleApprove(doc.id)} className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors" title="Approve">
                          <CheckCircle2 size={18} />
                        </button>
                        <button onClick={() => handleReject(doc.id)} className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors" title="Reject">
                          <XCircle size={18} />
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {doctors.length === 0 && (
            <div className="p-8 text-center text-slate-500 text-sm">No applications pending.</div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
