import { ElevenLabsClient } from '@elevenlabs/elevenlabs-js';

// Initialize ElevenLabs client
const client = new ElevenLabsClient({
  apiKey: process.env.NEXT_PUBLIC_ELEVENLABS_API_KEY || '',
});

export interface TranscriptionResult {
  text: string;
  language?: string;
  error?: string;
}

export const transcribeAudio = async (
  audioBlob: Blob
): Promise<TranscriptionResult> => {
  try {
    if (!process.env.NEXT_PUBLIC_ELEVENLABS_API_KEY) {
      throw new Error('ElevenLabs API key not configured');
    }

    // Convert blob to File object for the API
    const audioFile = new File([audioBlob], 'recording.webm', {
      type: 'audio/webm;codecs=opus',
    });

    // Call ElevenLabs Speech-to-Text API
    const transcription = await client.speechToText.convert({
      file: audioFile,
      modelId: 'scribe_v1', // DO NOT CHANGE THIS
      tagAudioEvents: false, // Disable for cleaner transcription
      diarize: false, // Disable speaker diarization for simplicity
    });

    return {
      text: transcription.text || '',
    };
  } catch (error) {
    console.error('ElevenLabs transcription error:', error);

    if (error instanceof Error) {
      // Handle specific API errors
      if (error.message.includes('API key')) {
        return {
          text: '',
          error:
            'API key not configured. Please check your environment variables.',
        };
      } else if (error.message.includes('quota')) {
        return {
          text: '',
          error: 'API quota exceeded. Please try again later.',
        };
      } else if (error.message.includes('file')) {
        return {
          text: '',
          error: 'Invalid audio file format. Please try recording again.',
        };
      } else {
        return { text: '', error: `Transcription failed: ${error.message}` };
      }
    }

    return {
      text: '',
      error: 'An unexpected error occurred during transcription.',
    };
  }
};

// Helper function to validate audio file
export const validateAudioFile = (audioBlob: Blob): boolean => {
  // Check file size (max 25MB for ElevenLabs)
  const maxSize = 25 * 1024 * 1024; // 25MB
  if (audioBlob.size > maxSize) {
    return false;
  }

  // Check file type
  const supportedTypes = [
    'audio/webm;codecs=opus',
    'audio/webm',
    'audio/mp4',
    'audio/wav',
    'audio/mpeg',
  ];

  return supportedTypes.includes(audioBlob.type);
};
