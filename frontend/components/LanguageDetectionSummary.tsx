'use client';

import { Globe, Languages } from 'lucide-react';
import { useLanguageStore } from '@/lib/stores/languageStore';
import { getLanguageByCode, type Language } from '@/lib/languageConfig';
import { useT } from '@/hooks/useTranslation';

interface LanguageCount {
  language: Language;
  count: number;
}

interface LanguageDetectionSummaryProps {
  detectedLanguages: string[];
  className?: string;
}

export default function LanguageDetectionSummary({
  detectedLanguages,
  className,
}: LanguageDetectionSummaryProps) {
  const currentLanguage = useLanguageStore((state) => state.currentLanguage);
  const detectedLanguagesText = useT('Detected Languages');
  const languagesText = useT('Languages');

  // Count occurrences of each language
  const languageCounts = detectedLanguages.reduce(
    (acc, langCode) => {
      const language = getLanguageByCode(langCode);
      if (language && langCode !== 'en') {
        acc[langCode] = (acc[langCode] || 0) + 1;
      }
      return acc;
    },
    {} as Record<string, number>
  );

  // Convert to array and sort by count
  const sortedLanguages: LanguageCount[] = Object.entries(languageCounts)
    .map(([code, count]) => ({
      language: getLanguageByCode(code)!,
      count,
    }))
    .sort((a, b) => b.count - a.count);

  // Don't show if no non-English languages detected
  if (sortedLanguages.length === 0) {
    return null;
  }

  return (
    <div
      className={`flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 ${className}`}
    >
      <Globe className="w-4 h-4" />
      <span className="font-medium">{detectedLanguagesText}:</span>
      <div className="flex items-center gap-1">
        {sortedLanguages.slice(0, 3).map(({ language, count }) => (
          <div
            key={language.code}
            className="flex items-center gap-1 bg-gray-100 dark:bg-zinc-700 px-2 py-1 rounded-full text-xs"
            title={`${language.label}: ${count} items`}
          >
            <span>{language.emoji}</span>
            <span className="font-medium">{count}</span>
          </div>
        ))}
        {sortedLanguages.length > 3 && (
          <span className="text-xs text-gray-500">
            +{sortedLanguages.length - 3} more
          </span>
        )}
      </div>
    </div>
  );
}
