import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { tomorrow, prism } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Theme } from '../types';

interface CodeRendererProps {
  code: string;
  language: string;
  theme: Theme;
}

export function CodeRenderer({ code, language, theme }: CodeRendererProps) {
  // Map our general language value to Prism-supported tags
  const getPrismLanguage = (lang: string) => {
    switch (lang) {
      case 'plain':
        return 'text';
      case 'typescript':
        return 'typescript';
      case 'javascript':
        return 'javascript';
      case 'python':
        return 'python';
      case 'go':
        return 'go';
      case 'html':
        return 'markup';
      case 'css':
        return 'css';
      case 'json':
        return 'json';
      case 'rust':
        return 'rust';
      case 'cpp':
        return 'cpp';
      case 'java':
        return 'java';
      case 'yaml':
        return 'yaml';
      default:
        return 'text';
    }
  };

  const codeStyle = theme === 'dark' ? tomorrow : prism;

  return (
    <div 
      id="syntax-highlighter-wrapper"
      className="relative rounded-2xl border overflow-x-auto overflow-y-auto max-h-[500px] transition-all duration-200
        bg-immersive-bg border-immersive-border"
    >
      <SyntaxHighlighter
        language={getPrismLanguage(language)}
        style={codeStyle}
        showLineNumbers={true}
        wrapLines={true}
        lineNumberStyle={{
          color: theme === 'dark' ? '#4b5563' : '#9ca3af',
          minWidth: '2.5rem',
          textAlign: 'right',
          paddingRight: '1rem',
          userSelect: 'none',
        }}
        customStyle={{
          margin: 0,
          background: 'none',
          padding: '1.25rem 1rem 1.25rem 0.5rem',
          fontFamily: 'var(--font-mono)',
          fontSize: '0.875rem',
          lineHeight: '1.5rem',
        }}
      >
        {code}
      </SyntaxHighlighter>
    </div>
  );
}
