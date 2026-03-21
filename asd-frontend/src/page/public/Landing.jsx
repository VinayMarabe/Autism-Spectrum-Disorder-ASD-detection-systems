import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Activity, 
  BrainCircuit, 
  Network, 
  Search, 
  CheckCircle2, 
  Home, 
  BarChart, 
  FileText, 
  User 
} from 'lucide-react';

export default function Landing() {
  const navigate = useNavigate();

  return (
    <div className="bg-surface font-body text-on-surface antialiased min-h-screen">
      
      {/* TopAppBar */}
      <header className="fixed top-0 w-full z-50 bg-white/70 backdrop-blur-xl shadow-sm shadow-blue-500/5">
        <div className="max-w-7xl mx-auto flex justify-between items-center px-6 py-4">
          <div className="flex items-center gap-2">
            <Activity className="text-blue-700" size={28} />
            <span className="text-2xl font-bold bg-gradient-to-r from-blue-700 to-indigo-600 bg-clip-text text-transparent font-headline tracking-tight">PrismHealth</span>
          </div>
          <nav className="hidden md:flex gap-8 items-center">
            <a className="text-blue-700 font-semibold font-headline transition-colors active:scale-95 duration-200" href="#">Home</a>
            <a className="text-slate-600 font-medium font-headline hover:text-blue-600 transition-colors active:scale-95 duration-200" href="#">Screening</a>
            <a className="text-slate-600 font-medium font-headline hover:text-blue-600 transition-colors active:scale-95 duration-200" href="#">Reports</a>
            <a className="text-slate-600 font-medium font-headline hover:text-blue-600 transition-colors active:scale-95 duration-200" href="#">Profile</a>
          </nav>
          <button 
            onClick={() => navigate('/login')}
            className="bg-gradient-to-r from-primary to-secondary text-white px-8 py-3 rounded-full font-semibold shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all"
          >
            Start Screening
          </button>
        </div>
        <div className="bg-slate-200/20 h-[1px] w-full absolute bottom-0"></div>
      </header>

      <main className="pt-24">
        
        {/* Hero Section */}
        <section className="relative min-h-[751px] flex items-center px-6 overflow-hidden">
          <div className="max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="z-10"
            >
              <span className="inline-block py-2 px-4 rounded-full bg-primary/10 text-primary font-semibold text-sm mb-6">
                Empowering Families with AI
              </span>
              <h1 className="font-headline text-5xl md:text-7xl font-extrabold tracking-tight text-on-surface leading-[1.1] mb-8">
                Understand Autism <br/><span className="text-primary">Early with AI</span>
              </h1>
              <p className="text-on-surface-variant text-lg md:text-xl leading-relaxed max-w-xl mb-10">
                PrismHealth leverages clinical-grade artificial intelligence to provide early insights into neurodevelopmental paths, helping you navigate your child's future with clarity.
              </p>
              <div className="flex flex-wrap gap-4">
                <button 
                  onClick={() => navigate('/login')}
                  className="bg-gradient-to-r from-primary to-secondary text-on-primary h-14 px-10 rounded-full font-bold text-lg shadow-xl shadow-primary/25 transition-transform active:scale-95"
                >
                  Start Screening
                </button>
                <button className="bg-surface-container-lowest border border-outline-variant/20 h-14 px-10 rounded-full font-bold text-lg text-primary hover:bg-surface-container transition-all active:scale-95">
                  Learn Methodology
                </button>
              </div>
            </motion.div>
            <div className="relative hidden lg:block">
              <div className="absolute -top-20 -right-20 w-96 h-96 bg-primary/20 rounded-full blur-[100px]"></div>
              <div className="absolute -bottom-20 -left-20 w-96 h-96 bg-tertiary/20 rounded-full blur-[100px]"></div>
              <motion.div 
                initial={{ opacity: 0, scale: 0.9, rotate: 0 }}
                animate={{ opacity: 1, scale: 1, rotate: 3 }}
                transition={{ duration: 1, delay: 0.2 }}
                className="bg-white/70 backdrop-blur-xl border border-white/40 rounded-xl p-4 shadow-2xl relative z-10"
              >
                <img 
                  alt="Abstract 3D brain and hospital nodes" 
                  className="w-full h-auto rounded-lg" 
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuCgdcsEYFv7o438UmekYA97js5BzdsM-8bE3_AOUSnJ9DxK35qPV8dD1Ig4mP3k2S0sFTwhle1STuOJExYxjiVn8CabaAhFjYRBY6KU0RMQA6y3veDH60oqIszHV0ohhb4fHmc9A4LNZuUKA79fWYIH6nDSG5sv70xn70zEZ3b8O0kd-Xbx_kT4pIFcmSPP3Ac9J8Ri21l2CIKZJYZtR-rygN9TLjS-yCkgkTB06T80FkBJBimbU6nOG2OJYjdRyZ5Xzgc6H_jCRt4"
                />
              </motion.div>
            </div>
          </div>
        </section>

        {/* Why This Platform (Glassmorphism Cards) */}
        <section className="py-24 bg-surface-container-low px-6">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-20">
              <h2 className="font-headline text-4xl font-bold text-on-surface mb-4">Why PrismHealth?</h2>
              <p className="text-on-surface-variant max-w-2xl mx-auto">Transforming clinical observations into actionable data with empathy at the core.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              
              <div className="bg-white/70 backdrop-blur-xl border border-outline-variant/20 rounded-xl p-10 hover:-translate-y-2 transition-transform duration-300 group shadow-sm">
                <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-8 group-hover:bg-primary group-hover:text-white transition-colors">
                  <BrainCircuit size={32} />
                </div>
                <h3 className="font-headline text-2xl font-bold mb-4">What is ASD?</h3>
                <p className="text-on-surface-variant leading-relaxed">Autism Spectrum Disorder is a developmental difference. Knowledge is the first step toward personalized support.</p>
              </div>
              
              <div className="bg-white/70 backdrop-blur-xl border-[2px] border-primary/10 rounded-xl p-10 hover:-translate-y-2 transition-transform duration-300 group shadow-sm">
                <div className="w-16 h-16 rounded-2xl bg-secondary/10 flex items-center justify-center mb-8 group-hover:bg-secondary group-hover:text-white transition-colors">
                  <Activity size={32} />
                </div>
                <h3 className="font-headline text-2xl font-bold mb-4">Early Action</h3>
                <p className="text-on-surface-variant leading-relaxed">Identifying patterns early allows for interventions during critical neuroplastic periods, leading to better outcomes.</p>
              </div>
              
              <div className="bg-white/70 backdrop-blur-xl border border-outline-variant/20 rounded-xl p-10 hover:-translate-y-2 transition-transform duration-300 group shadow-sm">
                <div className="w-16 h-16 rounded-2xl bg-tertiary/10 flex items-center justify-center mb-8 group-hover:bg-tertiary group-hover:text-white transition-colors">
                  <Network size={32} />
                </div>
                <h3 className="font-headline text-2xl font-bold mb-4">How AI Helps</h3>
                <p className="text-on-surface-variant leading-relaxed">Our AI detects subtle behavioral cues often missed in traditional triage, providing an objective preliminary layer.</p>
              </div>

            </div>
          </div>
        </section>

        {/* How It Works (Horizontal Steps) */}
        <section className="py-32 px-6 overflow-hidden">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row justify-between items-end mb-20 gap-8">
              <div className="max-w-xl">
                <h2 className="font-headline text-4xl font-bold text-on-surface mb-4">A Seamless Path to Clarity</h2>
                <p className="text-on-surface-variant">Our four-step process is designed to be gentle, fast, and clinically grounded.</p>
              </div>
              <div className="hidden md:block">
                <span className="text-primary font-bold text-8xl opacity-10 font-headline">PROCESS</span>
              </div>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-12 relative">
              {[
                { step: "01", title: "Upload", desc: "Securely upload short behavioral observation videos or clinical forms.", fill: "w-1/4" },
                { step: "02", title: "AI Analysis", desc: "Our neural network processes data against established clinical markers.", fill: "w-1/2" },
                { step: "03", title: "Report", desc: "Receive a detailed Prism Report summarizing early detection indicators.", fill: "w-3/4" },
                { step: "04", title: "Consult", desc: "Connect with pediatric specialists to discuss the next clinical steps.", fill: "w-full" }
              ].map((s, i) => (
                <div key={i} className="relative">
                  <div className="w-full h-2 bg-secondary-fixed rounded-full mb-8 overflow-hidden">
                    <div className={`${s.fill} h-full bg-primary`}></div>
                  </div>
                  <span className="text-xs font-bold text-primary tracking-widest uppercase mb-2 block">Step {s.step}</span>
                  <h4 className="font-headline text-xl font-bold mb-3">{s.title}</h4>
                  <p className="text-on-surface-variant text-sm leading-relaxed">{s.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Find Specialist (Map Background) */}
        <section className="py-24 px-6">
          <div className="max-w-7xl mx-auto rounded-xl overflow-hidden relative min-h-[500px] flex items-center shadow-2xl">
            <div className="absolute inset-0 z-0 bg-slate-900">
              <img 
                alt="Map indicating specialists location" 
                className="w-full h-full object-cover opacity-60 mix-blend-overlay" 
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuAnD59i5kGmSyMklEnLdrgrdwnDZ5RmuvN3lkMfIF6cG2WrKYsLSd3O36Gh_sUl06d1sRRq0R1N5-4UOu3CXaz5bGjvyNce9wv7edS2qRcjJ1fbuN_TDDvJzvUJYkkOkfcswZMdXXkWqUuHQotQsCEwEo4iZVXr-9pooDOaR7p_AGvCXyzbh5i8ExPhtV-4QrA3yesG8x-3tnVDFU2CjSEPHBNXIFMoOP3uvlSsv-sQcNKqourLisa8qZNGSaNComP81cno4Zph1ko"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-surface via-surface/80 to-transparent"></div>
            </div>
            <div className="relative z-10 p-8 md:p-16 max-w-xl">
              <h2 className="font-headline text-4xl font-bold text-on-surface mb-6 leading-tight">Find Top ASD Specialists <br/>Near You</h2>
              <p className="text-on-surface-variant mb-8 text-lg">Use our directory to find validated clinical partners who accept PrismHealth reports.</p>
              <div className="flex gap-2 p-2 bg-white rounded-2xl shadow-lg border border-outline-variant/10">
                <input className="bg-transparent border-none focus:ring-0 flex-1 px-4 py-3 font-medium outline-none text-slate-800" placeholder="Enter Zip Code" type="text" />
                <button className="bg-primary text-white h-12 w-12 rounded-xl flex items-center justify-center active:scale-90 transition-transform">
                  <Search size={20} />
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="py-32 px-6 text-center">
          <div className="max-w-4xl mx-auto bg-white/70 backdrop-blur-xl rounded-xl p-16 border border-primary/20 bg-gradient-to-b from-white/90 to-blue-50/50 shadow-xl">
            <h2 className="font-headline text-4xl md:text-5xl font-bold text-on-surface mb-6">Ready to gain peace of mind?</h2>
            <p className="text-on-surface-variant text-lg mb-12 max-w-2xl mx-auto">Join thousands of families who have used PrismHealth to illuminate their child's development journey.</p>
            <div className="relative inline-block">
              <div className="absolute -inset-4 bg-primary/20 blur-xl rounded-full opacity-50"></div>
              <button 
                onClick={() => navigate('/login')}
                className="relative bg-gradient-to-r from-primary to-secondary text-on-primary h-16 px-12 rounded-full font-bold text-xl shadow-2xl transition-all hover:scale-105 active:scale-95"
              >
                Start Screening Now
              </button>
            </div>
            <p className="mt-8 text-on-surface-variant text-sm font-medium flex items-center justify-center gap-2">
              <CheckCircle2 size={16} className="text-emerald-500" />
              HIPAA Compliant • Clinical Grade AI
            </p>
          </div>
        </section>

      </main>

      {/* Footer */}
      <footer className="w-full pt-20 pb-10 bg-slate-50 border-t border-slate-200">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-8">
          <div>
            <span className="font-headline font-bold text-lg text-slate-900 mb-2 block">PrismHealth AI</span>
            <p className="font-inter text-sm text-slate-500 max-w-xs">© 2026 PrismHealth AI. Empathetic care through technology.</p>
          </div>
          <div className="flex flex-wrap justify-center gap-8">
            <a className="font-inter text-sm text-slate-500 hover:text-blue-600 transition-colors" href="#">Privacy Policy</a>
            <a className="font-inter text-sm text-slate-500 hover:text-blue-600 transition-colors" href="#">Terms of Service</a>
            <a className="font-inter text-sm text-slate-500 hover:text-blue-600 transition-colors" href="#">Clinical Validation</a>
            <a className="font-inter text-sm text-slate-500 hover:text-blue-600 transition-colors" href="#">Contact</a>
          </div>
        </div>
      </footer>

    </div>
  );
}
