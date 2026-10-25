import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import en from '../locales/en';
import hi from '../locales/hi';

export type Language = 'en' | 'hi';
const STORAGE_KEY = 'pravah-language';
const translations = { en, hi };

interface LanguageContextValue {
  language: Language;
  setLanguage: (language: Language) => void;
  t: (englishText: string) => string;
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

const getInitialLanguage = (): Language => {
  try {
    return localStorage.getItem(STORAGE_KEY) === 'hi' ? 'hi' : 'en';
  } catch {
    return 'en';
  }
};

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<Language>(getInitialLanguage);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, language);
    } catch {
      // The selected language remains active for this page session.
    }
    document.documentElement.lang = language === 'hi' ? 'hi' : 'en';
  }, [language]);

  const value = useMemo<LanguageContextValue>(() => ({
    language,
    setLanguage,
    t: (englishText) => translations[language][englishText as keyof typeof en] || englishText,
  }), [language]);

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
};

export const useLanguage = (): LanguageContextValue => {
  const context = useContext(LanguageContext);
  if (!context) throw new Error('useLanguage must be used within LanguageProvider.');
  return context;
};
