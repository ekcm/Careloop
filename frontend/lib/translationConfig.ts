/**
 * Translation Configuration
 *
 * You can modify these settings to control translation behavior:
 * 1. Set USE_REAL_TRANSLATION to true to enable OpenAI translations
 * 2. Set your OpenAI API key in .env.local as OPENAI_API_KEY=your-key
 * 3. Adjust batch settings for performance tuning
 */

export const TRANSLATION_CONFIG = {
  // Toggle between mock and real OpenAI translations
  USE_REAL_TRANSLATION: true, // Set to true to use OpenAI API, note that this will cost you money
//   * FOR DEVELOPMENT (Mock translations):
//   * - Keep USE_REAL_TRANSLATION: false
//   * - Translations will show as [ZH] Welcome, [TA] Welcome, etc.

  // Batch processing settings
  BATCH_DELAY_MS: 500, // Wait time before processing batch
  MAX_BATCH_SIZE: 10, // Maximum texts per API call

  // OpenAI settings
  MODEL: 'gpt-4.1-nano-2025-04-14', // Cost-effective model
  MAX_RETRIES: 3, // Retry attempts on failure
  TIMEOUT_MS: 10000, // API timeout in milliseconds

  // Language settings
  DEFAULT_LANGUAGE: 'en', // Default fallback language

  // Development settings
  ENABLE_LOGGING: true, // Log translation events for debugging
} as const;
