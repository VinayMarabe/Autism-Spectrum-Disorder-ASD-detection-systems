// src/components/VoiceSearch.jsx
import React, { useEffect, useRef, useState } from "react";
import i18n from "../i18n";

export default function VoiceSearch() {
  const recognitionRef = useRef(null);
  const [enabled, setEnabled] = useState(localStorage.getItem("voice_enabled") === "1");
  const [listening, setListening] = useState(false);
  const [error, setError] = useState("");

  // map app language code -> SpeechRecognition lang
  function mapLangToSpeech(code) {
    if (!code) return "en-US";
    if (code === "hi") return "hi-IN";
    if (code === "mr") return "mr-IN";
    return "en-US";
  }

  useEffect(() => {
    // init recognition
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setError("not_supported");
      recognitionRef.current = null;
      return;
    }

    const r = new SpeechRecognition();
    r.continuous = false;
    r.interimResults = false;
    r.maxAlternatives = 1;

    const appLang = localStorage.getItem("app_lang") || i18n.getLanguage() || "en";
    r.lang = mapLangToSpeech(appLang);

    r.onstart = () => {
      setError("");
    };

    r.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      window.dispatchEvent(new CustomEvent("voice_input", { detail: transcript }));
    };

    r.onend = () => {
      setListening(false);
    };

    r.onerror = (ev) => {
      console.warn("Voice error", ev);
      setListening(false);
      setError("error");
    };

    recognitionRef.current = r;

    return () => {
      try {
        if (recognitionRef.current) recognitionRef.current.stop();
      } catch {}
      recognitionRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    // listen for preference & language changes and storage events (multi-tab)
    function onPrefChanged(e) {
      const val = e.detail && e.detail.enabled;
      setEnabled(!!val);
      if (!val && listening) {
        try { recognitionRef.current?.stop(); } catch {}
        setListening(false);
      }
    }

    function onStorage(e) {
      if (e.key === "voice_enabled") {
        setEnabled(e.newValue === "1");
      }
      if (e.key === "app_lang") {
        const newLang = e.newValue || localStorage.getItem("app_lang") || i18n.getLanguage();
        try {
          if (recognitionRef.current) recognitionRef.current.lang = mapLangToSpeech(newLang);
        } catch {}
      }
    }

    function onAppLangChange(e) {
      const newLang = (e && e.detail) || localStorage.getItem("app_lang") || i18n.getLanguage();
      try {
        if (recognitionRef.current) recognitionRef.current.lang = mapLangToSpeech(newLang);
      } catch {}
    }

    window.addEventListener("voice_pref_changed", onPrefChanged);
    window.addEventListener("storage", onStorage);
    window.addEventListener("app_lang_changed_for_voice", onAppLangChange);
    window.addEventListener("app_language_changed", onAppLangChange);

    return () => {
      window.removeEventListener("voice_pref_changed", onPrefChanged);
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("app_lang_changed_for_voice", onAppLangChange);
      window.removeEventListener("app_language_changed", onAppLangChange);
    };
  }, [listening]);

  function toggleListening() {
    if (!enabled) return;
    const r = recognitionRef.current;
    if (!r) {
      setError("not_supported");
      return;
    }

    try {
      if (!listening) {
        r.start();
        setListening(true);
      } else {
        r.stop();
        setListening(false);
      }
    } catch (err) {
      console.warn("Speech start/stop failed", err);
      setListening(false);
    }
  }

  return (
    <div className="text-xs mt-1">
      {error === "not_supported" && (
        <div className="bg-rose-100 text-rose-700 px-3 py-1 rounded-xl shadow-sm">Voice not supported</div>
      )}

      <button
        type="button"
        onClick={toggleListening}
        className={`mic-button ${listening ? "bg-rose-50 text-rose-600 border border-rose-200" : "bg-slate-100 hover:bg-slate-200 text-slate-700 border border-transparent"}`}
        aria-pressed={listening}
        title={enabled ? (listening ? "Stop listening" : "Start voice") : "Voice disabled in Settings"}
      >
        <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 ${listening ? "animate-pulse" : ""}`} viewBox="0 0 20 20" fill="currentColor">
          <path d="M9 2a1 1 0 00-1 1v6a1 1 0 102 0V3a1 1 0 00-1-1z" />
          <path d="M5 8a4 4 0 008 0v-.5a1 1 0 112 0V8a6 6 0 11-12 0v-.5a1 1 0 112 0V8z" />
        </svg>
        <span className="ml-2">{enabled ? (listening ? "Listening…" : "Voice") : "Voice off"}</span>
      </button>
    </div>
  );
}
