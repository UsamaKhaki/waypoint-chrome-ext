import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowRight,
  ArrowLeft,
  Check,
  Command,
  Bookmark,
  Globe,
  GitBranch,
  Target,
  Search,
  Pin,
  Folder,
  Zap,
  Shield,
  AlertTriangle,
  Activity,
  GitPullRequest,
  PlayCircle,
  Copy,
  Sparkles,
  CheckCircle2,
  CircleDot,
  Notebook,
  Goal,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { storage } from '@/services/storage';
import { cn } from '@/lib/utils';

interface FeaturePoint {
  icon: React.ElementType;
  text: string;
}

interface Step {
  icon: React.ElementType;
  title: string;
  tagline: string;
  description: string;
  shortcut?: string;
  accent: string; // tailwind text color class
  glow: string; // tailwind bg color class (with opacity)
  features: FeaturePoint[];
  Preview: React.ComponentType<{ accent: string }>;
}

/* ─────────────────────────  Preview Mockups  ───────────────────────── */

function CommandPalettePreview({ accent }: { accent: string }) {
  const items = [
    { icon: Search, label: 'Search bookmarks', shortcut: '↵' },
    { icon: GitBranch, label: 'Open GitHub repo', shortcut: '⌘G' },
    { icon: Globe, label: 'Switch to Production', shortcut: '⌘P' },
    { icon: Target, label: "Set today's focus", shortcut: '⌘F' },
  ];
  return (
    <div className="w-full rounded-xl border border-border bg-surface-elevated/60 shadow-2xl overflow-hidden">
      <div className="flex items-center gap-2 px-3 py-2 border-b border-border-subtle">
        <Search className="h-3.5 w-3.5 text-muted" />
        <div className="flex-1 text-sm text-secondary">Type a command or search…</div>
        <kbd className="kbd text-[11px]">esc</kbd>
      </div>
      <div className="py-1">
        {items.map((it, i) => {
          const Icon = it.icon;
          return (
            <motion.div
              key={it.label}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.05 * i + 0.1, duration: 0.25 }}
              className={cn(
                'flex items-center gap-2.5 px-3 py-2 text-sm',
                i === 0 && 'bg-accent/10'
              )}
            >
              <Icon className={cn('h-3.5 w-3.5', i === 0 ? accent : 'text-muted')} />
              <span className="flex-1 text-primary">{it.label}</span>
              <kbd className="kbd text-[11px]">{it.shortcut}</kbd>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

function BookmarksPreview({ accent }: { accent: string }) {
  const cats = [
    { label: 'GitHub', count: 12, color: 'bg-violet-400/70' },
    { label: 'CI/CD', count: 6, color: 'bg-cyan-400/70' },
    { label: 'Monitoring', count: 4, color: 'bg-amber-400/70' },
    { label: 'Docs', count: 9, color: 'bg-emerald-400/70' },
  ];
  return (
    <div className="w-full grid grid-cols-2 gap-2">
      {cats.map((c, i) => (
        <motion.div
          key={c.label}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.06 * i + 0.1, duration: 0.25 }}
          className="rounded-lg border border-border-subtle bg-surface-elevated/60 p-2.5"
        >
          <div className="flex items-center justify-between mb-2">
            <div className={cn('h-1.5 w-1.5 rounded-full', c.color)} />
            <Pin className={cn('h-3 w-3', i === 0 ? accent : 'text-muted')} />
          </div>
          <div className="text-sm font-medium text-primary">{c.label}</div>
          <div className="text-[11px] text-muted">{c.count} links</div>
        </motion.div>
      ))}
    </div>
  );
}

function EnvironmentsPreview({ accent: _accent }: { accent: string }) {
  const envs = [
    { label: 'Local', dot: 'bg-env-local', status: 'Healthy', alert: false },
    { label: 'Stage', dot: 'bg-env-stage', status: 'Healthy', alert: false },
    { label: 'Production', dot: 'bg-env-production', status: 'Protected', alert: true },
  ];
  return (
    <div className="w-full space-y-2">
      {envs.map((e, i) => (
        <motion.div
          key={e.label}
          initial={{ opacity: 0, x: -8 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.08 * i + 0.1, duration: 0.25 }}
          className="flex items-center gap-3 rounded-lg border border-border-subtle bg-surface-elevated/60 px-3 py-2"
        >
          <div className={cn('h-2 w-2 rounded-full shadow-[0_0_8px_currentColor]', e.dot)} />
          <span className="text-sm font-medium text-primary flex-1">{e.label}</span>
          <span className="text-[11px] text-muted">{e.status}</span>
          {e.alert ? (
            <AlertTriangle className="h-3.5 w-3.5 text-env-production" />
          ) : (
            <Activity className="h-3.5 w-3.5 text-muted" />
          )}
        </motion.div>
      ))}
    </div>
  );
}

function GitHubPreview({ accent }: { accent: string }) {
  const rows = [
    { icon: GitPullRequest, label: 'feat/new-onboarding', meta: '#142 · open' },
    { icon: PlayCircle, label: 'CI · build & test', meta: 'passing' },
    { icon: Copy, label: 'feature/{ticket}-{slug}', meta: 'template' },
  ];
  return (
    <div className="w-full rounded-xl border border-border bg-surface-elevated/60 overflow-hidden">
      <div className="flex items-center gap-2 px-3 py-2 border-b border-border-subtle">
        <GitBranch className={cn('h-3.5 w-3.5', accent)} />
        <span className="text-sm font-medium text-primary">acme / waypoint</span>
        <span className="ml-auto text-[11px] text-muted">main</span>
      </div>
      <div>
        {rows.map((r, i) => {
          const Icon = r.icon;
          return (
            <motion.div
              key={r.label}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.07 * i + 0.1, duration: 0.25 }}
              className="flex items-center gap-2.5 px-3 py-2 border-t border-border-subtle/60"
            >
              <Icon className="h-3.5 w-3.5 text-muted" />
              <span className="text-sm text-primary flex-1 truncate">{r.label}</span>
              <span className="text-[11px] text-muted">{r.meta}</span>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

function FocusPreview({ accent }: { accent: string }) {
  const goals = [
    { done: true, label: 'Ship onboarding redesign' },
    { done: true, label: 'Review PR #142' },
    { done: false, label: 'Plan Q3 roadmap' },
  ];
  return (
    <div className="w-full rounded-xl border border-border bg-surface-elevated/60 p-3 space-y-2.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Target className={cn('h-3.5 w-3.5', accent)} />
          <span className="text-sm font-medium text-primary">Today's focus</span>
        </div>
        <span className="text-[11px] text-muted">2/3</span>
      </div>
      <div className="space-y-1.5">
        {goals.map((g, i) => (
          <motion.div
            key={g.label}
            initial={{ opacity: 0, x: -6 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.07 * i + 0.1, duration: 0.25 }}
            className="flex items-center gap-2"
          >
            {g.done ? (
              <CheckCircle2 className={cn('h-3.5 w-3.5', accent)} />
            ) : (
              <CircleDot className="h-3.5 w-3.5 text-muted" />
            )}
            <span
              className={cn('text-sm flex-1', g.done ? 'text-muted line-through' : 'text-primary')}
            >
              {g.label}
            </span>
          </motion.div>
        ))}
      </div>
      <div className="pt-1.5 border-t border-border-subtle flex items-center gap-2">
        <Notebook className="h-3 w-3 text-muted" />
        <span className="text-[11px] text-muted">Auto-saved · just now</span>
      </div>
    </div>
  );
}

/* ─────────────────────────────  Steps  ───────────────────────────── */

const STEPS: Step[] = [
  {
    icon: Command,
    title: 'Command Palette',
    tagline: 'Move at the speed of thought',
    description:
      'Press ⌘K anywhere to instantly search bookmarks, navigate sections, and run commands. This is your fastest way to get things done.',
    shortcut: '⌘K',
    accent: 'text-accent',
    glow: 'bg-accent/20',
    features: [
      { icon: Search, text: 'Fuzzy search across everything' },
      { icon: Zap, text: 'Run actions without leaving the keyboard' },
      { icon: Sparkles, text: 'Smart suggestions based on recent use' },
    ],
    Preview: CommandPalettePreview,
  },
  {
    icon: Bookmark,
    title: 'Smart Bookmarks',
    tagline: 'Every link, perfectly organized',
    description:
      'Organize your dev links by category — GitHub, CI/CD, monitoring, environments. Pin your most-used links to the top.',
    shortcut: '⌘2',
    accent: 'text-violet-400',
    glow: 'bg-violet-400/20',
    features: [
      { icon: Folder, text: 'Categories for every workflow' },
      { icon: Pin, text: 'Pin and reorder favorites instantly' },
      { icon: Search, text: 'Instant search across all bookmarks' },
    ],
    Preview: BookmarksPreview,
  },
  {
    icon: Globe,
    title: 'Environment Switcher',
    tagline: 'Local, Stage, Production — one click',
    description:
      'Manage Local, Stage, and Production environments. Open all links at once, see health status, and get a warning before touching Production.',
    shortcut: '⌘3',
    accent: 'text-env-stage',
    glow: 'bg-env-stage/20',
    features: [
      { icon: Activity, text: 'Live health status for every environment' },
      { icon: Zap, text: 'Open all environment links in one shot' },
      { icon: Shield, text: 'Production safety guard prevents accidents' },
    ],
    Preview: EnvironmentsPreview,
  },
  {
    icon: GitBranch,
    title: 'GitHub Hub',
    tagline: 'Your repos, PRs, and CI in one place',
    description:
      'Save your repos, use branch naming templates, copy PR templates, and jump to GitHub Actions or PRs in one click.',
    shortcut: '⌘4',
    accent: 'text-sky-400',
    glow: 'bg-sky-400/20',
    features: [
      { icon: GitPullRequest, text: 'Jump straight to open PRs and reviews' },
      { icon: PlayCircle, text: 'Monitor GitHub Actions at a glance' },
      { icon: Copy, text: 'Branch & PR templates ready to copy' },
    ],
    Preview: GitHubPreview,
  },
  {
    icon: Target,
    title: 'Daily Focus',
    tagline: 'Start every tab with intention',
    description:
      'Set your priorities for the day, write notes, and track goals. Everything is auto-saved. Start every tab with intention.',
    shortcut: '⌘5',
    accent: 'text-success',
    glow: 'bg-success/20',
    features: [
      { icon: Goal, text: 'Daily goals with progress tracking' },
      { icon: Notebook, text: 'Quick notes that auto-save as you type' },
      { icon: Sparkles, text: 'A calm, intentional start to your day' },
    ],
    Preview: FocusPreview,
  },
];

/* ──────────────────────────────  Flow  ────────────────────────────── */

interface OnboardingFlowProps {
  onComplete: () => void;
}

export function OnboardingFlow({ onComplete }: OnboardingFlowProps) {
  const [step, setStep] = useState(0);
  const isLast = step === STEPS.length - 1;
  const isFirst = step === 0;
  const current = STEPS[step];
  const Icon = current.icon;
  const Preview = current.Preview;

  const handleNext = async () => {
    if (isLast) {
      await storage.set('onboardingCompleted', true);
      onComplete();
    } else {
      setStep((s) => s + 1);
    }
  };

  const handleBack = () => {
    if (!isFirst) setStep((s) => s - 1);
  };

  const handleSkip = async () => {
    await storage.set('onboardingCompleted', true);
    onComplete();
  };

  return (
    <div
      data-testid="onboarding-flow"
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-background overflow-hidden"
    >
      {/* Ambient background glow — shifts color per step */}
      <div className="pointer-events-none absolute inset-0">
        <motion.div
          key={`glow-${step}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6 }}
          className={cn(
            'absolute -top-40 left-1/2 -translate-x-1/2 h-[480px] w-[720px] rounded-full blur-3xl',
            current.glow
          )}
        />
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              'linear-gradient(hsl(var(--text-primary)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--text-primary)) 1px, transparent 1px)',
            backgroundSize: '32px 32px',
            maskImage: 'radial-gradient(ellipse at center, black 0%, transparent 70%)',
          }}
        />
      </div>

      <div className="relative w-full max-w-4xl px-6">
        {/* Centered brand header */}
        <div className="flex flex-col items-center text-center mb-8">
          <img
            src="/icon.svg"
            alt="Waypoint"
            className="h-16 w-16 rounded-2xl shadow-xl shadow-accent/30 mb-4"
          />
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-primary tracking-tight">Waypoint</h1>
            <span className="tag">New</span>
          </div>
          <p className="text-sm text-muted mt-1.5">Your developer command center</p>
        </div>

        {/* Step counter */}
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold uppercase tracking-widest text-muted">
            Getting started
          </span>
          <div className="text-sm text-muted font-mono">
            <span className="text-primary font-semibold">{String(step + 1).padStart(2, '0')}</span>
            <span className="mx-1">/</span>
            <span>{String(STEPS.length).padStart(2, '0')}</span>
          </div>
        </div>

        {/* Segmented progress bar */}
        <div className="flex items-center gap-1.5 mb-10">
          {STEPS.map((s, i) => (
            <button
              key={s.title}
              data-testid={`onboarding-dot-${i}`}
              onClick={() => setStep(i)}
              aria-label={`Go to step ${i + 1}: ${s.title}`}
              className="group relative flex-1 h-1 rounded-full overflow-hidden bg-surface-elevated"
            >
              <motion.div
                initial={false}
                animate={{
                  width: i < step ? '100%' : i === step ? '100%' : '0%',
                  opacity: i <= step ? 1 : 0,
                }}
                transition={{ duration: 0.4, ease: 'easeOut' }}
                className={cn('h-full', i === step ? 'bg-accent' : 'bg-accent/50')}
              />
            </button>
          ))}
        </div>

        {/* Main split card */}
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="grid grid-cols-1 md:grid-cols-2 gap-0 rounded-2xl border border-border-subtle bg-surface/80 backdrop-blur-xl overflow-hidden shadow-2xl"
          >
            {/* Left: visual preview */}
            <div className="relative p-10 border-b md:border-b-0 md:border-r border-border-subtle bg-gradient-to-br from-surface to-background/40 flex items-center justify-center min-h-[340px]">
              <div
                className={cn(
                  'absolute -top-10 -left-10 h-40 w-40 rounded-full blur-2xl',
                  current.glow
                )}
              />
              <div className="relative w-full max-w-sm">
                <Preview accent={current.accent} />
              </div>
            </div>

            {/* Right: content */}
            <div className="p-10 flex flex-col justify-center">
              <div className="flex items-center gap-3 mb-6">
                <div
                  className={cn(
                    'flex h-14 w-14 items-center justify-center rounded-2xl bg-surface-elevated border border-border-subtle',
                    current.accent
                  )}
                >
                  <Icon className="h-7 w-7" />
                </div>
                <div>
                  <div className="text-sm font-semibold uppercase tracking-widest text-muted">
                    Feature {step + 1}
                  </div>
                  <div className={cn('text-sm font-semibold mt-0.5', current.accent)}>
                    {current.tagline}
                  </div>
                </div>
              </div>

              <h2
                data-testid="onboarding-title"
                className="text-3xl font-bold text-primary mb-3 tracking-tight"
              >
                {current.title}
              </h2>
              <p className="text-base text-secondary leading-relaxed mb-6">{current.description}</p>

              <ul className="space-y-3 mb-6">
                {current.features.map((f) => {
                  const FIcon = f.icon;
                  return (
                    <li key={f.text} className="flex items-start gap-3 text-base">
                      <div
                        className={cn(
                          'mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-surface-elevated',
                          current.accent
                        )}
                      >
                        <FIcon className="h-3.5 w-3.5" />
                      </div>
                      <span className="text-secondary leading-snug">{f.text}</span>
                    </li>
                  );
                })}
              </ul>

              {current.shortcut && (
                <div className="flex items-center gap-2 text-sm text-muted">
                  <span>Try it with</span>
                  <kbd className="kbd text-sm px-2.5 py-1">{current.shortcut}</kbd>
                </div>
              )}
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Actions */}
        <div className="flex items-center justify-between mt-10">
          <button
            data-testid="onboarding-skip"
            onClick={handleSkip}
            className="text-base text-muted hover:text-secondary transition-colors"
          >
            Skip intro
          </button>
          <div className="flex items-center gap-2">
            {!isFirst && (
              <Button variant="ghost" onClick={handleBack} className="gap-2">
                <ArrowLeft className="h-4 w-4" /> Back
              </Button>
            )}
            <Button data-testid="onboarding-next" onClick={handleNext} className="gap-2" size="lg">
              {isLast ? (
                <>
                  <Check className="h-4 w-4" /> Get Started
                </>
              ) : (
                <>
                  Next <ArrowRight className="h-4 w-4" />
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
