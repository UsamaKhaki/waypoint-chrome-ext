import { CheckCircle2, XCircle, Clock, GitBranch, ExternalLink, RefreshCw } from 'lucide-react';
import { useGitHubAuthStore } from '@/store/githubAuth.store';
import { cn } from '@/lib/utils';

export function CicdOverview({ onNavigate }: { onNavigate: (s: string) => void }) {
  const { isConnected, ciStatus, isLoading, refresh } = useGitHubAuthStore();

  if (!isConnected) return null;

  const active = ciStatus.filter(
    (s) =>
      s.latestRun?.conclusion === 'failure' ||
      s.latestRun?.status === 'in_progress' ||
      s.latestRun?.status === 'queued'
  );

  const allPassing = ciStatus.length > 0 && active.length === 0;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <GitBranch className="h-4 w-4 text-secondary" />
          <span className="section-title">CI / CD</span>
          {ciStatus.length > 0 && (
            <span
              className={cn(
                'px-1.5 py-0.5 rounded-full text-xs font-medium',
                active.length > 0
                  ? 'bg-destructive/10 text-destructive'
                  : 'bg-success/10 text-success'
              )}
            >
              {active.length > 0
                ? `${active.length} alert${active.length > 1 ? 's' : ''}`
                : 'All passing'}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={refresh}
            disabled={isLoading}
            className="text-muted hover:text-secondary transition-colors"
          >
            <RefreshCw className={cn('h-3.5 w-3.5', isLoading && 'animate-spin')} />
          </button>
          <button
            onClick={() => onNavigate('github')}
            className="text-xs text-muted hover:text-accent transition-colors"
          >
            View all →
          </button>
        </div>
      </div>

      {allPassing && (
        <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-success/5 border border-success/20">
          <CheckCircle2 className="h-4 w-4 text-success flex-shrink-0" />
          <span className="text-sm text-success">All {ciStatus.length} repos passing</span>
        </div>
      )}

      {active.slice(0, 3).map((repo) => {
        const run = repo.latestRun!;
        const isFailing = run.conclusion === 'failure';
        return (
          <button
            key={repo.repoFullName}
            onClick={() => chrome.tabs.create({ url: run.html_url })}
            className={cn(
              'w-full flex items-center gap-3 px-3 py-2 rounded-xl border text-left transition-all group',
              isFailing
                ? 'border-destructive/30 bg-destructive/5 hover:bg-destructive/10'
                : 'border-warning/30 bg-warning/5 hover:bg-warning/10'
            )}
          >
            {isFailing ? (
              <XCircle className="h-4 w-4 text-destructive flex-shrink-0" />
            ) : (
              <Clock className="h-4 w-4 text-warning flex-shrink-0 animate-pulse" />
            )}
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-primary truncate">{repo.repoFullName}</p>
              <p className="text-xs text-muted truncate">
                {run.name} · {run.head_branch}
              </p>
            </div>
            <ExternalLink className="h-3.5 w-3.5 text-muted opacity-0 group-hover:opacity-100 flex-shrink-0 transition-opacity" />
          </button>
        );
      })}

      {ciStatus.length === 0 && !isLoading && (
        <div className="card p-4 flex items-center gap-3 text-muted">
          <GitBranch className="h-5 w-5 opacity-40" />
          <p className="text-sm">Add repos in GitHub Hub to track CI status</p>
        </div>
      )}
    </div>
  );
}
