'use client';

import { useEffect, useMemo, useState } from 'react';
import { useLanguage } from '@/lib/LanguageContext';
import { translationService } from '@/lib/translationService';
import { useTranslationStore } from '@/lib/stores/translationStore';

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
  const [textId, setTextId] = useState<string | null>(null);

  // Subscribe to store changes for reactivity
  const translations = useTranslationStore((state) => state.translations);

  // Generate stable ID for this text
  const stableTextId = useMemo(() => {
    // Create a stable ID without calling registerText
    const trimmedText = text.slice(0, 50);
    let hash = 0;
    for (let i = 0; i < trimmedText.length; i++) {
      const char = trimmedText.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash;
    }
    return `trans_${Math.abs(hash).toString(36)}_${text.length}`;
  }, [text]);

  // Register text in effect to avoid state updates during render
  useEffect(() => {
    const id = translationService.registerText(text);
    setTextId(id);
  }, [text]);

  // Queue for translation when language changes
  useEffect(() => {
    if (textId && currentLanguage.code !== 'en') {
      translationService.queueForTranslation(textId, currentLanguage.code);
    }
  }, [textId, currentLanguage.code]);

  // Get current translation state
  const translationItem = textId
    ? translationService.getTranslation(textId, currentLanguage.code)
    : undefined;

  const result = {
    translatedText:
      currentLanguage.code === 'en'
        ? text
        : translationItem?.translatedText || text,
    isTranslating: translationItem?.isTranslating || false,
    originalText: text,
  };

  return result;
}

/**
 * Hook for translating multiple texts at once
 * @param texts - Array of texts to translate
 * @returns Array of translation results
 */
export function useTranslations(texts: string[]): UseTranslationResult[] {
  const { currentLanguage } = useLanguage();
  const [textIds, setTextIds] = useState<string[]>([]);

  // Subscribe to store changes for reactivity
  const translations = useTranslationStore((state) => state.translations);

  // Generate stable IDs for all texts
  const stableTextIds = useMemo(() => {
    return texts.map((text) => {
      const trimmedText = text.slice(0, 50);
      let hash = 0;
      for (let i = 0; i < trimmedText.length; i++) {
        const char = trimmedText.charCodeAt(i);
        hash = (hash << 5) - hash + char;
        hash = hash & hash;
      }
      return `trans_${Math.abs(hash).toString(36)}_${text.length}`;
    });
  }, [texts]);

  // Register texts in effect to avoid state updates during render
  useEffect(() => {
    const ids = texts.map((text) => translationService.registerText(text));
    setTextIds(ids);
  }, [texts]);

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
    const translationItem = textIds[index]
      ? translationService.getTranslation(textIds[index], currentLanguage.code)
      : undefined;

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
