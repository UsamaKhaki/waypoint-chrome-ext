import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  GitPullRequest,
  AlertCircle,
  Eye,
  Bell,
  RefreshCw,
  LogOut,
  ExternalLink,
  Clock,
  MessageSquare,
  Pencil,
  GitBranch,
} from 'lucide-react';
import { useGitHubAuthStore } from '@/store/githubAuth.store';
import { Spinner } from '@/components/ui/Spinner';
import { Badge } from '@/components/ui/Badge';
import { cn } from '@/lib/utils';
import type { GitHubPR, GitHubIssue, GitHubNotification } from '@/services/githubApi';
import { CicdStatus } from './CicdStatus';

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

function PRStateIcon({ pr }: { pr: GitHubPR }) {
  if (pr.draft) return <Pencil className="h-4 w-4 text-muted" />;
  return <GitPullRequest className="h-4 w-4 text-success" />;
}

function PRCard({ pr }: { pr: GitHubPR }) {
  return (
    <button
      onClick={() => chrome.tabs.create({ url: pr.html_url })}
      className="w-full flex items-start gap-3 p-3 rounded-xl hover:bg-surface-elevated transition-colors text-left group"
    >
      <PRStateIcon pr={pr} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-medium text-primary group-hover:text-accent transition-colors truncate">
            {pr.title}
          </span>
          {pr.draft && <Badge variant="secondary">Draft</Badge>}
        </div>
        <div className="flex items-center gap-3 mt-1 text-xs text-muted flex-wrap">
          <span className="truncate">{pr.repoName}</span>
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
          {pr.requested_reviewers?.length > 0 && (
            <span className="flex items-center gap-1">
              <Eye className="h-3 w-3" />
              {pr.requested_reviewers.length} reviewers
            </span>
          )}
        </div>
        {pr.labels.length > 0 && (
          <div className="flex gap-1 mt-1.5 flex-wrap">
            {pr.labels.slice(0, 3).map((l) => (
              <span
                key={l.name}
                className="px-1.5 py-0.5 rounded-full text-xs font-medium"
                style={{ backgroundColor: `#${l.color}25`, color: `#${l.color}` }}
              >
                {l.name}
              </span>
            ))}
          </div>
        )}
      </div>
      <ExternalLink className="h-3.5 w-3.5 text-muted opacity-0 group-hover:opacity-100 flex-shrink-0 mt-0.5 transition-opacity" />
    </button>
  );
}

function IssueCard({ issue }: { issue: GitHubIssue }) {
  return (
    <button
      onClick={() => chrome.tabs.create({ url: issue.html_url })}
      className="w-full flex items-start gap-3 p-3 rounded-xl hover:bg-surface-elevated transition-colors text-left group"
    >
      <AlertCircle className="h-4 w-4 text-success flex-shrink-0 mt-0.5" />
      <div className="flex-1 min-w-0">
        <span className="text-sm font-medium text-primary group-hover:text-accent transition-colors block truncate">
          {issue.title}
        </span>
        <div className="flex items-center gap-3 mt-1 text-xs text-muted flex-wrap">
          <span className="truncate">{issue.repoName}</span>
          <span>#{issue.number}</span>
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {timeAgo(issue.updated_at)}
          </span>
          {issue.comments > 0 && (
            <span className="flex items-center gap-1">
              <MessageSquare className="h-3 w-3" />
              {issue.comments}
            </span>
          )}
        </div>
        {issue.labels.length > 0 && (
          <div className="flex gap-1 mt-1.5 flex-wrap">
            {issue.labels.slice(0, 3).map((l) => (
              <span
                key={l.name}
                className="px-1.5 py-0.5 rounded-full text-xs font-medium"
                style={{ backgroundColor: `#${l.color}25`, color: `#${l.color}` }}
              >
                {l.name}
              </span>
            ))}
          </div>
        )}
      </div>
      <ExternalLink className="h-3.5 w-3.5 text-muted opacity-0 group-hover:opacity-100 flex-shrink-0 mt-0.5 transition-opacity" />
    </button>
  );
}

function NotificationCard({ n }: { n: GitHubNotification }) {
  const Icon =
    n.subject.type === 'PullRequest'
      ? GitPullRequest
      : n.subject.type === 'Issue'
        ? AlertCircle
        : Bell;

  return (
    <div className="flex items-start gap-3 p-3 rounded-xl hover:bg-surface-elevated transition-colors">
      <Icon
        className={cn('h-4 w-4 flex-shrink-0 mt-0.5', n.unread ? 'text-accent' : 'text-muted')}
      />
      <div className="flex-1 min-w-0">
        <span
          className={cn(
            'text-sm block truncate',
            n.unread ? 'text-primary font-medium' : 'text-secondary'
          )}
        >
          {n.subject.title}
        </span>
        <div className="flex items-center gap-2 mt-0.5 text-xs text-muted">
          <span className="truncate">{n.repository.full_name}</span>
          <span>{timeAgo(n.updated_at)}</span>
        </div>
      </div>
      {n.unread && <div className="h-2 w-2 rounded-full bg-accent flex-shrink-0 mt-1.5" />}
    </div>
  );
}

function EmptyState({ icon: Icon, text }: { icon: React.ElementType; text: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <Icon className="h-8 w-8 text-muted mb-3 opacity-40" />
      <p className="text-sm text-muted">{text}</p>
    </div>
  );
}

type Tab = 'prs' | 'issues' | 'reviews' | 'notifications' | 'cicd';

export function GitHubDashboard() {
  const {
    user,
    myPRs,
    assignedIssues,
    reviewRequests,
    notifications,
    ciStatus,
    isLoading,
    error,
    refresh,
    disconnect,
  } = useGitHubAuthStore();
  const [activeTab, setActiveTab] = useState<Tab>('prs');

  // user is null while the initial refresh is in flight — show a full spinner
  if (!user && isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spinner size="lg" />
      </div>
    );
  }

  const tabs: { id: Tab; label: string; icon: React.ElementType; count: number }[] = [
    { id: 'prs', label: 'My PRs', icon: GitPullRequest, count: myPRs.length },
    { id: 'issues', label: 'Issues', icon: AlertCircle, count: assignedIssues.length },
    { id: 'reviews', label: 'Reviews', icon: Eye, count: reviewRequests.length },
    {
      id: 'notifications',
      label: 'Inbox',
      icon: Bell,
      count: notifications.filter((n) => n.unread).length,
    },
    {
      id: 'cicd',
      label: 'CI/CD',
      icon: GitBranch,
      count: ciStatus.filter(
        (s) => s.latestRun?.conclusion === 'failure' || s.latestRun?.status === 'in_progress'
      ).length,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {user?.avatar_url && (
            <img
              src={user.avatar_url}
              alt={user.login}
              className="h-10 w-10 rounded-full border-2 border-border"
            />
          )}
          <div>
            <h1 className="text-lg font-semibold text-primary">{user?.name || user?.login}</h1>
            <a
              href={user?.html_url}
              onClick={(e) => {
                e.preventDefault();
                if (user) chrome.tabs.create({ url: user.html_url });
              }}
              className="text-xs text-muted hover:text-accent transition-colors"
            >
              @{user?.login}
            </a>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={refresh}
            disabled={isLoading}
            className="p-2 rounded-xl hover:bg-surface-elevated text-muted hover:text-primary transition-all"
            title="Refresh"
          >
            <RefreshCw className={cn('h-4 w-4', isLoading && 'animate-spin')} />
          </button>
          <button
            onClick={disconnect}
            className="p-2 rounded-xl hover:bg-surface-elevated text-muted hover:text-destructive transition-all"
            title="Disconnect"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Stats strip */}
      <div className="grid grid-cols-5 gap-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'flex flex-col items-center gap-1 p-3 rounded-xl border transition-all duration-150',
                activeTab === tab.id
                  ? 'bg-accent/10 border-accent/30 text-accent'
                  : 'bg-surface border-border-subtle text-secondary hover:border-border hover:bg-surface-elevated'
              )}
            >
              <Icon className="h-4 w-4" />
              <span className="text-lg font-bold">{tab.count}</span>
              <span className="text-xs opacity-80">{tab.label}</span>
            </button>
          );
        })}
      </div>

      {error && (
        <div className="text-xs text-destructive bg-destructive/10 rounded-xl px-4 py-2">
          {error}
        </div>
      )}

      {/* Tab content */}
      <div className="card p-2 min-h-[300px]">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15 }}
          >
            {isLoading && myPRs.length === 0 ? (
              <div className="flex items-center justify-center py-12">
                <Spinner size="md" />
              </div>
            ) : activeTab === 'prs' ? (
              myPRs.length === 0 ? (
                <EmptyState icon={GitPullRequest} text="No open pull requests" />
              ) : (
                myPRs.map((pr) => <PRCard key={pr.id} pr={pr} />)
              )
            ) : activeTab === 'issues' ? (
              assignedIssues.length === 0 ? (
                <EmptyState icon={AlertCircle} text="No assigned issues" />
              ) : (
                assignedIssues.map((issue) => <IssueCard key={issue.id} issue={issue} />)
              )
            ) : activeTab === 'reviews' ? (
              reviewRequests.length === 0 ? (
                <EmptyState icon={Eye} text="No pending review requests" />
              ) : (
                reviewRequests.map((pr) => <PRCard key={pr.id} pr={pr} />)
              )
            ) : activeTab === 'cicd' ? (
              <CicdStatus />
            ) : notifications.length === 0 ? (
              <EmptyState icon={Bell} text="Inbox is empty" />
            ) : (
              notifications.map((n) => <NotificationCard key={n.id} n={n} />)
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
