'use client';

import { useEffect, useState, useMemo } from 'react';
import { languageDetectionService } from '@/lib/languageDetectionService';
import { getLanguageByCode, type Language } from '@/lib/languageConfig';

interface LanguageDetectionResult {
  detectedLanguage: string;
  languageObject?: Language;
  text: string;
  isDetecting: boolean;
  error?: string;
}

interface UseLanguageDetectionResult {
  detectedLanguage: string;
  languageObject?: Language;
  isDetecting: boolean;
  error?: string;
  originalText: string;
}

/**
 * Hook for detecting the language of a single text
 * @param text - The text to detect language for
 * @returns Object with detection results
 */
export function useLanguageDetection(text: string): UseLanguageDetectionResult {
  const [result, setResult] = useState<LanguageDetectionResult>({
    detectedLanguage: 'en',
    text,
    isDetecting: false,
  });

  // Memoize text to avoid unnecessary re-detection
  const memoizedText = useMemo(() => text, [text]);

  useEffect(() => {
    const detectLanguage = async () => {
      if (!memoizedText.trim()) {
        setResult({
          detectedLanguage: 'en',
          text: memoizedText,
          isDetecting: false,
        });
        return;
      }

      setResult((prev) => ({ ...prev, isDetecting: true, error: undefined }));

      try {
        const detection =
          await languageDetectionService.detectLanguage(memoizedText);
        const languageObject = getLanguageByCode(detection.detectedLanguage);

        setResult({
          detectedLanguage: detection.detectedLanguage,
          languageObject,
          text: memoizedText,
          isDetecting: false,
        });
      } catch (error) {
        console.error('Language detection failed:', error);
        setResult({
          detectedLanguage: 'en',
          text: memoizedText,
          isDetecting: false,
          error: 'Failed to detect language',
        });
      }
    };

    detectLanguage();
  }, [memoizedText]);

  return {
    detectedLanguage: result.detectedLanguage,
    languageObject: result.languageObject,
    isDetecting: result.isDetecting,
    error: result.error,
    originalText: result.text,
  };
}

/**
 * Hook for detecting languages of multiple texts
 * @param texts - Array of texts to detect language for
 * @returns Array of detection results
 */
export function useLanguageDetections(
  texts: string[]
): UseLanguageDetectionResult[] {
  const [results, setResults] = useState<LanguageDetectionResult[]>([]);
  const [isDetecting, setIsDetecting] = useState(false);

  // Memoize texts to avoid unnecessary re-detection
  const memoizedTexts = useMemo(() => texts, [texts]);

  useEffect(() => {
    const detectLanguages = async () => {
      if (memoizedTexts.length === 0) {
        setResults([]);
        return;
      }

      setIsDetecting(true);

      try {
        const detections =
          await languageDetectionService.detectLanguages(memoizedTexts);
        const resultsWithObjects = detections.map((detection) => ({
          detectedLanguage: detection.detectedLanguage,
          languageObject: getLanguageByCode(detection.detectedLanguage),
          text: detection.text,
          isDetecting: false,
        }));

        setResults(resultsWithObjects);
      } catch (error) {
        console.error('Batch language detection failed:', error);
        // Set default results on error
        const defaultResults = memoizedTexts.map((text) => ({
          detectedLanguage: 'en',
          text,
          isDetecting: false,
          error: 'Failed to detect language',
        }));
        setResults(defaultResults);
      } finally {
        setIsDetecting(false);
      }
    };

    detectLanguages();
  }, [memoizedTexts]);

  return results.map((result, index) => ({
    detectedLanguage: result.detectedLanguage,
    languageObject: result.languageObject,
    isDetecting: isDetecting || result.isDetecting,
    error: result.error,
    originalText: result.text,
  }));
}
