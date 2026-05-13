import { useGitHubAuthStore } from '@/store/githubAuth.store';
import { cn } from '@/lib/utils';

export function CicdWidget() {
  const isConnected = useGitHubAuthStore((s) => s.isConnected);
  const ciStatus = useGitHubAuthStore((s) => s.ciStatus);

  if (!isConnected) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-2 text-center">
        <p className="text-xs text-muted">Connect GitHub to see CI/CD status</p>
      </div>
    );
  }

  if (ciStatus.length === 0) {
    return <p className="text-xs text-muted text-center py-4">No repos tracked yet</p>;
  }

  const visible = ciStatus.slice(0, 5);
  const passing = visible.filter((r) => r.latestRun?.conclusion === 'success').length;
  const failing = visible.filter(
    (r) => r.latestRun?.conclusion === 'failure' || r.latestRun?.conclusion === 'timed_out'
  ).length;

  const getStatus = (item: (typeof ciStatus)[0]) => {
    if (!item.latestRun) return 'unknown';
    if (item.latestRun.status === 'in_progress' || item.latestRun.status === 'queued')
      return 'running';
    if (item.latestRun.conclusion === 'success') return 'success';
    if (item.latestRun.conclusion === 'failure' || item.latestRun.conclusion === 'timed_out')
      return 'failure';
    return 'unknown';
  };

  return (
    <div className="flex flex-col h-full gap-1">
      <p className="text-xs text-muted mb-1">
        {passing} passing{failing > 0 ? ` · ${failing} failing` : ''}
      </p>

      {visible.map((repo) => {
        const status = getStatus(repo);
        return (
          <div
            key={repo.repoFullName}
            className="flex items-center gap-2 py-1 px-1 rounded-lg hover:bg-surface-elevated transition-colors"
          >
            <span
              className={cn(
                'text-sm flex-shrink-0',
                status === 'success' && 'text-success',
                status === 'failure' && 'text-destructive',
                status === 'running' && 'text-warning',
                status === 'unknown' && 'text-muted'
              )}
            >
              {status === 'success' && '✓'}
              {status === 'failure' && '✗'}
              {status === 'running' && '⟳'}
              {status === 'unknown' && '·'}
            </span>
            <span className="text-xs text-primary truncate flex-1">{repo.repoFullName}</span>
          </div>
        );
      })}
    </div>
  );
}
