// src/index.js
import React, { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App";
import i18n from "./i18n";

const root = createRoot(document.getElementById("root"));

function RootWrapper() {
  const [lang, setLang] = useState(i18n.getLanguage());

  useEffect(() => {
    // Expose i18n globally for debugging
    window.i18n = i18n;

    const onLang = (e) => {
      const newLang = e?.detail || i18n.getLanguage();
      setLang(newLang);
    };

    window.addEventListener("app_language_changed", onLang);
    return () => window.removeEventListener("app_language_changed", onLang);
  }, []);

  return <App key={lang} />;
}

root.render(<RootWrapper />);
