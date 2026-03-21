import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Activity, Mail, Lock, User, Building, Stethoscope, UserRound } from "lucide-react";

export default function Signup() {
  const navigate = useNavigate();
  const [role, setRole] = useState("patient");
  const [loading, setLoading] = useState(false);

  const handleSignup = (e) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      // Direct registration to login for demo flow
      navigate("/login");
    }, 800);
  };

  return (
    <div className="min-h-screen flex bg-slate-50 font-sans">
      
      {/* Left Pane - Auth Form */}
      <div className="w-full md:w-[450px] lg:w-[500px] bg-white flex flex-col justify-center px-8 sm:px-12 py-12 relative z-10 shadow-2xl shadow-slate-200/50 overflow-y-auto">
        
        <Link to="/" className="absolute top-8 left-8 flex items-center gap-2 group">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-sky-500 to-emerald-400 flex items-center justify-center text-white">
            <Activity size={18} />
          </div>
          <span className="font-bold text-xl text-slate-800 tracking-tight group-hover:text-sky-600 transition">NeuroLens</span>
        </Link>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mt-16">
          <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight mb-2">Create Account</h2>
          <p className="text-slate-500 mb-8">Join the platform to access AI-powered diagnostic tools.</p>
          
          <form onSubmit={handleSignup} className="space-y-5">
            
            {/* Role Toggle */}
            <div className="p-1.5 bg-slate-100 rounded-xl flex gap-1 items-center justify-between border border-slate-200/50 mb-6">
              <button
                type="button"
                onClick={() => setRole("patient")}
                className={`flex-1 py-2.5 rounded-lg flex items-center justify-center gap-2 text-sm font-semibold transition-all duration-300 ${
                  role === "patient" ? "bg-white text-emerald-600 shadow-sm" : "text-slate-500 hover:text-slate-800"
                }`}
              >
                <UserRound size={16} /> Patient
              </button>
              <button
                type="button"
                onClick={() => setRole("doctor")}
                className={`flex-1 py-2.5 rounded-lg flex items-center justify-center gap-2 text-sm font-semibold transition-all duration-300 ${
                  role === "doctor" ? "bg-white text-sky-600 shadow-sm" : "text-slate-500 hover:text-slate-800"
                }`}
              >
                <Stethoscope size={16} /> Doctor
              </button>
            </div>

            {/* Inputs */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User size={18} className="text-slate-400" />
                </div>
                <input type="text" required placeholder="John Doe"
                  className="block w-full pl-10 pr-3 py-3 border border-slate-200 rounded-xl focus:ring-sky-500 focus:border-sky-500 bg-slate-50 focus:bg-white transition-colors" />
              </div>
            </div>

            {role === 'doctor' && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}>
                <label className="block text-sm font-medium text-slate-700 mb-1">Hospital / Clinic Name</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Building size={18} className="text-slate-400" />
                  </div>
                  <input type="text" required placeholder="General Hospital"
                    className="block w-full pl-10 pr-3 py-3 border border-slate-200 rounded-xl focus:ring-sky-500 focus:border-sky-500 bg-slate-50 focus:bg-white transition-colors" />
                </div>
              </motion.div>
            )}

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Email Address</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail size={18} className="text-slate-400" />
                </div>
                <input type="email" required placeholder="you@example.com"
                  className="block w-full pl-10 pr-3 py-3 border border-slate-200 rounded-xl focus:ring-sky-500 focus:border-sky-500 bg-slate-50 focus:bg-white transition-colors" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock size={18} className="text-slate-400" />
                </div>
                <input type="password" required placeholder="••••••••"
                  className="block w-full pl-10 pr-3 py-3 border border-slate-200 rounded-xl focus:ring-sky-500 focus:border-sky-500 bg-slate-50 focus:bg-white transition-colors" />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center items-center gap-2 py-3.5 px-4 mt-4 border border-transparent rounded-xl shadow-lg shadow-sky-500/20 text-sm font-bold text-white bg-slate-900 hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-900 transition-all disabled:opacity-80"
            >
               {loading ? "Creating Account..." : "Create Account"}
            </button>
            
            <p className="text-center text-sm text-slate-500 mt-6 pb-8">
              Already have an account? <Link to="/login" className="font-semibold text-sky-600 hover:text-sky-500">Sign in</Link>
            </p>
          </form>
        </motion.div>
      </div>

      {/* Right Pane Aesthetic matches Login */}
      <div className="hidden md:flex flex-1 relative bg-slate-900 overflow-hidden items-center justify-center">
        <div className="absolute w-[800px] h-[800px] bg-sky-500/20 rounded-full blur-[120px] mix-blend-screen" />
        <div className="absolute w-[600px] h-[600px] bg-emerald-500/20 rounded-full blur-[120px] bottom-10 left-10 mix-blend-screen" />
        
        <div className="relative z-10 text-center px-12 max-w-2xl">
          <div className="inline-flex items-center justify-center p-4 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-xl mb-8">
            <UserRound size={64} className="text-emerald-400" />
          </div>
          <h2 className="text-4xl font-extrabold text-white mb-6 leading-tight">Patient & Practitioner Unified.</h2>
          <p className="text-lg text-slate-400 leading-relaxed">
            Create an account to securely transmit medical imaging algorithms and access state-of-the-art reports with comprehensive analytics built natively into the platform.
          </p>
        </div>
        
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:64px_64px]" />
      </div>

    </div>
  );
}
