"use client";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Globe, ChevronDown } from "lucide-react";
import { useState } from "react";

const LANGUAGES = [
  { code: "en", label: "English", emoji: "🇬🇧" },
  { code: "ta", label: "Tamil",   emoji: "🇮🇳" },
  { code: "ms", label: "Malay",   emoji: "🇲🇾" },
  { code: "tl", label: "Tagalog", emoji: "🇵🇭" },
] as const;

export default function LanguageSwitcher() {
  const [selected, setSelected] = useState<(typeof LANGUAGES)[number]>(
    LANGUAGES[0]
  );

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          className="w-36 rounded-full pl-3 pr-2 py-2 flex items-center text-sm shadow-sm"
        >
          {/* left group */}
          <Globe className="w-4 h-4 text-muted-foreground shrink-0" />
          <span className="text-base">{selected.emoji}</span>
          <span className="truncate">{selected.label}</span>

          {/* right chevron */}
          <ChevronDown className="w-4 h-4 text-muted-foreground ml-auto shrink-0" />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent className="w-36">
        {LANGUAGES.map((lang) => (
          <DropdownMenuItem
            key={lang.code}
            onClick={() => setSelected(lang)}
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
