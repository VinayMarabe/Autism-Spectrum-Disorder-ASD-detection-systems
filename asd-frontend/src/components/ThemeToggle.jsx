import React, { useEffect, useState } from "react";

const KEY = "drthynk_theme";

const ThemeToggle = () => {
  const [theme, setTheme] = useState(() => {
    try {
      return localStorage.getItem(KEY) || "clinical";
    } catch {
      return "clinical";
    }
  });

  useEffect(() => {
    document.documentElement.classList.remove("theme-clinical", "theme-ai");
    document.documentElement.classList.add(theme === "ai" ? "theme-ai" : "theme-clinical");
    try {
      localStorage.setItem(KEY, theme);
    } catch {}
  }, [theme]);

  return (
    <div className="inline-flex items-center gap-2">
      <button
        onClick={() => setTheme("clinical")}
        className={`px-2 py-1 rounded-full text-xs font-medium ${theme === "clinical" ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-700"}`}
        aria-pressed={theme === "clinical"}
      >
        Clinical
      </button>
      <button
        onClick={() => setTheme("ai")}
        className={`px-2 py-1 rounded-full text-xs font-medium ${theme === "ai" ? "bg-gradient-to-tr from-sky-500 to-emerald-400 text-white" : "bg-slate-100 text-slate-700"}`}
        aria-pressed={theme === "ai"}
      >
        AI
      </button>
    </div>
  );
};

export default ThemeToggle;
