import { useState, useRef, useEffect } from 'react';
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
  const ref = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setIsOpen(false);
    };
    if (isOpen) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [isOpen]);

  const handleSelect = async (mode: WorkspaceMode) => {
    await setMode(mode);
    setIsOpen(false);
  };

  return (
    <div ref={ref} className="relative">
      <button
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

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.97 }}
            transition={{ duration: 0.12, ease: 'easeOut' }}
            className="absolute right-0 top-full mt-1.5 z-50 w-72 glass-elevated rounded-2xl shadow-2xl overflow-hidden"
          >
            <div className="p-1.5">
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
      </AnimatePresence>
    </div>
  );
}
