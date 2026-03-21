import React from "react";
import { Outlet, NavLink } from "react-router-dom";
import { Activity } from "lucide-react";

export default function PublicLayout() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <nav className="w-full bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-sky-500 to-emerald-400 flex items-center justify-center text-white">
                <Activity size={18} />
              </div>
              <span className="font-bold text-xl text-slate-800 tracking-tight">NeuroLens AI</span>
            </div>
            <div className="hidden md:flex gap-6 items-center">
              <NavLink to="/" className="text-sm font-medium text-slate-600 hover:text-sky-600 transition">Home</NavLink>
              <NavLink to="/login" className="text-sm font-medium text-slate-600 hover:text-sky-600 transition">Log In</NavLink>
              <NavLink to="/signup" className="text-sm font-semibold bg-sky-600 text-white px-4 py-2 rounded-full hover:bg-sky-700 hover:shadow-md transition">Sign Up</NavLink>
            </div>
          </div>
        </div>
      </nav>
      <main className="flex-1 flex flex-col">
        <Outlet />
      </main>
    </div>
  );
}
