import { useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { AlertCircle, Zap, Plus, Bell, Clock, Users, Kanban, ChevronRight } from 'lucide-react';
import { useLinearAuthStore } from '@/store/linearAuth.store';
import { cn } from '@/lib/utils';
import type { LinearIssue, LinearTeam, LinearNotification } from '@/services/linearApi';
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

const PRIORITY_LABELS: Record<number, string> = {
  0: 'No priority',
  1: 'Urgent',
  2: 'High',
  3: 'Medium',
  4: 'Low',
};

const PRIORITY_COLORS: Record<number, string> = {
  0: 'text-muted',
  1: 'text-destructive',
  2: 'text-warning',
  3: 'text-accent',
  4: 'text-muted',
};

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function IssueRow({ issue }: { issue: LinearIssue }) {
  return (
    <DashboardRow stateBarClass="bg-accent" onClick={() => chrome.tabs.create({ url: issue.url })}>
      <span
        className="pl-2 mt-1.5 h-2.5 w-2.5 rounded-full flex-shrink-0"
        style={{ backgroundColor: issue.state.color, marginLeft: '0.5rem' }}
      />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-mono text-muted flex-shrink-0">{issue.identifier}</span>
          <span className="text-sm font-semibold text-primary group-hover:text-accent transition-colors truncate">
            {issue.title}
          </span>
        </div>
        <div className="flex items-center gap-3 mt-1.5 text-xs text-muted flex-wrap">
          <span>{issue.team.name}</span>
          <span>·</span>
          <span>{issue.state.name}</span>
          <span>·</span>
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {timeAgo(issue.updatedAt)}
          </span>
          {issue.priority > 0 && issue.priority <= 2 && (
            <span
              className={cn(
                'flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[11px] font-medium border',
                issue.priority === 1
                  ? 'border-destructive/30 bg-destructive/10 text-destructive'
                  : 'border-warning/30 bg-warning/10 text-warning'
              )}
            >
              {PRIORITY_LABELS[issue.priority] ?? issue.priorityLabel}
            </span>
          )}
          {issue.priority > 2 && (
            <span className={cn('text-xs', PRIORITY_COLORS[issue.priority])}>
              {PRIORITY_LABELS[issue.priority] ?? issue.priorityLabel}
            </span>
          )}
        </div>
        {issue.labels.nodes.length > 0 && (
          <div className="flex gap-1.5 mt-2 flex-wrap">
            {issue.labels.nodes.slice(0, 4).map((l) => (
              <span
                key={l.name}
                className="px-2 py-0.5 rounded-full text-[11px] font-medium border"
                style={{
                  backgroundColor: `${l.color}1f`,
                  color: l.color,
                  borderColor: `${l.color}40`,
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

function TeamCard({ team }: { team: LinearTeam }) {
  const donePercent =
    team.issueCount > 0 ? Math.round((team.completedIssues / team.issueCount) * 100) : 0;

  return (
    <div className="p-4 rounded-xl border border-border-subtle bg-surface space-y-2.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-accent bg-accent/10 px-2 py-0.5 rounded-md">
            {team.key}
          </span>
          <span className="text-sm font-semibold text-primary">{team.name}</span>
        </div>
        <span className="text-xs text-muted">{team.issueCount} issues</span>
      </div>
      <div className="flex items-center gap-3 text-xs text-muted">
        <span className="flex items-center gap-1">
          <Zap className="h-3 w-3 text-warning" />
          {team.inProgressIssues} in progress
        </span>
        <span className="flex items-center gap-1">
          <AlertCircle className="h-3 w-3 text-success" />
          {team.completedIssues} completed
        </span>
        <span className="ml-auto font-medium text-secondary">{donePercent}%</span>
      </div>
      <div className="h-1.5 rounded-full bg-surface-elevated overflow-hidden">
        <div
          className="h-full rounded-full bg-success transition-all duration-500"
          style={{ width: `${donePercent}%` }}
        />
      </div>
    </div>
  );
}

function NotificationRow({ n }: { n: LinearNotification }) {
  const isUnread = !n.readAt;
  const handleClick = () => {
    if (n.issue?.url) chrome.tabs.create({ url: n.issue.url });
  };
  return (
    <DashboardRow stateBarClass={isUnread ? 'bg-accent' : undefined} onClick={handleClick}>
      <Bell
        className={cn('pl-2 h-4 w-4 flex-shrink-0 mt-0.5', isUnread ? 'text-accent' : 'text-muted')}
      />
      <div className="flex-1 min-w-0">
        <span
          className={cn(
            'text-sm block truncate',
            isUnread ? 'text-primary font-semibold' : 'text-secondary'
          )}
        >
          {n.issue?.title ?? n.type}
        </span>
        <div className="flex items-center gap-2 mt-1 text-xs text-muted">
          {n.issue && <span className="font-mono">{n.issue.identifier}</span>}
          {n.issue && <span>·</span>}
          <span>{timeAgo(n.updatedAt)}</span>
        </div>
      </div>
      {isUnread && (
        <span className="h-2 w-2 rounded-full bg-accent shadow-[0_0_8px_currentColor] text-accent mt-2" />
      )}
    </DashboardRow>
  );
}

type Tab = 'assigned' | 'inprogress' | 'created' | 'teams' | 'notifications';

export function LinearDashboard() {
  const {
    user,
    assignedIssues,
    inProgressIssues,
    createdIssues,
    teams,
    notifications,
    isLoading,
    error,
    refresh,
    disconnect,
  } = useLinearAuthStore();
  const [activeTab, setActiveTab] = useState<Tab>('assigned');

  if (!user && isLoading) return <DashboardLoading size="lg" />;

  const unreadCount = notifications.filter((n) => !n.readAt).length;

  const tabs = [
    {
      id: 'assigned' as Tab,
      label: 'Assigned',
      icon: AlertCircle,
      count: assignedIssues.length,
      highlight: 'accent' as const,
    },
    {
      id: 'inprogress' as Tab,
      label: 'In Progress',
      icon: Zap,
      count: inProgressIssues.length,
      highlight: 'warning' as const,
    },
    {
      id: 'created' as Tab,
      label: 'Created',
      icon: Plus,
      count: createdIssues.length,
      highlight: 'default' as const,
    },
    {
      id: 'teams' as Tab,
      label: 'Teams',
      icon: Users,
      count: teams.length,
      highlight: 'default' as const,
    },
    {
      id: 'notifications' as Tab,
      label: 'Inbox',
      icon: Bell,
      count: unreadCount,
      highlight: (unreadCount > 0 ? 'accent' : 'default') as 'accent' | 'default',
    },
  ];

  const active = tabs.find((t) => t.id === activeTab)!;

  return (
    <div data-testid="linear-dashboard" className={cn('p-6 space-y-6', DASHBOARD_MAX_WIDTH_CLASS)}>
      <DashboardHero
        avatar={user?.avatarUrl}
        avatarFallback={<Kanban className="h-7 w-7 text-muted" />}
        name={user?.name || ''}
        subtitle={user?.email}
        profileUrl={user?.url}
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
            {isLoading && assignedIssues.length === 0 ? (
              <DashboardLoading />
            ) : activeTab === 'assigned' ? (
              assignedIssues.length === 0 ? (
                <DashboardEmptyState
                  icon={AlertCircle}
                  title="No assigned issues"
                  hint="Inbox zero — nothing waiting for you in Linear."
                />
              ) : (
                <div className="space-y-2">
                  {assignedIssues.map((i) => (
                    <IssueRow key={i.id} issue={i} />
                  ))}
                </div>
              )
            ) : activeTab === 'inprogress' ? (
              inProgressIssues.length === 0 ? (
                <DashboardEmptyState
                  icon={Zap}
                  title="No issues in progress"
                  hint="Nothing actively being worked on."
                />
              ) : (
                <div className="space-y-2">
                  {inProgressIssues.map((i) => (
                    <IssueRow key={i.id} issue={i} />
                  ))}
                </div>
              )
            ) : activeTab === 'created' ? (
              createdIssues.length === 0 ? (
                <DashboardEmptyState
                  icon={Plus}
                  title="No open issues created by you"
                  hint="Issues you've created and aren't yet closed will appear here."
                />
              ) : (
                <div className="space-y-2">
                  {createdIssues.map((i) => (
                    <IssueRow key={i.id} issue={i} />
                  ))}
                </div>
              )
            ) : activeTab === 'teams' ? (
              teams.length === 0 ? (
                <DashboardEmptyState
                  icon={Users}
                  title="No teams found"
                  hint="Workspaces with no team membership won't show anything here."
                />
              ) : (
                <div className="space-y-2">
                  {teams.map((t) => (
                    <TeamCard key={t.id} team={t} />
                  ))}
                </div>
              )
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
