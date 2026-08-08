import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { defaultLanguage, languageStorageKey, translations } from './translations';

const LanguageContext = createContext(null);

export function LanguageProvider({ children }) {
  const [language, setLanguage] = useState(() => {
    if (typeof window === 'undefined') return null;
    const saved = localStorage.getItem(languageStorageKey);
    if (saved === 'en' || saved === 'gu') return saved;
    return null;
  });

  useEffect(() => {
    if (language) {
      localStorage.setItem(languageStorageKey, language);
    }
  }, [language]);

  const value = useMemo(() => {
    const activeLanguage = language || defaultLanguage;
    const translation = translations[activeLanguage] || translations[defaultLanguage];

    const t = (path) => {
      const keys = String(path).split('.');
      let current = translation;
      for (const key of keys) {
        if (!current || typeof current !== 'object' || !(key in current)) {
          return path;
        }
        current = current[key];
      }
      return current;
    };

    return {
      language,
      setLanguage,
      t,
      isGujarati: language === 'gu',
      translate: translations,
    };
  }, [language]);

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
