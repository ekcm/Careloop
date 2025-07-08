import { create } from 'zustand';

interface TranslationItem {
  id: string;
  originalText: string;
  translatedText?: string;
  isTranslating?: boolean;
  languageCode?: string;
}

interface TranslationConfig {
  USE_REAL_TRANSLATION: boolean;
  MODEL: string;
  MAX_RETRIES: number;
  TIMEOUT_MS: number;
  DEFAULT_LANGUAGE: string;
  ENABLE_LOGGING: boolean;
}

interface TranslationState {
  translations: Record<string, TranslationItem>;
  config: TranslationConfig | null;
  // Pure state actions
  setTranslation: (id: string, item: TranslationItem) => void;
  setTranslating: (id: string, isTranslating: boolean) => void;
  setConfig: (config: TranslationConfig) => void;
  clear: () => void;
}

export const useTranslationStore = create<TranslationState>((set) => ({
  translations: {},
  config: null,

  setTranslation: (id: string, item: TranslationItem) => {
    set((state) => ({
      translations: {
        ...state.translations,
        [id]: item,
      },
    }));
  },

  setTranslating: (id: string, isTranslating: boolean) => {
    set((state) => ({
      translations: {
        ...state.translations,
        [id]: {
          ...state.translations[id],
          isTranslating,
        },
      },
    }));
  },

  setConfig: (config: TranslationConfig) => {
    set({ config });
  },

  clear: () => {
    set({ translations: {} });
  },
}));
