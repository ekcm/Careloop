'use client';

import { useState } from 'react';
import { Copy } from 'lucide-react';

export default function TranslatePage() {
  //   const [sourceText, setSourceText] = useState('');
  //   const [translatedText, setTranslatedText] = useState('');

  // hard code the sourceText and translatedText first
  const [sourceText, setSourceText] = useState(
    'Can you bring me a glass of water?'
  );
  // set translatedText later
  const [translatedText] = useState('သောက်သုံးရန်ရေတစ်ခွက် ယူပေးနိုင်မလား?');

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
    <div className="w-full h-screen flex flex-col p-4 bg-gray-50">
      {/* Header */}
      {/* <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold text-gray-800">Translate</h1>
        <button
          onClick={handleClear}
          className="flex items-center gap-2 px-3 py-2 text-gray-600 hover:text-gray-800 transition-colors"
        >
          <X size={16} />
          <span className="text-sm">Clear</span>
        </button>
      </div> */}

      {/* Main Translation Area */}
      <div className="flex-1 flex flex-col gap-4">
        {/* Source Text Area (English) */}
        <div className="flex-1 bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between p-3 border-b border-gray-100">
            <span className="text-sm font-medium text-gray-700">English</span>
            <button
              onClick={handleCopySource}
              disabled={!sourceText}
              className="flex items-center gap-1 px-2 py-1 text-gray-500 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Copy size={14} />
              <span className="text-xs">Copy</span>
            </button>
          </div>
          <textarea
            value={sourceText}
            onChange={(e) => setSourceText(e.target.value)}
            placeholder="Enter text to translate..."
            className="w-full h-full p-4 resize-none border-0 focus:ring-0 focus:outline-none text-gray-800 placeholder-gray-400"
            style={{ minHeight: '200px' }}
          />
        </div>

        {/* Target Text Area (Burmese) */}
        <div className="flex-1 bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between p-3 border-b border-gray-100">
            <span className="text-sm font-medium text-gray-700">
              မြန်မာဘာသာ
            </span>
            <button
              onClick={handleCopyTranslated}
              disabled={!translatedText}
              className="flex items-center gap-1 px-2 py-1 text-gray-500 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Copy size={14} />
              <span className="text-xs">Copy</span>
            </button>
          </div>
          <div
            className="w-full h-full p-4 text-gray-800"
            style={{ minHeight: '200px' }}
          >
            {translatedText ? (
              <div className="whitespace-pre-wrap">{translatedText}</div>
            ) : (
              <div className="text-gray-400 italic">
                Translation will appear here...
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
