'use client';

import { Globe, AlertCircle, Loader2 } from 'lucide-react';
import { useT } from '@/hooks/useTranslation';

interface LanguageDetectionStatusProps {
  isDetecting: boolean;
  error?: string;
  detectedCount: number;
  totalCount: number;
  className?: string;
}

export default function LanguageDetectionStatus({
  isDetecting,
  error,
  detectedCount,
  totalCount,
  className,
}: LanguageDetectionStatusProps) {
  const detectingText = useT('Detecting languages...');
  const detectionCompleteText = useT('Language detection complete');
  const detectionErrorText = useT('Language detection failed');

  if (totalCount === 0) {
    return null;
  }

  return (
    <div className={`flex items-center gap-2 text-sm ${className}`}>
      <Globe className="w-4 h-4" />

      {isDetecting && (
        <>
          <Loader2 className="w-4 h-4 animate-spin" />
          <span className="text-blue-600 dark:text-blue-400">
            {detectingText}
          </span>
          <span className="text-gray-500">
            ({detectedCount}/{totalCount})
          </span>
        </>
      )}

      {!isDetecting && error && (
        <>
          <AlertCircle className="w-4 h-4 text-red-500" />
          <span className="text-red-600 dark:text-red-400">
            {detectionErrorText}
          </span>
        </>
      )}

      {!isDetecting && !error && (
        <>
          <span className="text-green-600 dark:text-green-400">
            {detectionCompleteText}
          </span>
          <span className="text-gray-500">
            ({detectedCount}/{totalCount})
          </span>
        </>
      )}
    </div>
  );
}
