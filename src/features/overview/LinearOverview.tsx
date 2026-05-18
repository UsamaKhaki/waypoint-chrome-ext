import { useEffect } from 'react';
import { ArrowRight, ExternalLink, RefreshCw, CircleDot, Flag } from 'lucide-react';
import { motion } from 'framer-motion';
import { useLinearAuthStore } from '@/store/linearAuth.store';
import { cn } from '@/lib/utils';

const LINEAR_PURPLE = '#5E6AD2';

interface LinearOverviewProps {
  onNavigate: (section: string) => void;
}

export function LinearOverview({ onNavigate }: LinearOverviewProps) {
  const {
    isConnected,
    isInitializing,
    isLoading,
    assignedIssues,
    inProgressIssues,
    refresh,
    loadApiKey,
  } = useLinearAuthStore();

  useEffect(() => {
    loadApiKey();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (isInitializing) return null;

  if (!isConnected) {
    return (
      <div className="card p-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div
            className="p-2 rounded-xl flex-shrink-0"
            style={{ backgroundColor: `${LINEAR_PURPLE}1a` }}
          >
            <CircleDot className="h-4 w-4" style={{ color: LINEAR_PURPLE }} />
          </div>
          <div>
            <p className="text-sm font-medium text-primary">Linear Issues</p>
            <p className="text-xs text-muted">Connect Linear to see your assigned issues here</p>
          </div>
        </div>
        <button
          onClick={() => onNavigate('linear')}
          className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium bg-accent/10 text-accent hover:bg-accent/20 transition-colors"
        >
          Connect <ArrowRight className="h-3 w-3" />
        </button>
      </div>
    );
  }

  const topIssues = [...inProgressIssues, ...assignedIssues].slice(0, 5);
  const total = assignedIssues.length;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CircleDot className="h-4 w-4" style={{ color: LINEAR_PURPLE }} />
          <span className="section-title">Linear Issues</span>
          {total > 0 && (
            <span
              className="px-1.5 py-0.5 rounded-full text-xs font-medium"
              style={{ backgroundColor: `${LINEAR_PURPLE}1a`, color: LINEAR_PURPLE }}
            >
              {total}
            </span>
          )}
          {inProgressIssues.length > 0 && (
            <span className="px-1.5 py-0.5 rounded-full text-xs font-medium bg-warning/10 text-warning">
              {inProgressIssues.length} in progress
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={refresh}
            disabled={isLoading}
            className="text-muted hover:text-secondary transition-colors"
            title="Refresh"
          >
            <RefreshCw className={cn('h-3.5 w-3.5', isLoading && 'animate-spin')} />
          </button>
          <button
            onClick={() => onNavigate('linear')}
            className="text-xs text-muted hover:text-accent transition-colors"
          >
            View all →
          </button>
        </div>
      </div>

      {isLoading && topIssues.length === 0 ? (
        <div className="grid grid-cols-1 gap-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-14 rounded-xl bg-surface-elevated animate-pulse" />
          ))}
        </div>
      ) : topIssues.length === 0 ? (
        <div className="card p-4 flex items-center gap-3 text-muted">
          <CircleDot className="h-5 w-5 opacity-40" />
          <p className="text-sm">No assigned issues — inbox zero ✨</p>
        </div>
      ) : (
        <div className="space-y-1.5">
          {topIssues.map((issue) => (
            <button
              key={issue.id}
              onClick={() => chrome.tabs.create({ url: issue.url })}
              className="w-full flex items-start gap-3 p-3 rounded-xl border border-border-subtle bg-surface hover:bg-surface-elevated hover:border-border transition-all duration-150 text-left group"
            >
              <span
                className="flex-shrink-0 mt-1 h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: issue.state.color }}
                title={issue.state.name}
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-primary group-hover:text-accent truncate transition-colors">
                  {issue.title}
                </p>
                <div className="flex items-center gap-2 mt-0.5 text-xs text-muted flex-wrap">
                  <span className="font-mono">{issue.identifier}</span>
                  <span>·</span>
                  <span>{issue.team.name}</span>
                  <span>·</span>
                  <span>{issue.state.name}</span>
                  {issue.priority > 0 && issue.priority <= 2 && (
                    <span className="flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-destructive/10 text-destructive text-xs font-medium">
                      <Flag className="h-3 w-3" />
                      {issue.priorityLabel}
                    </span>
                  )}
                </div>
              </div>
              <ExternalLink className="h-3.5 w-3.5 text-muted opacity-0 group-hover:opacity-100 flex-shrink-0 transition-opacity mt-0.5" />
            </button>
          ))}
          {total > 5 && (
            <button
              onClick={() => onNavigate('linear')}
              className="w-full text-xs text-muted hover:text-accent text-center py-2 transition-colors"
            >
              +{total - 5} more → View in Linear
            </button>
          )}
        </div>
      )}
    </motion.div>
  );
}
