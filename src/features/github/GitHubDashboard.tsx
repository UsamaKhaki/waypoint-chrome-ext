import { useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import {
  GitPullRequest,
  AlertCircle,
  Eye,
  Bell,
  Clock,
  MessageSquare,
  Pencil,
  GitBranch,
  ChevronRight,
} from 'lucide-react';
import { useGitHubAuthStore } from '@/store/githubAuth.store';
import { Badge } from '@/components/ui/Badge';
import { cn } from '@/lib/utils';
import type { GitHubPR, GitHubIssue, GitHubNotification } from '@/services/githubApi';
import { CicdStatus } from './CicdStatus';
import {
  DashboardHero,
  DashboardStatTab,
  DashboardEmptyState,
  DashboardContentCard,
  DashboardErrorBanner,
  DashboardLoading,
  DashboardTabPanel,
  DashboardRow,
  DASHBOARD_MAX_WIDTH_CLASS,
} from '@/features/shared/DashboardShell';

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function PRRow({ pr }: { pr: GitHubPR }) {
  return (
    <DashboardRow
      stateBarClass={pr.draft ? 'bg-muted/40' : 'bg-success'}
      onClick={() => chrome.tabs.create({ url: pr.html_url })}
    >
      <div className="pl-2 flex-shrink-0 mt-0.5">
        {pr.draft ? (
          <Pencil className="h-4 w-4 text-muted" />
        ) : (
          <GitPullRequest className="h-4 w-4 text-success" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-semibold text-primary group-hover:text-accent transition-colors truncate">
            {pr.title}
          </span>
          {pr.draft && <Badge variant="secondary">Draft</Badge>}
        </div>
        <div className="flex items-center gap-3 mt-1.5 text-xs text-muted flex-wrap">
          <span className="font-mono">{pr.repoName}</span>
          <span>·</span>
          <span className="font-mono">#{pr.number}</span>
          <span>·</span>
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
              {pr.requested_reviewers.length}
            </span>
          )}
        </div>
        {pr.labels.length > 0 && (
          <div className="flex gap-1.5 mt-2 flex-wrap">
            {pr.labels.slice(0, 4).map((l) => (
              <span
                key={l.name}
                className="px-2 py-0.5 rounded-full text-[11px] font-medium border"
                style={{
                  backgroundColor: `#${l.color}1f`,
                  color: `#${l.color}`,
                  borderColor: `#${l.color}40`,
                }}
              >
                {l.name}
              </span>
            ))}
          </div>
        )}
      </div>
      <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity text-xs text-muted">
        <span>Open</span>
        <ChevronRight className="h-3 w-3" />
      </div>
    </DashboardRow>
  );
}

function IssueRow({ issue }: { issue: GitHubIssue }) {
  return (
    <DashboardRow
      stateBarClass="bg-success"
      onClick={() => chrome.tabs.create({ url: issue.html_url })}
    >
      <div className="pl-2 flex-shrink-0 mt-0.5">
        <AlertCircle className="h-4 w-4 text-success" />
      </div>
      <div className="flex-1 min-w-0">
        <span className="text-sm font-semibold text-primary group-hover:text-accent transition-colors block truncate">
          {issue.title}
        </span>
        <div className="flex items-center gap-3 mt-1.5 text-xs text-muted flex-wrap">
          <span className="font-mono">{issue.repoName}</span>
          <span>·</span>
          <span className="font-mono">#{issue.number}</span>
          <span>·</span>
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
          <div className="flex gap-1.5 mt-2 flex-wrap">
            {issue.labels.slice(0, 4).map((l) => (
              <span
                key={l.name}
                className="px-2 py-0.5 rounded-full text-[11px] font-medium border"
                style={{
                  backgroundColor: `#${l.color}1f`,
                  color: `#${l.color}`,
                  borderColor: `#${l.color}40`,
                }}
              >
                {l.name}
              </span>
            ))}
          </div>
        )}
      </div>
      <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity text-xs text-muted">
        <span>Open</span>
        <ChevronRight className="h-3 w-3" />
      </div>
    </DashboardRow>
  );
}

function NotificationRow({ n }: { n: GitHubNotification }) {
  const Icon =
    n.subject.type === 'PullRequest'
      ? GitPullRequest
      : n.subject.type === 'Issue'
        ? AlertCircle
        : Bell;

  return (
    <DashboardRow stateBarClass={n.unread ? 'bg-accent' : undefined}>
      <div className="pl-2 flex-shrink-0 mt-0.5">
        <Icon className={cn('h-4 w-4', n.unread ? 'text-accent' : 'text-muted')} />
      </div>
      <div className="flex-1 min-w-0">
        <span
          className={cn(
            'text-sm block truncate',
            n.unread ? 'text-primary font-semibold' : 'text-secondary'
          )}
        >
          {n.subject.title}
        </span>
        <div className="flex items-center gap-2 mt-1 text-xs text-muted">
          <span className="font-mono truncate">{n.repository.full_name}</span>
          <span>·</span>
          <span>{timeAgo(n.updated_at)}</span>
        </div>
      </div>
      {n.unread && (
        <span className="h-2 w-2 rounded-full bg-accent shadow-[0_0_8px_currentColor] text-accent mt-2" />
      )}
    </DashboardRow>
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

  if (!user && isLoading) return <DashboardLoading size="lg" />;

  const unreadInbox = notifications.filter((n) => n.unread).length;
  const failingCi = ciStatus.filter(
    (s) => s.latestRun?.conclusion === 'failure' || s.latestRun?.status === 'in_progress'
  ).length;

  const tabs = [
    {
      id: 'prs' as Tab,
      label: 'My PRs',
      icon: GitPullRequest,
      count: myPRs.length,
      highlight: 'accent' as const,
    },
    {
      id: 'issues' as Tab,
      label: 'Issues',
      icon: AlertCircle,
      count: assignedIssues.length,
      highlight: 'warning' as const,
    },
    {
      id: 'reviews' as Tab,
      label: 'Reviews',
      icon: Eye,
      count: reviewRequests.length,
      highlight: 'default' as const,
    },
    {
      id: 'notifications' as Tab,
      label: 'Inbox',
      icon: Bell,
      count: unreadInbox,
      highlight: (unreadInbox > 0 ? 'accent' : 'default') as 'accent' | 'default',
    },
    {
      id: 'cicd' as Tab,
      label: 'CI/CD',
      icon: GitBranch,
      count: failingCi,
      highlight: (failingCi > 0 ? 'warning' : 'success') as 'warning' | 'success',
    },
  ];

  const active = tabs.find((t) => t.id === activeTab)!;

  return (
    <div data-testid="github-dashboard" className={cn('p-6 space-y-6', DASHBOARD_MAX_WIDTH_CLASS)}>
      <DashboardHero
        avatar={user?.avatar_url}
        name={user?.name || user?.login || ''}
        subtitle={user?.login ? `@${user.login}` : undefined}
        profileUrl={user?.html_url}
        isLoading={isLoading}
        onRefresh={refresh}
        onDisconnect={disconnect}
      />

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {tabs.map((tab) => (
          <DashboardStatTab
            key={tab.id}
            icon={tab.icon}
            label={tab.label}
            count={tab.count}
            highlight={tab.highlight}
            isActive={activeTab === tab.id}
            onClick={() => setActiveTab(tab.id)}
          />
        ))}
      </div>

      {error && <DashboardErrorBanner message={error} />}

      <DashboardContentCard
        icon={active.icon}
        label={active.label}
        count={active.count}
        isLoading={isLoading}
        onRefresh={refresh}
      >
        <AnimatePresence mode="wait">
          <DashboardTabPanel tabKey={activeTab}>
            {isLoading && myPRs.length === 0 ? (
              <DashboardLoading />
            ) : activeTab === 'prs' ? (
              myPRs.length === 0 ? (
                <DashboardEmptyState
                  icon={GitPullRequest}
                  title="No open pull requests"
                  hint="When you have open PRs, they'll show up here."
                />
              ) : (
                <div data-testid="github-prs-list" className="space-y-2">
                  {myPRs.map((pr) => (
                    <PRRow key={pr.id} pr={pr} />
                  ))}
                </div>
              )
            ) : activeTab === 'issues' ? (
              assignedIssues.length === 0 ? (
                <DashboardEmptyState
                  icon={AlertCircle}
                  title="No assigned issues"
                  hint="Issues assigned to you across all your repos will appear here."
                />
              ) : (
                <div className="space-y-2">
                  {assignedIssues.map((issue) => (
                    <IssueRow key={issue.id} issue={issue} />
                  ))}
                </div>
              )
            ) : activeTab === 'reviews' ? (
              reviewRequests.length === 0 ? (
                <DashboardEmptyState
                  icon={Eye}
                  title="No pending review requests"
                  hint="When teammates request your review, they'll land here."
                />
              ) : (
                <div className="space-y-2">
                  {reviewRequests.map((pr) => (
                    <PRRow key={pr.id} pr={pr} />
                  ))}
                </div>
              )
            ) : activeTab === 'cicd' ? (
              <CicdStatus />
            ) : notifications.length === 0 ? (
              <DashboardEmptyState
                icon={Bell}
                title="Inbox is empty"
                hint="You're all caught up."
              />
            ) : (
              <div className="space-y-2">
                {notifications.map((n) => (
                  <NotificationRow key={n.id} n={n} />
                ))}
              </div>
            )}
          </DashboardTabPanel>
        </AnimatePresence>
      </DashboardContentCard>
    </div>
  );
}
