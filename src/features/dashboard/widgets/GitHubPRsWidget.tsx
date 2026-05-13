import { useGitHubAuthStore } from '@/store/githubAuth.store';
import { Badge } from '@/components/ui/Badge';
import { truncate } from '@/utils';

interface GitHubPRsWidgetProps {
  onNavigate: (section: string) => void;
}

export function GitHubPRsWidget({ onNavigate }: GitHubPRsWidgetProps) {
  const isConnected = useGitHubAuthStore((s) => s.isConnected);
  const isInitializing = useGitHubAuthStore((s) => s.isInitializing);
  const isLoading = useGitHubAuthStore((s) => s.isLoading);
  const myPRs = useGitHubAuthStore((s) => s.myPRs);
  const reviewRequests = useGitHubAuthStore((s) => s.reviewRequests);

  if (isInitializing) {
    return <LoadingSkeleton />;
  }

  if (!isConnected) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3 text-center">
        <span className="text-2xl">⎇</span>
        <p className="text-xs text-secondary">Connect GitHub to see your pull requests</p>
        <button
          onClick={() => onNavigate('github')}
          className="text-xs text-accent hover:underline font-medium"
        >
          Connect GitHub →
        </button>
      </div>
    );
  }

  if (isLoading && myPRs.length === 0) {
    return <LoadingSkeleton />;
  }

  const allPRs = [...myPRs].slice(0, 5);

  return (
    <div className="flex flex-col h-full gap-1">
      {allPRs.length === 0 && (
        <p className="text-xs text-muted text-center py-4">No open pull requests</p>
      )}
      {allPRs.map((pr) => {
        const badgeVariant = pr.draft ? 'secondary' : 'default';
        const statusLabel = pr.draft ? 'Draft' : 'Open';
        const repoName =
          pr.repoName ??
          (pr.repository_url ? pr.repository_url.replace('https://api.github.com/repos/', '') : '');

        return (
          <div
            key={pr.id}
            className="flex items-start gap-2 py-1.5 rounded-lg hover:bg-surface-elevated px-1 transition-colors"
          >
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-primary truncate">{truncate(pr.title, 48)}</p>
              {repoName && <p className="text-xs text-muted truncate">{repoName}</p>}
            </div>
            <Badge variant={badgeVariant} className="flex-shrink-0 text-xs">
              {statusLabel}
            </Badge>
          </div>
        );
      })}

      {(myPRs.length > 5 || reviewRequests.length > 0) && (
        <button
          onClick={() => onNavigate('github')}
          className="text-xs text-accent hover:underline mt-auto pt-1 text-left"
        >
          View all →
        </button>
      )}
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="flex flex-col gap-2 animate-pulse">
      {[1, 2, 3].map((i) => (
        <div key={i} className="h-9 bg-surface-elevated rounded-lg" />
      ))}
    </div>
  );
}
