interface TranslationItem {
  id: string;
  originalText: string;
  translatedText?: string;
  isTranslating?: boolean;
}

interface TranslationBatch {
  texts: string[];
  ids: string[];
  targetLanguage: string;
}

class TranslationService {
  private translations = new Map<string, TranslationItem>();
  private pendingBatch: TranslationBatch | null = null;
  private batchTimeout: NodeJS.Timeout | null = null;
  private readonly BATCH_DELAY = 500; // ms - wait for more texts before sending
  private readonly MAX_BATCH_SIZE = 10; // max texts per batch

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

  // Add text to pending batch for translation
  queueForTranslation(id: string, targetLanguage: string) {
    const item = this.translations.get(id);
    if (!item) return;

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
    if (!this.pendingBatch.ids.includes(id)) {
      this.pendingBatch.texts.push(item.originalText);
      this.pendingBatch.ids.push(id);
    }

    // Process batch if full or set timeout
    if (this.pendingBatch.texts.length >= this.MAX_BATCH_SIZE) {
      this.processBatch();
    } else {
      this.scheduleBatchProcessing();
    }
  }

  // Get translation for a text ID
  getTranslation(id: string): TranslationItem | undefined {
    return this.translations.get(id);
  }

  // Get all current translations
  getAllTranslations(): TranslationItem[] {
    return Array.from(this.translations.values());
  }

  // Schedule batch processing with debounce
  private scheduleBatchProcessing() {
    if (this.batchTimeout) {
      clearTimeout(this.batchTimeout);
    }

    this.batchTimeout = setTimeout(() => {
      this.processBatch();
    }, this.BATCH_DELAY);
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
      // This will be implemented in Step 3
      const translations = await this.translateBatch(
        batch.texts,
        batch.targetLanguage
      );

      // Update translations
      batch.ids.forEach((id, index) => {
        const item = this.translations.get(id);
        if (item) {
          item.translatedText = translations[index] || item.originalText;
          item.isTranslating = false;
          this.translations.set(id, item);
        }
      });

      // Notify subscribers about updates
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

  // Placeholder for OpenAI translation - will implement in Step 3
  private async translateBatch(
    texts: string[],
    targetLanguage: string
  ): Promise<string[]> {
    // Temporary mock - will be replaced with OpenAI API call
    return texts.map((text) => `[${targetLanguage.toUpperCase()}] ${text}`);
  }

  // Generate consistent ID for text
  private generateId(text: string): string {
    return `trans_${btoa(text.slice(0, 50)).replace(/[^a-zA-Z0-9]/g, '')}_${text.length}`;
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
