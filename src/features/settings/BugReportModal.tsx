import { useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Bug, Send, CheckCircle2, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';
import { Sentry } from '@/lib/sentry';

type BugCategory = 'ui' | 'github' | 'snippets' | 'notifications' | 'performance' | 'other';

const CATEGORIES: { id: BugCategory; label: string }[] = [
  { id: 'ui', label: 'UI / Display' },
  { id: 'github', label: 'GitHub Integration' },
  { id: 'snippets', label: 'Snippets' },
  { id: 'notifications', label: 'Notifications' },
  { id: 'performance', label: 'Performance' },
  { id: 'other', label: 'Other' },
];

interface BugReportModalProps {
  onClose: () => void;
}

export function BugReportModal({ onClose }: BugReportModalProps) {
  const [category, setCategory] = useState<BugCategory | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [steps, setSteps] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isValid = category && title.trim() && description.trim();

  const handleSubmit = async () => {
    if (!isValid) return;
    setIsSubmitting(true);

    const sentryEventId = Sentry.lastEventId?.();

    // Build a GitHub issue URL pre-filled with the bug report
    const issueBody = [
      `**Category:** ${CATEGORIES.find((c) => c.id === category)?.label}`,
      '',
      `**Description:**`,
      description.trim(),
      '',
      steps.trim() ? `**Steps to reproduce:**\n${steps.trim()}` : '',
      '',
      `**Environment:**`,
      `- Waypoint v1.0.0`,
      `- Chrome ${navigator.userAgent.match(/Chrome\/([\d.]+)/)?.[1] ?? 'unknown'}`,
      `- ${navigator.platform}`,
      sentryEventId ? `- Sentry event: ${sentryEventId}` : '',
    ]
      .filter((l) => l !== undefined && l !== '')
      .join('\n');

    const params = new URLSearchParams({
      title: `[Bug] ${title.trim()}`,
      body: issueBody,
      labels: `bug,${category}`,
    });

    await new Promise((r) => setTimeout(r, 800));
    setIsSubmitting(false);
    setSubmitted(true);

    // Open GitHub issues after brief success state
    setTimeout(() => {
      window.open(`https://github.com/your-org/waypoint/issues/new?${params.toString()}`, '_blank');
    }, 1200);
  };

  return createPortal(
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
        style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 8 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 8 }}
          transition={{ duration: 0.15, ease: 'easeOut' }}
          className="glass-elevated rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center gap-3 px-5 py-4 border-b border-border-subtle">
            <div className="h-8 w-8 rounded-lg bg-destructive/10 flex items-center justify-center flex-shrink-0">
              <Bug className="h-4 w-4 text-destructive" />
            </div>
            <div className="flex-1">
              <h2 className="text-sm font-semibold text-primary">Report a Bug</h2>
              <p className="text-xs text-muted">Help us improve Waypoint</p>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-muted hover:text-primary hover:bg-surface-elevated transition-all"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {submitted ? (
            /* Success state */
            <div className="flex flex-col items-center justify-center py-12 px-6 text-center gap-4">
              <motion.div
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              >
                <CheckCircle2 className="h-14 w-14 text-success" />
              </motion.div>
              <div>
                <h3 className="text-base font-semibold text-primary mb-1">
                  Thanks for the report!
                </h3>
                <p className="text-sm text-muted">
                  Opening GitHub Issues to complete your submission…
                </p>
              </div>
              <div className="flex items-center gap-2 text-xs text-muted">
                <ExternalLink className="h-3.5 w-3.5" />
                Redirecting to GitHub
              </div>
            </div>
          ) : (
            /* Form */
            <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
              {/* Category */}
              <div>
                <label className="text-xs text-muted block mb-2 font-medium">
                  Category <span className="text-destructive">*</span>
                </label>
                <div className="flex flex-wrap gap-2">
                  {CATEGORIES.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => setCategory(c.id)}
                      className={cn(
                        'px-3 py-1.5 rounded-lg text-xs font-medium border transition-all',
                        category === c.id
                          ? 'bg-accent/10 border-accent/40 text-accent'
                          : 'bg-surface border-border-subtle text-secondary hover:border-border hover:text-primary'
                      )}
                    >
                      {c.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Title */}
              <div>
                <label className="text-xs text-muted block mb-1.5 font-medium">
                  Short title <span className="text-destructive">*</span>
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. GitHub PRs not loading after refresh"
                  maxLength={120}
                  className="w-full rounded-xl bg-surface border border-border-subtle text-primary text-sm px-3 py-2 outline-none focus:border-accent transition-colors placeholder:text-muted"
                />
              </div>

              {/* Description */}
              <div>
                <label className="text-xs text-muted block mb-1.5 font-medium">
                  What happened? <span className="text-destructive">*</span>
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe what you expected and what actually happened…"
                  rows={3}
                  className="w-full rounded-xl bg-surface border border-border-subtle text-primary text-sm px-3 py-2 outline-none focus:border-accent transition-colors placeholder:text-muted resize-none"
                />
              </div>

              {/* Steps */}
              <div>
                <label className="text-xs text-muted block mb-1.5 font-medium">
                  Steps to reproduce <span className="text-muted font-normal">(optional)</span>
                </label>
                <textarea
                  value={steps}
                  onChange={(e) => setSteps(e.target.value)}
                  placeholder="1. Open Snippets&#10;2. Click Add&#10;3. …"
                  rows={3}
                  className="w-full rounded-xl bg-surface border border-border-subtle text-primary text-sm px-3 py-2 outline-none focus:border-accent transition-colors placeholder:text-muted resize-none font-mono"
                />
              </div>

              {/* Auto-collected info notice */}
              <p className="text-xs text-muted bg-surface rounded-lg px-3 py-2 border border-border-subtle">
                ℹ️ Your Chrome version and OS will be included automatically to help us reproduce
                the issue.
              </p>
            </div>
          )}

          {/* Footer */}
          {!submitted && (
            <div className="flex items-center justify-between px-5 py-4 border-t border-border-subtle">
              <button
                onClick={onClose}
                className="text-sm text-muted hover:text-primary transition-colors"
              >
                Cancel
              </button>
              <Button onClick={handleSubmit} disabled={!isValid || isSubmitting}>
                {isSubmitting ? (
                  <>Submitting…</>
                ) : (
                  <>
                    <Send className="h-3.5 w-3.5" />
                    Submit Report
                  </>
                )}
              </Button>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>,
    document.body
  );
}
