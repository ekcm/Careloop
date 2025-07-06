interface TranslationItem {
  id: string;
  originalText: string;
  translatedText?: string;
  isTranslating?: boolean;
  languageCode?: string; // Track which language this translation is for
}

interface TranslationBatch {
  texts: string[];
  ids: string[];
  targetLanguage: string;
}

interface TranslationConfig {
  USE_REAL_TRANSLATION: boolean;
  BATCH_DELAY_MS: number;
  MAX_BATCH_SIZE: number;
  MODEL: string;
  MAX_RETRIES: number;
  TIMEOUT_MS: number;
  DEFAULT_LANGUAGE: string;
  ENABLE_LOGGING: boolean;
}

class TranslationService {
  private translations = new Map<string, TranslationItem>();
  private pendingBatch: TranslationBatch | null = null;
  private batchTimeout: NodeJS.Timeout | null = null;
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

  // Add text to pending batch for translation
  async queueForTranslation(id: string, targetLanguage: string) {
    const item = this.translations.get(id);
    if (!item) return;

    // Check if we already have a translation for this text + language combination
    const compositeKey = this.getCompositeKey(id, targetLanguage);
    const existingTranslation = this.translations.get(compositeKey);

    if (existingTranslation && existingTranslation.translatedText) {
      // We already have this translation, no need to queue
      if (this.config?.ENABLE_LOGGING) {
        console.log(
          `Cache hit for "${item.originalText}" -> "${existingTranslation.translatedText}" (${targetLanguage})`
        );
      }
      return;
    }

    // Mark as translating
    item.isTranslating = true;
    this.translations.set(id, item);

    // Initialize or update pending batch
    if (
      !this.pendingBatch ||
      this.pendingBatch.targetLanguage !== targetLanguage
    ) {
      this.pendingBatch = {
        texts: [],
        ids: [],
        targetLanguage,
      };
    }

    // Add to batch if not already included
    // Double-check that pendingBatch is still valid
    if (this.pendingBatch && !this.pendingBatch.ids.includes(id)) {
      this.pendingBatch.texts.push(item.originalText);
      this.pendingBatch.ids.push(id);
    }

    // Load config if not already loaded
    if (!this.config) {
      const { TRANSLATION_CONFIG } = await import('./translationConfig');
      this.config = TRANSLATION_CONFIG;
    }

    // Process batch if full or set timeout
    if (
      this.pendingBatch &&
      this.config &&
      (this.config.MAX_BATCH_SIZE === -1 ||
        this.pendingBatch.texts.length >= this.config.MAX_BATCH_SIZE)
    ) {
      this.processBatch();
    } else if (this.pendingBatch) {
      this.scheduleBatchProcessing();
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

  // Schedule batch processing with debounce
  private async scheduleBatchProcessing() {
    if (this.batchTimeout) {
      clearTimeout(this.batchTimeout);
    }

    // Load config if not already loaded
    if (!this.config) {
      const { TRANSLATION_CONFIG } = await import('./translationConfig');
      this.config = TRANSLATION_CONFIG;
    }

    this.batchTimeout = setTimeout(() => {
      this.processBatch();
    }, this.config.BATCH_DELAY_MS);
  }

  // Process the current batch
  private async processBatch() {
    if (!this.pendingBatch || this.pendingBatch.texts.length === 0) return;

    const batch = { ...this.pendingBatch };
    this.pendingBatch = null;

    if (this.batchTimeout) {
      clearTimeout(this.batchTimeout);
      this.batchTimeout = null;
    }

    try {
      // Load config if not already loaded
      if (!this.config) {
        const { TRANSLATION_CONFIG } = await import('./translationConfig');
        this.config = TRANSLATION_CONFIG;
      }

      const translations = await this.translateBatch(
        batch.texts,
        batch.targetLanguage
      );

      // Update translations
      batch.ids.forEach((id, index) => {
        const item = this.translations.get(id);
        if (item) {
          const translatedText = translations[index] || item.originalText;

          // Store the translation with composite key for caching
          const compositeKey = this.getCompositeKey(id, batch.targetLanguage);
          this.translations.set(compositeKey, {
            id: compositeKey,
            originalText: item.originalText,
            translatedText,
            isTranslating: false,
            languageCode: batch.targetLanguage,
          });

          // Also update the original item for backward compatibility
          item.translatedText = translatedText;
          item.isTranslating = false;
          this.translations.set(id, item);
        }
      });

      // Notify subscribers about updates
      if (this.config?.ENABLE_LOGGING) {
        console.log(
          `Updated translations:`,
          batch.ids.map((id) => {
            const item = this.translations.get(id);
            return `${item?.originalText} -> ${item?.translatedText}`;
          })
        );
        console.log(
          `Notifying ${this.subscribers.size} subscribers of translation updates`
        );
      }
      this.notifySubscribers();
    } catch (error) {
      console.error('Translation batch failed:', error);

      // Reset translation states on error
      batch.ids.forEach((id) => {
        const item = this.translations.get(id);
        if (item) {
          item.isTranslating = false;
          this.translations.set(id, item);
        }
      });

      this.notifySubscribers();
    }
  }

  // Real OpenAI translation implementation
  private async translateBatch(
    texts: string[],
    targetLanguage: string
  ): Promise<string[]> {
    // Import config to check if real translation is enabled
    const { TRANSLATION_CONFIG } = await import('./translationConfig');

    if (!TRANSLATION_CONFIG?.USE_REAL_TRANSLATION) {
      // Fallback to mock for development
      if (TRANSLATION_CONFIG?.ENABLE_LOGGING) {
        console.log(
          `Mock translating ${texts.length} texts to ${targetLanguage}`
        );
      }
      return texts.map((text) => `[${targetLanguage.toUpperCase()}] ${text}`);
    }

    try {
      // Dynamically import OpenAI service to avoid loading it unnecessarily
      const { openaiService } = await import('./openaiService');

      if (TRANSLATION_CONFIG?.ENABLE_LOGGING) {
        console.log(
          `Real translating ${texts.length} texts to ${targetLanguage} via OpenAI`
        );
      }

      return await openaiService.translateBatch(texts, targetLanguage);
    } catch (error) {
      console.error('OpenAI translation failed, falling back to mock:', error);
      // Fallback to mock on any error
      return texts.map((text) => `[${targetLanguage.toUpperCase()}] ${text}`);
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
    this.pendingBatch = null;
    if (this.batchTimeout) {
      clearTimeout(this.batchTimeout);
      this.batchTimeout = null;
    }
  }
}

// Singleton instance
export const translationService = new TranslationService();
