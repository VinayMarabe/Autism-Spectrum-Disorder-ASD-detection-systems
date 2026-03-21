import React, { useState } from "react";
import { motion } from "framer-motion";
import { UserRound, Bell, Moon, Globe, Shield, HelpCircle, Mail, ChevronRight, Camera, Check } from "lucide-react";

export default function PatientSettings() {
  const [darkMode, setDarkMode] = useState(false);
  const [notifs, setNotifs] = useState({ appointments: true, reports: true, messages: false, reminders: true });
  const [language, setLanguage] = useState("English");
  const [name, setName] = useState("Sarah Johnson");
  const [email, setEmail] = useState("sarah.j@example.com");
  const [saved, setSaved] = useState(false);

  const saveProfile = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const settingsGroups = [
    {
      title: "Appearance",
      items: [
        {
          icon: <Moon size={18} />, label: "Dark Mode", sub: "Switch between light and dark theme",
          control: <button onClick={() => setDarkMode(!darkMode)} className={`w-12 h-6 rounded-full transition-colors relative ${darkMode ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-700'}`}>
            <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-md transition-transform ${darkMode ? 'translate-x-6' : ''}`} />
          </button>
        },
        {
          icon: <Globe size={18} />, label: "Language", sub: "Select your preferred language",
          control: <select value={language} onChange={e => setLanguage(e.target.value)} className="text-sm bg-gray-100 dark:bg-gray-700 border-none rounded-lg px-3 py-1.5 focus:outline-none dark:text-white">
            {["English","Spanish","French","Hindi"].map(l => <option key={l}>{l}</option>)}
          </select>
        }
      ]
    },
    {
      title: "Notifications",
      items: [
        { icon: <Bell size={18} />, label: "Appointment Reminders", sub: "Get reminders before appointments", key: "appointments" },
        { icon: <Bell size={18} />, label: "Report Updates", sub: "Notify when AI analysis completes", key: "reports" },
        { icon: <Bell size={18} />, label: "Messages", sub: "New messages from doctors", key: "messages" },
        { icon: <Bell size={18} />, label: "Health Reminders", sub: "Daily health check-in reminders", key: "reminders" },
      ].map(item => ({
        ...item,
        control: <button onClick={() => setNotifs(prev => ({...prev, [item.key]: !prev[item.key]}))} className={`w-12 h-6 rounded-full transition-colors relative ${notifs[item.key] ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-700'}`}>
          <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-md transition-transform ${notifs[item.key] ? 'translate-x-6' : ''}`} />
        </button>
      }))
    },
    {
      title: "Privacy & Security",
      items: [
        { icon: <Shield size={18} />, label: "Privacy Policy", sub: "Read our data protection commitment", link: true },
        { icon: <Shield size={18} />, label: "Data & Consent", sub: "Manage how your data is used", link: true },
      ]
    },
    {
      title: "Support",
      items: [
        { icon: <HelpCircle size={18} />, label: "Help & FAQ", sub: "Answers to common questions", link: true },
        { icon: <Mail size={18} />, label: "Contact Us", sub: "Reach our support team", link: true },
      ]
    }
  ];

  return (
    <div className="p-5 lg:p-8 pb-24 md:pb-8 bg-gray-50 dark:bg-gray-950 min-h-full">
      <div>
        <div className="mb-6">
          <h1 className="text-2xl font-headline font-bold text-gray-900 dark:text-white mb-1">Settings</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm">Manage your account and preferences</p>
        </div>

        {/* Profile Card */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-6 mb-6">
          <h2 className="font-headline font-bold text-gray-900 dark:text-white mb-5 flex items-center gap-2">
            <UserRound size={18} className="text-blue-600" /> Profile Information
          </h2>
          <div className="flex flex-col items-center mb-6">
            <div className="relative">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center border-4 border-white dark:border-gray-900 shadow-lg">
                <UserRound size={36} className="text-white" />
              </div>
              <button className="absolute bottom-0 right-0 w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white shadow-md hover:bg-blue-700 transition">
                <Camera size={14} />
              </button>
            </div>
          </div>

          {/* Profile Completeness */}
          <div className="mb-5 p-3 bg-blue-50 dark:bg-blue-950/30 rounded-xl">
            <div className="flex justify-between mb-1.5">
              <span className="text-xs font-semibold text-blue-800 dark:text-blue-200">Profile Completeness</span>
              <span className="text-xs font-bold text-blue-600">87%</span>
            </div>
            <div className="h-2 bg-blue-100 dark:bg-blue-900/40 rounded-full overflow-hidden">
              <div className="h-full w-[87%] bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full" />
            </div>
            <p className="text-xs text-blue-600 dark:text-blue-400 mt-1.5">Add your photo to reach 100%</p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5 block">Full Name</label>
              <input value={name} onChange={e => setName(e.target.value)} className="w-full bg-gray-100 dark:bg-gray-800 rounded-xl px-4 py-3 text-sm font-medium outline-none focus:ring-2 focus:ring-blue-500 dark:text-white transition-all" />
            </div>
            <div>
              <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5 block">Email Address</label>
              <input value={email} onChange={e => setEmail(e.target.value)} type="email" className="w-full bg-gray-100 dark:bg-gray-800 rounded-xl px-4 py-3 text-sm font-medium outline-none focus:ring-2 focus:ring-blue-500 dark:text-white transition-all" />
            </div>
            <button
              onClick={saveProfile}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition active:scale-95 ${saved ? 'bg-emerald-600 text-white' : 'bg-blue-600 hover:bg-blue-700 text-white'}`}
            >
              {saved ? <><Check size={15} /> Saved!</> : "Save Changes"}
            </button>
          </div>
        </div>

        {/* Settings Groups */}
        {settingsGroups.map((group, gi) => (
          <div key={gi} className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden mb-4">
            <div className="px-5 py-3 bg-gray-50 dark:bg-gray-800/50">
              <h3 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{group.title}</h3>
            </div>
            <div className="divide-y divide-gray-50 dark:divide-gray-800">
              {group.items.map((item, ii) => (
                <div key={ii} className={`flex items-center gap-4 px-5 py-4 ${item.link ? 'cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors' : ''}`}>
                  <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/30 flex items-center justify-center text-blue-600 shrink-0">
                    {item.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">{item.label}</p>
                    <p className="text-xs text-gray-400">{item.sub}</p>
                  </div>
                  {item.control || (item.link && <ChevronRight size={18} className="text-gray-300 dark:text-gray-600 shrink-0" />)}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
