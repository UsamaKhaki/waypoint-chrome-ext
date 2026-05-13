import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { StickyNote, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/Button';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { cn } from '@/lib/utils';

export function QuickNotesButton() {
  const [isOpen, setIsOpen] = useState(false);
  const [notes, setNotes] = useLocalStorage('quickNotes', '');
  const popupRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Close when clicking outside the popup and the trigger button
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: MouseEvent) => {
      if (
        popupRef.current?.contains(e.target as Node) ||
        buttonRef.current?.contains(e.target as Node)
      )
        return;
      setIsOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [isOpen]);

  return (
    <>
      <Button
        ref={buttonRef}
        variant="ghost"
        size="icon-sm"
        onClick={() => setIsOpen((o) => !o)}
        title="Quick Notes"
        className={cn(isOpen && 'text-accent')}
      >
        <StickyNote className="h-4 w-4" />
      </Button>

      {/* Portal renders directly on document.body — escapes ALL stacking contexts */}
      {createPortal(
        <AnimatePresence>
          {isOpen && (
            <>
              <motion.div
                ref={popupRef}
                initial={{ opacity: 0, y: -8, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8, scale: 0.97 }}
                transition={{ duration: 0.15 }}
                className="fixed top-12 right-4 z-[9998] w-80 glass-elevated rounded-2xl shadow-2xl overflow-hidden"
              >
                <div className="flex items-center justify-between px-4 py-3 border-b border-border-subtle">
                  <div className="flex items-center gap-2">
                    <StickyNote className="h-4 w-4 text-warning" />
                    <span className="text-sm font-medium text-primary">Quick Notes</span>
                  </div>
                  <Button variant="ghost" size="icon-sm" onClick={() => setIsOpen(false)}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Jot something down..."
                  className="w-full h-48 bg-transparent text-primary text-sm px-4 py-3 outline-none resize-none placeholder:text-muted font-mono"
                  autoFocus
                />
                <div className="px-4 py-2 border-t border-border-subtle flex justify-between items-center">
                  <span className="text-xs text-muted">Auto-saved locally</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setNotes('')}
                    className="text-xs text-muted hover:text-destructive"
                  >
                    Clear
                  </Button>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>,
        document.body
      )}
    </>
  );
}
