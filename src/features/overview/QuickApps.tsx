import { useState, useEffect } from 'react';
import { Plus, X, Edit2, Check, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuickAppsStore, type QuickApp } from '@/store/quickApps.store';
import { cn } from '@/lib/utils';
import { isValidUrl } from '@/utils';

// ── Brand logos ──────────────────────────────────────────────────────────────
// We render the brand's actual website favicon (via Google's favicon service)
// rather than depending on Simple Icons, which has removed many big corporate
// logos (Microsoft, Amazon, LinkedIn, etc.) due to trademark policy.
//
// The selected brand is stored in QuickApp.emoji as `brand:<slug>` so the
// storage shape is unchanged. The slug maps to a canonical domain below.
const BRAND_PREFIX = 'brand:';

interface Brand {
  slug: string;
  name: string;
  domain: string;
}

const BRANDS: Brand[] = [
  // Code & repos
  { slug: 'github', name: 'GitHub', domain: 'github.com' },
  { slug: 'gitlab', name: 'GitLab', domain: 'gitlab.com' },
  { slug: 'bitbucket', name: 'Bitbucket', domain: 'bitbucket.org' },
  { slug: 'sourcegraph', name: 'Sourcegraph', domain: 'sourcegraph.com' },
  // Communication
  { slug: 'slack', name: 'Slack', domain: 'slack.com' },
  { slug: 'discord', name: 'Discord', domain: 'discord.com' },
  { slug: 'telegram', name: 'Telegram', domain: 'telegram.org' },
  { slug: 'whatsapp', name: 'WhatsApp', domain: 'whatsapp.com' },
  { slug: 'signal', name: 'Signal', domain: 'signal.org' },
  { slug: 'zoom', name: 'Zoom', domain: 'zoom.us' },
  { slug: 'googlemeet', name: 'Google Meet', domain: 'meet.google.com' },
  { slug: 'msteams', name: 'MS Teams', domain: 'teams.microsoft.com' },
  // Productivity
  { slug: 'notion', name: 'Notion', domain: 'notion.so' },
  { slug: 'linear', name: 'Linear', domain: 'linear.app' },
  { slug: 'jira', name: 'Jira', domain: 'atlassian.com' },
  { slug: 'confluence', name: 'Confluence', domain: 'confluence.atlassian.com' },
  { slug: 'trello', name: 'Trello', domain: 'trello.com' },
  { slug: 'asana', name: 'Asana', domain: 'asana.com' },
  { slug: 'clickup', name: 'ClickUp', domain: 'clickup.com' },
  { slug: 'monday', name: 'Monday', domain: 'monday.com' },
  // Design
  { slug: 'figma', name: 'Figma', domain: 'figma.com' },
  { slug: 'miro', name: 'Miro', domain: 'miro.com' },
  { slug: 'canva', name: 'Canva', domain: 'canva.com' },
  { slug: 'framer', name: 'Framer', domain: 'framer.com' },
  { slug: 'adobe', name: 'Adobe', domain: 'adobe.com' },
  // Google
  { slug: 'google', name: 'Google', domain: 'google.com' },
  { slug: 'gmail', name: 'Gmail', domain: 'mail.google.com' },
  { slug: 'gdrive', name: 'Drive', domain: 'drive.google.com' },
  { slug: 'gcalendar', name: 'Calendar', domain: 'calendar.google.com' },
  { slug: 'gmaps', name: 'Maps', domain: 'maps.google.com' },
  { slug: 'gdocs', name: 'Docs', domain: 'docs.google.com' },
  { slug: 'gsheets', name: 'Sheets', domain: 'sheets.google.com' },
  { slug: 'youtube', name: 'YouTube', domain: 'youtube.com' },
  // Microsoft
  { slug: 'microsoft', name: 'Microsoft', domain: 'microsoft.com' },
  { slug: 'outlook', name: 'Outlook', domain: 'outlook.com' },
  { slug: 'onedrive', name: 'OneDrive', domain: 'onedrive.live.com' },
  { slug: 'excel', name: 'Excel', domain: 'office.com' },
  { slug: 'azure', name: 'Azure', domain: 'azure.microsoft.com' },
  // Social
  { slug: 'meta', name: 'Meta', domain: 'meta.com' },
  { slug: 'facebook', name: 'Facebook', domain: 'facebook.com' },
  { slug: 'instagram', name: 'Instagram', domain: 'instagram.com' },
  { slug: 'threads', name: 'Threads', domain: 'threads.net' },
  { slug: 'x', name: 'X / Twitter', domain: 'x.com' },
  { slug: 'linkedin', name: 'LinkedIn', domain: 'linkedin.com' },
  { slug: 'tiktok', name: 'TikTok', domain: 'tiktok.com' },
  { slug: 'snapchat', name: 'Snapchat', domain: 'snapchat.com' },
  { slug: 'pinterest', name: 'Pinterest', domain: 'pinterest.com' },
  { slug: 'reddit', name: 'Reddit', domain: 'reddit.com' },
  // Cloud / infra
  { slug: 'aws', name: 'AWS', domain: 'aws.amazon.com' },
  { slug: 'gcp', name: 'GCP', domain: 'cloud.google.com' },
  { slug: 'vercel', name: 'Vercel', domain: 'vercel.com' },
  { slug: 'netlify', name: 'Netlify', domain: 'netlify.com' },
  { slug: 'cloudflare', name: 'Cloudflare', domain: 'cloudflare.com' },
  { slug: 'digitalocean', name: 'DigitalOcean', domain: 'digitalocean.com' },
  { slug: 'heroku', name: 'Heroku', domain: 'heroku.com' },
  { slug: 'render', name: 'Render', domain: 'render.com' },
  { slug: 'fly', name: 'Fly.io', domain: 'fly.io' },
  { slug: 'docker', name: 'Docker', domain: 'docker.com' },
  { slug: 'kubernetes', name: 'Kubernetes', domain: 'kubernetes.io' },
  // Languages & frameworks
  { slug: 'react', name: 'React', domain: 'react.dev' },
  { slug: 'nextjs', name: 'Next.js', domain: 'nextjs.org' },
  { slug: 'vue', name: 'Vue', domain: 'vuejs.org' },
  { slug: 'svelte', name: 'Svelte', domain: 'svelte.dev' },
  { slug: 'nodejs', name: 'Node.js', domain: 'nodejs.org' },
  { slug: 'typescript', name: 'TypeScript', domain: 'typescriptlang.org' },
  { slug: 'python', name: 'Python', domain: 'python.org' },
  { slug: 'go', name: 'Go', domain: 'go.dev' },
  { slug: 'rust', name: 'Rust', domain: 'rust-lang.org' },
  { slug: 'npm', name: 'npm', domain: 'npmjs.com' },
  // Data
  { slug: 'mongodb', name: 'MongoDB', domain: 'mongodb.com' },
  { slug: 'postgres', name: 'Postgres', domain: 'postgresql.org' },
  { slug: 'mysql', name: 'MySQL', domain: 'mysql.com' },
  { slug: 'redis', name: 'Redis', domain: 'redis.io' },
  { slug: 'supabase', name: 'Supabase', domain: 'supabase.com' },
  { slug: 'firebase', name: 'Firebase', domain: 'firebase.google.com' },
  // AI
  { slug: 'openai', name: 'OpenAI', domain: 'openai.com' },
  { slug: 'anthropic', name: 'Anthropic', domain: 'anthropic.com' },
  { slug: 'chatgpt', name: 'ChatGPT', domain: 'chat.openai.com' },
  { slug: 'claude', name: 'Claude', domain: 'claude.ai' },
  { slug: 'huggingface', name: 'HuggingFace', domain: 'huggingface.co' },
  // Media
  { slug: 'spotify', name: 'Spotify', domain: 'spotify.com' },
  { slug: 'applemusic', name: 'Apple Music', domain: 'music.apple.com' },
  { slug: 'netflix', name: 'Netflix', domain: 'netflix.com' },
  { slug: 'twitch', name: 'Twitch', domain: 'twitch.tv' },
  // Commerce / finance
  { slug: 'amazon', name: 'Amazon', domain: 'amazon.com' },
  { slug: 'apple', name: 'Apple', domain: 'apple.com' },
  { slug: 'paypal', name: 'PayPal', domain: 'paypal.com' },
  { slug: 'stripe', name: 'Stripe', domain: 'stripe.com' },
  { slug: 'shopify', name: 'Shopify', domain: 'shopify.com' },
  // Travel / lifestyle
  { slug: 'airbnb', name: 'Airbnb', domain: 'airbnb.com' },
  { slug: 'uber', name: 'Uber', domain: 'uber.com' },
  { slug: 'doordash', name: 'DoorDash', domain: 'doordash.com' },
];

const BRAND_BY_SLUG: Record<string, Brand> = BRANDS.reduce(
  (acc, b) => {
    acc[b.slug] = b;
    return acc;
  },
  {} as Record<string, Brand>
);

function isBrand(value: string | undefined): value is string {
  return !!value && value.startsWith(BRAND_PREFIX);
}

function brandUrl(slug: string, size: number): string {
  const brand = BRAND_BY_SLUG[slug];
  // Fallback: treat the slug as a domain if we don't know it (handles legacy
  // saved values that pointed at simpleicons slugs).
  const domain = brand?.domain ?? `${slug}.com`;
  return `https://www.google.com/s2/favicons?domain=${domain}&sz=${size}`;
}

function BrandIcon({ slug, size = 28 }: { slug: string; size?: number }) {
  // Google's favicon service maxes out near 64; request 64 then scale via
  // width/height so smaller renders stay crisp on hidpi displays.
  return (
    <img
      src={brandUrl(slug, 64)}
      alt={BRAND_BY_SLUG[slug]?.name ?? slug}
      width={size}
      height={size}
      className="object-contain rounded-md"
      loading="lazy"
    />
  );
}

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
  // tab: -1 = Brands, 0..n = EMOJI_CATEGORIES index
  const [tab, setTab] = useState<number>(-1);
  const [brandQuery, setBrandQuery] = useState('');

  const filteredBrands = BRANDS.filter(
    (b) =>
      brandQuery.trim().length === 0 ||
      b.name.toLowerCase().includes(brandQuery.toLowerCase()) ||
      b.slug.toLowerCase().includes(brandQuery.toLowerCase())
  );

  const renderPreview = () => {
    if (isBrand(value)) {
      const slug = value.slice(BRAND_PREFIX.length);
      return <BrandIcon slug={slug} size={22} />;
    }
    return <span className="text-xl leading-none">{value || '😀'}</span>;
  };

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
          <span className="w-6 h-6 flex items-center justify-center">{renderPreview()}</span>
          <span className="flex-1 text-left text-muted text-xs">
            {value
              ? isBrand(value)
                ? `Brand: ${value.slice(BRAND_PREFIX.length)}`
                : 'Selected'
              : 'Pick an icon or brand logo'}
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
              <div className="flex border-b border-border-subtle overflow-x-auto scrollbar-none">
                <button
                  type="button"
                  onClick={() => setTab(-1)}
                  className={cn(
                    'px-3 py-2 text-xs font-medium transition-colors whitespace-nowrap',
                    tab === -1
                      ? 'text-accent border-b-2 border-accent'
                      : 'text-muted hover:text-secondary'
                  )}
                >
                  Brands
                </button>
                {EMOJI_CATEGORIES.map((cat, i) => (
                  <button
                    key={cat.label}
                    type="button"
                    onClick={() => setTab(i)}
                    className={cn(
                      'px-3 py-2 text-xs font-medium transition-colors whitespace-nowrap',
                      tab === i
                        ? 'text-accent border-b-2 border-accent'
                        : 'text-muted hover:text-secondary'
                    )}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>

              {tab === -1 ? (
                <div className="p-2 space-y-2">
                  <input
                    autoFocus
                    placeholder="Search brands (github, slack, figma…)"
                    value={brandQuery}
                    onChange={(e) => setBrandQuery(e.target.value)}
                    className="w-full rounded-lg bg-surface border border-border-subtle text-primary text-xs px-2.5 py-1.5 outline-none focus:border-accent"
                  />
                  <div className="grid grid-cols-6 gap-1 max-h-44 overflow-y-auto pr-1">
                    {filteredBrands.length === 0 ? (
                      <div className="col-span-6 text-center text-xs text-muted py-6">
                        No brand matches “{brandQuery}”
                      </div>
                    ) : (
                      filteredBrands.map((b) => {
                        const v = `${BRAND_PREFIX}${b.slug}`;
                        const selected = value === v;
                        return (
                          <button
                            key={b.slug}
                            type="button"
                            onClick={() => {
                              onChange(v);
                              setOpen(false);
                            }}
                            className={cn(
                              'flex flex-col items-center gap-1 p-2 rounded-lg transition-all hover:bg-surface-elevated',
                              selected && 'bg-accent/15 ring-1 ring-accent'
                            )}
                            title={b.name}
                          >
                            <BrandIcon slug={b.slug} size={24} />
                            <span className="text-[10px] text-muted truncate max-w-full leading-tight">
                              {b.name}
                            </span>
                          </button>
                        );
                      })
                    )}
                  </div>
                </div>
              ) : (
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
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function AppFavicon({ url, emoji }: { url: string; emoji?: string }) {
  const [imgFailed, setImgFailed] = useState(false);

  if (isBrand(emoji)) {
    return <BrandIcon slug={emoji.slice(BRAND_PREFIX.length)} size={32} />;
  }

  if (emoji) {
    return <span className="text-2xl leading-none select-none">{emoji}</span>;
  }

  try {
    const hostname = new URL(url).hostname;
    if (imgFailed) return <span className="text-2xl">🔗</span>;
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
      data-testid="quick-apps"
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
