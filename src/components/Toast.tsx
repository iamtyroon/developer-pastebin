import { Check, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export interface ToastMessage {
  id: string;
  text: string;
  type?: 'success' | 'info';
}

interface ToastProps {
  message: ToastMessage | null;
  onClose: () => void;
}

export function Toast({ message, onClose }: ToastProps) {
  return (
    <AnimatePresence>
      {message && (
        <div id="toast-outer-wrap" className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 pointer-events-none">
          <motion.div
            id="toast-surface-container"
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 15, scale: 0.95 }}
            transition={{ type: 'spring', damping: 18, stiffness: 220 }}
            className="flex items-center gap-3 px-5 py-3 rounded-2xl shadow-xl pointer-events-auto border font-sans text-sm font-medium
              light:bg-zinc-900 light:border-zinc-850 light:text-white
              dark:bg-zinc-900 dark:border-zinc-800 dark:text-zinc-100"
          >
            {message.type === 'info' ? (
              <Info className="w-4 h-4 text-sky-400 shrink-0" />
            ) : (
              <Check className="w-4 h-4 text-emerald-400 shrink-0" />
            )}
            <span>{message.text}</span>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
