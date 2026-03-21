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
    <div className="p-6">
      <div className="max-w-4xl">
        <h1 className="text-3xl font-semibold text-slate-900">{i18n.t("settings_title")}</h1>
        <p className="text-sm text-slate-500 mt-1">{i18n.t("settings_subtitle")}</p>

        <div className="mt-6 space-y-6">

          <div className="bg-white rounded-xl p-6 border shadow-sm">
            <h2 className="text-lg font-semibold text-slate-800">{i18n.t("language_english")}</h2>
            <p className="text-sm text-slate-500 mt-1">{i18n.t("settings_subtitle")}</p>

            <div className="mt-4 flex gap-3">
              <button
                className={`px-3 py-2 rounded-md ${lang === "en" ? "bg-sky-600 text-white" : "bg-slate-100"}`}
                onClick={() => handleLangClick("en")}
              >
                {i18n.t("language_english")}
              </button>
              <button
                className={`px-3 py-2 rounded-md ${lang === "hi" ? "bg-sky-600 text-white" : "bg-slate-100"}`}
                onClick={() => handleLangClick("hi")}
              >
                {i18n.t("language_hindi")}
              </button>
              <button
                className={`px-3 py-2 rounded-md ${lang === "mr" ? "bg-sky-600 text-white" : "bg-slate-100"}`}
                onClick={() => handleLangClick("mr")}
              >
                {i18n.t("language_marathi")}
              </button>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 border shadow-sm">
            <h2 className="text-lg font-semibold text-slate-800">{i18n.t("appearance_clinical")}</h2>
            <p className="text-sm text-slate-500 mt-1">Theme used across the app.</p>

            <div className="mt-4 flex gap-3">
              <button
                className={`px-3 py-2 rounded-md ${theme === "clinical" ? "bg-sky-600 text-white" : "bg-slate-100"}`}
                onClick={() => handleThemeClick("clinical")}
              >
                {i18n.t("appearance_clinical")}
              </button>
              <button
                className={`px-3 py-2 rounded-md ${theme === "dark" ? "bg-sky-600 text-white" : "bg-slate-100"}`}
                onClick={() => handleThemeClick("dark")}
              >
                {i18n.t("appearance_dark")}
              </button>
              <button
                className={`px-3 py-2 rounded-md ${theme === "contrast" ? "bg-sky-600 text-white" : "bg-slate-100"}`}
                onClick={() => handleThemeClick("contrast")}
              >
                {i18n.t("appearance_contrast")}
              </button>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 border shadow-sm">
            <h2 className="text-lg font-semibold text-slate-800">Backend / API URLs</h2>
            <p className="text-sm text-slate-500 mt-1">Set your backend endpoints for MRI and Behaviour model.</p>

            <div className="mt-4 grid grid-cols-1 gap-3">
              <label className="text-sm text-slate-600">MRI Model URL</label>
              <input value={mriUrl} onChange={(e) => setMriUrl(e.target.value)} placeholder="http://127.0.0.1:8000" className="border rounded-md px-3 py-2 w-full" />

              <label className="text-sm text-slate-600 mt-2">Behaviour Model URL</label>
              <input value={behavUrl} onChange={(e) => setBehavUrl(e.target.value)} placeholder="http://127.0.0.1:8000" className="border rounded-md px-3 py-2 w-full" />

              <div className="flex gap-3 mt-3">
                <button onClick={runHealthChecks} className="px-4 py-2 bg-sky-600 text-white rounded-md">Run health checks</button>
                <div className="flex items-center gap-4">
                  <div className="text-sm">MRI: <span className="font-medium">{healthStatus.mri ?? "n/a"}</span></div>
                  <div className="text-sm">Behaviour: <span className="font-medium">{healthStatus.behavi ?? "n/a"}</span></div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 border shadow-sm">
            <h2 className="text-lg font-semibold text-slate-800">Voice Assistant</h2>
            <p className="text-sm text-slate-500 mt-1">Enable microphone-based input and voice commands for the assistant.</p>

            <div className="mt-4 flex items-center gap-4">
              <label className="inline-flex items-center gap-2">
                <input type="checkbox" checked={voiceEnabled} onChange={(e) => handleVoiceToggle(e.target.checked)} />
                <span className="text-sm">{i18n.t("enable_voice")}</span>
              </label>

              <div className="text-sm text-slate-500">Note: Browser permission required. You can configure recognition language above in Language.</div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 border shadow-sm">
            <h2 className="text-lg font-semibold text-slate-800">Data & Export</h2>
            <p className="text-sm text-slate-500 mt-1">Export or clear patient data. Use with caution.</p>

            <div className="mt-4 flex gap-3">
              <button onClick={exportPatients} className="px-4 py-2 bg-emerald-600 text-white rounded-md">{i18n.t("export_patients")}</button>
              <button onClick={clearAllPatients} className="px-4 py-2 bg-rose-50 text-rose-600 border rounded-md">{i18n.t("clear_patients")}</button>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="text-sm text-slate-500">{statusMessage}</div>
            <div className="flex items-center gap-3">
              <button onClick={saveAll} className="px-4 py-2 bg-sky-600 text-white rounded-md">{i18n.t("save")}</button>
              <button onClick={revert} className="px-4 py-2 rounded-md border">{i18n.t("revert")}</button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
