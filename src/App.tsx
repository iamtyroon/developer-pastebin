import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Braces, 
  Link as LinkIcon, 
  Copy, 
  Plus, 
  Loader2, 
  Database, 
  ShieldAlert,
  ChevronRight,
  Sparkles,
  RefreshCw,
  QrCode
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';

import { Theme, Paste } from './types';
import { savePaste, getPaste, isFirebaseConfigured } from './firebase';
import { ThemeToggle } from './components/ThemeToggle';
import { LanguageSelector } from './components/LanguageSelector';
import { CodeInput } from './components/CodeInput';
import { CodeRenderer } from './components/CodeRenderer';
import { Toast, ToastMessage } from './components/Toast';

export default function App() {
  // Theme State
  const [theme, setTheme] = useState<Theme>('dark');

  // Input States (Create View)
  const [code, setCode] = useState('');
  const [language, setLanguage] = useState('javascript');
  const [generating, setGenerating] = useState(false);

  // Active Dynamic View State
  const [activePasteId, setActivePasteId] = useState<string | null>(null);
  const [activePaste, setActivePaste] = useState<Paste | null>(null);
  const [fetchingPaste, setFetchingPaste] = useState(false);
  const [showQr, setShowQr] = useState(false);

  // Notifications State
  const [toast, setToast] = useState<ToastMessage | null>(null);

  // Set up Toast notification triggering
  const showToast = (text: string, type: 'success' | 'info' = 'success') => {
    const id = Math.random().toString();
    setToast({ id, text, type });
  };

  // Close toast automatically
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => {
        setToast(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  // Load Theme Preference from local storage or default to dark
  useEffect(() => {
    const savedTheme = localStorage.getItem('pastebin_theme') as Theme;
    if (savedTheme) {
      setTheme(savedTheme);
    } else {
      setTheme('dark');
    }
  }, []);

  // Hydrate Class List based on current Theme State
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
      document.documentElement.style.colorScheme = 'dark';
    } else {
      document.documentElement.classList.remove('dark');
      document.documentElement.style.colorScheme = 'light';
    }
    localStorage.setItem('pastebin_theme', theme);
  }, [theme]);

  // Parse location rules for routing paste identification
  const getPasteIdFromUrl = (): string | null => {
    // 1. Check matching /paste/{id} pathname format
    const pathname = window.location.pathname;
    const match = pathname.match(/\/paste\/([a-zA-Z0-9_\-]+)/);
    if (match && match[1]) {
      return match[1];
    }

    // 2. Check query string parameters
    const params = new URLSearchParams(window.location.search);
    const queryId = params.get('id') || params.get('paste');
    if (queryId) {
      return queryId;
    }

    // 3. Check hash locations
    const hash = window.location.hash;
    if (hash) {
      const cleanHash = hash.replace('#', '');
      const parts = cleanHash.split('/');
      const hashId = parts[parts.length - 1];
      if (hashId && hashId.length >= 6) {
        return hashId;
      }
    }
    return null;
  };

  // Safe routine to load paste details from FireDB or LocalStorage
  const loadPasteItem = async (id: string) => {
    setFetchingPaste(true);
    try {
      const item = await getPaste(id);
      if (item) {
        setActivePaste(item);
      } else {
        showToast("Paste not found or expired.", "info");
        // Revert to creation route safely
        setActivePasteId(null);
        window.history.pushState(null, '', '/');
      }
    } catch (e) {
      console.error(e);
      showToast("Could not fetch the paste snippet.", "info");
    } finally {
      setFetchingPaste(false);
    }
  };

  // Listening for address bar edits or backward/forward actions
  useEffect(() => {
    const handleUrlLoadingChange = () => {
      const urlId = getPasteIdFromUrl();
      if (urlId) {
        setActivePasteId(urlId);
        loadPasteItem(urlId);
      } else {
        setActivePasteId(null);
        setActivePaste(null);
      }
    };

    // Initial check
    handleUrlLoadingChange();

    // Hook popstate event for natural browser navigation
    window.addEventListener('popstate', handleUrlLoadingChange);
    return () => window.removeEventListener('popstate', handleUrlLoadingChange);
  }, []);

  // Core callback to submit and generate copy links
  const handleGeneratePaste = async () => {
    if (!code.trim()) {
      showToast("Please enter a code snippet before saving.", "info");
      return;
    }

    setGenerating(true);
    try {
      const id = await savePaste(code, language);
      
      // Update browser history so URL points cleanly to the shareable route
      const newPath = `/paste/${id}`;
      window.history.pushState({ pasteId: id }, '', newPath);
      
      setActivePasteId(id);
      await loadPasteItem(id);
      showToast("Link created successfully!", "success");
    } catch (err: any) {
      console.error(err);
      showToast("Offline local backup configured.", "info");
    } finally {
      setGenerating(false);
    }
  };

  // Clear state space and reset back to Home Route
  const handleNewPaste = () => {
    setCode('');
    setActivePasteId(null);
    setActivePaste(null);
    setShowQr(false);
    window.history.pushState(null, '', '/');
  };

  // Copy raw snippet text to visual clipboard
  const handleCopyCode = async () => {
    const rawCode = activePaste ? activePaste.code : code;
    if (!rawCode) return;
    try {
      await navigator.clipboard.writeText(rawCode);
      showToast("Raw code copied to clipboard!", "success");
    } catch (err) {
      showToast("Failed to copy code text.", "info");
    }
  };

  // Copy unique dynamic link to clipboard
  const handleCopyLink = async () => {
    if (!activePasteId) return;
    
    // Construct standard complete URL
    const locationOrigin = window.location.origin;
    const path = `/paste/${activePasteId}`;
    const cleanUrl = `${locationOrigin}${path}`;
    
    try {
      await navigator.clipboard.writeText(cleanUrl);
      showToast("Shareable link copied!", "success");
    } catch (err) {
      showToast("Failed to copy URL link.", "info");
    }
  };

  // Render timestamp nicely
  const formattedTime = (isoString?: string) => {
    if (!isoString) return 'Just now';
    try {
      const date = new Date(isoString);
      return date.toLocaleDateString(undefined, { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric',
        hour: '2-digit', 
        minute: '2-digit' 
      });
    } catch {
      return 'Just now';
    }
  };

  return (
    <div 
      id="dev-pastebin-applet-root"
      className="min-h-screen transition-all duration-205 select-none flex flex-col relative overflow-hidden
        bg-[#f6f8fa] text-[#24292f] dark:bg-[#0d1117] dark:text-[#e6edf3]"
    >
      {/* Immersive ambient glowing decorative orbs */}
      <div className="immersive-glow-orb top-[-160px] right-[-140px] opacity-70" />
      <div className="immersive-glow-orb bottom-[-220px] left-[-180px] opacity-35" />

      {/* Header Container */}
      <header 
        id="applet-navigation"
        className="w-full border-b transition-colors duration-250 sticky top-0 z-40 backdrop-blur-md
          bg-white/85 border-[#d0d7de]/80
          dark:bg-[#161b22]/85 dark:border-[#30363d]/80"
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-18 flex items-center justify-between relative z-10">
          <div 
            id="brand-mark"
            onClick={handleNewPaste}
            className="flex items-center gap-2.5 cursor-pointer group"
          >
            <div className="w-8 h-8 rounded-lg bg-[#2f81f7] text-white flex items-center justify-center font-bold text-[13px] shadow-sm shadow-[#2f81f7]/20 group-hover:scale-105 transition-transform duration-200 shrink-0 select-none">
              &lt;/&gt;
            </div>
            <div className="flex flex-col">
              <span className="font-sans font-bold tracking-tight text-lg leading-tight text-zinc-900 dark:text-zinc-50">
                Snippet.dev
              </span>
              <span className="text-[10px] font-semibold tracking-wide text-zinc-500 dark:text-zinc-400 mt-0.5">
                rapid code share
              </span>
            </div>
          </div>

          <div id="header-utilities-panel" className="flex items-center gap-3">
            <ThemeToggle theme={theme} onToggle={() => setTheme(theme === 'dark' ? 'light' : 'dark')} />
          </div>
        </div>
      </header>

      {/* Main Scaffold panel */}
      <main id="main-content-scaffold" className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-8 md:py-12 flex flex-col justify-start">
        
        {/* Dynamic Display Selector block */}
        {fetchingPaste ? (
          <div id="editor-loading-screen" className="flex-1 flex flex-col items-center justify-center gap-3 py-24">
            <Loader2 className="w-8 h-8 text-sky-500 animate-spin" />
            <p className="font-mono text-sm text-zinc-400">Loading code snippet...</p>
          </div>
        ) : activePasteId && activePaste ? (
          
          /* Visual shared code renderer route */
          <motion.div
            id="shared-view-panel"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="space-y-6"
          >
            {/* Toolbar Panel */}
            <div 
              id="shared-view-toolbar"
              className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl border transition-colors duration-200 relative z-10
                bg-immersive-nav border-immersive-border text-immersive-text"
            >
              <div id="shared-metadata" className="flex flex-col gap-1">
                <div className="flex items-center gap-2 text-xs font-mono text-zinc-500 dark:text-zinc-400">
                  <span>Language</span>
                  <ChevronRight className="w-3.5 h-3.5 text-zinc-400 dark:text-zinc-650" />
                  <span className="font-bold text-[#2f81f7] uppercase">{activePaste.language}</span>
                </div>
                <h1 className="text-sm font-sans font-medium text-zinc-500 dark:text-zinc-400 mt-1">
                  Pasted on <span className="font-mono font-bold text-zinc-800 dark:text-zinc-200">{formattedTime(activePaste.createdAt)}</span>
                </h1>
              </div>

              <div id="shared-actions-bar" className="flex items-center flex-wrap gap-2.5">
                <div className="relative">
                  <button
                    id="btn-view-qr"
                    onClick={() => setShowQr(!showQr)}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border font-sans text-sm font-semibold cursor-pointer select-none tracking-tight transition-all duration-205 focus:outline-hidden ${
                      showQr 
                        ? 'bg-[#2f81f7]/10 border-[#2f81f7] text-[#2f81f7]' 
                        : 'bg-immersive-btn border-immersive-border text-immersive-text hover:bg-immersive-btn-hover'
                    }`}
                  >
                    <QrCode className="w-4 h-4" />
                    QR Code
                  </button>
                  
                  <AnimatePresence>
                    {showQr && (
                      <motion.div
                        id="qr-code-popover"
                        initial={{ opacity: 0, scale: 0.95, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 10 }}
                        className="absolute right-0 top-13 z-50 p-4 rounded-2xl shadow-xl border w-48 text-center flex flex-col items-center gap-3
                          bg-immersive-nav border-immersive-border"
                      >
                        <div className="bg-white p-2.5 rounded-xl border border-zinc-200/60 shadow-inner flex items-center justify-center">
                          <QRCodeSVG
                            value={`${window.location.origin}/paste/${activePasteId}`}
                            size={128}
                            level="H"
                            includeMargin={false}
                          />
                        </div>
                        <span className="text-[10px] font-mono text-zinc-400 dark:text-zinc-500 leading-tight">
                          Scan to view on mobile
                        </span>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <button
                  id="btn-copy-link"
                  onClick={handleCopyLink}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl border font-sans text-sm font-semibold cursor-pointer select-none tracking-tight transition-all duration-205 focus:outline-hidden
                    bg-immersive-btn border-immersive-border text-immersive-text hover:bg-immersive-btn-hover"
                >
                  <LinkIcon className="w-4 h-4 text-[#2f81f7]" />
                  Copy Link
                </button>

                <button
                  id="btn-copy-code"
                  onClick={handleCopyCode}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl border font-sans text-sm font-semibold cursor-pointer select-none tracking-tight transition-all duration-205 focus:outline-hidden
                    bg-immersive-btn border-immersive-border text-immersive-text hover:bg-immersive-btn-hover"
                >
                  <Copy className="w-4 h-4 text-[#238636]" />
                  Copy Raw Code
                </button>

                <button
                  id="btn-new-paste"
                  onClick={handleNewPaste}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-white font-sans text-sm font-semibold cursor-pointer select-none tracking-tight transition-all duration-200 active:scale-[0.98] focus:outline-hidden
                    bg-[#238636] hover:bg-[#2ea043] hover:shadow-md hover:shadow-emerald-500/10 overflow-hidden"
                >
                  <Plus className="w-4 h-4" />
                  New Paste
                </button>
              </div>
            </div>

            {/* Syntactic highlight panel */}
            <div id="renderer-card-block" className="relative">
              <div className="absolute right-4 top-4 z-10 flex items-center gap-2">
                <span className="px-2.5 py-1 text-[10px] font-bold font-mono tracking-wider rounded-md border
                  bg-immersive-btn/90 border-immersive-border text-zinc-500 dark:text-zinc-400"
                >
                  READ ONLY MODE
                </span>
              </div>
              <CodeRenderer code={activePaste.code} language={activePaste.language} theme={theme} />
            </div>
          </motion.div>
        
        ) : (
          
          /* Visual creation landing route */
          <motion.div
            id="creator-view-panel"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
            className="space-y-6 flex flex-col justify-start"
          >
            {/* Header branding description */}
            <div id="creator-intro-block" className="space-y-3 relative z-10">
              <h2 className="text-3xl sm:text-4xl font-sans font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
                Create & Share Snippets Instantly
              </h2>
              <p className="text-sm sm:text-base text-zinc-500 dark:text-zinc-400 max-w-2xl font-sans font-light">
                Write or paste block code, pick your language syntax, and share the generated read-only URL seamlessly across chats.
              </p>
            </div>

            {/* Controls segment */}
            <div 
              id="editor-controls-bar"
              className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 p-4 rounded-2xl border transition-colors duration-200 relative z-10
                bg-immersive-nav border-immersive-border text-immersive-text"
            >
              <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                <span className="text-xs font-mono font-medium text-zinc-500 dark:text-zinc-400">Syntax Highlight:</span>
                <LanguageSelector value={language} onChange={setLanguage} />
              </div>

              <button
                id="btn-generate-link"
                disabled={generating || !code.trim()}
                onClick={handleGeneratePaste}
                className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl font-sans text-sm font-semibold select-none cursor-pointer tracking-tight transition-all duration-200 active:scale-[0.98] focus:outline-hidden text-white
                  disabled:opacity-40 disabled:cursor-not-allowed disabled:active:scale-100
                  bg-[#238636] hover:bg-[#2ea043] hover:shadow-md hover:shadow-emerald-500/10 shrink-0"
              >
                {generating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Generating Link...
                  </>
                ) : (
                  <>
                    <Database className="w-4 h-4" />
                    Generate Shareable Link
                  </>
                )}
              </button>
            </div>

            {/* Editor Canvas workspace */}
            <CodeInput value={code} onChange={setCode} />

            {/* Info guides */}
            {!isFirebaseConfigured && (
              <div 
                id="firebase-educational-alert"
                className="flex gap-3 p-4 rounded-xl border text-xs leading-relaxed
                  bg-amber-500/5 border-amber-500/20 text-amber-800 dark:text-amber-400"
              >
                <ShieldAlert className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                <div className="space-y-1 font-sans">
                  <p className="font-bold">Pending Firebase Terms Approval</p>
                  <p>
                    Developer Pastebin is locally functional! We are currently falling back to standard LocalStorage persistence as the Firebase Terms of Service have not yet been accepted. Once accepted, Firestore will sync as the secure central backend automatically.
                  </p>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </main>

      {/* Persistent global Toast notifications */}
      <Toast message={toast} onClose={() => setToast(null)} />

      {/* Humble aesthetic credit footer */}
      <footer 
        id="applet-footer"
        className="w-full border-t py-6 text-center text-[11px] font-mono mt-auto relative z-10
          bg-[#f6f8fa]/80 border-[#d0d7de]/50 text-zinc-500
          dark:bg-[#161b22]/80 dark:border-[#30363d] dark:text-zinc-400"
      >
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <span>&copy; {new Date().getFullYear()} Snippet.dev. Zero authentication required.</span>
          <span className="flex items-center gap-2 text-zinc-400 dark:text-zinc-500">
            <Database className="w-3.5 h-3.5" /> 
            {isFirebaseConfigured ? 'Central Firestore DB Active' : 'Sandbox Storage (Local Mode)'}
          </span>
        </div>
      </footer>
    </div>
  );
}

// Inline workaround helper for copying Lucide icon names mismatch and avoiding compilation import issues
function LinkIconIcon(props: React.SVGProps<SVGSVGElement>) {
  return <LinkIcon {...props} />;
}
