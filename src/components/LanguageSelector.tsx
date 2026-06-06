import { Terminal, ChevronDown } from 'lucide-react';
import { SUPPORTED_LANGUAGES } from '../types';

interface LanguageSelectorProps {
  value: string;
  onChange: (value: string) => void;
}

export function LanguageSelector({ value, onChange }: LanguageSelectorProps) {
  return (
    <div id="language-selector-container" className="relative flex items-center">
      <div className="absolute left-3.5 text-zinc-400 pointer-events-none flex items-center">
        <Terminal className="w-4 h-4 text-sky-500" />
      </div>
      <select
        id="language-select-dropdown"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="pl-10 pr-10 py-2.5 w-full md:w-52 rounded-xl border appearance-none font-sans text-sm font-medium transition-all duration-200 cursor-pointer focus:outline-hidden focus:ring-2 focus:ring-sky-500/50
          bg-immersive-nav border-immersive-border text-immersive-text hover:border-immersive-accent"
      >
        {SUPPORTED_LANGUAGES.map((lang) => (
          <option key={lang.value} value={lang.value}>
            {lang.label}
          </option>
        ))}
      </select>
      <div className="absolute right-3.5 text-zinc-400 pointer-events-none flex items-center">
        <ChevronDown className="w-4 h-4" />
      </div>
    </div>
  );
}
