import { useEffect } from 'react';
import {
  GitPullRequest,
  ExternalLink,
  RefreshCw,
  Clock,
  MessageSquare,
  Pencil,
  ArrowRight,
  CheckCircle2,
  MessageCircleWarning,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useGitHubAuthStore } from '@/store/githubAuth.store';
import { cn } from '@/lib/utils';

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

interface OpenPRsProps {
  onNavigate: (section: string) => void;
}

export function OpenPRs({ onNavigate }: OpenPRsProps) {
  const { isConnected, user, myPRs, isLoading, refresh, loadToken } = useGitHubAuthStore();

  useEffect(() => {
    if (!isConnected) loadToken();
  }, []);

  // Not connected — show a connect prompt
  if (!isConnected) {
    return (
      <div className="card p-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-slate-500/10">
            <GitPullRequest className="h-4 w-4 text-secondary" />
          </div>
          <div>
            <p className="text-sm font-medium text-primary">Open Pull Requests</p>
            <p className="text-xs text-muted">Connect GitHub to see your PRs here</p>
          </div>
        </div>
        <button
          onClick={() => onNavigate('github')}
          className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium bg-accent/10 text-accent hover:bg-accent/20 transition-colors"
        >
          Connect <ArrowRight className="h-3 w-3" />
        </button>
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <GitPullRequest className="h-4 w-4 text-success" />
          <span className="section-title">Open Pull Requests</span>
          {myPRs.length > 0 && (
            <span className="px-1.5 py-0.5 rounded-full text-xs font-medium bg-success/10 text-success">
              {myPRs.length}
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
            onClick={() => onNavigate('github')}
            className="text-xs text-muted hover:text-accent transition-colors"
          >
            View all →
          </button>
        </div>
      </div>

      {/* PR list */}
      {isLoading && myPRs.length === 0 ? (
        <div className="grid grid-cols-1 gap-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-14 rounded-xl bg-surface-elevated animate-pulse" />
          ))}
        </div>
      ) : myPRs.length === 0 ? (
        <div className="card p-4 flex items-center gap-3 text-muted">
          <GitPullRequest className="h-5 w-5 opacity-40" />
          <div>
            <p className="text-sm">No open pull requests</p>
            <p className="text-xs opacity-70">@{user?.login}</p>
          </div>
        </div>
      ) : (
        <div className="space-y-1.5">
          {myPRs.slice(0, 5).map((pr) => (
            <button
              key={pr.id}
              onClick={() => chrome.tabs.create({ url: pr.html_url })}
              className={cn(
                'w-full flex items-start gap-3 p-3 rounded-xl border bg-surface hover:bg-surface-elevated transition-all duration-150 text-left group',
                !pr.draft && pr.approvals && pr.approvals > 0
                  ? 'border-success/30 hover:border-success/50'
                  : 'border-border-subtle hover:border-border'
              )}
            >
              {/* State icon */}
              <div className="flex-shrink-0 mt-0.5">
                {pr.draft ? (
                  <Pencil className="h-4 w-4 text-muted" />
                ) : (
                  <GitPullRequest className="h-4 w-4 text-success" />
                )}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-primary group-hover:text-accent truncate transition-colors">
                  {pr.title}
                </p>
                <div className="flex items-center gap-3 mt-0.5 text-xs text-muted flex-wrap">
                  <span className="truncate max-w-[180px]">{pr.repoName}</span>
                  <span>#{pr.number}</span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {timeAgo(pr.updated_at)}
                  </span>
                  {pr.comments > 0 && (
                    <span className="flex items-center gap-1">
                      <MessageSquare className="h-3 w-3" />
                      {pr.comments}
                    </span>
                  )}
                  {pr.draft && (
                    <span className="px-1.5 py-0.5 rounded-full bg-surface-elevated text-muted text-xs">
                      Draft
                    </span>
                  )}
                  {!pr.draft && pr.approvals !== undefined && pr.approvals > 0 && (
                    <span className="flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-success/10 text-success text-xs font-medium">
                      <CheckCircle2 className="h-3 w-3" />
                      {pr.approvals === 1 ? '1 approval' : `${pr.approvals} approvals`}
                    </span>
                  )}
                  {pr.review_comments > 0 && (
                    <span className="flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-warning/10 text-warning text-xs font-medium">
                      <MessageCircleWarning className="h-3 w-3" />
                      {pr.review_comments === 1 ? '1 unresolved' : `${pr.review_comments} unresolved`}
                    </span>
                  )}
                </div>
                {/* Labels */}
                {pr.labels?.length > 0 && (
                  <div className="flex gap-1 mt-1.5 flex-wrap">
                    {pr.labels.slice(0, 3).map((l) => (
                      <span
                        key={l.name}
                        className="px-1.5 py-0.5 rounded-full text-xs font-medium"
                        style={{ backgroundColor: `#${l.color}20`, color: `#${l.color}` }}
                      >
                        {l.name}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <ExternalLink className="h-3.5 w-3.5 text-muted opacity-0 group-hover:opacity-100 flex-shrink-0 transition-opacity mt-0.5" />
            </button>
          ))}

          {/* Show more link if > 5 */}
          {myPRs.length > 5 && (
            <button
              onClick={() => onNavigate('github')}
              className="w-full text-xs text-muted hover:text-accent text-center py-2 transition-colors"
            >
              +{myPRs.length - 5} more PRs → View in GitHub Hub
            </button>
          )}
        </div>
      )}
    </motion.div>
  );
}
