// src/components/Sidebar.jsx
import React from "react";
import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  ClipboardList,
  Users,
  Settings as SettingsIcon,
  ActivitySquare,
} from "lucide-react";
import i18n from "../i18n";

export default function Sidebar({ siteName }) {
  const brand = siteName || (i18n && i18n.t && i18n.t("site_name")) || "dr.THYNK";

  const NavItem = ({ to, icon, children }) => (
    <NavLink
      to={to}
      className={({ isActive }) =>
        [
          "flex items-center gap-2 px-3 py-2 rounded-xl transition text-slate-600",
          isActive ? "bg-sky-50 text-sky-700 font-medium" : "hover:bg-slate-50 hover:text-slate-900",
        ].join(" ")
      }
    >
      {icon}
      <span>{children}</span>
    </NavLink>
  );

  return (
    <aside className="hidden md:flex md:flex-col w-60 bg-white border-r border-slate-200 shadow-sm">
      <div className="px-5 py-4 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-sky-500 to-emerald-400 flex items-center justify-center text-white font-bold text-lg">
            DT
          </div>
          <div>
            <div className="text-sm font-semibold text-slate-900">{brand}</div>
            <div className="text-[11px] text-slate-500">ASD Assistant</div>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1 text-sm">
        <NavItem to="/dashboard" icon={<LayoutDashboard size={16} />}>
          {i18n.t("nav_dashboard") || "Dashboard"}
        </NavItem>

        <NavItem to="/patient-form" icon={<ClipboardList size={16} />}>
          {i18n.t("nav_patient_form") || "Patient form"}
        </NavItem>

        <NavItem to="/patients" icon={<Users size={16} />}>
          {i18n.t("nav_patients") || "Patients"}
        </NavItem>

        <NavItem to="/detection" icon={<ActivitySquare size={16} />}>
          {i18n.t("nav_detection_lab") || "Detection lab"}
        </NavItem>

        <NavItem to="/settings" icon={<SettingsIcon size={16} />}>
          {i18n.t("nav_settings") || "Settings"}
        </NavItem>
      </nav>

      <div className="px-4 py-3 border-t border-slate-100 text-[11px] text-slate-500">
        MRI · Behaviour Notes · Severity AI
      </div>
    </aside>
  );
}
