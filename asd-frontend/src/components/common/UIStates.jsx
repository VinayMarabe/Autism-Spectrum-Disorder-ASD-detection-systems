import React from 'react';
import { motion } from 'framer-motion';

export const SkeletonCard = ({ rows = 3, className = "" }) => (
  <div className={`bg-white rounded-3xl border border-slate-200 shadow-sm p-6 overflow-hidden relative ${className}`}>
    <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-slate-100/50 to-transparent" />
    <div className="w-12 h-12 bg-slate-100 rounded-full mb-4" />
    <div className="space-y-3">
      {Array(rows).fill(0).map((_, i) => (
        <div key={i} className={`h-4 bg-slate-100 rounded-lg ${i === 0 ? 'w-3/4' : (i === 1 ? 'w-full' : 'w-5/6')}`} />
      ))}
    </div>
  </div>
);

export const EmptyState = ({ icon: Icon, title, description, actionText, onAction }) => (
  <motion.div 
    initial={{ opacity: 0, scale: 0.95 }}
    animate={{ opacity: 1, scale: 1 }}
    className="w-full flex flex-col items-center justify-center py-16 px-4 text-center rounded-3xl border-2 border-dashed border-slate-200 bg-slate-50/50"
  >
    <div className="w-20 h-20 bg-white shadow-sm border border-slate-200 rounded-full flex items-center justify-center text-slate-400 mb-6 relative">
      <div className="absolute inset-0 bg-slate-100 rounded-full animate-ping opacity-20" />
      <Icon size={32} />
    </div>
    <h3 className="text-xl font-bold text-slate-900 mb-2">{title}</h3>
    <p className="text-sm text-slate-500 max-w-sm mb-8">{description}</p>
    {actionText && (
      <button 
        onClick={onAction}
        className="px-6 py-2.5 bg-slate-900 text-white rounded-xl font-semibold shadow-md active:scale-95 transition"
      >
        {actionText}
      </button>
    )}
  </motion.div>
);
