'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';

export type Language = {
  code: string;
  label: string;
  emoji: string;
};

export const LANGUAGES = [
  { code: 'en', label: 'English', emoji: '🇬🇧' },
  { code: 'zh', label: '中文', emoji: '🇨🇳' },
  { code: 'ta', label: 'தமிழ்', emoji: '🇮🇳' },
  { code: 'ms', label: 'Bahasa Melayu', emoji: '🇲🇾' },
  { code: 'tl', label: 'Tagalog', emoji: '🇵🇭' },
] as const;

interface LanguageContextType {
  currentLanguage: Language;
  setCurrentLanguage: (language: Language) => void;
  isTranslating: boolean;
  setIsTranslating: (translating: boolean) => void;
}

const LanguageContext = createContext<LanguageContextType | undefined>(
  undefined
);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [currentLanguage, setCurrentLanguage] = useState<Language>(
    LANGUAGES[0]
  );
  const [isTranslating, setIsTranslating] = useState(false);

  return (
    <LanguageContext.Provider
      value={{
        currentLanguage,
        setCurrentLanguage,
        isTranslating,
        setIsTranslating,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
