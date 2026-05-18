import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  GitBranch,
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
  GitPullRequest,
  GitMerge,
  Bell,
  Shield,
} from 'lucide-react';
import { useGitHubAuthStore } from '@/store/githubAuth.store';
import { Spinner } from '@/components/ui/Spinner';
import { cn } from '@/lib/utils';

const STEPS = [
  {
    number: 1,
    icon: Settings,
    title: 'Open GitHub Settings',
    description: 'Navigate to your account settings.',
    details: [
      'Click your profile picture in the top-right corner on GitHub',
      'Select "Settings" from the dropdown menu',
    ],
    tip: 'You can also go directly to github.com/settings in your browser.',
    tipType: 'info' as const,
    scopes: null,
  },
  {
    number: 2,
    icon: Code2,
    title: 'Go to Developer Settings',
    description: 'Access the token management area.',
    details: [
      'Scroll to the very bottom of the left sidebar',
      'Click "Developer settings"',
      'Select "Personal access tokens" → "Tokens (classic)"',
    ],
    tip: null,
    tipType: 'info' as const,
    scopes: null,
  },
  {
    number: 3,
    icon: Key,
    title: 'Generate a New Token',
    description: 'Create a classic token with the right permissions.',
    details: [
      'Click "Generate new token" → "Generate new token (classic)"',
      'Give it a name like "Waypoint Extension"',
      'Set expiration to 60 days or less',
      'Enable the three required scopes listed below',
    ],
    scopes: [
      { name: 'repo', desc: 'Full repository & pull request access' },
      { name: 'notifications', desc: 'Read your GitHub notifications' },
      { name: 'read:user', desc: 'Read your profile information' },
    ],
    tip: 'Some organizations block classic PATs with lifetime > 60 days. Always set expiry to ≤ 60 days to avoid errors.',
    tipType: 'warning' as const,
  },
  {
    number: 4,
    icon: ClipboardPaste,
    title: 'Copy & Paste Your Token',
    description: "You'll only see the token once — grab it now.",
    details: [
      'Scroll to the bottom and click "Generate token"',
      'Copy the token immediately (it disappears when you leave the page)',
      'Paste it into the field below and click Connect',
    ],
    tip: null,
    tipType: 'info' as const,
    scopes: null,
  },
];

const FEATURES = [
  { icon: GitPullRequest, label: 'Open Pull Requests', desc: 'Approvals & comment status' },
  { icon: GitMerge,      label: 'Review Requests',    desc: 'PRs assigned for your review' },
  { icon: Bell,          label: 'Notifications',       desc: 'Mentions, comments & activity' },
  { icon: Shield,        label: 'Stored Locally',      desc: 'Token never leaves your device' },
];

export function GitHubConnect() {
  const { connect, isLoading, error } = useGitHubAuthStore();
  const [token, setToken] = useState('');
  const [showToken, setShowToken] = useState(false);
  const [expandedStep, setExpandedStep] = useState<number | null>(1);

  const handleConnect = () => {
    if (token.trim()) connect(token.trim());
  };

  return (
    <div
      data-testid="github-connect"
      className="flex h-full overflow-hidden"
    >
      {/* ── Left panel ── */}
      <div className="w-64 flex-shrink-0 border-r border-border-subtle flex flex-col">
        {/* Branding */}
        <div className="flex flex-col items-center text-center px-6 pt-8 pb-6">
          <div className="relative mb-4">
            <div className="p-4 rounded-2xl bg-surface-elevated border border-border-subtle">
              <GitBranch className="h-8 w-8 text-accent" />
            </div>
            <span className="absolute -bottom-1 -right-1 w-3 h-3 rounded-full bg-accent border-2 border-background" />
          </div>
          <h2 className="text-sm font-semibold text-primary">Connect GitHub</h2>
          <p className="text-xs text-muted mt-1.5 leading-relaxed">
            Link your account to unlock your developer workflow
          </p>
        </div>

        <div className="mx-6 border-t border-border-subtle" />

        {/* Features */}
        <div className="flex flex-col gap-1 px-4 py-5">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-muted px-2 mb-2">
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
                <p className="text-[11px] text-muted mt-0.5 leading-snug">{desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Token generator CTA */}
        <div className="mt-auto px-4 pb-5">
          <button
            onClick={() =>
              chrome.tabs.create({
                url: 'https://github.com/settings/tokens/new?scopes=repo,notifications,read:user&description=Waypoint',
              })
            }
            className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl border border-accent/20 text-accent text-xs font-medium hover:bg-accent/8 hover:border-accent/35 transition-all duration-150"
          >
            <ExternalLink className="h-3.5 w-3.5 flex-shrink-0" />
            <span>Open Token Generator</span>
          </button>
        </div>
      </div>

      {/* ── Right panel ── */}
      <div className="flex-1 min-w-0 flex flex-col overflow-hidden">
        {/* Sticky header */}
        <div className="px-6 pt-6 pb-4 border-b border-border-subtle flex-shrink-0">
          <h3 className="text-sm font-semibold text-primary">Setup Guide</h3>
          <p className="text-xs text-muted mt-0.5">
            Follow these 4 steps to create your Personal Access Token
          </p>
        </div>

        {/* Scrollable content */}
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
                {/* Step header button */}
                <button
                  onClick={() => setExpandedStep(isOpen ? null : step.number)}
                  className="w-full flex items-center gap-3 px-4 py-3 text-left"
                >
                  {/* Badge */}
                  <div
                    className={cn(
                      'w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center text-[11px] font-bold transition-all duration-200',
                      isOpen
                        ? 'bg-accent text-white'
                        : isDone
                        ? 'bg-accent/15 text-accent'
                        : 'bg-surface-elevated text-muted border border-border'
                    )}
                  >
                    {isDone ? <CheckCircle2 className="h-3.5 w-3.5" /> : step.number}
                  </div>

                  {/* Icon */}
                  <Icon
                    className={cn(
                      'h-3.5 w-3.5 flex-shrink-0 transition-colors',
                      isOpen ? 'text-accent' : 'text-muted'
                    )}
                  />

                  {/* Text */}
                  <div className="flex-1 min-w-0">
                    <span
                      className={cn(
                        'text-xs font-semibold block',
                        isOpen ? 'text-primary' : 'text-secondary'
                      )}
                    >
                      {step.title}
                    </span>
                    <span className="text-[11px] text-muted">{step.description}</span>
                  </div>

                  {/* Chevron */}
                  {isOpen
                    ? <ChevronUp className="h-3.5 w-3.5 text-muted flex-shrink-0" />
                    : <ChevronDown className="h-3.5 w-3.5 text-muted flex-shrink-0" />
                  }
                </button>

                {/* Expanded content */}
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
                        {/* Divider */}
                        <div className="border-t border-border-subtle" />

                        {/* Checklist */}
                        <ul className="space-y-2">
                          {step.details.map((detail, i) => (
                            <li key={i} className="flex items-start gap-3">
                              <div className="w-4 h-4 rounded-full bg-accent/10 border border-accent/20 flex-shrink-0 flex items-center justify-center mt-0.5">
                                <span className="text-[9px] font-bold text-accent">{i + 1}</span>
                              </div>
                              <span className="text-xs text-secondary leading-relaxed">{detail}</span>
                            </li>
                          ))}
                        </ul>

                        {/* Scopes */}
                        {step.scopes && (
                          <div className="rounded-lg border border-border-subtle bg-background p-3 space-y-2">
                            <p className="text-[10px] font-semibold uppercase tracking-widest text-muted">
                              Required scopes
                            </p>
                            <div className="space-y-1.5">
                              {step.scopes.map((scope) => (
                                <div key={scope.name} className="flex items-center gap-2.5">
                                  <CheckCircle2 className="h-3 w-3 text-accent flex-shrink-0" />
                                  <code className="px-1.5 py-0.5 rounded bg-accent/10 text-accent text-[11px] font-mono">
                                    {scope.name}
                                  </code>
                                  <span className="text-[11px] text-muted">{scope.desc}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Tip */}
                        {step.tip && (
                          <div
                            className={cn(
                              'flex items-start gap-2 px-3 py-2.5 rounded-lg text-[11px] leading-relaxed',
                              step.tipType === 'warning'
                                ? 'bg-warning/8 border border-warning/20 text-warning'
                                : 'bg-surface border border-border-subtle text-muted'
                            )}
                          >
                            {step.tipType === 'warning' && (
                              <AlertTriangle className="h-3 w-3 flex-shrink-0 mt-0.5" />
                            )}
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

        {/* Sticky token input footer */}
        <div className="px-6 py-4 border-t border-border-subtle flex-shrink-0 space-y-2.5">
          <div className="flex items-center justify-between">
            <label htmlFor="github-token" className="text-xs font-semibold text-secondary">
              Paste your token
            </label>
            <span className="text-[10px] text-muted">Stored locally · never sent to a server</span>
          </div>

          <div className="relative">
            <Key className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted pointer-events-none" />
            <input
              id="github-token"
              data-testid="github-token-input"
              type={showToken ? 'text' : 'password'}
              placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
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
              aria-label={showToken ? 'Hide token' : 'Show token'}
            >
              {showToken ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
            </button>
          </div>

          {error && (
            <div className="flex items-start gap-2 px-3 py-2.5 rounded-xl bg-destructive/8 border border-destructive/20 text-destructive text-xs">
              <AlertTriangle className="h-3.5 w-3.5 flex-shrink-0 mt-0.5" />
              <span data-testid="github-connect-error">{error}</span>
            </div>
          )}

          <button
            data-testid="github-connect-btn"
            onClick={handleConnect}
            disabled={!token.trim() || isLoading}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-accent text-white text-xs font-semibold hover:bg-accent-hover transition-all duration-150 disabled:opacity-40 disabled:pointer-events-none"
          >
            {isLoading ? <Spinner size="sm" /> : <GitBranch className="h-3.5 w-3.5" />}
            {isLoading ? 'Connecting…' : 'Connect GitHub'}
          </button>
        </div>
      </div>
    </div>
  );
}
