import OpenAI from 'openai';

// Language code to full name mapping for better OpenAI understanding
const LANGUAGE_NAMES: Record<string, string> = {
  en: 'English',
  zh: 'Chinese (Simplified)',
  ta: 'Tamil',
  ms: 'Malay (Bahasa Melayu)',
  tl: 'Tagalog (Filipino)',
};

class OpenAIService {
  private client: OpenAI;
  private readonly model = 'gpt-4.1-nano-2025-04-14';
  private readonly maxRetries = 3;
  private readonly timeoutMs = 10000; // 10 seconds

  constructor() {
    const apiKey = process.env.NEXT_PUBLIC_OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error(
        'NEXT_PUBLIC_OPENAI_API_KEY environment variable is required'
      );
    }

    this.client = new OpenAI({
      apiKey,
      timeout: this.timeoutMs,
      dangerouslyAllowBrowser: true, // Note: Only for development/testing! OpenAI API key is not secure in browser, use for development only. A better approach would be to use a server-side API key.
    });
  }

  /**
   * Translate multiple texts to target language using OpenAI
   * @param texts - Array of texts to translate
   * @param targetLanguageCode - Target language code (e.g., 'zh', 'ta')
   * @returns Promise<string[]> - Array of translated texts in same order
   */
  async translateBatch(
    texts: string[],
    targetLanguageCode: string
  ): Promise<string[]> {
    if (texts.length === 0) return [];

    const targetLanguage =
      LANGUAGE_NAMES[targetLanguageCode] || targetLanguageCode;

    // Create context-aware prompt for healthcare/caregiving app
    const prompt = this.createTranslationPrompt(texts, targetLanguage);

    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        const response = await this.client.chat.completions.create({
          model: this.model,
          messages: [
            {
              role: 'system',
              content:
                'You are a professional translator specializing in user interface text for healthcare and caregiving applications. Provide accurate, culturally appropriate translations that maintain the tone and context of the original text.',
            },
            {
              role: 'user',
              content: prompt,
            },
          ],
          temperature: 0.1, // Low temperature for consistent translations
        });

        const translatedText = response.choices[0]?.message?.content;
        if (!translatedText) {
          throw new Error('No translation received from OpenAI');
        }

        console.log('OpenAI raw response:', translatedText);
        console.log('Expected text count:', texts.length);

        const parsedTranslations = this.parseTranslationResponse(
          translatedText,
          texts.length
        );
        console.log('Parsed translations:', parsedTranslations);

        return parsedTranslations;
      } catch (error) {
        console.warn(`Translation attempt ${attempt} failed:`, error);

        if (attempt === this.maxRetries) {
          console.error('All translation attempts failed:', error);
          // Return original texts as fallback
          return texts;
        }

        // Wait before retry with exponential backoff
        await this.delay(Math.pow(2, attempt) * 1000);
      }
    }

    // Fallback: return original texts
    return texts;
  }

  /**
   * Create a well-structured prompt for batch translation
   */
  private createTranslationPrompt(
    texts: string[],
    targetLanguage: string
  ): string {
    const numberedTexts = texts
      .map((text, index) => `${index + 1}. ${text}`)
      .join('\n');

    return `Translate the following UI text elements from a caregiving/healthcare mobile app to ${targetLanguage}.

Context: These are user interface elements including buttons, labels, messages, and form text. Keep translations:
- Concise and appropriate for mobile UI
- Culturally appropriate and respectful
- Consistent in tone (professional but friendly)
- Preserve any formatting or special characters

Original texts:
${numberedTexts}

Instructions:
- Return ONLY the translations, one per line
- Maintain the exact same order (1, 2, 3...)
- Do not include numbers or additional text
- If a text should not be translated (like email addresses), return it unchanged`;
  }

  /**
   * Parse OpenAI response back into array of translations
   */
  private parseTranslationResponse(
    response: string,
    expectedCount: number
  ): string[] {
    const lines = response
      .trim()
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.length > 0);

    // If we got the expected number of lines, return them
    if (lines.length === expectedCount) {
      return lines;
    }

    // Try to extract numbered responses (in case GPT included numbers)
    const numberedLines = lines
      .map((line) => line.replace(/^\d+\.\s*/, '').trim())
      .filter((line) => line.length > 0);

    if (numberedLines.length === expectedCount) {
      return numberedLines;
    }

    // If parsing fails, log error and return what we have
    console.warn(
      `Expected ${expectedCount} translations, got ${lines.length}. Response:`,
      response
    );

    // Pad with original text indices if needed
    const result = [...lines];
    while (result.length < expectedCount) {
      result.push(`[Translation error ${result.length + 1}]`);
    }

    return result.slice(0, expectedCount);
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
    // Rough estimate: ~$0.0001 per 1K tokens for gpt-4o-mini
    // Input + output tokens approximation
    // Elijah TODO: changed gpt-4o-mini to gpt.4.1-nano instead, need to update this
    const estimatedTokens = textCount * avgTextLength * 1.5; // 1.5x for input+output
    return (estimatedTokens / 1000) * 0.0001;
  }
}

// Singleton instance
export const openaiService = new OpenAIService();
