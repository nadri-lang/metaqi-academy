import { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';

interface TranslationCache {
  [key: string]: string;
}

const translationCache: TranslationCache = {};

// Simple translation API using Google Translate (free)
async function translateTextClient(text: string, targetLang: string): Promise<string> {
  if (!text || targetLang === 'es') return text;
  
  const cacheKey = `${text.substring(0, 50)}_${targetLang}`;
  if (translationCache[cacheKey]) {
    return translationCache[cacheKey];
  }

  try {
    // Use LibreTranslate API (free, no key required)
    const response = await fetch('https://translate.argosopentech.com/translate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        q: text,
        source: 'es',
        target: targetLang,
        format: 'text',
      }),
    });

    if (!response.ok) {
      console.warn('Translation API failed, returning original text');
      return text;
    }

    const data = await response.json();
    const translated = data.translatedText || text;
    
    translationCache[cacheKey] = translated;
    return translated;
  } catch (error) {
    console.error('Translation error:', error);
    return text; // Return original on error
  }
}

/**
 * Hook to translate content automatically based on current language
 * Usage: const translatedText = useTranslate(originalText);
 */
export function useTranslate(text: string | undefined | null): string {
  const { language } = useLanguage();
  const [translated, setTranslated] = useState(text || '');
  const [isTranslating, setIsTranslating] = useState(false);

  useEffect(() => {
    if (!text) {
      setTranslated('');
      return;
    }

    if (language === 'es') {
      setTranslated(text);
      return;
    }

    setIsTranslating(true);
    translateTextClient(text, language)
      .then((result) => {
        setTranslated(result);
      })
      .catch((error) => {
        console.error('Translation failed:', error);
        setTranslated(text);
      })
      .finally(() => {
        setIsTranslating(false);
      });
  }, [text, language]);

  return translated;
}

/**
 * Hook to translate an array of strings
 */
export function useTranslateArray(items: string[] | undefined | null): string[] {
  const { language } = useLanguage();
  const [translated, setTranslated] = useState<string[]>(items || []);

  useEffect(() => {
    if (!items || items.length === 0) {
      setTranslated([]);
      return;
    }

    if (language === 'es') {
      setTranslated(items);
      return;
    }

    Promise.all(items.map((item) => translateTextClient(item, language)))
      .then((results) => {
        setTranslated(results);
      })
      .catch((error) => {
        console.error('Array translation failed:', error);
        setTranslated(items);
      });
  }, [items, language]);

  return translated;
}

/**
 * Translate a single piece of text immediately (for use in async functions)
 */
export async function translateText(text: string, targetLang: string): Promise<string> {
  return translateTextClient(text, targetLang);
}
