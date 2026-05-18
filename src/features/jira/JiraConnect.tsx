import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Key,
  ExternalLink,
  Globe,
  Mail,
  ClipboardPaste,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  Eye,
  EyeOff,
  ListTodo,
  Kanban,
  RefreshCw,
  Filter,
} from 'lucide-react';
import { JiraIcon } from '@/components/icons/ConnectorIcons';
import { useJiraAuthStore } from '@/store/jiraAuth.store';
import { Spinner } from '@/components/ui/Spinner';
import { cn } from '@/lib/utils';

const STEPS = [
  {
    number: 1,
    icon: Globe,
    title: 'Find Your Jira Domain',
    description: 'Locate your Atlassian workspace URL.',
    details: [
      'Open your Jira Cloud instance in a browser',
      'Your domain is the part before .atlassian.net',
      'For example: your-company (from your-company.atlassian.net)',
    ],
    tip: null,
    tipType: 'info' as const,
  },
  {
    number: 2,
    icon: Key,
    title: 'Create an API Token',
    description: 'Generate a token from your Atlassian account.',
    details: [
      'Go to id.atlassian.com/manage-profile/security/api-tokens',
      'Click "Create API token"',
      'Give it a label like "Waypoint Extension"',
      'Copy the token immediately',
    ],
    tip: 'API tokens are tied to your Atlassian account and work across all your Jira projects.',
    tipType: 'info' as const,
  },
  {
    number: 3,
    icon: Mail,
    title: 'Have Your Email Ready',
    description: "You'll need the email linked to your Atlassian account.",
    details: [
      'This is the email you use to log in to Jira',
      "It's used alongside the API token for authentication",
    ],
    tip: null,
    tipType: 'info' as const,
  },
  {
    number: 4,
    icon: ClipboardPaste,
    title: 'Fill In the Fields Below',
    description: 'Enter your domain, email, and API token.',
    details: [
      'Enter your workspace name (e.g. your-company)',
      'Enter your Atlassian email address',
      'Paste your API token in the last field',
      'Click Connect to link your account',
    ],
    tip: null,
    tipType: 'info' as const,
  },
];

const FEATURES = [
  { icon: ListTodo, label: 'Assigned Issues', desc: 'All tickets assigned to you' },
  { icon: Kanban, label: 'Sprint Board', desc: 'Current sprint progress' },
  { icon: RefreshCw, label: 'Recent Activity', desc: 'Recently updated tickets' },
  { icon: Filter, label: 'Status Tracking', desc: 'In progress, done & blocked' },
];

export function JiraConnect() {
  const { connect, isLoading, error } = useJiraAuthStore();
  const [domain, setDomain] = useState('');
  const [email, setEmail] = useState('');
  const [apiToken, setApiToken] = useState('');
  const [showToken, setShowToken] = useState(false);
  const [expandedStep, setExpandedStep] = useState<number | null>(1);

  const handleConnect = () => {
    const d = domain
      .trim()
      .replace(/\.atlassian\.net.*$/, '')
      .replace(/^https?:\/\//, '');
    if (d && email.trim() && apiToken.trim()) {
      connect(d, email.trim(), apiToken.trim());
    }
  };

  const canSubmit = domain.trim() && email.trim() && apiToken.trim();

  return (
    <div data-testid="jira-connect" className="flex h-full overflow-hidden">
      {/* ── Left panel ── */}
      <div className="w-64 flex-shrink-0 border-r border-border-subtle flex flex-col">
        <div className="flex flex-col items-center text-center px-6 pt-8 pb-6">
          <div className="relative mb-4">
            <div className="p-4 rounded-2xl bg-surface-elevated border border-border-subtle">
              <JiraIcon className="h-8 w-8" />
            </div>
            <span className="absolute -bottom-1 -right-1 w-3 h-3 rounded-full bg-accent border-2 border-background" />
          </div>
          <h2 className="text-sm font-semibold text-primary">Connect Jira</h2>
          <p className="text-xs text-muted mt-1.5 leading-relaxed">
            Link your Jira Cloud account to track issues, sprints, and tickets
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
            onClick={() =>
              chrome.tabs.create({
                url: 'https://id.atlassian.com/manage-profile/security/api-tokens',
              })
            }
            className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl border border-accent/20 text-accent text-xs font-medium hover:bg-accent/8 hover:border-accent/35 transition-all duration-150"
          >
            <ExternalLink className="h-3.5 w-3.5 flex-shrink-0" />
            <span>Create API Token</span>
          </button>
        </div>
      </div>

      {/* ── Right panel ── */}
      <div className="flex-1 min-w-0 flex flex-col overflow-hidden">
        <div className="px-6 pt-6 pb-4 border-b border-border-subtle flex-shrink-0">
          <h3 className="text-sm font-semibold text-primary">Setup Guide</h3>
          <p className="text-xs text-muted mt-0.5">
            Follow these 4 steps to connect your Jira Cloud account
          </p>
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

        {/* Footer: 3 inputs */}
        <div className="px-6 py-4 border-t border-border-subtle flex-shrink-0 space-y-2.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-secondary">Your credentials</label>
            <span className="text-[0.67rem] text-muted">
              Stored locally · never sent to a server
            </span>
          </div>

          {/* Domain */}
          <div className="relative">
            <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted pointer-events-none" />
            <input
              data-testid="jira-domain-input"
              type="text"
              placeholder="your-company (from your-company.atlassian.net)"
              value={domain}
              onChange={(e) => setDomain(e.target.value)}
              className="w-full rounded-xl bg-surface-elevated border border-border-subtle text-primary text-xs pl-9 pr-4 py-2.5 outline-none focus:border-accent/50 focus:ring-2 focus:ring-accent/10 transition-all font-mono placeholder:text-muted/40"
              autoFocus
            />
          </div>

          {/* Email */}
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted pointer-events-none" />
            <input
              data-testid="jira-email-input"
              type="email"
              placeholder="your-email@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-xl bg-surface-elevated border border-border-subtle text-primary text-xs pl-9 pr-4 py-2.5 outline-none focus:border-accent/50 focus:ring-2 focus:ring-accent/10 transition-all placeholder:text-muted/40"
            />
          </div>

          {/* API Token */}
          <div className="relative">
            <Key className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted pointer-events-none" />
            <input
              data-testid="jira-token-input"
              type={showToken ? 'text' : 'password'}
              placeholder="Paste your API token"
              value={apiToken}
              onChange={(e) => setApiToken(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleConnect()}
              className="w-full rounded-xl bg-surface-elevated border border-border-subtle text-primary text-xs pl-9 pr-10 py-2.5 outline-none focus:border-accent/50 focus:ring-2 focus:ring-accent/10 transition-all font-mono placeholder:text-muted/40"
            />
            <button
              onClick={() => setShowToken((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-secondary transition-colors"
              tabIndex={-1}
            >
              {showToken ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
            </button>
          </div>

          {error && (
            <div className="flex items-start gap-2 px-3 py-2.5 rounded-xl bg-destructive/8 border border-destructive/20 text-destructive text-xs">
              <AlertTriangle className="h-3.5 w-3.5 flex-shrink-0 mt-0.5" />
              <span data-testid="jira-error">{error}</span>
            </div>
          )}

          <button
            data-testid="jira-connect-btn"
            onClick={handleConnect}
            disabled={!canSubmit || isLoading}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-accent text-white text-xs font-semibold hover:bg-accent-hover transition-all duration-150 disabled:opacity-40 disabled:pointer-events-none"
          >
            {isLoading ? <Spinner size="sm" /> : <JiraIcon className="h-3.5 w-3.5" />}
            {isLoading ? 'Connecting…' : 'Connect Jira'}
          </button>
        </div>
      </div>
    </div>
  );
}
