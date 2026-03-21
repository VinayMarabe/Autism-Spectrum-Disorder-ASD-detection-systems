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

import ActivePatientDropdown from "./components/ActivePatientDropdown";
import VoiceSearch from "./components/VoiceSearch";

import {
  LayoutDashboard,
  ClipboardList,
  Users,
  Settings as SettingsIcon,
  ActivitySquare,
} from "lucide-react";

import { ActivePatientProvider } from "./context/ActivePatientContext";
import i18n from "./i18n";

const AppLayout = ({ children }) => {
  const siteName = (i18n && i18n.t && i18n.t("site_name")) || "dr.THYNK";

  return (
    // 🔒 Full viewport height, no window scroll; only main area scrolls
    <div className="h-screen flex bg-slate-50 text-slate-900 overflow-hidden">
      {/* Sidebar (fixed height, left side) */}
      <aside className="hidden md:flex md:flex-col w-60 bg-white border-r border-slate-200 shadow-sm h-full">
        <div className="px-5 py-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-sky-500 to-emerald-400 flex items-center justify-center text-white font-bold text-lg">
              DT
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-900">
                {siteName}
              </p>
              <p className="text-[11px] text-slate-500">
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

          {/* Heatmap journey nav */}
          <NavItem to="/heatmap-journey" icon={<ActivitySquare size={16} />}>
            {i18n.t("nav_heatmap_journey") || "Heatmap journey"}
          </NavItem>

          {/* Convo with Dr nav */}
          <NavItem to="/convo-with-dr" icon={<ActivitySquare size={16} />}>
            {i18n.t("nav_convo_with_dr") || "Convo with Dr"}
          </NavItem>

          <NavItem to="/settings" icon={<SettingsIcon size={16} />}>
            {i18n.t("nav_settings")}
          </NavItem>
        </nav>

        <div className="px-4 py-3 border-t border-slate-100 text-[11px] text-slate-500">
          MRI · Behaviour Notes · Severity AI
        </div>
      </aside>

      {/* Right side: header fixed at top, main scrolls */}
      <div className="flex-1 flex flex-col h-full">
        {/* Header stays in place */}
        <header className="w-full bg-white border-b border-slate-200 px-4 md:px-6 py-3 flex items-center justify-between gap-3 shrink-0">
          <div className="hidden md:block">
            <p className="text-xs uppercase tracking-wide text-slate-500">
              {i18n.t("header_subtitle")}
            </p>
            <p className="text-sm font-semibold text-slate-900">
              {siteName}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <VoiceSearch />
            <ActivePatientDropdown />
          </div>
        </header>

        {/* 🔁 Only this area scrolls now */}
        <main className="flex-1 p-4 md:p-6 overflow-y-auto">
          {children}
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
        "flex items-center gap-2 px-3 py-2 rounded-xl transition text-slate-600",
        isActive
          ? "bg-sky-50 text-sky-700 font-medium"
          : "hover:bg-slate-50 hover:text-slate-900",
      ].join(" ")
    }
  >
    {icon}
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
