'use client';

import { Globe } from 'lucide-react';
import { cn } from '@/lib/utils';
import { type Language } from '@/lib/languageConfig';

interface LanguageIndicatorProps {
  language?: Language;
  detectedLanguage: string;
  isDetecting?: boolean;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
  className?: string;
}

export default function LanguageIndicator({
  language,
  detectedLanguage,
  isDetecting = false,
  size = 'sm',
  showIcon = true,
  className,
}: LanguageIndicatorProps) {
  // Don't show indicator for English or when detecting
  if (detectedLanguage === 'en' || isDetecting || !language) {
    return null;
  }

  const sizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
  };

  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
  };

  return (
    <div
      className={cn(
        'flex items-center gap-1 text-gray-500 dark:text-gray-400',
        sizeClasses[size],
        className
      )}
      title={`Detected language: ${language.label}`}
    >
      {showIcon && <Globe className={iconSizes[size]} />}
      <span>{language.emoji}</span>
    </div>
  );
}
