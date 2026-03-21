import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Activity, Mail, Lock, Stethoscope, UserRound, Shield, Brain } from "lucide-react";
import { useAuth } from "../../context/AuthContext";

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [role, setRole] = useState("doctor");
  const [loading, setLoading] = useState(false);

  const handleMockLogin = (e) => {
    e.preventDefault();
    setLoading(true);
    // Simulate network delay for premium feel
    setTimeout(() => {
      login(role, { 
        name: role === "doctor" ? "Dr. Admin" : "Jane Doe", 
        id: role === "doctor" ? "D-550" : "P-1001",
        email: "demo@neurolens.ai"
      });
      if (role === "admin") navigate("/admin/dashboard");
      else if (role === "doctor") navigate("/doctor/dashboard");
      else navigate("/patient/dashboard");
    }, 800);
  };

  return (
    <div className="min-h-screen flex bg-slate-50 font-sans">
      
      {/* Left Pane - Auth Form */}
      <div className="w-full md:w-[450px] lg:w-[500px] bg-white flex flex-col justify-center px-8 sm:px-12 py-12 relative z-10 shadow-2xl shadow-slate-200/50">
        
        <Link to="/" className="absolute top-8 left-8 flex items-center gap-2 group">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-sky-500 to-emerald-400 flex items-center justify-center text-white">
            <Activity size={18} />
          </div>
          <span className="font-bold text-xl text-slate-800 tracking-tight group-hover:text-sky-600 transition">NeuroLens</span>
        </Link>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mt-12">
          <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight mb-2">Welcome Back</h2>
          <p className="text-slate-500 mb-8">Please select your portal role and enter your details to sign in.</p>
          
          <form onSubmit={handleMockLogin} className="space-y-6">
            
            {/* Role Toggle */}
            <div className="p-1.5 bg-slate-100 rounded-xl flex gap-1 items-center justify-between border border-slate-200/50">
              <button
                type="button"
                onClick={() => setRole("patient")}
                className={`flex-1 py-2.5 rounded-lg flex items-center justify-center gap-1.5 text-xs sm:text-sm font-semibold transition-all duration-300 ${
                  role === "patient" ? "bg-white text-emerald-600 shadow-sm" : "text-slate-500 hover:text-slate-800"
                }`}
              >
                <UserRound size={16} /> Patient
              </button>
              <button
                type="button"
                onClick={() => setRole("doctor")}
                className={`flex-1 py-2.5 rounded-lg flex items-center justify-center gap-1.5 text-xs sm:text-sm font-semibold transition-all duration-300 ${
                  role === "doctor" ? "bg-white text-sky-600 shadow-sm" : "text-slate-500 hover:text-slate-800"
                }`}
              >
                <Stethoscope size={16} /> Doctor
              </button>
              <button
                type="button"
                onClick={() => setRole("admin")}
                className={`flex-1 py-2.5 rounded-lg flex items-center justify-center gap-1.5 text-xs sm:text-sm font-semibold transition-all duration-300 ${
                  role === "admin" ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500 hover:text-slate-800"
                }`}
              >
                <Shield size={16} /> Admin
              </button>
            </div>

            {/* Inputs */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Email Address</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail size={18} className="text-slate-400" />
                  </div>
                  <input type="email" required disabled={loading} defaultValue="demo@neurolens.ai"
                    className="block w-full pl-10 pr-3 py-3 border border-slate-200 rounded-xl focus:ring-sky-500 focus:border-sky-500 bg-slate-50 focus:bg-white transition-colors disabled:opacity-50" />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-sm font-medium text-slate-700">Password</label>
                  <span className="text-xs font-medium text-sky-600 hover:text-sky-500 cursor-pointer">Forgot?</span>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock size={18} className="text-slate-400" />
                  </div>
                  <input type="password" required disabled={loading} defaultValue="password123"
                    className="block w-full pl-10 pr-3 py-3 border border-slate-200 rounded-xl focus:ring-sky-500 focus:border-sky-500 bg-slate-50 focus:bg-white transition-colors disabled:opacity-50" />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center items-center gap-2 py-3.5 px-4 border border-transparent rounded-xl shadow-lg shadow-sky-500/20 text-sm font-bold text-white bg-slate-900 hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-900 transition-all disabled:opacity-80"
            >
              {loading ? (
                <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}>
                  <Activity size={20} />
                </motion.div>
              ) : (
                "Sign In Securely"
              )}
            </button>
            
            <p className="text-center text-sm text-slate-500 mt-6">
              Don't have an account? <Link to="/signup" className="font-semibold text-sky-600 hover:text-sky-500">Create one</Link>
            </p>
          </form>
        </motion.div>
      </div>

      {/* Right Pane - Visual Illustration */}
      <div className="hidden md:flex flex-1 relative bg-slate-900 overflow-hidden items-center justify-center">
        {/* Glows */}
        <div className="absolute w-[800px] h-[800px] bg-sky-500/20 rounded-full blur-[120px] mix-blend-screen" />
        <div className="absolute w-[600px] h-[600px] bg-emerald-500/20 rounded-full blur-[120px] top-10 right-10 mix-blend-screen" />
        
        <div className="relative z-10 text-center px-12 max-w-2xl">
          <div className="inline-flex items-center justify-center p-4 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-xl mb-8">
            <Brain size={64} className="text-sky-400" />
          </div>
          <h2 className="text-4xl font-extrabold text-white mb-6 leading-tight">Objective Diagnostic Clarity.</h2>
          <p className="text-lg text-slate-400 leading-relaxed">
            Join the NeuroLens network to leverage multi-modal AI analytics on functional MRI data, significantly expediting accurate ASD determinations.
          </p>
        </div>
        
        {/* Abstract grids / aesthetics */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:64px_64px]" />
      </div>

    </div>
  );
}
