import { useState, useEffect } from 'react';
import { Plus, X, Edit2, Check, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuickAppsStore, type QuickApp } from '@/store/quickApps.store';
import { cn } from '@/lib/utils';
import { isValidUrl } from '@/utils';

// ── Emoji picker ─────────────────────────────────────────────────────────────
const EMOJI_CATEGORIES = [
  {
    label: 'Dev',
    emojis: [
      '🐙',
      '💻',
      '🖥️',
      '⌨️',
      '🖱️',
      '📡',
      '🔌',
      '💾',
      '📀',
      '🖨️',
      '🔧',
      '🔩',
      '⚙️',
      '🛠️',
      '🔬',
      '🔭',
      '📟',
      '📠',
      '☎️',
      '📺',
    ],
  },
  {
    label: 'Apps',
    emojis: [
      '📧',
      '📅',
      '📝',
      '📋',
      '📊',
      '📈',
      '📉',
      '🗂️',
      '🗃️',
      '📁',
      '📂',
      '🗄️',
      '📌',
      '📍',
      '✏️',
      '📎',
      '🔗',
      '📤',
      '📥',
      '📨',
    ],
  },
  {
    label: 'Cloud',
    emojis: [
      '☁️',
      '⛅',
      '🌤️',
      '🌐',
      '🌍',
      '🌎',
      '🌏',
      '📶',
      '🛰️',
      '🚀',
      '⚡',
      '🔥',
      '💧',
      '🌊',
      '❄️',
      '🌪️',
      '🌈',
      '✨',
      '💫',
      '⭐',
    ],
  },
  {
    label: 'Team',
    emojis: [
      '👥',
      '👤',
      '🤝',
      '💬',
      '📢',
      '📣',
      '🔔',
      '🔕',
      '🎯',
      '🏆',
      '🥇',
      '🎖️',
      '🏅',
      '🎗️',
      '🎪',
      '🎨',
      '🎭',
      '🎬',
      '🎤',
      '🎧',
    ],
  },
  {
    label: 'Symbols',
    emojis: [
      '▲',
      '◆',
      '●',
      '■',
      '★',
      '♦',
      '♠',
      '♣',
      '♥',
      '🔷',
      '🔶',
      '🔵',
      '🔴',
      '🟢',
      '🟡',
      '🟠',
      '🟣',
      '⬜',
      '⬛',
      '🔲',
    ],
  },
];

function EmojiPicker({ value, onChange }: { value: string; onChange: (e: string) => void }) {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState(0);

  return (
    <div className="space-y-1">
      <label className="text-xs text-muted">Icon (optional)</label>
      <div className="relative">
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className={cn(
            'flex items-center gap-2 w-full px-3 py-2 rounded-xl border text-sm transition-all',
            open
              ? 'border-accent bg-surface-elevated'
              : 'border-border-subtle bg-surface hover:border-border'
          )}
        >
          <span className="text-xl w-6 text-center">{value || '😀'}</span>
          <span className="flex-1 text-left text-muted text-xs">
            {value ? 'Selected' : 'Pick an emoji'}
          </span>
          {value && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onChange('');
              }}
              className="text-muted hover:text-secondary p-0.5"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
          <ChevronDown
            className={cn('h-3.5 w-3.5 text-muted transition-transform', open && 'rotate-180')}
          />
        </button>

        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.12 }}
              className="absolute z-50 top-full mt-1 left-0 right-0 glass-elevated rounded-2xl shadow-2xl overflow-hidden"
            >
              {/* Category tabs */}
              <div className="flex border-b border-border-subtle">
                {EMOJI_CATEGORIES.map((cat, i) => (
                  <button
                    key={cat.label}
                    type="button"
                    onClick={() => setTab(i)}
                    className={cn(
                      'flex-1 py-2 text-xs font-medium transition-colors',
                      tab === i
                        ? 'text-accent border-b-2 border-accent'
                        : 'text-muted hover:text-secondary'
                    )}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>

              {/* Emoji grid */}
              <div className="grid grid-cols-10 gap-0.5 p-2 max-h-36 overflow-y-auto">
                {EMOJI_CATEGORIES[tab].emojis.map((em) => (
                  <button
                    key={em}
                    type="button"
                    onClick={() => {
                      onChange(em);
                      setOpen(false);
                    }}
                    className={cn(
                      'flex items-center justify-center h-8 w-8 rounded-lg text-lg transition-all hover:bg-surface-elevated hover:scale-110',
                      value === em && 'bg-accent/15 ring-1 ring-accent'
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
  );
}

function AppFavicon({ url, emoji }: { url: string; emoji?: string }) {
  const [imgFailed, setImgFailed] = useState(false);

  if (emoji && (imgFailed || emoji)) {
    return <span className="text-2xl leading-none select-none">{emoji}</span>;
  }

  try {
    const hostname = new URL(url).hostname;
    return (
      <img
        src={`https://www.google.com/s2/favicons?domain=${hostname}&sz=48`}
        alt=""
        className="h-8 w-8 rounded-lg object-contain"
        onError={() => setImgFailed(true)}
      />
    );
  } catch {
    return <span className="text-2xl">🔗</span>;
  }
}

function AddAppModal({ onClose }: { onClose: () => void }) {
  const { add } = useQuickAppsStore();
  const [name, setName] = useState('');
  const [url, setUrl] = useState('');
  const [emoji, setEmoji] = useState('');
  const [error, setError] = useState('');

  const handleAdd = async () => {
    if (!name.trim()) return setError('Name is required');
    const fullUrl = url.startsWith('http') ? url : `https://${url}`;
    if (!isValidUrl(fullUrl)) return setError('Enter a valid URL');
    await add({ name: name.trim(), url: fullUrl, emoji: emoji.trim() || undefined });
    onClose();
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative glass-elevated rounded-2xl p-6 w-full max-w-sm shadow-2xl space-y-4">
        <h3 className="text-base font-semibold text-primary">Add Quick App</h3>

        <div className="space-y-3">
          <input
            autoFocus
            placeholder="App name *"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-xl bg-surface border border-border-subtle text-primary text-sm px-3 py-2 outline-none focus:border-accent"
          />
          <input
            placeholder="URL * (e.g. notion.so)"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className="w-full rounded-xl bg-surface border border-border-subtle text-primary text-sm px-3 py-2 outline-none focus:border-accent"
          />
          <EmojiPicker value={emoji} onChange={setEmoji} />
        </div>

        {error && <p className="text-xs text-destructive">{error}</p>}

        <div className="flex gap-2 justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-sm text-secondary hover:text-primary hover:bg-surface-elevated transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleAdd}
            className="px-4 py-2 rounded-xl text-sm bg-accent text-white hover:bg-accent-hover transition-colors"
          >
            Add App
          </button>
        </div>
      </div>
    </motion.div>
  );
}

function AppTile({ app, editMode }: { app: QuickApp; editMode: boolean }) {
  const { remove } = useQuickAppsStore();

  const handleClick = () => {
    if (!editMode) chrome.tabs.create({ url: app.url });
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      className="relative flex flex-col items-center gap-2 group"
    >
      <button
        onClick={handleClick}
        className={cn(
          'w-16 h-16 rounded-2xl flex items-center justify-center transition-all duration-150',
          'bg-surface border border-border-subtle',
          !editMode &&
            'hover:bg-surface-elevated hover:border-border hover:scale-105 hover:shadow-lg',
          editMode && 'animate-[wiggle_0.3s_ease-in-out_infinite]'
        )}
      >
        <AppFavicon url={app.url} emoji={app.emoji} />
      </button>

      <span className="text-xs text-muted text-center w-16 truncate leading-tight">{app.name}</span>

      {/* Delete button in edit mode */}
      <AnimatePresence>
        {editMode && (
          <motion.button
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0 }}
            onClick={() => remove(app.id)}
            className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-destructive flex items-center justify-center shadow-md"
          >
            <X className="h-3 w-3 text-white" />
          </motion.button>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export function QuickApps() {
  const { apps, load } = useQuickAppsStore();
  const [editMode, setEditMode] = useState(false);
  const [showAdd, setShowAdd] = useState(false);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2, delay: 0.2 }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <p className="section-title">Quick Apps</p>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowAdd(true)}
            className="flex items-center gap-1 text-xs text-muted hover:text-secondary transition-colors"
          >
            <Plus className="h-3.5 w-3.5" /> Add
          </button>
          <button
            onClick={() => setEditMode((e) => !e)}
            className={cn(
              'flex items-center gap-1 text-xs transition-colors',
              editMode ? 'text-accent' : 'text-muted hover:text-secondary'
            )}
          >
            {editMode ? <Check className="h-3.5 w-3.5" /> : <Edit2 className="h-3.5 w-3.5" />}
            {editMode ? 'Done' : 'Edit'}
          </button>
        </div>
      </div>

      {/* App grid */}
      <div className="flex flex-wrap gap-4">
        <AnimatePresence>
          {apps.map((app) => (
            <AppTile key={app.id} app={app} editMode={editMode} />
          ))}
        </AnimatePresence>

        {/* Add tile shortcut */}
        {!editMode && (
          <motion.button
            layout
            onClick={() => setShowAdd(true)}
            className="flex flex-col items-center gap-2 group"
          >
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center bg-surface border border-dashed border-border hover:border-accent hover:bg-surface-elevated transition-all duration-150">
              <Plus className="h-5 w-5 text-muted group-hover:text-accent transition-colors" />
            </div>
            <span className="text-xs text-muted">Add</span>
          </motion.button>
        )}
      </div>

      {/* Add modal */}
      <AnimatePresence>
        {showAdd && <AddAppModal onClose={() => setShowAdd(false)} />}
      </AnimatePresence>
    </motion.div>
  );
}
