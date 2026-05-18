import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Layers, Check, ChevronDown, Plus, Trash2, Cloud, Sparkles, X, Zap } from 'lucide-react';
import { useWorkspaceStore } from '@/store/workspace.store';
import { cn } from '@/lib/utils';
import { storage } from '@/services/storage';
import { usePro } from '@/hooks/usePro';
import { PRO_FEATURES } from '@/constants/subscription';
import type { WorkspaceMode, CustomWorkspaceMode } from '@/types';

const SUGGESTED_EMOJIS = [
  '🌐',
  '✨',
  '🎨',
  '⚙️',
  '🚀',
  '🐛',
  '📋',
  '🔥',
  '🤝',
  '🧘',
  '🤖',
  '📊',
  '🔬',
  '🛠️',
  '📚',
  '⚡',
  '🎯',
  '🧪',
  '🪐',
  '🌙',
  '💼',
  '🏗️',
  '🎮',
  '📝',
  '🔭',
  '🏆',
  '🧩',
  '🌱',
];

const GENERAL_LABEL = 'General';
const GENERAL_EMOJI = '🌐';

interface ModeEntry {
  id: string;
  label: string;
  emoji: string;
  description: string;
  isCustom: boolean;
}

/* ─────────────────────── Create-workspace modal ─────────────────────── */
/* Matches the Quick App "Add" modal style: framer-motion-based, glass card,
   compact emoji-row picker, inline icon button. */

interface CreateWorkspaceModalProps {
  onClose: () => void;
  onCreate: (input: { label: string; description: string; emoji: string }) => Promise<void>;
}

function CreateWorkspaceModal({ onClose, onCreate }: CreateWorkspaceModalProps) {
  const [label, setLabel] = useState('');
  const [description, setDescription] = useState('');
  const [emoji, setEmoji] = useState('✨');
  const [iconOpen, setIconOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    if (!label.trim()) {
      setError('Name is required');
      return;
    }
    setError('');
    setSubmitting(true);
    try {
      await onCreate({
        label: label.trim(),
        description: description.trim() || 'Custom workspace',
        emoji: emoji.trim() || '✨',
      });
    } finally {
      setSubmitting(false);
    }
  };

  return createPortal(
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative glass-elevated rounded-2xl p-6 w-full max-w-sm shadow-2xl space-y-4">
        <h3 className="text-base font-semibold text-primary">Create workspace</h3>

        <div className="space-y-3">
          <input
            autoFocus
            placeholder="Workspace name *"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
            className="w-full rounded-xl bg-surface border border-border-subtle text-primary text-sm px-3 py-2 outline-none focus:border-accent"
          />
          <input
            placeholder="Description (optional)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
            className="w-full rounded-xl bg-surface border border-border-subtle text-primary text-sm px-3 py-2 outline-none focus:border-accent"
          />

          {/* Icon picker — same shape as the Quick App picker trigger */}
          <div className="space-y-1">
            <label className="text-xs text-muted">Icon (optional)</label>
            <div className="relative">
              <button
                type="button"
                onClick={() => setIconOpen((o) => !o)}
                className={cn(
                  'flex items-center gap-2 w-full px-3 py-2 rounded-xl border text-sm transition-all',
                  iconOpen
                    ? 'border-accent bg-surface-elevated'
                    : 'border-border-subtle bg-surface hover:border-border'
                )}
              >
                <span className="text-xl w-6 text-center">{emoji}</span>
                <span className="flex-1 text-left text-muted text-xs">Pick an icon</span>
                {emoji && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setEmoji('✨');
                    }}
                    className="text-muted hover:text-secondary p-0.5"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
                <ChevronDown
                  className={cn(
                    'h-3.5 w-3.5 text-muted transition-transform',
                    iconOpen && 'rotate-180'
                  )}
                />
              </button>

              <AnimatePresence>
                {iconOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={{ duration: 0.12 }}
                    className="absolute z-50 top-full mt-1 left-0 right-0 glass-elevated rounded-2xl shadow-2xl overflow-hidden"
                  >
                    <div className="grid grid-cols-10 gap-0.5 p-2 max-h-36 overflow-y-auto">
                      {SUGGESTED_EMOJIS.map((em) => (
                        <button
                          key={em}
                          type="button"
                          onClick={() => {
                            setEmoji(em);
                            setIconOpen(false);
                          }}
                          className={cn(
                            'flex items-center justify-center h-8 w-8 rounded-lg text-lg transition-all hover:bg-surface-elevated hover:scale-110',
                            emoji === em && 'bg-accent/15 ring-1 ring-accent'
                          )}
                        >
                          {em}
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {error && <p className="text-xs text-destructive">{error}</p>}

        <div className="flex gap-2 justify-end">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="px-4 py-2 rounded-xl text-sm text-secondary hover:text-primary hover:bg-surface-elevated transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting || !label.trim()}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm bg-accent text-white hover:bg-accent-hover transition-colors disabled:opacity-40 disabled:pointer-events-none"
          >
            <Sparkles className="h-4 w-4" />
            Create & switch
          </button>
        </div>
      </div>
    </motion.div>,
    document.body
  );
}

/* ───────────────────────── Selector dropdown ───────────────────────── */

export function WorkspaceModeSelector() {
  const { currentMode, customModes, setMode, addCustomMode, removeCustomMode } =
    useWorkspaceStore();
  const { isPro, requirePro } = usePro();
  const [isOpen, setIsOpen] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [dropdownPos, setDropdownPos] = useState({ top: 0, right: 0 });
  const buttonRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setDropdownPos({
        top: rect.bottom + 6,
        right: window.innerWidth - rect.right,
      });
    }
  }, [isOpen]);

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

  const handleCreate = async (input: { label: string; description: string; emoji: string }) => {
    const newMode = await addCustomMode(input);
    await setMode(newMode.id);
    setShowCreate(false);
    setIsOpen(false);
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!window.confirm('Delete this workspace?')) return;
    await removeCustomMode(id);
  };

  /* The only built-in is "default" (General). Everything else is user-created. */
  const generalEntry: ModeEntry = {
    id: 'default',
    label: GENERAL_LABEL,
    emoji: GENERAL_EMOJI,
    description: 'General workspace — everything visible',
    isCustom: false,
  };
  const customEntries: ModeEntry[] = customModes.map((m: CustomWorkspaceMode) => ({
    id: m.id,
    label: m.label,
    emoji: m.emoji || '✨',
    description: m.description,
    isCustom: true,
  }));

  const activeEntry =
    [generalEntry, ...customEntries].find((e) => e.id === currentMode) ?? generalEntry;

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
        <span>{activeEntry.emoji}</span>
        <span className="hidden sm:inline">{activeEntry.label}</span>
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
              className="fixed z-[9998] w-80 glass-elevated rounded-2xl shadow-2xl overflow-hidden"
            >
              <div className="p-1.5 max-h-[70vh] overflow-y-auto">
                <div className="flex items-center justify-between px-3 py-1.5">
                  <p className="text-xs text-muted font-semibold uppercase tracking-wider">
                    Workspaces
                  </p>
                  {storage.isSynced('customWorkspaceModes') && (
                    <span
                      className="flex items-center gap-1 text-[10px] text-muted"
                      title="Workspaces sync across your Chrome profiles"
                    >
                      <Cloud className="h-3 w-3" />
                      Synced
                    </span>
                  )}
                </div>

                {[generalEntry, ...customEntries].map((entry) => {
                  const isActive = entry.id === currentMode;
                  return (
                    <button
                      key={entry.id}
                      onClick={() => handleSelect(entry.id)}
                      className={cn(
                        'group w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all duration-100',
                        isActive
                          ? 'bg-accent/10 text-primary'
                          : 'text-secondary hover:bg-surface-elevated hover:text-primary'
                      )}
                    >
                      <span className="text-base">{entry.emoji}</span>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium">{entry.label}</div>
                        <div className="text-xs text-muted truncate">{entry.description}</div>
                      </div>
                      {entry.isCustom && (
                        <button
                          onClick={(e) => handleDelete(e, entry.id)}
                          className="opacity-0 group-hover:opacity-100 text-muted hover:text-destructive p-1 rounded transition-all"
                          title="Delete workspace"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                      {isActive && <Check className="h-4 w-4 text-accent flex-shrink-0" />}
                    </button>
                  );
                })}

                <div className="border-t border-border-subtle mt-1.5 pt-1.5">
                  <button
                    onClick={() => {
                      setIsOpen(false);
                      // Pro gate: free users get the upgrade modal; Pro users
                      // get the create-workspace form.
                      if (!requirePro(PRO_FEATURES.CUSTOM_WORKSPACES)) return;
                      setShowCreate(true);
                    }}
                    className={cn(
                      'w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm transition-colors',
                      isPro
                        ? 'text-muted hover:text-accent hover:bg-surface-elevated'
                        : 'text-secondary hover:text-primary hover:bg-surface-elevated'
                    )}
                  >
                    <Plus className="h-4 w-4" />
                    <span className="flex-1 text-left">Create workspace</span>
                    {!isPro && (
                      <span className="flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-semibold uppercase tracking-wider bg-accent/15 text-accent">
                        <Zap className="h-2.5 w-2.5" />
                        Pro
                      </span>
                    )}
                  </button>
                  {!isPro && customModes.length === 0 && (
                    <p className="px-3 pt-1 pb-1 text-[11px] text-muted">
                      Upgrade to Pro to create custom workspaces.
                    </p>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}

      <AnimatePresence>
        {showCreate && (
          <CreateWorkspaceModal onClose={() => setShowCreate(false)} onCreate={handleCreate} />
        )}
      </AnimatePresence>
    </>
  );
}
