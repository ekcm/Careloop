import { useState, useRef, useCallback } from 'react';

interface UseAudioRecorderReturn {
  isRecording: boolean;
  startRecording: () => Promise<void>;
  stopRecording: () => Promise<Blob | null>;
  audioBlob: Blob | null;
  recordingError: string | null;
  clearError: () => void;
}

export const useAudioRecorder = (): UseAudioRecorderReturn => {
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [recordingError, setRecordingError] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const clearError = useCallback(() => {
    setRecordingError(null);
  }, []);

  const startRecording = useCallback(async () => {
    try {
      clearError();

      // Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: 44100,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      streamRef.current = stream;
      audioChunksRef.current = [];

      // Create MediaRecorder with optimal settings for speech
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus',
      });

      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, {
          type: 'audio/webm;codecs=opus',
        });
        setAudioBlob(audioBlob);

        // Stop all tracks in the stream
        if (streamRef.current) {
          streamRef.current.getTracks().forEach((track) => track.stop());
          streamRef.current = null;
        }
      };

      mediaRecorder.onerror = (event) => {
        setRecordingError('Recording failed. Please try again.');
        console.error('MediaRecorder error:', event);
      };

      // Start recording
      mediaRecorder.start(1000); // Collect data every second
      setIsRecording(true);
    } catch (error) {
      console.error('Error starting recording:', error);
      if (error instanceof Error) {
        if (error.name === 'NotAllowedError') {
          setRecordingError(
            'Microphone access denied. Please allow microphone access and try again.'
          );
        } else if (error.name === 'NotFoundError') {
          setRecordingError(
            'No microphone found. Please connect a microphone and try again.'
          );
        } else {
          setRecordingError('Failed to start recording. Please try again.');
        }
      } else {
        setRecordingError('An unexpected error occurred.');
      }
    }
  }, [clearError]);

  const stopRecording = useCallback(async (): Promise<Blob | null> => {
    if (!mediaRecorderRef.current || !isRecording) {
      return null;
    }

    // Immediately set recording to false
    setIsRecording(false);

    return new Promise((resolve) => {
      const mediaRecorder = mediaRecorderRef.current!;

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, {
          type: 'audio/webm;codecs=opus',
        });
        setAudioBlob(audioBlob);

        // Stop all tracks in the stream
        if (streamRef.current) {
          streamRef.current.getTracks().forEach((track) => track.stop());
          streamRef.current = null;
        }

        resolve(audioBlob);
      };

      mediaRecorder.stop();
    });
  }, [isRecording]);

  return {
    isRecording,
    startRecording,
    stopRecording,
    audioBlob,
    recordingError,
    clearError,
  };
};
