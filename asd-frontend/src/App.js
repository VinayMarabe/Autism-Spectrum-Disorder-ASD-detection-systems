// src/App.js
import React from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  NavLink,
  Navigate,
} from "react-router-dom";

import Dashboard from "./page/Dashboard";
import PatientForm from "./page/PatientForm";
import Detection from "./page/Detection";
import Patients from "./page/Patients";
import Settings from "./page/Settings";
import PatientDetails from "./page/PatientDetails";
import HeatmapJourney from "./page/HeatmapJourney";
import ConvoWithDoctor from "./page/ConvoWithDoctor";
import MvpRoiDashboard from "./page/MvpRoiDashboard";
import HowItWorks from "./page/HowItWorks";

import ActivePatientDropdown from "./components/ActivePatientDropdown";
import VoiceSearch from "./components/VoiceSearch";

import {
  LayoutDashboard,
  ClipboardList,
  Users,
  Settings as SettingsIcon,
  ActivitySquare,
  BookOpen,
} from "lucide-react";

import { ActivePatientProvider } from "./context/ActivePatientContext";
import i18n from "./i18n";

const AppLayout = ({ children }) => {
  const siteName = (i18n && i18n.t && i18n.t("site_name")) || "dr.THYNK";

  return (
    // 🔒 Full viewport height, no window scroll; only main area scrolls
    <div className="h-screen flex bg-slate-50 text-slate-900 overflow-hidden font-sans">
      {/* Sidebar (fixed height, left side) */}
      <aside className="hidden md:flex md:flex-col w-64 bg-white/60 backdrop-blur-xl border-r border-slate-200/60 shadow-[4px_0_24px_rgba(0,0,0,0.02)] h-full z-20 transition-all duration-300">
        <div className="px-6 py-6 border-b border-slate-200/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-primary-500/30 ring-2 ring-white">
              DT
            </div>
            <div>
              <p className="text-sm font-bold text-slate-800 tracking-tight">
                {siteName}
              </p>
              <p className="text-[11px] text-slate-500 font-medium">
                {i18n.t("header_subtitle")}
              </p>
            </div>
          </div>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1 text-sm overflow-y-auto">
          <NavItem to="/dashboard" icon={<LayoutDashboard size={16} />}>
            {i18n.t("nav_dashboard")}
          </NavItem>

          <NavItem to="/patient-form" icon={<ClipboardList size={16} />}>
            {i18n.t("nav_patient_form")}
          </NavItem>

          <NavItem to="/patients" icon={<Users size={16} />}>
            {i18n.t("nav_patients")}
          </NavItem>

          <NavItem to="/detection" icon={<ActivitySquare size={16} />}>
            {i18n.t("nav_detection")}
          </NavItem>

          {/* Convo with Dr nav */}
          <NavItem to="/convo-with-dr" icon={<ActivitySquare size={16} />}>
            {i18n.t("nav_convo_with_dr") || "Convo with Dr"}
          </NavItem>

          <NavItem to="/mvp-roi" icon={<ActivitySquare size={16} />}>
            {"MVP ROI Viewer"}
          </NavItem>

          <NavItem to="/how-it-works" icon={<BookOpen size={16} />}>
            {"How It Works"}
          </NavItem>

          <NavItem to="/settings" icon={<SettingsIcon size={16} />}>
            {i18n.t("nav_settings")}
          </NavItem>
        </nav>

        <div className="px-6 py-4 border-t border-slate-200/50 text-[11px] text-slate-400 font-medium tracking-wide">
          MRI · Behaviour Notes · Severity AI
        </div>
      </aside>

      {/* Right side: header fixed at top, main scrolls */}
      <div className="flex-1 flex flex-col h-full bg-slate-50/50 relative">
        {/* Header stays in place */}
        <header className="w-full bg-white/80 backdrop-blur-md border-b border-slate-200/60 px-6 py-4 flex items-center justify-between gap-4 shrink-0 sticky top-0 z-10 shadow-sm">
          <div className="hidden md:block">
            <p className="text-[10px] uppercase tracking-widest text-slate-400 font-semibold mb-0.5">
              {i18n.t("header_subtitle")}
            </p>
            <p className="text-sm font-semibold text-slate-800">
              {siteName}
            </p>
          </div>

          <div className="flex items-center gap-4">
            <VoiceSearch />
            <ActivePatientDropdown />
          </div>
        </header>

        {/* 🔁 Only this area scrolls now */}
        <main className="flex-1 p-6 md:p-8 overflow-y-auto animate-fade-in relative">
          {/* Subtle background decoration */}
          <div className="absolute top-0 left-0 w-full h-96 bg-gradient-to-b from-primary-50/50 to-transparent -z-10 pointer-events-none" />
          <div className="max-w-7xl mx-auto space-y-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

const NavItem = ({ to, icon, children }) => (
  <NavLink
    to={to}
    className={({ isActive }) =>
      [
        "flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-200 group text-sm",
        isActive
          ? "nav-item-active"
          : "text-slate-500 hover:bg-slate-100 hover:text-slate-900",
      ].join(" ")
    }
  >
    <span className="transition-transform duration-200 group-hover:scale-110">
      {icon}
    </span>
    <span>{children}</span>
  </NavLink>
);

const App = () => {
  return (
    <ActivePatientProvider>
      <BrowserRouter>
        <AppLayout>
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />

            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/patient-form" element={<PatientForm />} />
            <Route path="/patients" element={<Patients />} />
            <Route path="/patient/:id" element={<PatientDetails />} />
            <Route path="/detection" element={<Detection />} />
            <Route path="/settings" element={<Settings />} />

            {/* Heatmap + Convo routes */}
            <Route path="/heatmap-journey" element={<HeatmapJourney />} />
            <Route path="/convo-with-dr" element={<ConvoWithDoctor />} />
            <Route path="/mvp-roi" element={<MvpRoiDashboard />} />
            <Route path="/how-it-works" element={<HowItWorks />} />

            <Route
              path="*"
              element={<Navigate to="/dashboard" replace />}
            />
          </Routes>
        </AppLayout>
      </BrowserRouter>
    </ActivePatientProvider>
  );
};

export default App;
