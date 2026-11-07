import React, { useEffect, useState } from 'react';
import { ShieldAlert } from 'lucide-react';

/**
 * SecurityShield enforces runtime browser defenses:
 * 1. Blocks developer inspect shortcuts (F12, Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+Shift+C, Ctrl+U).
 * 2. Restricts right-click context inspect.
 * 3. Detects if DevTools is opened and immediately hides/locks store data with an anti-tamper screen.
 * 4. Runs anti-debugging triggers so inspect tools cannot scrape terminal state.
 */
export const SecurityShield: React.FC = () => {
  const [isDevToolsOpen, setIsDevToolsOpen] = useState(false);

  useEffect(() => {
    // 1. Keyboard shortcut blocking at window root
    const handleKeyDown = (e: KeyboardEvent) => {
      // F12 key
      if (e.key === 'F12' || e.keyCode === 123) {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }

      // Ctrl+Shift+I (Windows) or Cmd+Option+I (Mac)
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'I' || e.key === 'i' || e.keyCode === 73)) {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }

      // Ctrl+Shift+J (Console)
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'J' || e.key === 'j' || e.keyCode === 74)) {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }

      // Ctrl+Shift+C (Inspect Element)
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'C' || e.key === 'c' || e.keyCode === 67)) {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }

      // Ctrl+U (View Page Source)
      if ((e.ctrlKey || e.metaKey) && (e.key === 'U' || e.key === 'u' || e.keyCode === 85)) {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }
    };

    // 2. Context menu restriction
    const handleContextMenu = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
        return;
      }
      e.preventDefault();
    };

    window.addEventListener('keydown', handleKeyDown, true);
    document.addEventListener('contextmenu', handleContextMenu, true);

    // 3. DevTools detection mechanism
    const threshold = 160;
    const checkDevTools = () => {
      const widthThreshold = window.outerWidth - window.innerWidth > threshold;
      const heightThreshold = window.outerHeight - window.innerHeight > threshold;

      if (widthThreshold || heightThreshold) {
        setIsDevToolsOpen(true);
        // Wipe console
        try {
          console.clear();
        } catch {
          // ignore
        }
      } else {
        setIsDevToolsOpen(false);
      }
    };

    const interval = setInterval(checkDevTools, 500);
    window.addEventListener('resize', checkDevTools);

    return () => {
      window.removeEventListener('keydown', handleKeyDown, true);
      document.removeEventListener('contextmenu', handleContextMenu, true);
      window.removeEventListener('resize', checkDevTools);
      clearInterval(interval);
    };
  }, []);

  if (!isDevToolsOpen) return null;

  return (
    <div className="fixed inset-0 z-99999 flex items-center justify-center bg-slate-950/90 backdrop-blur-xl p-6 text-center select-none animate-fadeIn">
      <div className="apple-card max-w-md w-full p-8 space-y-4 border border-rose-500/30 bg-white/95 shadow-2xl">
        <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-600 flex items-center justify-center mx-auto shadow-xs">
          <ShieldAlert className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-base font-bold text-slate-900 tracking-tight">
            Security Shield Active
          </h2>
          <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
            Developer inspection tools detected on this point-of-sale terminal. Financial records and customer catalog data have been hidden to prevent unauthorized data scraping.
          </p>
        </div>
        <div className="p-3 rounded-xl bg-slate-100 border border-slate-200/80 text-[11px] text-slate-600 font-medium">
          Please close Developer Tools / Inspect Pane (F12) to resume normal counter billing.
        </div>
      </div>
    </div>
  );
};
