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
    const { sourceText, sourceLanguage, targetLanguage } = await request.json();

    if (!sourceText || !sourceLanguage || !targetLanguage) {
      return NextResponse.json(
        {
          error:
            'Missing required parameters: sourceText, sourceLanguage, targetLanguage',
        },
        { status: 400 }
      );
    }

    // Skip empty or whitespace-only text
    if (!sourceText.trim()) {
      return NextResponse.json(
        { error: 'Source text cannot be empty' },
        { status: 400 }
      );
    }

    // Create the translation prompt
    const prompt = `Translate the following text from ${sourceLanguage} to ${targetLanguage}. 
    Only return the translated text, nothing else. Do not add any explanations or additional text.
    
    Text to translate: "${sourceText}"`;

    // Call OpenAI API
    const completion = await openai.chat.completions.create({
      model: 'gpt-4.1-nano-2025-04-14',
      messages: [
        {
          role: 'system',
          content:
            'You are a professional translator. Translate the given text accurately and naturally.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      max_tokens: 1000,
      temperature: 0.3,
    });

    const translatedText = completion.choices[0]?.message?.content?.trim();

    if (!translatedText) {
      return NextResponse.json(
        { error: 'Failed to generate translation' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      translatedText,
      success: true,
    });
  } catch (error) {
    console.error('OpenAI translation error:', error);

    if (error instanceof Error) {
      // Handle specific API errors
      if (error.message.includes('API key')) {
        return NextResponse.json(
          {
            error:
              'OpenAI API key not configured. Please check your environment variables.',
          },
          { status: 500 }
        );
      } else if (
        error.message.includes('quota') ||
        error.message.includes('billing')
      ) {
        return NextResponse.json(
          {
            error:
              'OpenAI quota exceeded or billing issue. Please try again later.',
          },
          { status: 429 }
        );
      } else if (error.message.includes('rate limit')) {
        return NextResponse.json(
          { error: 'Rate limit exceeded. Please wait a moment and try again.' },
          { status: 429 }
        );
      } else {
        return NextResponse.json(
          { error: `Translation failed: ${error.message}` },
          { status: 500 }
        );
      }
    }

    return NextResponse.json(
      { error: 'An unexpected error occurred during translation.' },
      { status: 500 }
    );
  }
}
