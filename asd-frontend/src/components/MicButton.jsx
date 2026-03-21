import React, { useEffect, useState, useRef } from "react";

const MicButton = ({ onTranscript, label = "Mic" }) => {
  const [listening, setListening] = useState(false);
  const recognitionRef = useRef(null);

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition || null;
    if (!SpeechRecognition) return;
    recognitionRef.current = new SpeechRecognition();
    recognitionRef.current.continuous = true;
    recognitionRef.current.interimResults = false;
    recognitionRef.current.lang = "en-US";
    recognitionRef.current.onresult = (event) => {
      let text = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        text += event.results[i][0].transcript;
      }
      if (text.trim()) onTranscript((prev) => (prev ? `${prev} ${text.trim()}` : text.trim()));
    };
    recognitionRef.current.onerror = () => {
      setListening(false);
      try { recognitionRef.current.stop(); } catch {}
    };
    return () => {
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch {}
        recognitionRef.current = null;
      }
    };
  }, [onTranscript]);

  const toggleListening = () => {
    const r = recognitionRef.current;
    if (!r) return;
    if (!listening) {
      try {
        r.start();
        setListening(true);
      } catch {
        setListening(false);
      }
    } else {
      try {
        r.stop();
      } catch {}
      setListening(false);
    }
  };

  return (
    <button
      type="button"
      onClick={toggleListening}
      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium ${
        listening ? "bg-rose-50 text-rose-600 border border-rose-200" : "bg-slate-100 hover:bg-slate-200 text-slate-700 border border-transparent"
      }`}
      aria-pressed={listening}
      aria-live="polite"
    >
      <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 ${listening ? "animate-pulse" : ""}`} viewBox="0 0 20 20" fill="currentColor">
        <path d="M9 2a1 1 0 00-1 1v6a1 1 0 102 0V3a1 1 0 00-1-1z" />
        <path d="M5 8a4 4 0 008 0v-.5a1 1 0 112 0V8a6 6 0 11-12 0v-.5a1 1 0 112 0V8z" />
        <path d="M11 14.08V16a2 2 0 11-4 0v-1.92a6.001 6.001 0 005-5.98V8a1 1 0 10-2 0v-.9A6.001 6.001 0 0111 14.08z" />
      </svg>
      <span>{listening ? "Listening..." : label}</span>
    </button>
  );
};

export default MicButton;
