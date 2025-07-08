interface TranslationItem {
  id: string;
  originalText: string;
  translatedText?: string;
  isTranslating?: boolean;
  languageCode?: string; // Track which language this translation is for
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
  private translations = new Map<string, TranslationItem>();
  private config: TranslationConfig | null = null; // Will be loaded dynamically

  // Register text for translation and return a unique ID
  registerText(originalText: string): string {
    const id = this.generateId(originalText);

    if (!this.translations.has(id)) {
      this.translations.set(id, {
        id,
        originalText,
        translatedText: originalText, // fallback to original
        isTranslating: false,
      });
    }

    return id;
  }

  // Generate composite key for text + language combination
  private getCompositeKey(textId: string, languageCode: string): string {
    return `${textId}_${languageCode}`;
  }

  // Translate text immediately (async processing)
  async queueForTranslation(id: string, targetLanguage: string) {
    const item = this.translations.get(id);
    if (!item) return;

    // Check if we already have a translation for this text + language combination
    const compositeKey = this.getCompositeKey(id, targetLanguage);
    const existingTranslation = this.translations.get(compositeKey);

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
    item.isTranslating = true;
    this.translations.set(id, item);
    this.notifySubscribers();

    // Load config if not already loaded
    if (!this.config) {
      const { TRANSLATION_CONFIG } = await import('./translationConfig');
      this.config = TRANSLATION_CONFIG;
    }

    try {
      if (this.config?.ENABLE_LOGGING) {
        console.log(`Translating "${item.originalText}" to ${targetLanguage}`);
      }

      // Translate immediately (no batching)
      const translatedText = await this.translateText(
        item.originalText,
        targetLanguage
      );

      // Store the translation with composite key for caching
      const compositeKey = this.getCompositeKey(id, targetLanguage);
      this.translations.set(compositeKey, {
        id: compositeKey,
        originalText: item.originalText,
        translatedText,
        isTranslating: false,
        languageCode: targetLanguage,
      });

      // Also update the original item for backward compatibility
      item.translatedText = translatedText;
      item.isTranslating = false;
      this.translations.set(id, item);

      if (this.config?.ENABLE_LOGGING) {
        console.log(
          `Translation complete: "${item.originalText}" -> "${translatedText}"`
        );
      }

      this.notifySubscribers();
    } catch (error) {
      console.error(`Translation failed for "${item.originalText}":`, error);

      // Reset translation state on error
      item.isTranslating = false;
      this.translations.set(id, item);
      this.notifySubscribers();
    }
  }

  // Get translation for a text ID and language
  getTranslation(
    id: string,
    languageCode?: string
  ): TranslationItem | undefined {
    if (languageCode) {
      // Try to get cached translation for specific language
      const compositeKey = this.getCompositeKey(id, languageCode);
      const cachedTranslation = this.translations.get(compositeKey);
      if (cachedTranslation) {
        return cachedTranslation;
      }
    }

    // Fallback to original item (for backward compatibility)
    return this.translations.get(id);
  }

  // Get all current translations
  getAllTranslations(): TranslationItem[] {
    return Array.from(this.translations.values());
  }

  // Translate single text immediately
  private async translateText(
    text: string,
    targetLanguage: string
  ): Promise<string> {
    // Import config to check if real translation is enabled
    const { TRANSLATION_CONFIG } = await import('./translationConfig');

    if (!TRANSLATION_CONFIG?.USE_REAL_TRANSLATION) {
      // Fallback to mock for development
      if (TRANSLATION_CONFIG?.ENABLE_LOGGING) {
        console.log(`Mock translating "${text}" to ${targetLanguage}`);
      }
      return `[${targetLanguage.toUpperCase()}] ${text}`;
    }

    try {
      // Dynamically import OpenAI service to avoid loading it unnecessarily
      const { openaiService } = await import('./openaiService');

      if (TRANSLATION_CONFIG?.ENABLE_LOGGING) {
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

  // Generate consistent ID for text
  private generateId(text: string): string {
    // Create a simple hash that works in both browser and Node environments
    const trimmedText = text.slice(0, 50);
    let hash = 0;
    for (let i = 0; i < trimmedText.length; i++) {
      const char = trimmedText.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return `trans_${Math.abs(hash).toString(36)}_${text.length}`;
  }

  // Subscriber management for React components
  private subscribers = new Set<() => void>();

  subscribe(callback: () => void) {
    this.subscribers.add(callback);
    return () => this.subscribers.delete(callback);
  }

  private notifySubscribers() {
    this.subscribers.forEach((callback) => callback());
  }

  // Clear all translations (useful for testing/reset)
  clear() {
    this.translations.clear();
  }
}

// Singleton instance
export const translationService = new TranslationService();
