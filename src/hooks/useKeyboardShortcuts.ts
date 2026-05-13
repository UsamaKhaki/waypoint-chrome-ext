import { useEffect, useRef, useCallback } from 'react';
import { useCommandPaletteStore } from '@/store/commandPalette.store';

type SectionNavigator = (section: string) => void;

const CHORD_TIMEOUT = 1000; // ms to complete a chord

const SECTION_MAP: Record<string, string> = {
  '1': 'overview',
  '2': 'bookmarks',
  '3': 'environments',
  '4': 'github',
  '5': 'focus',
  '6': 'tabs',
  '7': 'settings',
};

const CHORD_MAP: Record<string, Record<string, string>> = {
  g: {
    h: 'github',
    p: 'github', // GitHub PRs — navigate to github section
  },
  e: {
    l: 'environments',
    s: 'environments',
    p: 'environments',
  },
};

export function useKeyboardShortcuts(onNavigate: SectionNavigator) {
  // Use selectors to avoid subscribing to the full store (which would cause App to re-render on every command palette state change)
  const openPalette = useCommandPaletteStore((s) => s.open);
  const paletteOpen = useCommandPaletteStore((s) => s.isOpen);
  const pendingChord = useRef<string | null>(null);
  const chordTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearChord = useCallback(() => {
    if (chordTimer.current) clearTimeout(chordTimer.current);
    pendingChord.current = null;
    chordTimer.current = null;
  }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isInInput =
        target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable;

      // CMD+K → always open palette, even in inputs
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        openPalette();
        clearChord();
        return;
      }

      // Don't intercept other shortcuts when palette is open or user is typing
      if (paletteOpen || isInInput) return;

      // / → open palette as search
      if (e.key === '/' && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        openPalette();
        clearChord();
        return;
      }

      // Escape → clear pending chord
      if (e.key === 'Escape') {
        clearChord();
        return;
      }

      // CMD+1–9 → navigate sections
      if ((e.metaKey || e.ctrlKey) && e.key >= '1' && e.key <= '9') {
        e.preventDefault();
        const section = SECTION_MAP[e.key];
        if (section) onNavigate(section);
        clearChord();
        return;
      }

      // Chord handling (no modifier keys)
      if (!e.metaKey && !e.ctrlKey && !e.altKey && e.key.length === 1) {
        const key = e.key.toLowerCase();

        if (pendingChord.current !== null) {
          // Second key of chord
          const chordResult = CHORD_MAP[pendingChord.current]?.[key];
          clearChord();
          if (chordResult) {
            e.preventDefault();
            onNavigate(chordResult);
          }
          return;
        }

        // First key of potential chord
        if (CHORD_MAP[key]) {
          pendingChord.current = key;
          chordTimer.current = setTimeout(() => {
            clearChord();
          }, CHORD_TIMEOUT);
          // Don't preventDefault on first key — let it fall through
        }
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [openPalette, paletteOpen, onNavigate, clearChord]);
}
