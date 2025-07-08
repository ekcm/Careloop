import { getOpenAIName } from './languageConfig';

class OpenAIService {
  private readonly maxRetries = 3;

  constructor() {
    // No longer need API key on client side
  }

  /**
   * Translate multiple texts to target language using server-side API
   * @param texts - Array of texts to translate
   * @param targetLanguageCode - Target language code (e.g., 'zh', 'ta')
   * @returns Promise<string[]> - Array of translated texts in same order
   */
  async translateBatch(
    texts: string[],
    targetLanguageCode: string
  ): Promise<string[]> {
    if (texts.length === 0) return [];

    const targetLanguage = getOpenAIName(targetLanguageCode);

    // Process each text individually (async processing)
    const translationPromises = texts.map((text) =>
      this.translateSingleText(text, targetLanguage)
    );

    try {
      const results = await Promise.all(translationPromises);
      return results;
    } catch (error) {
      console.error('Translation batch failed:', error);
      // Return original texts as fallback
      return texts;
    }
  }

  /**
   * Translate a single text to target language
   * @param text - Text to translate
   * @param targetLanguage - Target language name
   * @returns Promise<string> - Translated text
   */
  private async translateSingleText(
    text: string,
    targetLanguage: string
  ): Promise<string> {
    // Skip empty or whitespace-only text
    if (!text.trim()) {
      return text;
    }

    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        // Call our server-side translation API
        const response = await fetch('/api/translate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            sourceText: text,
            sourceLanguage: 'English',
            targetLanguage: targetLanguage,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || `HTTP ${response.status}`);
        }

        const result = await response.json();

        if (!result.success || !result.translatedText) {
          throw new Error('No translation received from server');
        }

        console.log(
          `Single translation: "${text}" -> "${result.translatedText}"`
        );
        return result.translatedText;
      } catch (error) {
        console.warn(`Single translation attempt ${attempt} failed:`, error);

        if (attempt === this.maxRetries) {
          console.error('All single translation attempts failed:', error);
          // Return original text as fallback
          return text;
        }

        // Wait before retry with exponential backoff
        await this.delay(Math.pow(2, attempt) * 1000);
      }
    }

    // Fallback: return original text
    return text;
  }

  /**
   * Utility function for delays
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Get cost estimate for translation (approximate)
   */
  estimateCost(textCount: number, avgTextLength: number = 10): number {
    // Rough estimate for gpt-4.1-nano-2025-04-14
    // Input + output tokens approximation
    const estimatedTokens = textCount * avgTextLength * 1.5; // 1.5x for input+output
    return (estimatedTokens / 1000) * 0.0001; // Approximate cost per 1K tokens
  }
}

// Singleton instance
export const openaiService = new OpenAIService();
