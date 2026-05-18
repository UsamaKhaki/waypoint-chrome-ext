import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Key,
  ExternalLink,
  Settings,
  Code2,
  ClipboardPaste,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  Eye,
  EyeOff,
  MessageSquare,
  Bell,
  Hash,
  Users,
  Plus,
} from 'lucide-react';
import { SlackIcon } from '@/components/icons/ConnectorIcons';
import { useSlackAuthStore } from '@/store/slackAuth.store';
import { Spinner } from '@/components/ui/Spinner';
import { cn } from '@/lib/utils';

const STEPS = [
  {
    number: 1,
    icon: Settings,
    title: 'Create a Slack App',
    description: 'Set up a new app at api.slack.com.',
    details: [
      'Go to api.slack.com/apps in your browser',
      'Click "Create New App"',
      'Choose "From scratch"',
      'Give it a name like "Waypoint" and select your workspace',
    ],
    tip: null,
    tipType: 'info' as const,
    scopes: null,
  },
  {
    number: 2,
    icon: Code2,
    title: 'Add Required User Scopes',
    description: 'Grant the permissions Waypoint needs.',
    details: [
      'In your app settings, click "OAuth & Permissions"',
      'Scroll to "User Token Scopes" (not Bot Token Scopes)',
      'Add all five scopes listed below',
    ],
    scopes: [
      { name: 'channels:read', desc: 'List public channels' },
      { name: 'groups:read', desc: 'List private channels (needed for unread counts)' },
      { name: 'im:read', desc: 'Access direct messages' },
      { name: 'mpim:read', desc: 'Access group DMs' },
      { name: 'users:read', desc: 'Look up user information' },
    ],
    tip: 'Important: add these under "User Token Scopes" — not Bot. Bot tokens don\'t track unread messages.',
    tipType: 'warning' as const,
  },
  {
    number: 3,
    icon: Plus,
    title: 'Install App to Workspace',
    description: 'Authorise the app for your team.',
    details: [
      'Scroll up on the "OAuth & Permissions" page',
      'Click "Install to Workspace"',
      'Review the permissions and click "Allow"',
    ],
    tip: 'You need to be a workspace admin or have permission to install apps.',
    tipType: 'info' as const,
  },
  {
    number: 4,
    icon: ClipboardPaste,
    title: 'Copy the User OAuth Token',
    description: 'Grab the user-scoped token after installation.',
    details: [
      'After installing, scroll to "OAuth Tokens for Your Workspace"',
      'Copy the "User OAuth Token" — it starts with xoxp-',
      "Do NOT copy the Bot User OAuth Token (xoxb-) — it can't see unread messages",
      'Paste the xoxp- token into the field below',
    ],
    tip: 'If you accidentally used a bot token (xoxb-), generate the user token by adding User scopes and reinstalling.',
    tipType: 'warning' as const,
    scopes: null,
  },
];

const FEATURES = [
  { icon: MessageSquare, label: 'Direct Messages', desc: 'See your recent DMs at a glance' },
  { icon: Hash, label: 'Channels', desc: 'Monitor channel activity' },
  { icon: Bell, label: 'Mentions', desc: 'Never miss a @mention' },
  { icon: Users, label: 'Team Updates', desc: 'Stay in sync with your team' },
];

export function SlackConnect() {
  const { connect, isLoading, error } = useSlackAuthStore();
  const [token, setToken] = useState('');
  const [showToken, setShowToken] = useState(false);
  const [expandedStep, setExpandedStep] = useState<number | null>(1);

  const handleConnect = () => {
    const t = token.trim();
    if (t) connect(t);
  };

  return (
    <div data-testid="slack-connect" className="flex h-full overflow-hidden">
      {/* ── Left panel ── */}
      <div className="w-64 flex-shrink-0 border-r border-border-subtle flex flex-col">
        <div className="flex flex-col items-center text-center px-6 pt-8 pb-6">
          <div className="relative mb-4">
            <div className="p-4 rounded-2xl bg-surface-elevated border border-border-subtle">
              <SlackIcon className="h-8 w-8" />
            </div>
            <span className="absolute -bottom-1 -right-1 w-3 h-3 rounded-full bg-accent border-2 border-background" />
          </div>
          <h2 className="text-sm font-semibold text-primary">Connect Slack</h2>
          <p className="text-xs text-muted mt-1.5 leading-relaxed">
            Link your workspace to see messages, mentions, and channels
          </p>
        </div>

        <div className="mx-6 border-t border-border-subtle" />

        <div className="flex flex-col gap-1 px-4 py-5">
          <p className="text-[0.67rem] font-semibold uppercase tracking-widest text-muted px-2 mb-2">
            What you get
          </p>
          {FEATURES.map(({ icon: Icon, label, desc }) => (
            <div
              key={label}
              className="flex items-center gap-3 px-2 py-2.5 rounded-xl hover:bg-surface-elevated transition-colors duration-150"
            >
              <div className="w-7 h-7 rounded-lg bg-accent/10 flex items-center justify-center flex-shrink-0">
                <Icon className="h-3.5 w-3.5 text-accent" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium text-secondary leading-none">{label}</p>
                <p className="text-[0.73rem] text-muted mt-0.5 leading-snug">{desc}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-auto px-4 pb-5">
          <button
            onClick={() => chrome.tabs.create({ url: 'https://api.slack.com/apps' })}
            className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl border border-accent/20 text-accent text-xs font-medium hover:bg-accent/8 hover:border-accent/35 transition-all duration-150"
          >
            <ExternalLink className="h-3.5 w-3.5 flex-shrink-0" />
            <span>Open Slack API Apps</span>
          </button>
        </div>
      </div>

      {/* ── Right panel ── */}
      <div className="flex-1 min-w-0 flex flex-col overflow-hidden">
        <div className="px-6 pt-6 pb-4 border-b border-border-subtle flex-shrink-0">
          <h3 className="text-sm font-semibold text-primary">Setup Guide</h3>
          <p className="text-xs text-muted mt-0.5">Follow these 4 steps to create a Bot Token</p>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-2">
          {STEPS.map((step) => {
            const Icon = step.icon;
            const isOpen = expandedStep === step.number;
            const isDone = expandedStep !== null && step.number < expandedStep;

            return (
              <div
                key={step.number}
                className={cn(
                  'rounded-xl border transition-all duration-200',
                  isOpen
                    ? 'border-accent/30 bg-surface-elevated'
                    : 'border-border-subtle bg-transparent hover:bg-surface-elevated/40'
                )}
              >
                <button
                  onClick={() => setExpandedStep(isOpen ? null : step.number)}
                  className="w-full flex items-center gap-3 px-4 py-3 text-left"
                >
                  <div
                    className={cn(
                      'w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center text-[0.73rem] font-bold transition-all duration-200',
                      isOpen
                        ? 'bg-accent text-white'
                        : isDone
                          ? 'bg-accent/15 text-accent'
                          : 'bg-surface-elevated text-muted border border-border'
                    )}
                  >
                    {isDone ? <CheckCircle2 className="h-3.5 w-3.5" /> : step.number}
                  </div>
                  <Icon
                    className={cn(
                      'h-3.5 w-3.5 flex-shrink-0 transition-colors',
                      isOpen ? 'text-accent' : 'text-muted'
                    )}
                  />
                  <div className="flex-1 min-w-0">
                    <span
                      className={cn(
                        'text-xs font-semibold block',
                        isOpen ? 'text-primary' : 'text-secondary'
                      )}
                    >
                      {step.title}
                    </span>
                    <span className="text-[0.73rem] text-muted">{step.description}</span>
                  </div>
                  {isOpen ? (
                    <ChevronUp className="h-3.5 w-3.5 text-muted flex-shrink-0" />
                  ) : (
                    <ChevronDown className="h-3.5 w-3.5 text-muted flex-shrink-0" />
                  )}
                </button>

                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.18, ease: 'easeOut' }}
                      className="overflow-hidden"
                    >
                      <div className="px-4 pt-1 pb-4 space-y-3">
                        <div className="border-t border-border-subtle" />
                        <ul className="space-y-2">
                          {step.details.map((detail, i) => (
                            <li key={i} className="flex items-start gap-3">
                              <div className="w-4 h-4 rounded-full bg-accent/10 border border-accent/20 flex-shrink-0 flex items-center justify-center mt-0.5">
                                <span className="text-[0.6rem] font-bold text-accent">{i + 1}</span>
                              </div>
                              <span className="text-xs text-secondary leading-relaxed">
                                {detail}
                              </span>
                            </li>
                          ))}
                        </ul>
                        {'scopes' in step && step.scopes && (
                          <div className="rounded-lg border border-border-subtle bg-background p-3 space-y-2">
                            <p className="text-[0.67rem] font-semibold uppercase tracking-widest text-muted">
                              Required scopes
                            </p>
                            <div className="space-y-1.5">
                              {step.scopes.map((scope) => (
                                <div key={scope.name} className="flex items-center gap-2.5">
                                  <CheckCircle2 className="h-3 w-3 text-accent flex-shrink-0" />
                                  <code className="px-1.5 py-0.5 rounded bg-accent/10 text-accent text-[0.73rem] font-mono">
                                    {scope.name}
                                  </code>
                                  <span className="text-[0.73rem] text-muted">{scope.desc}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        {step.tip && (
                          <div className="flex items-start gap-2 px-3 py-2.5 rounded-lg bg-surface border border-border-subtle text-muted text-[0.73rem] leading-relaxed">
                            <span>{step.tip}</span>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>

        <div className="px-6 py-4 border-t border-border-subtle flex-shrink-0 space-y-2.5">
          <div className="flex items-center justify-between">
            <label htmlFor="slack-token" className="text-xs font-semibold text-secondary">
              Paste your User OAuth Token
            </label>
            <span className="text-[0.67rem] text-muted">
              Stored locally · never sent to a server
            </span>
          </div>
          <div className="relative">
            <Key className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted pointer-events-none" />
            <input
              id="slack-token"
              data-testid="slack-input"
              type={showToken ? 'text' : 'password'}
              placeholder="xoxp-xxxxxxxxxxxx-xxxxxxxxxxxx"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleConnect()}
              className="w-full rounded-xl bg-surface-elevated border border-border-subtle text-primary text-xs pl-9 pr-10 py-2.5 outline-none focus:border-accent/50 focus:ring-2 focus:ring-accent/10 transition-all font-mono placeholder:text-muted/40"
              autoFocus
            />
            <button
              onClick={() => setShowToken((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-secondary transition-colors"
              tabIndex={-1}
            >
              {showToken ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
            </button>
          </div>
          {token.trim().startsWith('xoxb-') && (
            <div className="flex items-start gap-2 px-3 py-2 rounded-xl bg-warning/10 border border-warning/30 text-warning text-[0.73rem]">
              <AlertTriangle className="h-3.5 w-3.5 flex-shrink-0 mt-0.5" />
              <span>
                This looks like a Bot token (xoxb-). Bot tokens can't read unread message counts —
                use the User OAuth Token (xoxp-) instead.
              </span>
            </div>
          )}
          {error && (
            <div className="flex items-start gap-2 px-3 py-2.5 rounded-xl bg-destructive/8 border border-destructive/20 text-destructive text-xs">
              <AlertTriangle className="h-3.5 w-3.5 flex-shrink-0 mt-0.5" />
              <span data-testid="slack-error">{error}</span>
            </div>
          )}
          <button
            data-testid="slack-connect-btn"
            onClick={handleConnect}
            disabled={!token.trim() || isLoading}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-accent text-white text-xs font-semibold hover:bg-accent-hover transition-all duration-150 disabled:opacity-40 disabled:pointer-events-none"
          >
            {isLoading ? <Spinner size="sm" /> : <SlackIcon className="h-3.5 w-3.5" />}
            {isLoading ? 'Connecting…' : 'Connect Slack'}
          </button>
        </div>
      </div>
    </div>
  );
}
