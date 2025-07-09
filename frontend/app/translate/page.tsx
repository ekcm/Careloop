'use client';

import { useState, useEffect } from 'react';
import {
  Copy,
  ArrowLeftRight,
  Mic,
  Volume2,
  Square,
  Languages,
} from 'lucide-react';
import { useAudioRecorder } from '@/hooks/useAudioRecorder';
import { transcribeAudio, validateAudioFile } from '@/lib/elevenlabsService';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import { LANGUAGES } from '@/lib/languageConfig';
import { translationService } from '@/lib/translationService';

export default function TranslatePage() {
  const [sourceText, setSourceText] = useState('');
  const [translatedText, setTranslatedText] = useState('');
  const [isTranslating, setIsTranslating] = useState(false);

  const [sourceLanguage, setSourceLanguage] = useState(LANGUAGES[0]);
  const [targetLanguage, setTargetLanguage] = useState(
    LANGUAGES[1] ?? LANGUAGES[0]
  );

  // Audio recording hook
  const {
    isRecording,
    startRecording,
    stopRecording,
    audioBlob,
    recordingError,
    clearError,
  } = useAudioRecorder();

  // Transcription state
  const [transcriptionError, setTranscriptionError] = useState<string | null>(
    null
  );
  const [processedAudioBlob, setProcessedAudioBlob] = useState<Blob | null>(
    null
  );
  const [translationError, setTranslationError] = useState<string | null>(null);

  // Handle transcription when audio is recorded
  useEffect(() => {
    const handleTranscription = async () => {
      if (audioBlob && audioBlob !== processedAudioBlob) {
        setProcessedAudioBlob(audioBlob);
        setTranscriptionError(null);
        setTranslationError(null);

        try {
          // Validate audio file
          if (!validateAudioFile(audioBlob)) {
            throw new Error('Invalid audio file. Please try recording again.');
          }

          // Transcribe audio
          const result = await transcribeAudio(audioBlob);

          if (result.error) {
            setTranscriptionError(result.error);
          } else if (result.text) {
            // Log the transcription
            console.log('Transcription result:', result.text);
            // Update source text with transcribed text
            setSourceText(result.text);
            // Translate the transcribed text
            try {
              const id = translationService.registerText(result.text);
              await translationService.queueForTranslation(
                id,
                targetLanguage.code
              );
              const translationItem = translationService.getTranslation(
                id,
                targetLanguage.code
              );
              setTranslatedText(translationItem?.translatedText || '');
            } catch (err) {
              console.error('Translation error:', err);
              setTranslationError(
                'Failed to translate text. Please try again.'
              );
              setTranslatedText('');
            }
          }
        } catch (error) {
          console.error('Transcription error:', error);
          setTranscriptionError(
            'Failed to transcribe audio. Please try again.'
          );
        }
      }
    };

    handleTranscription();
  }, [audioBlob, processedAudioBlob, targetLanguage.code]);

  const handleTranslate = async () => {
    if (!sourceText || sourceText.trim() === '') {
      console.log('No text to translate');
      return;
    }

    setIsTranslating(true);
    setTranslationError(null);

    try {
      const id = translationService.registerText(sourceText);
      await translationService.queueForTranslation(id, targetLanguage.code);
      const translationItem = translationService.getTranslation(
        id,
        targetLanguage.code
      );
      setTranslatedText(translationItem?.translatedText || '');
    } catch (err) {
      console.error('Translation error:', err);
      setTranslationError('Failed to translate text. Please try again.');
      setTranslatedText('');
    } finally {
      setIsTranslating(false);
    }
  };

  const handleVoiceButton = async () => {
    if (isRecording) {
      // Stop recording
      await stopRecording();
    } else {
      // Start recording
      await startRecording();
    }
  };

  const handleSourceSpeaker = () => {
    if (!sourceText || sourceText.trim() === '') {
      console.log('No text available for voice playback in source language');
      return;
    }
    // Placeholder for source text-to-speech
    console.log('Source speaker clicked with text:', sourceText);
  };

  const handleTargetSpeaker = () => {
    if (!translatedText || translatedText.trim() === '') {
      console.log('No text available for voice playback in target language');
      return;
    }
    // Placeholder for target text-to-speech
    console.log('Target speaker clicked with text:', translatedText);
  };

  //   const handleClear = () => {
  //     setSourceText('');
  //     setTranslatedText('');
  //   };

  const handleCopySource = async () => {
    if (sourceText) {
      await navigator.clipboard.writeText(sourceText);
    }
  };

  const handleCopyTranslated = async () => {
    if (translatedText) {
      await navigator.clipboard.writeText(translatedText);
    }
  };

  const handleSwapLanguages = () => {
    setSourceLanguage(targetLanguage);
    setTargetLanguage(sourceLanguage);

    const tempText = sourceText;
    setSourceText(translatedText);
    setTranslatedText(tempText);
  };

  return (
    <div className="p-4 pb-20 min-h-[calc(100vh-80px)] flex flex-col">
      {/* Main Translation Area */}
      <div className="flex flex-col gap-6 flex-grow">
        {/* Source Text Area */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between p-3 border-b border-gray-100">
            <span className="text-sm font-medium text-gray-700">
              {sourceLanguage.label}
            </span>
            <button
              onClick={handleCopySource}
              disabled={!sourceText}
              className="flex items-center gap-1 px-2 py-1 text-gray-500 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Copy size={14} />
            </button>
          </div>
          <div className="relative">
            <textarea
              value={sourceText}
              onChange={(e) => setSourceText(e.target.value)}
              placeholder="Enter text to translate..."
              className="w-full h-full p-4 pr-24 resize-none border-0 focus:ring-0 focus:outline-none text-gray-800 placeholder-gray-400"
              style={{ minHeight: '180px', height: 'calc(30vh - 60px)' }}
            />
            <div className="absolute bottom-3 right-3 flex space-x-1">
              <button
                onClick={handleTranslate}
                disabled={isTranslating || !sourceText}
                className="p-2 text-gray-500 hover:text-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                title="Translate"
              >
                <Languages size={16} />
              </button>
              <button
                onClick={handleSourceSpeaker}
                className="p-2 text-gray-500 hover:text-gray-700 transition-colors"
                title="Listen"
              >
                <Volume2 size={16} />
              </button>
            </div>
          </div>
        </div>

        {/* Target Text Area */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between p-3 border-b border-gray-100">
            <span className="text-sm font-medium text-gray-700">
              {targetLanguage.label}
            </span>
            <button
              onClick={handleCopyTranslated}
              disabled={!translatedText}
              className="flex items-center gap-1 px-2 py-1 text-gray-500 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Copy size={14} />
            </button>
          </div>
          <div className="relative">
            <div
              className="w-full h-full p-4 pr-12 text-gray-800"
              style={{ minHeight: '180px', height: 'calc(30vh - 60px)' }}
            >
              {translatedText ? (
                <div className="whitespace-pre-wrap">{translatedText}</div>
              ) : (
                <div className="text-gray-400 italic">
                  Translation will appear here...
                </div>
              )}
            </div>
            <button
              onClick={handleTargetSpeaker}
              className="absolute bottom-3 right-3 p-2 text-gray-500 hover:text-gray-700 transition-colors"
            >
              <Volume2 size={16} />
            </button>
          </div>
        </div>

        {/* Language Switchers */}
        <div className="flex items-center justify-center gap-4 py-2">
          <LanguageSwitcher
            value={sourceLanguage}
            onChange={setSourceLanguage}
          />
          <button
            type="button"
            onClick={handleSwapLanguages}
            className="p-2 rounded-full bg-white border border-gray-200 hover:bg-gray-100 transition-colors flex items-center justify-center"
            aria-label="Swap languages"
          >
            <ArrowLeftRight size={18} />
          </button>
          <LanguageSwitcher
            value={targetLanguage}
            onChange={setTargetLanguage}
          />
        </div>

        {/* Voice Control Container */}
        <div className="flex flex-col items-center gap-4 mt-2">
          {/* Voice Recording Button */}
          <button
            onClick={handleVoiceButton}
            className={`flex items-center justify-center w-16 h-16 ${
              isRecording
                ? 'bg-red-500 hover:bg-red-600'
                : 'bg-blue-500 hover:bg-blue-600'
            } rounded-full shadow-lg transition-colors`}
          >
            {isRecording ? (
              <Square size={24} className="text-white" />
            ) : (
              <Mic size={24} className="text-white" />
            )}
          </button>

          {/* Error Messages */}
          {(recordingError || transcriptionError || translationError) && (
            <div className="text-red-500 text-sm text-center max-w-xs">
              {recordingError || transcriptionError || translationError}
              <button
                onClick={() => {
                  clearError();
                  setTranscriptionError(null);
                  setTranslationError(null);
                }}
                className="ml-2 underline hover:no-underline"
              >
                Dismiss
              </button>
            </div>
          )}

          {/* Status Messages */}
          {isRecording && (
            <div className="text-blue-600 text-sm">
              Recording... Click to stop
            </div>
          )}

          {isTranslating && (
            <div className="text-green-600 text-sm">Translating...</div>
          )}
        </div>
      </div>
    </div>
  );
}
