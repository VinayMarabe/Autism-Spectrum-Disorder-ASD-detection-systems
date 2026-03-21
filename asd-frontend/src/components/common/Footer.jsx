import React from 'react';
import { Activity, Twitter, Linkedin, Github } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="bg-slate-950 text-slate-400 py-16 font-sans border-t border-slate-900 mt-auto">
      <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-12">
        
        {/* Brand */}
        <div className="col-span-1 md:col-span-1">
          <Link to="/" className="flex items-center gap-2 mb-4 group inline-flex">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-sky-500 to-emerald-400 flex items-center justify-center text-white">
              <Activity size={18} />
            </div>
            <span className="font-bold text-xl text-white tracking-tight group-hover:text-sky-400 transition">NeuroLens AI</span>
          </Link>
          <p className="text-sm text-slate-500 leading-relaxed mb-6">
            Pioneering objective clarity in ASD diagnostics using functional MRI and advanced machine learning modeling.
          </p>
          <div className="flex gap-4">
            <a href="#" className="w-8 h-8 rounded-full bg-slate-900 flex items-center justify-center hover:bg-sky-500 hover:text-white transition-colors">
              <Twitter size={14} />
            </a>
            <a href="#" className="w-8 h-8 rounded-full bg-slate-900 flex items-center justify-center hover:bg-sky-500 hover:text-white transition-colors">
              <Linkedin size={14} />
            </a>
            <a href="#" className="w-8 h-8 rounded-full bg-slate-900 flex items-center justify-center hover:bg-slate-700 hover:text-white transition-colors">
              <Github size={14} />
            </a>
          </div>
        </div>

        {/* Links */}
        <div>
          <h4 className="text-white font-semibold mb-4 text-sm tracking-widest uppercase">Platform</h4>
          <ul className="space-y-3 text-sm">
            <li><Link to="/login" className="hover:text-sky-400 transition-colors">Doctor Portal</Link></li>
            <li><Link to="/login" className="hover:text-sky-400 transition-colors">Patient Portal</Link></li>
            <li><a href="#" className="hover:text-sky-400 transition-colors">AI Processing Engine</a></li>
            <li><a href="#" className="hover:text-sky-400 transition-colors">Hospital Network</a></li>
          </ul>
        </div>

        <div>
          <h4 className="text-white font-semibold mb-4 text-sm tracking-widest uppercase">Resources</h4>
          <ul className="space-y-3 text-sm">
            <li><a href="#" className="hover:text-sky-400 transition-colors">Help / FAQ</a></li>
            <li><a href="#" className="hover:text-sky-400 transition-colors">ASD Awareness Guide</a></li>
            <li><a href="#" className="hover:text-sky-400 transition-colors">fMRI Clinical Guidelines</a></li>
            <li><a href="#" className="hover:text-sky-400 transition-colors">Contact Us</a></li>
          </ul>
        </div>

        <div>
          <h4 className="text-white font-semibold mb-4 text-sm tracking-widest uppercase">Legal & Security</h4>
          <ul className="space-y-3 text-sm">
            <li><a href="#" className="hover:text-sky-400 transition-colors">Privacy Policy</a></li>
            <li><a href="#" className="hover:text-sky-400 transition-colors">Terms of Service</a></li>
            <li><a href="#" className="hover:text-sky-400 transition-colors flex items-center gap-2">HIPAA Compliance <span className="w-2 h-2 rounded-full bg-emerald-500" /></a></li>
            <li><a href="#" className="hover:text-sky-400 transition-colors flex items-center gap-2">System Status <span className="w-2 h-2 rounded-full bg-emerald-500" /></a></li>
          </ul>
        </div>

      </div>

      <div className="max-w-7xl mx-auto px-6 pt-12 mt-12 border-t border-slate-900/50 flex flex-col md:flex-row justify-between items-center gap-4 text-sm">
        <p className="text-slate-600">© 2026 NeuroLens AI Inc. All rights reserved.</p>
        <p className="text-slate-600">Designed with precision for objective analytics.</p>
      </div>
    </footer>
  );
}
