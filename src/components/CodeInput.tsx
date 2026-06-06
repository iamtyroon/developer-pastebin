import React, { useRef, useEffect } from 'react';

interface CodeInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export function CodeInput({ value, onChange, placeholder = 'Paste or write your custom code snippet here...' }: CodeInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const lineNumbersRef = useRef<HTMLDivElement>(null);

  // Sync scroll of line numbers with text entry scroll
  const handleScroll = () => {
    if (textareaRef.current && lineNumbersRef.current) {
      lineNumbersRef.current.scrollTop = textareaRef.current.scrollTop;
    }
  };

  // Support Tab key indentation inside code area
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const target = e.currentTarget;
      const start = target.selectionStart;
      const end = target.selectionEnd;
      const val = target.value;
      
      const tabSpaces = '  ';
      const newValue = val.substring(0, start) + tabSpaces + val.substring(end);
      onChange(newValue);

      // Restore caret position on next animation frame
      requestAnimationFrame(() => {
        if (textareaRef.current) {
          textareaRef.current.selectionStart = textareaRef.current.selectionEnd = start + tabSpaces.length;
        }
      });
    }
  };

  const lineCount = value.split('\n').length || 1;
  const lineNumbers = Array.from({ length: lineCount }, (_, idx) => idx + 1);

  return (
    <div 
      id="code-editor-outer-panel"
      className="relative flex flex-row rounded-2xl border font-mono text-sm overflow-hidden h-[450px] transition-all duration-200
        bg-immersive-bg border-immersive-border focus-within:border-immersive-accent focus-within:ring-2 focus-within:ring-sky-500/10"
    >
      {/* Scroll-synced Line Numbers Column */}
      <div 
        id="editor-line-numbers-rail"
        ref={lineNumbersRef}
        className="py-4 w-12 flex flex-col items-end pr-3 select-none text-right overflow-hidden border-r shrink-0
          bg-immersive-btn border-immersive-border text-zinc-400 dark:text-zinc-500"
        style={{ scrollbarWidth: 'none' }} // Firefox scrollbar hidden
      >
        {lineNumbers.map((num) => (
          <div key={num} className="h-6 leading-6 text-xs font-mono">
            {num}
          </div>
        ))}
      </div>

      {/* Editor Main Textarea */}
      <textarea
        id="code-editor-textarea"
        ref={textareaRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onScroll={handleScroll}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        spellCheck="false"
        className="w-full h-full py-4 px-4 resize-none focus:outline-hidden overflow-y-auto overflow-x-auto leading-6 whitespace-pre font-mono text-sm
          text-immersive-text placeholder-zinc-400 bg-transparent dark:placeholder-zinc-500"
      />
    </div>
  );
}
