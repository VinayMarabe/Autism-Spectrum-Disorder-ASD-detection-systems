// src/context/LanguageContext.js
import React, { createContext, useContext, useState, useEffect } from "react";

const defaultLang = localStorage.getItem("lang") || "en";

const LanguageContext = createContext({
  lang: defaultLang,
  setLang: () => {},
});

export const LanguageProvider = ({ children }) => {
  const [lang, setLang] = useState(defaultLang);

  useEffect(() => {
    localStorage.setItem("lang", lang);
  }, [lang]);

  return (
    <LanguageContext.Provider value={{ lang, setLang }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);
