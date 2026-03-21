import React, { useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import {
  LayoutDashboard, Hospital, CalendarDays, MessageSquare,
  FileText, BrainCircuit, History, Star, Settings,
  LogOut, UserRound, Bell, Search, ChevronLeft, ChevronRight,
  AlertCircle, Menu
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useActivePatient } from "../context/ActivePatientContext";
import { getNotifications, markNotificationRead } from "../utils/notificationsApi";

const BRAND = "NeuroLens";
const BRAND_SUB = "Patient Portal";

const navItems = [
  { to: "/patient/dashboard", icon: <LayoutDashboard size={20} />, label: "Dashboard" },
  { to: "/patient/hospitals", icon: <Hospital size={20} />, label: "Find Hospitals" },
  { to: "/patient/appointments", icon: <CalendarDays size={20} />, label: "Appointments" },
  { to: "/patient/chat", icon: <MessageSquare size={20} />, label: "Chat" },
  { to: "/patient/ai-analysis", icon: <BrainCircuit size={20} />, label: "AI Analysis" },
  { to: "/patient/history", icon: <History size={20} />, label: "History" },
  { to: "/patient/reviews", icon: <Star size={20} />, label: "Reviews" },
  { to: "/patient/settings", icon: <Settings size={20} />, label: "Settings" },
];

export default function PatientLayout() {
  const { logout, user } = useAuth();
  const navigate = useNavigate();
  const { activePatient } = useActivePatient();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);

  const loadNotifications = React.useCallback(async () => {
    if (!activePatient) return;
    try {
      const data = await getNotifications("patient", activePatient.id);
      setNotifications(data || []);
    } catch {
      setNotifications([]);
    }
  }, [activePatient]);

  React.useEffect(() => {
    loadNotifications();
    const iv = setInterval(loadNotifications, 5000);
    return () => clearInterval(iv);
  }, [loadNotifications]);

  const handleMarkRead = async (id) => {
    await markNotificationRead(id);
    loadNotifications();
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  const Sidebar = ({ isMobile = false }) => (
    <aside
      className={`flex flex-col h-full bg-white dark:bg-gray-900 border-r border-gray-100 dark:border-gray-800 shadow-sm transition-all duration-300 ${
        isMobile ? "w-72" : collapsed ? "w-[72px]" : "w-64"
      }`}
    >
      {/* Sidebar Top: User Profile + Collapse */}
      <div className={`p-4 border-b border-gray-100 dark:border-gray-800 flex ${collapsed && !isMobile ? "flex-col items-center gap-4" : "items-center justify-between"}`}>
        <div className={`flex items-center gap-3 min-w-0 ${collapsed && !isMobile ? "" : "pr-2"}`}>
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-400 to-cyan-500 flex items-center justify-center text-white shrink-0 shadow-sm">
            <UserRound size={20} />
          </div>
          {(!collapsed || isMobile) && (
            <div className="min-w-0">
              <p className="text-[15px] font-bold text-gray-900 dark:text-white truncate">{user?.name || "Sarah Johnson"}</p>
              <p className="text-xs font-semibold text-blue-600 dark:text-blue-400 truncate">Patient ID: P-{user?.id || "1001"}</p>
            </div>
          )}
        </div>
        {!isMobile && (
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="shrink-0 p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white transition-colors"
          >
            {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-2 py-2 space-y-0.5 overflow-y-auto">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            onClick={() => isMobile && setMobileOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group relative ${
                isActive
                  ? "bg-blue-600 text-white shadow-md shadow-blue-500/20"
                  : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white"
              } ${collapsed && !isMobile ? "justify-center" : ""}`
            }
          >
            {({ isActive }) => (
              <>
                <span className={`shrink-0 ${isActive ? "text-white" : ""}`}>{item.icon}</span>
                {(!collapsed || isMobile) && (
                  <span className="text-[15px] font-semibold">{item.label}</span>
                )}
                {collapsed && !isMobile && (
                  <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 whitespace-nowrap pointer-events-none z-50 transition-opacity">
                    {item.label}
                  </div>
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Emergency + Logout */}
      <div className={`p-3 border-t border-gray-100 dark:border-gray-800 space-y-2`}>
        {(!collapsed || isMobile) && (
          <button className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-[15px] font-bold text-red-600 bg-red-50 hover:bg-red-100 dark:bg-red-950/30 dark:hover:bg-red-950/60 rounded-xl transition-colors">
            <AlertCircle size={16} /> Emergency SOS
          </button>
        )}
        <button
          onClick={() => { logout(); navigate("/login"); }}
          className={`w-full flex items-center gap-2 px-3 py-2.5 text-[15px] font-semibold text-gray-600 dark:text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-xl transition-colors ${collapsed && !isMobile ? "justify-center" : ""}`}
        >
          <LogOut size={18} />
          {(!collapsed || isMobile) && <span>Log Out</span>}
        </button>
      </div>
    </aside>
  );

  return (
    <div className="h-screen flex bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-white overflow-hidden font-body">
      
      {/* Desktop Sidebar */}
      <div className="hidden md:flex h-full">
        <Sidebar />
      </div>

      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/40 z-40 md:hidden"
              onClick={() => setMobileOpen(false)}
            />
            <motion.div
              initial={{ x: -300 }} animate={{ x: 0 }} exit={{ x: -300 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="fixed left-0 top-0 h-full z-50 md:hidden"
            >
              <Sidebar isMobile />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Main */}
      <div className="flex-1 flex flex-col h-full min-w-0">
        
        {/* Header */}
        <header className="shrink-0 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 px-5 py-3 flex items-center gap-4 z-30 shadow-sm">
          <button
            onClick={() => setMobileOpen(true)}
            className="md:hidden p-2 rounded-xl text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition"
          >
            <Menu size={22} />
          </button>

          {/* Moved Logo */}
          <div className="flex items-center gap-3 ml-2 lg:ml-0">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center text-white shrink-0">
              <BrainCircuit size={18} />
            </div>
            <div className="hidden sm:block">
              <span className="font-headline font-extrabold text-xl text-gray-900 dark:text-white tracking-tight block leading-tight">{BRAND}</span>
              <span className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 tracking-widest uppercase">{BRAND_SUB}</span>
            </div>
          </div>

          <div className="flex-1"></div>

          <div className="flex items-center gap-3 ml-auto">
            {/* Chat */}
            <button
              onClick={() => navigate('/patient/chat')}
              className="relative flex items-center justify-center w-11 h-11 bg-gray-100 dark:bg-gray-800 hover:bg-blue-100 dark:hover:bg-blue-900/40 text-gray-700 dark:text-gray-200 hover:text-blue-700 dark:hover:text-blue-400 rounded-xl transition-all"
              title="Chat"
            >
              <MessageSquare size={22} strokeWidth={2} />
              <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-blue-500 rounded-full border-2 border-white dark:border-gray-900" />
            </button>

            {/* Bell */}
            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative flex items-center justify-center w-11 h-11 bg-gray-100 dark:bg-gray-800 hover:bg-red-100 dark:hover:bg-red-900/30 text-gray-700 dark:text-gray-200 hover:text-red-600 dark:hover:text-red-400 rounded-xl transition-all"
                title="Notifications"
              >
                <Bell size={22} strokeWidth={2} />
                {unreadCount > 0 && <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white dark:border-gray-900 animate-pulse" />}
              </button>
              <AnimatePresence>
                {showNotifications && (
                  <motion.div
                    initial={{ opacity: 0, y: 8, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.95 }}
                    className="absolute right-0 top-14 w-80 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 shadow-2xl rounded-2xl overflow-hidden z-50"
                  >
                    <div className="px-4 py-3 flex items-center justify-between border-b border-gray-100 dark:border-gray-800">
                      <span className="font-bold text-base text-gray-900 dark:text-white">Notifications</span>
                    </div>
                    {notifications.length === 0 ? (
                      <div className="p-4 text-center text-sm text-gray-500">No notifications</div>
                    ) : (
                      notifications.map(n => (
                        <div key={n.id} onClick={() => { if(!n.is_read) handleMarkRead(n.id) }} className={`px-4 py-3.5 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition border-b border-gray-50 dark:border-gray-800 last:border-0 ${!n.is_read ? 'bg-blue-50/50 dark:bg-blue-950/20' : ''}`}>
                          <div className="flex justify-between mb-1">
                            <p className={`text-sm ${!n.is_read ? 'font-bold text-gray-900 dark:text-white' : 'font-medium text-gray-700 dark:text-gray-300'}`}>{n.title}</p>
                          </div>
                          <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">{n.message}</p>
                        </div>
                      ))
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Profile */}
            <div className="flex items-center gap-2.5 bg-blue-100 dark:bg-blue-900/40 border border-blue-200 dark:border-blue-800 rounded-xl px-3 py-2 cursor-pointer hover:bg-blue-200 dark:hover:bg-blue-900/60 transition">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
                <UserRound size={16} className="text-white" />
              </div>
              <div className="hidden sm:block">
                <p className="text-sm font-bold text-blue-900 dark:text-blue-100 leading-tight">
                  {user?.name?.split(' ')[0] || "Sarah"}
                </p>
                <p className="text-xs font-medium text-blue-600 dark:text-blue-400">Patient</p>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>

        {/* Mobile Bottom Nav */}
        <nav className="md:hidden shrink-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 flex justify-around px-2 py-2 safe-bottom shadow-[0_-2px_12px_rgba(0,0,0,0.06)]">
          {navItems.slice(0, 5).map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-xl transition-colors ${
                  isActive ? "text-blue-600" : "text-gray-500 dark:text-gray-400"
                }`
              }
            >
              {item.icon}
              <span className="text-[11px] font-semibold">{item.label.split(' ')[0]}</span>
            </NavLink>
          ))}
        </nav>
      </div>
    </div>
  );
}
