'use client';

import { useEffect, useState, useMemo } from 'react';
import { useLanguage } from '@/lib/LanguageContext';
import { translationService } from '@/lib/translationService';

interface UseTranslationResult {
  translatedText: string;
  isTranslating: boolean;
  originalText: string;
}

/**
 * Hook for translating text based on current language selection
 * @param text - The original text to translate
 * @returns Object with translatedText, isTranslating status, and originalText
 */
export function useTranslation(text: string): UseTranslationResult {
  const { currentLanguage } = useLanguage();
  const [updateCounter, setUpdateCounter] = useState(0);

  // Generate stable ID for this text
  const textId = useMemo(() => {
    return translationService.registerText(text);
  }, [text]);

  // Force re-render when translations update
  useEffect(() => {
    const unsubscribe = translationService.subscribe(() => {
      // console.log(`Hook received translation update for text: "${text}"`);
      setUpdateCounter((prev) => prev + 1);
    });
    return () => {
      unsubscribe();
    };
  }, [text]);

  // Queue for translation when language changes
  useEffect(() => {
    // Only translate if not English (assume English is default)
    if (currentLanguage.code !== 'en') {
      translationService.queueForTranslation(textId, currentLanguage.code);
    }
  }, [textId, currentLanguage.code]);

  // Get current translation state
  const translationItem = translationService.getTranslation(textId);

  const result = {
    translatedText:
      currentLanguage.code === 'en'
        ? text
        : translationItem?.translatedText || text,
    isTranslating: translationItem?.isTranslating || false,
    originalText: text,
  };

  // Debug logging
  // console.log(`Hook returning for "${text}":`, result.translatedText);

  return result;
}

/**
 * Hook for translating multiple texts at once
 * @param texts - Array of texts to translate
 * @returns Array of translation results
 */
export function useTranslations(texts: string[]): UseTranslationResult[] {
  const { currentLanguage } = useLanguage();
  const [updateCounter, setUpdateCounter] = useState(0);

  // Generate stable IDs for all texts
  const textIds = useMemo(() => {
    return texts.map((text) => translationService.registerText(text));
  }, [texts]);

  // Force re-render when translations update
  useEffect(() => {
    const unsubscribe = translationService.subscribe(() => {
      setUpdateCounter((prev) => prev + 1);
    });
    return () => {
      unsubscribe();
    };
  }, []);

  // Queue all texts for translation when language changes
  useEffect(() => {
    if (currentLanguage.code !== 'en') {
      textIds.forEach((id) => {
        translationService.queueForTranslation(id, currentLanguage.code);
      });
    }
  }, [textIds, currentLanguage.code]);

  // Return translation results for all texts
  return texts.map((text, index) => {
    const translationItem = translationService.getTranslation(textIds[index]);

    return {
      translatedText:
        currentLanguage.code === 'en'
          ? text
          : translationItem?.translatedText || text,
      isTranslating: translationItem?.isTranslating || false,
      originalText: text,
    };
  });
}

/**
 * Simple hook that just returns translated text (most common use case)
 * @param text - The text to translate
 * @returns The translated text string
 */
export function useT(text: string): string {
  const { translatedText } = useTranslation(text);
  if (
    typeof translatedText === 'string' &&
    translatedText.toLowerCase().includes('error')
  ) {
    return text;
  }
  return translatedText;
}
