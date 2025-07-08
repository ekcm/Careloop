import { NextRequest, NextResponse } from 'next/server';
import { ElevenLabsClient } from '@elevenlabs/elevenlabs-js';

// Initialize ElevenLabs client
const client = new ElevenLabsClient({
  apiKey: process.env.ELEVENLABS_API_KEY || '',
});

export async function POST(request: NextRequest) {
  try {
    // Check if API key is available
    if (!process.env.ELEVENLABS_API_KEY) {
      return NextResponse.json(
        { error: 'ElevenLabs API key not configured' },
        { status: 500 }
      );
    }

    // Get the form data from the request
    const formData = await request.formData();
    const audioFile = formData.get('audio') as File;

    if (!audioFile) {
      return NextResponse.json(
        { error: 'No audio file provided' },
        { status: 400 }
      );
    }

    // Validate file size (max 25MB for ElevenLabs)
    const maxSize = 25 * 1024 * 1024; // 25MB
    if (audioFile.size > maxSize) {
      return NextResponse.json(
        { error: 'Audio file too large. Maximum size is 25MB.' },
        { status: 400 }
      );
    }

    // Validate file type
    const supportedTypes = [
      'audio/webm;codecs=opus',
      'audio/webm',
      'audio/mp4',
      'audio/wav',
      'audio/mpeg',
    ];

    if (!supportedTypes.includes(audioFile.type)) {
      return NextResponse.json(
        { error: 'Unsupported audio file format' },
        { status: 400 }
      );
    }

    // Call ElevenLabs Speech-to-Text API
    const transcription = await client.speechToText.convert({
      file: audioFile,
      modelId: 'scribe_v1',
      tagAudioEvents: false,
      diarize: false,
    });

    return NextResponse.json({
      text: transcription.text || '',
      success: true,
    });
  } catch (error) {
    console.error('ElevenLabs transcription error:', error);

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
      } else if (error.message.includes('file')) {
        return NextResponse.json(
          { error: 'Invalid audio file format. Please try recording again.' },
          { status: 400 }
        );
      } else {
        return NextResponse.json(
          { error: `Transcription failed: ${error.message}` },
          { status: 500 }
        );
      }
    }

    return NextResponse.json(
      { error: 'An unexpected error occurred during transcription.' },
      { status: 500 }
    );
  }
}
