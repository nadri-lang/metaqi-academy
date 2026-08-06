import React, { createContext, useContext, useEffect, useState } from 'react';
import { storage } from '@/src/utils/storage';
import * as Localization from 'expo-localization';
import es from '@/src/i18n/es';
import en from '@/src/i18n/en';
import fr from '@/src/i18n/fr';
import de from '@/src/i18n/de';
import ro from '@/src/i18n/ro';

export type Language = 'es' | 'en' | 'fr' | 'de' | 'ro';

const translations = { es, en, fr, de, ro };

type TranslationKey = string;

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => Promise<void>;
  t: (key: TranslationKey) => string;
  // Get the correct localized value from backend content (title, title_en, etc.)
  localizeContent: (baseValue: string | null | undefined, enValue?: string | null | undefined) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const getNested = (obj: any, path: string): string | null => {
  const keys = path.split('.');
  let current = obj;
  for (const key of keys) {
    if (current && typeof current === 'object' && key in current) {
      current = current[key];
    } else {
      return null; // Return null if not found
    }
  }
  return typeof current === 'string' ? current : null;
};

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>('es');

  useEffect(() => {
    loadLanguage();
  }, []);

  const loadLanguage = async () => {
    try {
      const stored = await storage.getItem('app_language', null);
      if (stored === 'es' || stored === 'en' || stored === 'fr' || stored === 'de' || stored === 'ro') {
        setLanguageState(stored);
      } else {
        // Detect device language
        const locales = Localization.getLocales();
        const deviceLang = locales?.[0]?.languageCode;
        if (deviceLang === 'en') {
          setLanguageState('en');
        } else if (deviceLang === 'fr') {
          setLanguageState('fr');
        } else if (deviceLang === 'de') {
          setLanguageState('de');
        } else if (deviceLang === 'ro') {
          setLanguageState('ro');
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
    // Try current language
    let result = getNested(translations[language], key);
    if (result !== null) return result;

    // Fallback to Spanish
    result = getNested(translations.es, key);
    if (result !== null) return result;

    // Fallback to English
    result = getNested(translations.en, key);
    if (result !== null) return result;

    // Last resort: return empty string (never show the key literal)
    return '';
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
