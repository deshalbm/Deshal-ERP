import React, { createContext, useContext, useState, useEffect, ReactNode, useMemo } from "react";
import { Language, TranslationDictionary, translations } from "./translations";

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  toggleLanguage: () => void;
  t: (key: keyof TranslationDictionary, params?: Record<string, string | number>) => string;
  dir: "rtl" | "ltr";
  isRTL: boolean;
}

const LANGUAGE_STORAGE_KEY = "rv_language_pref";

const defaultT = (key: keyof TranslationDictionary, params?: Record<string, string | number>): string => {
  let str = translations.ar[key] || String(key);
  if (params) {
    Object.entries(params).forEach(([k, v]) => {
      str = str.replace(new RegExp(`\\{${k}\\}`, "g"), String(v));
    });
  }
  return str;
};

const defaultContextValue: LanguageContextType = {
  language: "ar",
  setLanguage: () => {},
  toggleLanguage: () => {},
  t: defaultT,
  dir: "rtl",
  isRTL: true
};

const LanguageContext = createContext<LanguageContextType>(defaultContextValue);

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem(LANGUAGE_STORAGE_KEY);
      if (saved === "ar" || saved === "en") {
        return saved;
      }
    }
    return "ar";
  });

  const dir: "rtl" | "ltr" = language === "ar" ? "rtl" : "ltr";
  const isRTL = language === "ar";

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
      document.documentElement.setAttribute("dir", dir);
      document.documentElement.setAttribute("lang", language);
      document.documentElement.classList.toggle("rtl", isRTL);
      document.documentElement.classList.toggle("ltr", !isRTL);
    }
  }, [language, dir, isRTL]);

  const setLanguage = (newLang: Language) => {
    setLanguageState(newLang);
  };

  const toggleLanguage = () => {
    const nextLang: Language = language === "ar" ? "en" : "ar";
    setLanguageState(nextLang);
  };

  const t = (key: keyof TranslationDictionary, params?: Record<string, string | number>): string => {
    let str = translations[language]?.[key] || translations.ar[key] || String(key);
    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        str = str.replace(new RegExp(`\\{${k}\\}`, "g"), String(v));
      });
    }
    return str;
  };

  const value = useMemo(
    () => ({
      language,
      setLanguage,
      toggleLanguage,
      t,
      dir,
      isRTL
    }),
    [language, dir, isRTL]
  );

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  return context || defaultContextValue;
};

