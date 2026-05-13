import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, Check, Command, Bookmark, Globe, GitBranch, Target } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { storage } from '@/services/storage';
import { cn } from '@/lib/utils';

interface Step {
  icon: React.ElementType;
  title: string;
  description: string;
  shortcut?: string;
  color: string;
}

const STEPS: Step[] = [
  {
    icon: Command,
    title: 'Command Palette',
    description:
      'Press ⌘K anywhere to instantly search bookmarks, navigate sections, and run commands. This is your fastest way to get things done.',
    shortcut: '⌘K',
    color: 'text-accent',
  },
  {
    icon: Bookmark,
    title: 'Smart Bookmarks',
    description:
      'Organize your dev links by category — GitHub, CI/CD, monitoring, environments. Pin your most-used links to the top.',
    shortcut: '⌘2',
    color: 'text-violet-400',
  },
  {
    icon: Globe,
    title: 'Environment Switcher',
    description:
      'Manage Local, Stage, and Production environments. Open all links at once, see health status, and get a warning before touching Production.',
    shortcut: '⌘3',
    color: 'text-env-stage',
  },
  {
    icon: GitBranch,
    title: 'GitHub Hub',
    description:
      'Save your repos, use branch naming templates, copy PR templates, and jump to GitHub Actions or PRs in one click.',
    shortcut: '⌘4',
    color: 'text-secondary',
  },
  {
    icon: Target,
    title: 'Daily Focus',
    description:
      'Set your priorities for the day, write notes, and track goals. Everything is auto-saved. Start every tab with intention.',
    shortcut: '⌘5',
    color: 'text-success',
  },
];

interface OnboardingFlowProps {
  onComplete: () => void;
}

export function OnboardingFlow({ onComplete }: OnboardingFlowProps) {
  const [step, setStep] = useState(0);
  const isLast = step === STEPS.length - 1;
  const current = STEPS[step];
  const Icon = current.icon;

  const handleNext = async () => {
    if (isLast) {
      await storage.set('onboardingCompleted', true);
      onComplete();
    } else {
      setStep((s) => s + 1);
    }
  };

  const handleSkip = async () => {
    await storage.set('onboardingCompleted', true);
    onComplete();
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-background">
      <div className="w-full max-w-md px-6">
        {/* Progress dots */}
        <div className="flex justify-center gap-2 mb-10">
          {STEPS.map((_, i) => (
            <button
              key={i}
              onClick={() => setStep(i)}
              className={cn(
                'h-1.5 rounded-full transition-all duration-300',
                i === step ? 'w-6 bg-accent' : 'w-1.5 bg-surface-elevated'
              )}
            />
          ))}
        </div>

        {/* Card */}
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="card p-8 text-center space-y-6"
          >
            <div className={cn('flex justify-center', current.color)}>
              <div className="p-4 rounded-2xl bg-surface-elevated">
                <Icon className="h-10 w-10" />
              </div>
            </div>

            <div className="space-y-2">
              <h2 className="text-xl font-semibold text-primary">{current.title}</h2>
              <p className="text-sm text-secondary leading-relaxed">{current.description}</p>
            </div>

            {current.shortcut && (
              <div className="flex justify-center">
                <kbd className="kbd text-sm px-3 py-1">{current.shortcut}</kbd>
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Actions */}
        <div className="flex items-center justify-between mt-8">
          <button
            onClick={handleSkip}
            className="text-sm text-muted hover:text-secondary transition-colors"
          >
            Skip intro
          </button>
          <Button onClick={handleNext} className="gap-2">
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
  );
}
