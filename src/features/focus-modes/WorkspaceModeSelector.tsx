import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Layers, Check, ChevronDown } from 'lucide-react';
import { useWorkspaceStore } from '@/store/workspace.store';
import { WORKSPACE_CONFIGS } from '@/constants';
import { cn } from '@/lib/utils';
import type { WorkspaceMode } from '@/types';

const MODE_EMOJIS: Record<WorkspaceMode, string> = {
  default: '🌐',
  frontend: '🎨',
  backend: '⚙️',
  devops: '🚀',
  debugging: '🐛',
  'sprint-planning': '📋',
  'production-support': '🔥',
  meeting: '🤝',
  'deep-work': '🧘',
};

export function WorkspaceModeSelector() {
  const { currentMode, setMode } = useWorkspaceStore();
  const [isOpen, setIsOpen] = useState(false);
  const [dropdownPos, setDropdownPos] = useState({ top: 0, right: 0 });
  const buttonRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Calculate dropdown position from button
  useEffect(() => {
    if (isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setDropdownPos({
        top: rect.bottom + 6,
        right: window.innerWidth - rect.right,
      });
    }
  }, [isOpen]);

  // Close on outside click
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: MouseEvent) => {
      if (
        buttonRef.current?.contains(e.target as Node) ||
        dropdownRef.current?.contains(e.target as Node)
      )
        return;
      setIsOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [isOpen]);

  const handleSelect = async (mode: WorkspaceMode) => {
    await setMode(mode);
    setIsOpen(false);
  };

  return (
    <>
      <button
        ref={buttonRef}
        onClick={() => setIsOpen((o) => !o)}
        className={cn(
          'flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-medium transition-all duration-150',
          'border border-border-subtle hover:border-border',
          'bg-surface hover:bg-surface-elevated text-secondary hover:text-primary',
          isOpen && 'border-border bg-surface-elevated text-primary'
        )}
      >
        <Layers className="h-3.5 w-3.5" />
        <span>{MODE_EMOJIS[currentMode]}</span>
        <span className="capitalize hidden sm:inline">{currentMode.replace(/-/g, ' ')}</span>
        <ChevronDown
          className={cn('h-3 w-3 transition-transform duration-150', isOpen && 'rotate-180')}
        />
      </button>

      {createPortal(
        <AnimatePresence>
          {isOpen && (
            <motion.div
              ref={dropdownRef}
              initial={{ opacity: 0, y: -6, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -6, scale: 0.97 }}
              transition={{ duration: 0.12, ease: 'easeOut' }}
              style={{ top: dropdownPos.top, right: dropdownPos.right }}
              className="fixed z-[9998] w-72 glass-elevated rounded-2xl shadow-2xl overflow-hidden"
            >
              <div className="p-1.5 max-h-[70vh] overflow-y-auto">
                <p className="px-3 py-1.5 text-xs text-muted font-semibold uppercase tracking-wider">
                  Workspace Mode
                </p>
                {(Object.keys(WORKSPACE_CONFIGS) as WorkspaceMode[]).map((mode) => {
                  const config = WORKSPACE_CONFIGS[mode];
                  const isActive = mode === currentMode;
                  return (
                    <button
                      key={mode}
                      onClick={() => handleSelect(mode)}
                      className={cn(
                        'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all duration-100',
                        isActive
                          ? 'bg-accent/10 text-primary'
                          : 'text-secondary hover:bg-surface-elevated hover:text-primary'
                      )}
                    >
                      <span className="text-base">{MODE_EMOJIS[mode]}</span>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium capitalize">
                          {mode.replace(/-/g, ' ')}
                        </div>
                        <div className="text-xs text-muted truncate">{config.description}</div>
                      </div>
                      {isActive && <Check className="h-4 w-4 text-accent flex-shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </>
  );
}
