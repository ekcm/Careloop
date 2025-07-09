import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '',
});

export async function POST(request: NextRequest) {
  try {
    // Check if API key is available
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'OpenAI API key not configured' },
        { status: 500 }
      );
    }

    // Get request body
    const { text } = await request.json();

    if (!text) {
      return NextResponse.json(
        { error: 'Missing required parameter: text' },
        { status: 400 }
      );
    }

    // Skip empty or whitespace-only text
    if (!text.trim()) {
      return NextResponse.json(
        { error: 'Text cannot be empty' },
        { status: 400 }
      );
    }

    // Create the language detection prompt
    const prompt = `Detect the language of the following text and return only the ISO 639-1 language code (e.g., 'en', 'zh', 'ta', 'ms', 'tl', 'id', 'my'). If the language is not one of these, return 'en' as default.

Available language codes:
- en (English)
- zh (Chinese)
- ta (Tamil)
- ms (Malay)
- tl (Tagalog)
- id (Indonesian)
- my (Burmese)

Text to detect: "${text}"`;

    // Call OpenAI API
    const completion = await openai.chat.completions.create({
      model: 'gpt-4.1-nano-2025-04-14',
      messages: [
        {
          role: 'system',
          content:
            'You are a language detection expert. Return only the ISO 639-1 language code.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      max_tokens: 10,
      temperature: 0.1,
    });

    const detectedLanguage = completion.choices[0]?.message?.content?.trim();

    if (!detectedLanguage) {
      return NextResponse.json(
        { error: 'Failed to detect language' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      detectedLanguage,
      text,
    });
  } catch (error) {
    console.error('Language detection error:', error);
    return NextResponse.json(
      { error: 'Failed to detect language' },
      { status: 500 }
    );
  }
}
