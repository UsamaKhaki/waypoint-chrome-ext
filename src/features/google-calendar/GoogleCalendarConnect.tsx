import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import {
  ExternalLink,
  Cloud,
  Key,
  Code2,
  ClipboardPaste,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  CalendarDays,
  Clock,
  Bell,
  Shield,
} from 'lucide-react';
import { GoogleCalendarIcon } from '@/components/icons/ConnectorIcons';
import { useGoogleCalendarAuthStore } from '@/store/googleCalendarAuth.store';
import { Spinner } from '@/components/ui/Spinner';
import { cn } from '@/lib/utils';

const hasIdentityApi =
  typeof chrome !== 'undefined' && typeof chrome?.identity?.getAuthToken === 'function';

const STEPS = [
  {
    number: 1,
    icon: Cloud,
    title: 'Create a Google Cloud Project',
    description: 'Set up a project in Google Cloud Console.',
    details: [
      'Go to console.cloud.google.com',
      'Click "Select a project" → "New Project"',
      'Give it a name like "Waypoint Extension" and create it',
    ],
    tip: null,
    tipType: 'info' as const,
  },
  {
    number: 2,
    icon: CalendarDays,
    title: 'Enable Google Calendar API',
    description: 'Turn on the Calendar API for your project.',
    details: [
      'In the left sidebar, go to "APIs & Services" → "Library"',
      'Search for "Google Calendar API"',
      'Click on it and press "Enable"',
    ],
    tip: null,
    tipType: 'info' as const,
  },
  {
    number: 3,
    icon: Key,
    title: 'Create OAuth 2.0 Credentials',
    description: 'Generate a Chrome Extension client ID.',
    details: [
      'Go to "APIs & Services" → "Credentials"',
      'Click "Create Credentials" → "OAuth client ID"',
      'Choose "Chrome Extension" as the application type',
      'Enter your extension ID and click "Create"',
    ],
    tip: 'Find your extension ID at chrome://extensions — enable developer mode to see it.',
    tipType: 'info' as const,
  },
  {
    number: 4,
    icon: ClipboardPaste,
    title: 'Add Client ID to Manifest',
    description: 'Connect the credentials to your extension.',
    details: [
      'Copy the generated OAuth 2.0 Client ID',
      'Open the file public/manifest.json in this project',
      'Paste the client ID under oauth2 → client_id',
      'Reload the extension and click Connect below',
    ],
    tip: null,
    tipType: 'info' as const,
  },
];

const FEATURES = [
  { icon: CalendarDays, label: "Today's Meetings",  desc: 'All events scheduled for today' },
  { icon: Clock,        label: 'Upcoming Events',   desc: 'What\'s coming up this week' },
  { icon: Bell,         label: 'Smart Reminders',   desc: 'Never miss a meeting' },
  { icon: Shield,       label: 'Secure OAuth',      desc: 'Via Chrome identity API — no passwords' },
];

export function GoogleCalendarConnect() {
  const { connect, isLoading, error } = useGoogleCalendarAuthStore();
  const [expandedStep, setExpandedStep] = useState<number | null>(1);

  return (
    <div
      data-testid="google-calendar-connect"
      className="flex h-full overflow-hidden"
    >
      {/* ── Left panel ── */}
      <div className="w-64 flex-shrink-0 border-r border-border-subtle flex flex-col">
        <div className="flex flex-col items-center text-center px-6 pt-8 pb-6">
          <div className="relative mb-4">
            <div className="p-4 rounded-2xl bg-surface-elevated border border-border-subtle">
              <GoogleCalendarIcon className="h-8 w-8" />
            </div>
            <span className="absolute -bottom-1 -right-1 w-3 h-3 rounded-full bg-accent border-2 border-background" />
          </div>
          <h2 className="text-sm font-semibold text-primary">Connect Google Calendar</h2>
          <p className="text-xs text-muted mt-1.5 leading-relaxed">
            See today's meetings and upcoming events right in Waypoint
          </p>
        </div>

        <div className="mx-6 border-t border-border-subtle" />

        <div className="flex flex-col gap-1 px-4 py-5">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-muted px-2 mb-2">What you get</p>
          {FEATURES.map(({ icon: Icon, label, desc }) => (
            <div key={label} className="flex items-center gap-3 px-2 py-2.5 rounded-xl hover:bg-surface-elevated transition-colors duration-150">
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

        <div className="mt-auto px-4 pb-5">
          <button
            onClick={() => chrome?.tabs?.create({ url: 'https://console.cloud.google.com/apis/credentials' })}
            className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl border border-accent/20 text-accent text-xs font-medium hover:bg-accent/8 hover:border-accent/35 transition-all duration-150"
          >
            <ExternalLink className="h-3.5 w-3.5 flex-shrink-0" />
            <span>Google Cloud Console</span>
          </button>
        </div>
      </div>

      {/* ── Right panel ── */}
      <div className="flex-1 min-w-0 flex flex-col overflow-hidden">
        <div className="px-6 pt-6 pb-4 border-b border-border-subtle flex-shrink-0">
          <h3 className="text-sm font-semibold text-primary">Setup Guide</h3>
          <p className="text-xs text-muted mt-0.5">One-time setup to connect via Chrome's secure OAuth</p>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-2">
          {/* Identity API warning */}
          {!hasIdentityApi && (
            <div className="flex items-start gap-3 px-4 py-3 rounded-xl bg-warning/8 border border-warning/20">
              <AlertTriangle className="h-4 w-4 text-warning flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-semibold text-warning">One-time setup required</p>
                <p className="text-[11px] text-warning/80 mt-0.5 leading-relaxed">
                  Chrome's identity API isn't available here. Add your OAuth client ID to{' '}
                  <code className="text-accent">manifest.json → oauth2.client_id</code> and reload the extension.
                </p>
              </div>
            </div>
          )}

          {STEPS.map((step) => {
            const Icon = step.icon;
            const isOpen = expandedStep === step.number;
            const isDone = expandedStep !== null && step.number < expandedStep;

            return (
              <div
                key={step.number}
                className={cn(
                  'rounded-xl border transition-all duration-200',
                  isOpen ? 'border-accent/30 bg-surface-elevated' : 'border-border-subtle bg-transparent hover:bg-surface-elevated/40'
                )}
              >
                <button
                  onClick={() => setExpandedStep(isOpen ? null : step.number)}
                  className="w-full flex items-center gap-3 px-4 py-3 text-left"
                >
                  <div className={cn(
                    'w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center text-[11px] font-bold transition-all duration-200',
                    isOpen ? 'bg-accent text-white' : isDone ? 'bg-accent/15 text-accent' : 'bg-surface-elevated text-muted border border-border'
                  )}>
                    {isDone ? <CheckCircle2 className="h-3.5 w-3.5" /> : step.number}
                  </div>
                  <Icon className={cn('h-3.5 w-3.5 flex-shrink-0 transition-colors', isOpen ? 'text-accent' : 'text-muted')} />
                  <div className="flex-1 min-w-0">
                    <span className={cn('text-xs font-semibold block', isOpen ? 'text-primary' : 'text-secondary')}>{step.title}</span>
                    <span className="text-[11px] text-muted">{step.description}</span>
                  </div>
                  {isOpen ? <ChevronUp className="h-3.5 w-3.5 text-muted flex-shrink-0" /> : <ChevronDown className="h-3.5 w-3.5 text-muted flex-shrink-0" />}
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
                                <span className="text-[9px] font-bold text-accent">{i + 1}</span>
                              </div>
                              <span className="text-xs text-secondary leading-relaxed">{detail}</span>
                            </li>
                          ))}
                        </ul>
                        {step.tip && (
                          <div className="flex items-start gap-2 px-3 py-2.5 rounded-lg bg-surface border border-border-subtle text-muted text-[11px] leading-relaxed">
                            <Code2 className="h-3 w-3 flex-shrink-0 mt-0.5 text-accent" />
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

        {/* Footer: OAuth connect button */}
        <div className="px-6 py-4 border-t border-border-subtle flex-shrink-0 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-secondary">Authorise with Google</span>
            <span className="text-[10px] text-muted">Secure OAuth · read-only calendar access</span>
          </div>

          {error && (
            <div className="flex items-start gap-2 px-3 py-2.5 rounded-xl bg-destructive/8 border border-destructive/20 text-destructive text-xs">
              <AlertTriangle className="h-3.5 w-3.5 flex-shrink-0 mt-0.5" />
              <span data-testid="google-calendar-error">{error}</span>
            </div>
          )}

          <button
            data-testid="google-calendar-connect-btn"
            onClick={connect}
            disabled={isLoading || !hasIdentityApi}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-accent text-white text-xs font-semibold hover:bg-accent-hover transition-all duration-150 disabled:opacity-40 disabled:pointer-events-none"
          >
            {isLoading ? <Spinner size="sm" /> : <GoogleCalendarIcon className="h-3.5 w-3.5" />}
            {isLoading ? 'Connecting…' : 'Connect with Google'}
          </button>
        </div>
      </div>
    </div>
  );
}
