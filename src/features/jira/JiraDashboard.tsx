import { useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import {
  SquareKanban,
  Clock,
  MessageSquare,
  CircleDot,
  FileText,
  History,
  ChevronRight,
} from 'lucide-react';
import { useJiraAuthStore } from '@/store/jiraAuth.store';
import { cn } from '@/lib/utils';
import type { JiraIssue } from '@/services/jiraApi';
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
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function statusPill(categoryKey: string): string {
  if (categoryKey === 'done') return 'bg-success/10 text-success border-success/30';
  if (categoryKey === 'indeterminate') return 'bg-warning/10 text-warning border-warning/30';
  return 'bg-surface-elevated text-secondary border-border-subtle';
}

function statusBar(categoryKey: string): string {
  if (categoryKey === 'done') return 'bg-success';
  if (categoryKey === 'indeterminate') return 'bg-warning';
  return 'bg-muted/40';
}

function IssueRow({ issue, domain }: { issue: JiraIssue; domain: string }) {
  const { fields } = issue;
  const url = `https://${domain}.atlassian.net/browse/${issue.key}`;
  const cat = fields.status.statusCategory.key;

  return (
    <DashboardRow stateBarClass={statusBar(cat)} onClick={() => chrome.tabs.create({ url })}>
      <img
        src={fields.issuetype.iconUrl}
        alt={fields.issuetype.name}
        className="pl-2 h-4 w-4 flex-shrink-0 mt-0.5 rounded"
      />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-mono text-muted flex-shrink-0">{issue.key}</span>
          <span className="text-sm font-semibold text-primary group-hover:text-accent transition-colors truncate">
            {fields.summary}
          </span>
        </div>
        <div className="flex items-center gap-3 mt-1.5 text-xs text-muted flex-wrap">
          <span className="truncate max-w-[200px]">{fields.project.name}</span>
          <span>·</span>
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {timeAgo(fields.updated)}
          </span>
          {fields.comment.total > 0 && (
            <span className="flex items-center gap-1">
              <MessageSquare className="h-3 w-3" />
              {fields.comment.total}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1.5 mt-2 flex-wrap">
          <span
            className={cn(
              'px-2 py-0.5 rounded-full text-[11px] font-medium border',
              statusPill(cat)
            )}
          >
            {fields.status.name}
          </span>
          {fields.priority && (
            <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-surface-elevated text-secondary border border-border-subtle">
              <img src={fields.priority.iconUrl} alt="" className="h-3 w-3" />
              {fields.priority.name}
            </span>
          )}
          {fields.labels.slice(0, 3).map((label) => (
            <span
              key={label}
              className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-surface-elevated text-secondary border border-border-subtle"
            >
              {label}
            </span>
          ))}
        </div>
      </div>
      <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity text-xs text-muted">
        <span>Open</span>
        <ChevronRight className="h-3 w-3" />
      </div>
    </DashboardRow>
  );
}

type Tab = 'assigned' | 'inprogress' | 'reported' | 'recent';

export function JiraDashboard() {
  const {
    user,
    credentials,
    assignedIssues,
    inProgressIssues,
    reportedIssues,
    recentIssues,
    isLoading,
    error,
    refresh,
    disconnect,
  } = useJiraAuthStore();
  const [activeTab, setActiveTab] = useState<Tab>('assigned');

  if (!user && isLoading) return <DashboardLoading size="lg" />;

  const domain = credentials?.domain ?? '';
  const profileUrl = `https://${domain}.atlassian.net/people/${user?.accountId}`;

  const tabs = [
    {
      id: 'assigned' as Tab,
      label: 'Assigned',
      icon: SquareKanban,
      count: assignedIssues.length,
      highlight: 'accent' as const,
    },
    {
      id: 'inprogress' as Tab,
      label: 'In Progress',
      icon: CircleDot,
      count: inProgressIssues.length,
      highlight: 'warning' as const,
    },
    {
      id: 'reported' as Tab,
      label: 'Reported',
      icon: FileText,
      count: reportedIssues.length,
      highlight: 'default' as const,
    },
    {
      id: 'recent' as Tab,
      label: 'Recent',
      icon: History,
      count: recentIssues.length,
      highlight: 'default' as const,
    },
  ];

  const active = tabs.find((t) => t.id === activeTab)!;
  const issueList: JiraIssue[] =
    activeTab === 'assigned'
      ? assignedIssues
      : activeTab === 'inprogress'
        ? inProgressIssues
        : activeTab === 'reported'
          ? reportedIssues
          : recentIssues;

  const emptyMessages: Record<Tab, { title: string; hint: string }> = {
    assigned: {
      title: 'No issues assigned to you',
      hint: 'Issues assigned to you will appear here automatically.',
    },
    inprogress: {
      title: 'No issues in progress',
      hint: "Issues you're actively working on will land here.",
    },
    reported: {
      title: 'No issues reported by you',
      hint: "Issues you've created across all projects will appear here.",
    },
    recent: {
      title: 'No recent activity',
      hint: 'Recently-updated issues across your projects will show up here.',
    },
  };
  const emptyMeta = emptyMessages[activeTab];

  return (
    <div data-testid="jira-dashboard" className={cn('p-6 space-y-6', DASHBOARD_MAX_WIDTH_CLASS)}>
      <DashboardHero
        avatar={user?.avatarUrls['48x48']}
        avatarFallback={<SquareKanban className="h-7 w-7 text-muted" />}
        name={user?.displayName || ''}
        subtitle={user?.emailAddress}
        profileUrl={profileUrl}
        isLoading={isLoading}
        onRefresh={refresh}
        onDisconnect={disconnect}
      />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
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
            {isLoading && issueList.length === 0 ? (
              <DashboardLoading />
            ) : issueList.length === 0 ? (
              <DashboardEmptyState
                icon={SquareKanban}
                title={emptyMeta.title}
                hint={emptyMeta.hint}
              />
            ) : (
              <div className="space-y-2">
                {issueList.map((issue) => (
                  <IssueRow key={issue.id} issue={issue} domain={domain} />
                ))}
              </div>
            )}
          </DashboardTabPanel>
        </AnimatePresence>
      </DashboardContentCard>
    </div>
  );
}
