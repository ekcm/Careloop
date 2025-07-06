export type Language = {
  code: string;
  label: string;
  emoji: string;
  openaiName: string;
};

export const LANGUAGES: readonly Language[] = [
  { code: 'en', label: 'English', emoji: '🇬🇧', openaiName: 'English' },
  {
    code: 'zh',
    label: '中文',
    emoji: '🇨🇳',
    openaiName: 'Chinese (Simplified)',
  },
  { code: 'ta', label: 'தமிழ்', emoji: '🇮🇳', openaiName: 'Tamil' },
  {
    code: 'ms',
    label: 'Bahasa Melayu',
    emoji: '🇲🇾',
    openaiName: 'Malay (Bahasa Melayu)',
  },
  {
    code: 'tl',
    label: 'Tagalog',
    emoji: '🇵🇭',
    openaiName: 'Tagalog (Filipino)',
  },
  {
    code: 'id',
    label: 'Bahasa Indonesia',
    emoji: '🇮🇩',
    openaiName: 'Indonesian',
  },
  {
    code: 'my',
    label: 'မြန်မာဘာသာ',
    emoji: '🇲🇲',
    openaiName: 'Burmese (Myanmar)',
  },
] as const;

// Helper function to get OpenAI-friendly language name
export function getOpenAIName(languageCode: string): string {
  const language = LANGUAGES.find((lang) => lang.code === languageCode);
  return language?.openaiName || languageCode;
}

// Helper function to get language by code
export function getLanguageByCode(code: string): Language | undefined {
  return LANGUAGES.find((lang) => lang.code === code);
}

// Export language codes for type safety
export const LANGUAGE_CODES = LANGUAGES.map((lang) => lang.code);
export type LanguageCode = (typeof LANGUAGE_CODES)[number];
