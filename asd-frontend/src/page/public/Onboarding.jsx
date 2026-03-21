import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Sparkles, ArrowRight, Activity, MapPin, BrainCircuit } from 'lucide-react';

export default function Onboarding() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    relation: '',
    patientName: '',
    patientAge: '',
    concerns: [],
    location: ''
  });

  const handleToggleConcern = (concern) => {
    setFormData(prev => ({
      ...prev,
      concerns: prev.concerns.includes(concern) 
        ? prev.concerns.filter(c => c !== concern) 
        : [...prev.concerns, concern]
    }));
  };

  const handleFinish = () => {
    setLoading(true);
    setTimeout(() => {
      // Complete onboarding, jump to dashboard
      navigate('/patient/dashboard');
    }, 1200);
  };

  const currentStepData = {
    1: {
      title: "Let's personalize your experience.",
      desc: "Tell us a bit about who you're seeking diagnostics for.",
    },
    2: {
      title: "What are your primary concerns?",
      desc: "This helps our AI report explainer focus on what matters to you.",
    },
    3: {
      title: "Help us find nearby specialists.",
      desc: "We can connect you to top-rated clinics in your exact area.",
    }
  }[step];

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 font-sans relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-sky-500/20 rounded-full blur-[120px] pointer-events-none" />
      
      <div className="w-full max-w-xl relative py-8 z-10">
        
        {/* Progress Bar */}
        <div className="flex gap-2 mb-12">
          {[1,2,3].map(i => (
            <div key={i} className="flex-1 h-1.5 rounded-full bg-white/10 overflow-hidden">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: step >= i ? '100%' : '0%' }}
                className="h-full bg-sky-500"
              />
            </div>
          ))}
        </div>

        {/* Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="bg-white/5 border border-white/10 rounded-3xl p-8 backdrop-blur-xl"
          >
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-sky-400 to-indigo-500 flex items-center justify-center text-white mb-6 shadow-lg shadow-sky-500/20">
              {step === 1 && <UserIcon />}
              {step === 2 && <BrainCircuit />}
              {step === 3 && <MapPin />}
            </div>

            <h1 className="text-2xl font-bold text-white mb-2">{currentStepData.title}</h1>
            <p className="text-slate-400 text-sm mb-8">{currentStepData.desc}</p>

            {/* STEP 1: Basic Info */}
            {step === 1 && (
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-slate-400 mb-1.5 block">I am the...</label>
                  <select 
                    value={formData.relation}
                    onChange={(e) => setFormData({...formData, relation: e.target.value})}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 appearance-none"
                  >
                    <option value="" disabled className="text-slate-900">Select relation</option>
                    <option value="parent" className="text-slate-900">Parent / Guardian</option>
                    <option value="self" className="text-slate-900">Patient (Self)</option>
                    <option value="other" className="text-slate-900">Other Relative</option>
                  </select>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="col-span-2">
                    <label className="text-xs font-semibold text-slate-400 mb-1.5 block">Patient Name</label>
                    <input 
                      type="text" 
                      placeholder="e.g. Leo"
                      value={formData.patientName}
                      onChange={(e) => setFormData({...formData, patientName: e.target.value})}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-sky-500"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-400 mb-1.5 block">Age</label>
                    <input 
                      type="number" 
                      placeholder="Years"
                      value={formData.patientAge}
                      onChange={(e) => setFormData({...formData, patientAge: e.target.value})}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-sky-500"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* STEP 2: Concerns */}
            {step === 2 && (
              <div className="grid grid-cols-2 gap-3">
                {[
                  "Speech / Language Delay", 
                  "Repetitive Behaviors", 
                  "Social Interaction", 
                  "Sensory Sensitivity", 
                  "Eye Contact",
                  "Anxiety"
                ].map(concern => {
                  const isActive = formData.concerns.includes(concern);
                  return (
                    <button
                      key={concern}
                      onClick={() => handleToggleConcern(concern)}
                      className={`p-3 rounded-xl border text-left text-sm transition-all ${
                        isActive 
                          ? 'border-sky-500 bg-sky-500/10 text-white shadow-inner shadow-sky-500/20' 
                          : 'border-white/10 bg-white/5 text-slate-300 hover:bg-white/10'
                      }`}
                    >
                      {concern}
                    </button>
                  );
                })}
              </div>
            )}

            {/* STEP 3: Location */}
            {step === 3 && (
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-slate-400 mb-1.5 block">Zip Code or City</label>
                  <input 
                    type="text" 
                    placeholder="e.g. 10001 or New York"
                    value={formData.location}
                    onChange={(e) => setFormData({...formData, location: e.target.value})}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-sky-500"
                  />
                  <p className="text-xs text-emerald-400 mt-2 flex items-center gap-1">
                    <Sparkles size={12} /> Privacy guaranteed. We only use this for finding nearby specialists.
                  </p>
                </div>
              </div>
            )}

            {/* Navigation Footer */}
            <div className="mt-8 flex justify-between items-center pt-6 border-t border-white/10">
              <button 
                onClick={() => step > 1 && setStep(step - 1)}
                className={`text-sm text-slate-400 hover:text-white transition ${step === 1 ? 'opacity-0 pointer-events-none' : ''}`}
              >
                Back
              </button>
              
              {step < 3 ? (
                <button 
                  onClick={() => setStep(step + 1)}
                  disabled={step === 1 && (!formData.patientName || !formData.relation)}
                  className="px-6 py-2.5 rounded-xl bg-white text-slate-900 font-semibold text-sm hover:bg-slate-200 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  Continue <ArrowRight size={16} />
                </button>
              ) : (
                <button 
                  onClick={handleFinish}
                  disabled={loading || !formData.location}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-500 text-white font-semibold text-sm shadow-lg shadow-sky-500/20 active:scale-95 transition disabled:opacity-50 flex items-center gap-2"
                >
                  {loading ? (
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>Complete Setup <Sparkles size={16} /></>
                  )}
                </button>
              )}
            </div>

          </motion.div>
        </AnimatePresence>

      </div>
    </div>
  );
}

const UserIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
);
