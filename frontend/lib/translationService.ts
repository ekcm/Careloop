import { useTranslationStore } from './stores/translationStore';

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

class TranslationService {
  private config: TranslationConfig | null = null;

  // Generate consistent ID for text
  private generateId(text: string): string {
    const trimmedText = text.slice(0, 50);
    let hash = 0;
    for (let i = 0; i < trimmedText.length; i++) {
      const char = trimmedText.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash;
    }
    return `trans_${Math.abs(hash).toString(36)}_${text.length}`;
  }

  // Generate composite key for text + language combination
  private getCompositeKey(textId: string, languageCode: string): string {
    return `${textId}_${languageCode}`;
  }

  // Register text for translation and return a unique ID
  registerText(originalText: string): string {
    const store = useTranslationStore.getState();
    const id = this.generateId(originalText);

    if (!store.translations[id]) {
      store.setTranslation(id, {
        id,
        originalText,
        translatedText: originalText, // fallback to original
        isTranslating: false,
      });
    }

    return id;
  }

  // Get translation for a text ID and language
  getTranslation(
    id: string,
    languageCode?: string
  ): TranslationItem | undefined {
    const store = useTranslationStore.getState();

    if (languageCode) {
      // Try to get cached translation for specific language
      const compositeKey = this.getCompositeKey(id, languageCode);
      const cachedTranslation = store.translations[compositeKey];
      if (cachedTranslation) {
        return cachedTranslation;
      }
    }

    // Fallback to original item
    return store.translations[id];
  }

  // Get all current translations
  getAllTranslations(): TranslationItem[] {
    const store = useTranslationStore.getState();
    return Object.values(store.translations);
  }

  // Translate text immediately (async processing)
  async queueForTranslation(id: string, targetLanguage: string): Promise<void> {
    const store = useTranslationStore.getState();
    const item = store.translations[id];
    if (!item) return;

    // Check if we already have a translation for this text + language combination
    const compositeKey = this.getCompositeKey(id, targetLanguage);
    const existingTranslation = store.translations[compositeKey];

    if (existingTranslation && existingTranslation.translatedText) {
      // We already have this translation, no need to translate
      if (this.config?.ENABLE_LOGGING) {
        console.log(
          `Cache hit for "${item.originalText}" -> "${existingTranslation.translatedText}" (${targetLanguage})`
        );
      }
      return;
    }

    // Skip empty or whitespace-only text
    if (!item.originalText.trim()) {
      if (this.config?.ENABLE_LOGGING) {
        console.log(`Skipping empty text for translation`);
      }
      return;
    }

    // Mark as translating
    store.setTranslating(id, true);

    // Load config if not already loaded
    if (!this.config) {
      const { TRANSLATION_CONFIG } = await import('./translationConfig');
      this.config = TRANSLATION_CONFIG;
      store.setConfig(this.config);
    }

    try {
      if (this.config?.ENABLE_LOGGING) {
        console.log(`Translating "${item.originalText}" to ${targetLanguage}`);
      }

      // Translate immediately
      const translatedText = await this.translateText(
        item.originalText,
        targetLanguage
      );

      // Store the translation with composite key for caching
      store.setTranslation(compositeKey, {
        id: compositeKey,
        originalText: item.originalText,
        translatedText,
        isTranslating: false,
        languageCode: targetLanguage,
      });

      // Also update the original item for backward compatibility
      store.setTranslation(id, {
        ...item,
        translatedText,
        isTranslating: false,
      });

      if (this.config?.ENABLE_LOGGING) {
        console.log(
          `Translation complete: "${item.originalText}" -> "${translatedText}"`
        );
      }
    } catch (error) {
      console.error(`Translation failed for "${item.originalText}":`, error);

      // Reset translation state on error
      store.setTranslating(id, false);
    }
  }

  // Translate single text immediately
  private async translateText(
    text: string,
    targetLanguage: string
  ): Promise<string> {
    if (!this.config?.USE_REAL_TRANSLATION) {
      // Fallback to mock for development
      if (this.config?.ENABLE_LOGGING) {
        console.log(`Mock translating "${text}" to ${targetLanguage}`);
      }
      return `[${targetLanguage.toUpperCase()}] ${text}`;
    }

    try {
      // Dynamically import OpenAI service to avoid loading it unnecessarily
      const { openaiService } = await import('./openaiService');

      if (this.config?.ENABLE_LOGGING) {
        console.log(
          `Real translating "${text}" to ${targetLanguage} via OpenAI`
        );
      }

      // Use the single text translation method
      const translations = await openaiService.translateBatch(
        [text],
        targetLanguage
      );
      return translations[0] || text;
    } catch (error) {
      console.error('OpenAI translation failed, falling back to mock:', error);
      // Fallback to mock on any error
      return `[${targetLanguage.toUpperCase()}] ${text}`;
    }
  }

  // Clear all translations (useful for testing/reset)
  clear(): void {
    const store = useTranslationStore.getState();
    store.clear();
  }
}

// Singleton instance
export const translationService = new TranslationService();
