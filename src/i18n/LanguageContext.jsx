fimport { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { defaultLanguage, getPropertyDisplayTitle, languageStorageKey, locationTranslationsGu, translations } from './translations';

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
      if (!path && path !== 0) return '';
      const localizedValue = resolve(translation, path);
      if (typeof localizedValue === 'string' && localizedValue.trim()) return localizedValue;

      const defaultValue = resolve(translations[defaultLanguage], path);
      if (typeof defaultValue === 'string' && defaultValue.trim()) return defaultValue;

      if (activeLanguage === 'gu' && locationTranslationsGu[path]) {
        return locationTranslationsGu[path];
      }

      if (typeof path === 'string' && path.includes('.')) {
        const lastKey = path.split('.').pop();
        return lastKey.replace(/([A-Z])/g, ' $1').replace(/^./, (str) => str.toUpperCase()).trim();
      }

      return String(path);
    };

    return {
      language: activeLanguage,
      setLanguage,
      t,
      getPropertyDisplayTitle: (title) => getPropertyDisplayTitle(title, activeLanguage),
      isGujarati: activeLanguage === 'gu',
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
