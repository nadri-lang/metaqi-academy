import React, { createContext, useContext, useEffect, useState } from 'react';
import { storage } from '@/src/utils/storage';
import * as Localization from 'expo-localization';
import es from '@/src/i18n/es';
import en from '@/src/i18n/en';

export type Language = 'es' | 'en';

const translations = { es, en };

type TranslationKey = string;

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => Promise<void>;
  t: (key: TranslationKey) => string;
  // Get the correct localized value from backend content (title, title_en, etc.)
  localizeContent: (baseValue: string | null | undefined, enValue?: string | null | undefined) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const getNested = (obj: any, path: string): string => {
  const keys = path.split('.');
  let current = obj;
  for (const key of keys) {
    if (current && typeof current === 'object' && key in current) {
      current = current[key];
    } else {
      return path; // Return the key if not found (for debugging)
    }
  }
  return typeof current === 'string' ? current : path;
};

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>('es');

  useEffect(() => {
    loadLanguage();
  }, []);

  const loadLanguage = async () => {
    try {
      const stored = await storage.getItem('app_language', null);
      if (stored === 'es' || stored === 'en') {
        setLanguageState(stored);
      } else {
        // Detect device language
        const locales = Localization.getLocales();
        const deviceLang = locales?.[0]?.languageCode;
        if (deviceLang === 'en') {
          setLanguageState('en');
        } else {
          setLanguageState('es');
        }
      }
    } catch (e) {
      console.error('Error loading language:', e);
    }
  };

  const setLanguage = async (lang: Language) => {
    setLanguageState(lang);
    await storage.setItem('app_language', lang);
  };

  const t = (key: TranslationKey): string => {
    return getNested(translations[language], key);
  };

  const localizeContent = (baseValue: string | null | undefined, enValue?: string | null | undefined): string => {
    if (language === 'en' && enValue) return enValue;
    return baseValue || enValue || '';
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, localizeContent }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
