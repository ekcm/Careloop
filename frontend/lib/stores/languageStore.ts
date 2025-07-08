import { create } from 'zustand';
import { LANGUAGES, type Language } from '../languageConfig';

interface LanguageState {
  currentLanguage: Language;
  setCurrentLanguage: (language: Language) => void;
  isTranslating: boolean;
  setIsTranslating: (translating: boolean) => void;
}

export const useLanguageStore = create<LanguageState>((set) => ({
  currentLanguage: LANGUAGES[0],
  setCurrentLanguage: (language) => set({ currentLanguage: language }),
  isTranslating: false,
  setIsTranslating: (translating) => set({ isTranslating: translating }),
}));
