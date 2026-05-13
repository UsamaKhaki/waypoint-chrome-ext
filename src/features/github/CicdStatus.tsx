import {
  ExternalLink,
  GitBranch,
  CheckCircle2,
  XCircle,
  Clock,
  AlertCircle,
  SkipForward,
} from 'lucide-react';
import { useGitHubAuthStore } from '@/store/githubAuth.store';
import { useGitHubStore } from '@/store/github.store';
import { cn } from '@/lib/utils';
import type { WorkflowRun } from '@/services/githubApi';

function StatusIcon({ run }: { run: WorkflowRun }) {
  if (run.status === 'in_progress' || run.status === 'queued') {
    return <Clock className="h-4 w-4 text-warning animate-pulse" />;
  }
  switch (run.conclusion) {
    case 'success':
      return <CheckCircle2 className="h-4 w-4 text-success" />;
    case 'failure':
      return <XCircle className="h-4 w-4 text-destructive" />;
    case 'cancelled':
      return <SkipForward className="h-4 w-4 text-muted" />;
    case 'timed_out':
      return <AlertCircle className="h-4 w-4 text-warning" />;
    default:
      return <Clock className="h-4 w-4 text-muted" />;
  }
}

function statusLabel(run: WorkflowRun): string {
  if (run.status === 'in_progress') return 'Running';
  if (run.status === 'queued') return 'Queued';
  return run.conclusion ?? 'unknown';
}

function statusColor(run: WorkflowRun): string {
  if (run.status === 'in_progress' || run.status === 'queued') return 'text-warning';
  if (run.conclusion === 'success') return 'text-success';
  if (run.conclusion === 'failure') return 'text-destructive';
  return 'text-muted';
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export function CicdStatus() {
  const { ciStatus, isLoading, refresh, isConnected } = useGitHubAuthStore();
  const { repos } = useGitHubStore();

  if (!isConnected) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <GitBranch className="h-8 w-8 text-muted mb-3 opacity-40" />
        <p className="text-sm text-muted">Connect GitHub to see CI/CD status</p>
      </div>
    );
  }

  if (repos.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <GitBranch className="h-8 w-8 text-muted mb-3 opacity-40" />
        <p className="text-sm text-muted">Add repos in the Repos tab to see CI status</p>
      </div>
    );
  }

  const failing = ciStatus.filter((s) => s.latestRun?.conclusion === 'failure').length;
  const running = ciStatus.filter((s) => s.latestRun?.status === 'in_progress').length;
  const passing = ciStatus.filter((s) => s.latestRun?.conclusion === 'success').length;

  return (
    <div className="space-y-4">
      {/* Summary strip */}
      {ciStatus.length > 0 && (
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: 'Passing', count: passing, color: 'text-success', bg: 'bg-success/10' },
            { label: 'Running', count: running, color: 'text-warning', bg: 'bg-warning/10' },
            {
              label: 'Failing',
              count: failing,
              color: 'text-destructive',
              bg: 'bg-destructive/10',
            },
          ].map((s) => (
            <div key={s.label} className={cn('rounded-xl p-2.5 text-center', s.bg)}>
              <div className={cn('text-xl font-bold', s.color)}>{s.count}</div>
              <div className="text-xs text-muted">{s.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Per-repo list */}
      {isLoading && ciStatus.length === 0 ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 rounded-xl bg-surface-elevated animate-pulse" />
          ))}
        </div>
      ) : ciStatus.length === 0 ? (
        <div className="flex items-center justify-center py-8 text-muted text-sm">
          No CI data yet —{' '}
          <button onClick={refresh} className="ml-1 text-accent hover:underline">
            refresh
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          {ciStatus.map((repo) => (
            <div
              key={repo.repoFullName}
              className="flex items-start gap-3 p-3 rounded-xl border border-border-subtle bg-surface hover:bg-surface-elevated transition-colors group"
            >
              <div className="flex-shrink-0 mt-0.5">
                {repo.latestRun ? (
                  <StatusIcon run={repo.latestRun} />
                ) : (
                  <GitBranch className="h-4 w-4 text-muted" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-primary truncate">
                    {repo.repoFullName}
                  </span>
                </div>
                {repo.latestRun ? (
                  <div className="flex items-center gap-3 mt-0.5 text-xs flex-wrap">
                    <span className={cn('font-medium capitalize', statusColor(repo.latestRun))}>
                      {statusLabel(repo.latestRun)}
                    </span>
                    <span className="text-muted">{repo.latestRun.name}</span>
                    <span className="text-muted flex items-center gap-1">
                      <GitBranch className="h-3 w-3" />
                      {repo.latestRun.head_branch}
                    </span>
                    <span className="text-muted">{timeAgo(repo.latestRun.updated_at)}</span>
                  </div>
                ) : (
                  <p className="text-xs text-muted mt-0.5">No workflow runs found</p>
                )}
              </div>
              {repo.latestRun && (
                <button
                  onClick={() => chrome.tabs.create({ url: repo.latestRun!.html_url })}
                  className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <ExternalLink className="h-3.5 w-3.5 text-muted" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
