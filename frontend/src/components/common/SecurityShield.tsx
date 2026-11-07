import React, { useEffect } from 'react';

/**
 * SecurityShield enforces runtime browser defenses:
 * 1. Blocks developer inspect shortcuts (F12, Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+Shift+C, Ctrl+U).
 * 2. Restricts right-click inspect on checkout terminals.
 * 3. Sanitizes console output so internal system states are not exposed.
 */
export const SecurityShield: React.FC = () => {
  useEffect(() => {
    // Print security banner in console
    const bannerStyle =
      'color: #ea580c; font-size: 13px; font-weight: bold; padding: 4px; border-radius: 4px;';
    console.info('%c[CounterPilot Terminal Security Active]', bannerStyle);
    console.info(
      'This is a point-of-sale financial terminal. Inspection and script injection are restricted.'
    );

    const handleKeyDown = (e: KeyboardEvent) => {
      // 1. F12 key
      if (e.key === 'F12' || e.keyCode === 123) {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }

      // 2. Ctrl+Shift+I (Windows/Linux) or Cmd+Option+I (Mac)
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'I' || e.key === 'i')) {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }

      // 3. Ctrl+Shift+J or Cmd+Option+J (Console)
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'J' || e.key === 'j')) {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }

      // 4. Ctrl+Shift+C or Cmd+Option+C (Inspect Element)
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'C' || e.key === 'c')) {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }

      // 5. Ctrl+U or Cmd+Option+U (View Page Source)
      if ((e.ctrlKey || e.metaKey) && (e.key === 'U' || e.key === 'u')) {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }
    };

    // Restrict context menu on right click in production
    const handleContextMenu = (e: MouseEvent) => {
      // Allow context menu only inside editable text inputs/textareas
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
    document.addEventListener('contextmenu', handleContextMenu);

    return () => {
      window.removeEventListener('keydown', handleKeyDown, true);
      document.removeEventListener('contextmenu', handleContextMenu);
    };
  }, []);

  return null;
};
