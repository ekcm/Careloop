import { getLanguageByCode, type Language } from './languageConfig';

interface LanguageDetectionResult {
  detectedLanguage: string;
  confidence?: number;
  text: string;
}

interface CachedDetection {
  result: LanguageDetectionResult;
  timestamp: number;
}

class LanguageDetectionService {
  private cache = new Map<string, CachedDetection>();
  private readonly CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours
  private readonly MAX_RETRIES = 3;
  private readonly TIMEOUT_MS = 5000;

  /**
   * Detect the language of a text
   * @param text - Text to detect language for
   * @returns Promise<LanguageDetectionResult>
   */
  async detectLanguage(text: string): Promise<LanguageDetectionResult> {
    // Skip empty or whitespace-only text
    if (!text.trim()) {
      return {
        detectedLanguage: 'en',
        text,
      };
    }

    // Check cache first
    const cacheKey = this.generateCacheKey(text);
    const cached = this.cache.get(cacheKey);

    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
      return cached.result;
    }

    // Detect language via API
    const result = await this.detectLanguageViaAPI(text);

    // Cache the result
    this.cache.set(cacheKey, {
      result,
      timestamp: Date.now(),
    });

    return result;
  }

  /**
   * Detect language for multiple texts in batch
   * @param texts - Array of texts to detect language for
   * @returns Promise<LanguageDetectionResult[]>
   */
  async detectLanguages(texts: string[]): Promise<LanguageDetectionResult[]> {
    if (texts.length === 0) return [];

    // Process each text individually (async processing)
    const detectionPromises = texts.map((text) => this.detectLanguage(text));

    try {
      const results = await Promise.all(detectionPromises);
      return results;
    } catch (error) {
      console.error('Batch language detection failed:', error);
      // Return default results as fallback
      return texts.map((text) => ({
        detectedLanguage: 'en',
        text,
      }));
    }
  }

  /**
   * Get the Language object for a detected language code
   * @param languageCode - ISO 639-1 language code
   * @returns Language object or undefined if not found
   */
  getLanguageObject(languageCode: string): Language | undefined {
    return getLanguageByCode(languageCode);
  }

  /**
   * Clear the detection cache
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { size: number; entries: number } {
    return {
      size: this.cache.size,
      entries: Array.from(this.cache.values()).length,
    };
  }

  private generateCacheKey(text: string): string {
    // Create a simple hash for the text
    const trimmedText = text.slice(0, 100); // Limit to first 100 chars
    let hash = 0;
    for (let i = 0; i < trimmedText.length; i++) {
      const char = trimmedText.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash;
    }
    return `lang_${Math.abs(hash).toString(36)}_${text.length}`;
  }

  private async detectLanguageViaAPI(
    text: string
  ): Promise<LanguageDetectionResult> {
    for (let attempt = 1; attempt <= this.MAX_RETRIES; attempt++) {
      try {
        const response = await fetch('/api/detect-language', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ text }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || `HTTP ${response.status}`);
        }

        const result = await response.json();

        if (!result.success || !result.detectedLanguage) {
          throw new Error('No language detection result received from server');
        }

        return {
          detectedLanguage: result.detectedLanguage,
          text,
        };
      } catch (error) {
        console.warn(`Language detection attempt ${attempt} failed:`, error);

        if (attempt === this.MAX_RETRIES) {
          console.error('All language detection attempts failed:', error);
          // Return default result as fallback
          return {
            detectedLanguage: 'en',
            text,
          };
        }

        // Wait before retry with exponential backoff
        await this.delay(Math.pow(2, attempt) * 1000);
      }
    }

    // Fallback: return default result
    return {
      detectedLanguage: 'en',
      text,
    };
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

// Singleton instance
export const languageDetectionService = new LanguageDetectionService();
