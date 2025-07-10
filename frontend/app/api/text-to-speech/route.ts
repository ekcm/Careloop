import { NextRequest, NextResponse } from 'next/server';
import { ElevenLabsClient } from '@elevenlabs/elevenlabs-js';

// Initialize ElevenLabs client
const client = new ElevenLabsClient({
  apiKey: process.env.ELEVENLABS_API_KEY || '',
});

// Use a single voice ID as provided in the example
const voiceId = 'JBFqnCBsd6RMkjVDRZzb';

export async function POST(request: NextRequest) {
  try {
    // Check if API key is available
    if (!process.env.ELEVENLABS_API_KEY) {
      return NextResponse.json(
        { error: 'ElevenLabs API key not configured' },
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

    // Call ElevenLabs Text-to-Speech API using the client directly
    const audio = await client.textToSpeech.convert(voiceId, {
      text,
      modelId: 'eleven_multilingual_v2',
      outputFormat: 'mp3_44100_128',
    });

    // Convert audio to buffer
    // The ElevenLabs client returns a ReadableStream
    const reader = audio.getReader();
    const chunks: Uint8Array[] = [];

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      chunks.push(value);
    }

    const buffer = Buffer.concat(chunks);

    // Return audio as base64 data URL
    const base64Audio = buffer.toString('base64');
    const audioUrl = `data:audio/mp3;base64,${base64Audio}`;

    return NextResponse.json({
      audioUrl,
      success: true,
    });
  } catch (error) {
    console.error('ElevenLabs text-to-speech error:', error);

    if (error instanceof Error) {
      // Handle specific API errors
      if (error.message.includes('API key')) {
        return NextResponse.json(
          {
            error:
              'API key not configured. Please check your environment variables.',
          },
          { status: 500 }
        );
      } else if (error.message.includes('quota')) {
        return NextResponse.json(
          { error: 'API quota exceeded. Please try again later.' },
          { status: 429 }
        );
      } else if (error.message.includes('voice')) {
        return NextResponse.json(
          { error: 'Invalid voice ID. Please check your configuration.' },
          { status: 400 }
        );
      } else {
        return NextResponse.json(
          { error: `Text-to-speech failed: ${error.message}` },
          { status: 500 }
        );
      }
    }

    return NextResponse.json(
      {
        error: 'An unexpected error occurred during text-to-speech conversion.',
      },
      { status: 500 }
    );
  }
}
