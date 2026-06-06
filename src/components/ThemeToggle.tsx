import { Sun, Moon } from 'lucide-react';
import { motion } from 'motion/react';
import { Theme } from '../types';

interface ThemeToggleProps {
  theme: Theme;
  onToggle: () => void;
}

export function ThemeToggle({ theme, onToggle }: ThemeToggleProps) {
  return (
    <button
      id="theme-toggle-btn"
      onClick={onToggle}
      className="p-2.5 rounded-xl border transition-all duration-200 cursor-pointer
        bg-immersive-btn hover:bg-immersive-btn-hover border-immersive-border text-immersive-text
        focus:outline-hidden focus:ring-2 focus:ring-sky-500/50"
      aria-label="Toggle visual theme"
    >
      <motion.div
        initial={false}
        animate={{ rotate: theme === 'dark' ? 180 : 0, scale: 1 }}
        transition={{ type: "spring", stiffness: 200, damping: 15 }}
      >
        {theme === 'dark' ? (
          <Sun className="w-5 h-5 text-amber-400" />
        ) : (
          <Moon className="w-5 h-5 text-zinc-600" />
        )}
      </motion.div>
    </button>
  );
}
