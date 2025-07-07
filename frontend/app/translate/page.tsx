'use client';

import { useState } from 'react';
import { Copy, ArrowLeftRight, Mic, Volume2, Square } from 'lucide-react';

export default function TranslatePage() {
  //   const [sourceText, setSourceText] = useState('');
  //   const [translatedText, setTranslatedText] = useState('');

  // hard code the sourceText and translatedText first
  const [sourceText, setSourceText] = useState(
    'Can you bring me a glass of water?'
  );
  // set translatedText later
  const [translatedText] = useState('သောက်သုံးရန်ရေတစ်ခွက် ယူပေးနိုင်မလား?');

  // Language toggle state
  const [isSwapped, setIsSwapped] = useState(false);

  // Recording state
  const [isRecording, setIsRecording] = useState(false);

  const handleLanguageToggle = () => {
    setIsSwapped(!isSwapped);
  };

  const handleVoiceButton = () => {
    setIsRecording(!isRecording);
    if (isRecording) {
      // Stop recording logic will go here
      console.log('Stop recording');
    } else {
      // Start recording logic will go here
      console.log('Start recording');
    }
  };

  const handleSourceSpeaker = () => {
    // Placeholder for source text-to-speech
    console.log('Source speaker clicked');
  };

  const handleTargetSpeaker = () => {
    // Placeholder for target text-to-speech
    console.log('Target speaker clicked');
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

  return (
    <div className="p-4 pb-20">
      {/* Main Translation Area */}
      <div className="flex flex-col gap-4">
        {/* Source Text Area */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between p-3 border-b border-gray-100">
            <span className="text-sm font-medium text-gray-700">
              {isSwapped ? 'မြန်မာဘာသာ' : 'English'}
            </span>
            <button
              onClick={handleCopySource}
              disabled={!sourceText}
              className="flex items-center gap-1 px-2 py-1 text-gray-500 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Copy size={14} />
              {/* <span className="text-xs">Copy</span> */}
            </button>
          </div>
          <div className="relative">
            <textarea
              value={sourceText}
              onChange={(e) => setSourceText(e.target.value)}
              placeholder="Enter text to translate..."
              className="w-full h-full p-4 pr-12 resize-none border-0 focus:ring-0 focus:outline-none text-gray-800 placeholder-gray-400"
              style={{ minHeight: '160px' }}
            />
            <button
              onClick={handleSourceSpeaker}
              className="absolute bottom-3 right-3 p-2 text-gray-500 hover:text-gray-700 transition-colors"
            >
              <Volume2 size={16} />
            </button>
          </div>
        </div>

        {/* Target Text Area */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between p-3 border-b border-gray-100">
            <span className="text-sm font-medium text-gray-700">
              {isSwapped ? 'English' : 'မြန်မာဘာသာ'}
            </span>
            <button
              onClick={handleCopyTranslated}
              disabled={!translatedText}
              className="flex items-center gap-1 px-2 py-1 text-gray-500 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Copy size={14} />
              {/* <span className="text-xs">Copy</span> */}
            </button>
          </div>
          <div className="relative">
            <div
              className="w-full h-full p-4 pr-12 text-gray-800"
              style={{ minHeight: '160px' }}
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

        {/* Language Toggle Switch */}
        <div className="flex items-center justify-center py-1">
          <button
            onClick={handleLanguageToggle}
            className="flex items-center gap-2 px-4 py-2 bg-white rounded-lg shadow-sm border border-gray-200 hover:bg-gray-50 transition-colors"
          >
            <span className="text-sm font-medium text-gray-700">
              {isSwapped ? 'English' : 'မြန်မာဘာသာ'}
            </span>
            <ArrowLeftRight size={16} className="text-gray-500" />
            <span className="text-sm font-medium text-gray-700">
              {isSwapped ? 'မြန်မာဘာသာ' : 'English'}
            </span>
          </button>
        </div>

        {/* Voice Control Container */}
        <div className="flex flex-col items-center gap-4">
          {/* Voice Recording Button */}
          <button
            onClick={handleVoiceButton}
            className={`flex items-center justify-center w-16 h-16 ${isRecording ? 'bg-red-500 hover:bg-red-600' : 'bg-blue-500 hover:bg-blue-600'} rounded-full shadow-lg transition-colors`}
          >
            {isRecording ? (
              <Square size={24} className="text-white" />
            ) : (
              <Mic size={24} className="text-white" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
