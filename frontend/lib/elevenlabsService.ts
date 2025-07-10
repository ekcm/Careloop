export interface TranscriptionResult {
  text: string;
  error?: string;
}

export interface TextToSpeechResult {
  audioUrl?: string;
  error?: string;
}

export const transcribeAudio = async (
  audioBlob: Blob
): Promise<TranscriptionResult> => {
  try {
    // Create FormData to send the audio file
    const formData = new FormData();
    formData.append('audio', audioBlob, 'recording.webm');

    // Call our Next.js API route
    const response = await fetch('/api/transcribe', {
      method: 'POST',
      body: formData,
    });

    const result = await response.json();

    if (!response.ok) {
      return {
        text: '',
        error: result.error || 'Failed to transcribe audio',
      };
    }

    return {
      text: result.text || '',
    };
  } catch (error) {
    console.error('Transcription error:', error);

    if (error instanceof Error) {
      return { text: '', error: `Transcription failed: ${error.message}` };
    }

    return {
      text: '',
      error: 'An unexpected error occurred during transcription.',
    };
  }
};

// New function to convert text to speech
export const textToSpeech = async (
  text: string,
  languageCode: string
): Promise<TextToSpeechResult> => {
  try {
    if (!text || text.trim() === '') {
      return { error: 'Text cannot be empty' };
    }

    // Call our Next.js API route
    const response = await fetch('/api/text-to-speech', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text,
        languageCode,
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      return {
        error: result.error || 'Failed to convert text to speech',
      };
    }

    return {
      audioUrl: result.audioUrl,
    };
  } catch (error) {
    console.error('Text-to-speech error:', error);

    if (error instanceof Error) {
      return { error: `Text-to-speech failed: ${error.message}` };
    }

    return {
      error: 'An unexpected error occurred during text-to-speech conversion.',
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
