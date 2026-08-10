import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { defaultLanguage, languageStorageKey, translations } from './translations';

const LanguageContext = createContext(null);

export function LanguageProvider({ children }) {
  const [language, setLanguage] = useState(() => {
    if (typeof window === 'undefined') return null;
    const saved = localStorage.getItem(languageStorageKey);
    if (saved === 'en' || saved === 'gu') return saved;
    return defaultLanguage;
  });

  useEffect(() => {
    if (language) {
      localStorage.setItem(languageStorageKey, language);
    }
  }, [language]);

  const value = useMemo(() => {
    const activeLanguage = language || defaultLanguage;
    const translation = translations[activeLanguage] || translations[defaultLanguage];

    const resolve = (dictionary, path) => String(path).split('.').reduce(
      (current, key) => (current && typeof current === 'object' ? current[key] : undefined),
      dictionary,
    );

    const t = (path) => {
      const localizedValue = resolve(translation, path);
      if (typeof localizedValue === 'string' && localizedValue.trim()) return localizedValue;

      const defaultValue = resolve(translations[defaultLanguage], path);
      if (typeof defaultValue === 'string' && defaultValue.trim()) return defaultValue;

      return '—';
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
