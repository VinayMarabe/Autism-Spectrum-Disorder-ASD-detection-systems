import React, { useEffect, useState } from "react";
import { getPatients, savePatients } from "../utils/storage";
import i18n from "../i18n";

const LANG_KEY = "app_lang";
const THEME_KEY = "app_theme";
const MRI_URL_KEY = "api_mri_url";
const BEHAV_URL_KEY = "api_behaviour_url";
const VOICE_KEY = "voice_enabled";

export default function Settings() {
  const [lang, setLang] = useState(localStorage.getItem(LANG_KEY) || i18n.getLanguage() || "en");
  const [theme, setTheme] = useState(localStorage.getItem(THEME_KEY) || document.documentElement.dataset.theme || "clinical");
  const [mriUrl, setMriUrl] = useState(localStorage.getItem(MRI_URL_KEY) || "");
  const [behavUrl, setBehavUrl] = useState(localStorage.getItem(BEHAV_URL_KEY) || "");
  const [voiceEnabled, setVoiceEnabled] = useState(localStorage.getItem(VOICE_KEY) === "1");
  const [statusMessage, setStatusMessage] = useState("");
  const [healthStatus, setHealthStatus] = useState({ mri: null, behavi: null });

  useEffect(() => {
    applyTheme(theme);
    applyLanguage(lang);
  }, [lang, theme]);

  async function applyLanguage(l) {
    try {
      await i18n.changeLanguage(l);
    } catch (e) {}
    localStorage.setItem(LANG_KEY, l);
    window.dispatchEvent(new CustomEvent("app_language_changed", { detail: l }));
    window.dispatchEvent(new CustomEvent("app_lang_changed_for_voice", { detail: l }));
  }

  function applyTheme(t) {
    if (t === "dark") {
      document.documentElement.classList.add("dark");
      document.documentElement.dataset.theme = "dark";
    } else if (t === "contrast") {
      document.documentElement.classList.remove("dark");
      document.documentElement.dataset.theme = "contrast";
    } else {
      document.documentElement.classList.remove("dark");
      document.documentElement.dataset.theme = "clinical";
    }
    localStorage.setItem(THEME_KEY, t);
  }

  function saveAll() {
    localStorage.setItem(LANG_KEY, lang);
    localStorage.setItem(THEME_KEY, theme);
    localStorage.setItem(MRI_URL_KEY, mriUrl);
    localStorage.setItem(BEHAV_URL_KEY, behavUrl);
    localStorage.setItem(VOICE_KEY, voiceEnabled ? "1" : "0");
    applyLanguage(lang);
    applyTheme(theme);
    window.dispatchEvent(new CustomEvent("voice_pref_changed", { detail: { enabled: !!voiceEnabled } }));
    setStatusMessage(i18n.t("save"));
    setTimeout(() => setStatusMessage(""), 3000);
  }

  function exportPatients() {
    const all = getPatients();
    const blob = new Blob([JSON.stringify(all, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `drthynk_patients_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  function clearAllPatients() {
    const ok = window.confirm("Clear all patients and history? This is irreversible.");
    if (!ok) return;
    savePatients([]);
    localStorage.removeItem("asd_active_patient");
    setStatusMessage(i18n.t("clear_patients"));
    setTimeout(() => setStatusMessage(""), 3000);
  }

  async function checkHealth(url) {
    if (!url) return null;
    try {
      const resp = await fetch(url.endsWith("/") ? `${url}health` : `${url}/health`, { method: "GET" });
      return resp.ok ? i18n.t("backend_status_online") : `error (${resp.status})`;
    } catch (e) {
      return "offline";
    }
  }

  async function runHealthChecks() {
    setHealthStatus({ mri: "checking...", behavi: "checking..." });
    const m = mriUrl ? await checkHealth(mriUrl) : "not configured";
    const b = behavUrl ? await checkHealth(behavUrl) : "not configured";
    setHealthStatus({ mri: m, behavi: b });
    setStatusMessage("Health checks completed");
    setTimeout(() => setStatusMessage(""), 3000);
  }

  function revert() {
    const savedLang = localStorage.getItem(LANG_KEY) || "en";
    const savedTheme = localStorage.getItem(THEME_KEY) || "clinical";
    const savedMri = localStorage.getItem(MRI_URL_KEY) || "";
    const savedBeh = localStorage.getItem(BEHAV_URL_KEY) || "";
    const savedVoice = localStorage.getItem(VOICE_KEY) === "1";
    setLang(savedLang);
    setTheme(savedTheme);
    setMriUrl(savedMri);
    setBehavUrl(savedBeh);
    setVoiceEnabled(savedVoice);
    applyLanguage(savedLang);
    applyTheme(savedTheme);
    window.dispatchEvent(new CustomEvent("voice_pref_changed", { detail: { enabled: savedVoice } }));
    setStatusMessage(i18n.t("revert"));
    setTimeout(() => setStatusMessage(""), 1500);
  }

  function handleLangClick(l) {
    setLang(l);
    applyLanguage(l);
  }

  function handleThemeClick(t) {
    setTheme(t);
    applyTheme(t);
  }

  function handleVoiceToggle(checked) {
    setVoiceEnabled(checked);
    localStorage.setItem(VOICE_KEY, checked ? "1" : "0");
    window.dispatchEvent(new CustomEvent("voice_pref_changed", { detail: { enabled: !!checked } }));
  }

  return (
    <div className="animate-fade-in p-6 md:p-8">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-semibold text-slate-900">{i18n.t("settings_title")}</h1>

        <div className="mt-6 space-y-6">

          <div className="card">
            <h2 className="text-lg font-semibold text-slate-800 tracking-tight">{i18n.t("language_english")}</h2>

            <div className="mt-5 flex flex-wrap gap-3">
              <button
                className={`btn px-5 py-2.5 ${lang === "en" ? "bg-primary-500 text-white shadow-md hover:-translate-y-0.5" : "bg-slate-100 text-slate-700 hover:bg-slate-200"}`}
                onClick={() => handleLangClick("en")}
              >
                {i18n.t("language_english")}
              </button>
              <button
                className={`btn px-5 py-2.5 ${lang === "hi" ? "bg-primary-500 text-white shadow-md hover:-translate-y-0.5" : "bg-slate-100 text-slate-700 hover:bg-slate-200"}`}
                onClick={() => handleLangClick("hi")}
              >
                {i18n.t("language_hindi")}
              </button>
              <button
                className={`btn px-5 py-2.5 ${lang === "mr" ? "bg-primary-500 text-white shadow-md hover:-translate-y-0.5" : "bg-slate-100 text-slate-700 hover:bg-slate-200"}`}
                onClick={() => handleLangClick("mr")}
              >
                {i18n.t("language_marathi")}
              </button>
            </div>
          </div>

          <div className="card">
            <h2 className="text-lg font-semibold text-slate-800 tracking-tight">{i18n.t("appearance_clinical")}</h2>
            <p className="text-sm text-slate-500 mt-1">Theme used across the app.</p>

            <div className="mt-5 flex flex-wrap gap-3">
              <button
                className={`btn px-5 py-2.5 ${theme === "clinical" ? "bg-primary-500 text-white shadow-md hover:-translate-y-0.5" : "bg-slate-100 text-slate-700 hover:bg-slate-200"}`}
                onClick={() => handleThemeClick("clinical")}
              >
                {i18n.t("appearance_clinical")}
              </button>
              <button
                className={`btn px-5 py-2.5 ${theme === "dark" ? "bg-primary-500 text-white shadow-md hover:-translate-y-0.5" : "bg-slate-100 text-slate-700 hover:bg-slate-200"}`}
                onClick={() => handleThemeClick("dark")}
              >
                {i18n.t("appearance_dark")}
              </button>
              <button
                className={`btn px-5 py-2.5 ${theme === "contrast" ? "bg-primary-500 text-white shadow-md hover:-translate-y-0.5" : "bg-slate-100 text-slate-700 hover:bg-slate-200"}`}
                onClick={() => handleThemeClick("contrast")}
              >
                {i18n.t("appearance_contrast")}
              </button>
            </div>
          </div>

          <div className="card">
            <h2 className="text-lg font-semibold text-slate-800 tracking-tight">Backend / API URLs</h2>
            <p className="text-sm text-slate-500 mt-1">Set your backend endpoints for MRI and Behaviour model.</p>

            <div className="mt-5 grid grid-cols-1 gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1.5">MRI Model URL</label>
                <input value={mriUrl} onChange={(e) => setMriUrl(e.target.value)} placeholder="http://127.0.0.1:8000" className="input-field" />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1.5">Behaviour Model URL</label>
                <input value={behavUrl} onChange={(e) => setBehavUrl(e.target.value)} placeholder="http://127.0.0.1:8000" className="input-field" />
              </div>

              <div className="flex flex-col sm:flex-row gap-4 sm:items-center mt-2">
                <button onClick={runHealthChecks} className="btn bg-slate-800 text-white hover:bg-slate-900 px-5 py-2.5">Run health checks</button>
                <div className="flex flex-col sm:flex-row gap-3 sm:gap-6 bg-slate-50 px-4 py-2.5 rounded-xl border border-slate-100 flex-1">
                  <div className="text-sm text-slate-600">MRI: <span className="font-bold text-slate-800">{healthStatus.mri ?? "n/a"}</span></div>
                  <div className="text-sm text-slate-600">Behaviour: <span className="font-bold text-slate-800">{healthStatus.behavi ?? "n/a"}</span></div>
                </div>
              </div>
            </div>
          </div>

          <div className="card">
            <h2 className="text-lg font-semibold text-slate-800 tracking-tight">Voice Assistant</h2>
            <p className="text-sm text-slate-500 mt-1">Enable microphone-based input and voice commands for the assistant.</p>

            <div className="mt-5 flex flex-col sm:flex-row sm:items-center gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100">
              <label className="inline-flex items-center gap-3 cursor-pointer">
                <input type="checkbox" checked={voiceEnabled} onChange={(e) => handleVoiceToggle(e.target.checked)} className="w-5 h-5 rounded text-primary-500 focus:ring-primary-500 border-slate-300 cursor-pointer" />
                <span className="text-sm font-medium text-slate-800">{i18n.t("enable_voice")}</span>
              </label>

              <div className="text-xs text-slate-500 sm:ml-auto">Note: Browser permission required.</div>
            </div>
          </div>

          <div className="card border-rose-100">
            <h2 className="text-lg font-semibold text-slate-800 tracking-tight">Data & Export</h2>
            <p className="text-sm text-slate-500 mt-1">Export or clear patient data. Use with caution.</p>

            <div className="mt-5 flex flex-wrap gap-3">
              <button onClick={exportPatients} className="btn bg-emerald-100 text-emerald-800 hover:bg-emerald-200 px-5 py-2.5">{i18n.t("export_patients")}</button>
              <button onClick={clearAllPatients} className="btn bg-rose-50 text-rose-600 hover:bg-rose-100 border border-rose-200 px-5 py-2.5">{i18n.t("clear_patients")}</button>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4">
            <div className="text-sm font-medium text-emerald-600">{statusMessage}</div>
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <button onClick={saveAll} className="btn-primary w-full sm:w-auto">{i18n.t("save")}</button>
              <button onClick={revert} className="btn-ghost w-full sm:w-auto">{i18n.t("revert")}</button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
