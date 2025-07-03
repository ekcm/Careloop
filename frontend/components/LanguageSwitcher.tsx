'use client';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { ChevronDown } from 'lucide-react';
import { useLanguage, LANGUAGES } from '@/lib/LanguageContext';

export default function LanguageSwitcher() {
  const { currentLanguage, setCurrentLanguage } = useLanguage();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          className="max-w-36 rounded-full pl-3 pr-2 py-2 flex items-center text-sm shadow-sm"
        >
          <span className="text-base">{currentLanguage.emoji}</span>
          <span className="truncate">{currentLanguage.label}</span>

          <ChevronDown className="w-4 h-4 text-muted-foreground ml-auto shrink-0" />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent className="max-w-36">
        {LANGUAGES.map((lang) => (
          <DropdownMenuItem
            key={lang.code}
            onClick={() => setCurrentLanguage(lang)}
            className="flex items-center gap-2"
          >
            <span>{lang.emoji}</span>
            <span>{lang.label}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
