import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  SquareKanban,
  Clock,
  MessageSquare,
  RefreshCw,
  LogOut,
  ExternalLink,
  CheckCircle2,
  CircleDot,
  FileText,
  History,
} from 'lucide-react';
import { useJiraAuthStore } from '@/store/jiraAuth.store';
import { Spinner } from '@/components/ui/Spinner';
import { cn } from '@/lib/utils';
import type { JiraIssue } from '@/services/jiraApi';

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

function statusColor(categoryKey: string): string {
  if (categoryKey === 'done') return 'text-success bg-success/10';
  if (categoryKey === 'indeterminate') return 'text-accent bg-accent/10';
  return 'text-muted bg-surface-elevated';
}

function IssueCard({ issue, domain }: { issue: JiraIssue; domain: string }) {
  const { fields } = issue;
  const url = `https://${domain}.atlassian.net/browse/${issue.key}`;

  return (
    <button
      onClick={() => chrome.tabs.create({ url })}
      className="w-full flex items-start gap-3 p-3 rounded-xl hover:bg-surface-elevated transition-colors text-left group"
    >
      {/* Issue type icon */}
      <img
        src={fields.issuetype.iconUrl}
        alt={fields.issuetype.name}
        className="h-4 w-4 flex-shrink-0 mt-0.5 rounded"
      />

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-mono text-muted">{issue.key}</span>
          <span className="text-sm font-medium text-primary group-hover:text-accent transition-colors truncate">
            {fields.summary}
          </span>
        </div>

        <div className="flex items-center gap-3 mt-1 text-xs text-muted flex-wrap">
          <span className="truncate">{fields.project.name}</span>
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

        <div className="flex items-center gap-2 mt-1.5 flex-wrap">
          <span
            className={cn(
              'px-1.5 py-0.5 rounded-full text-xs font-medium',
              statusColor(fields.status.statusCategory.key)
            )}
          >
            {fields.status.name}
          </span>
          {fields.priority && (
            <span className="text-xs text-muted">{fields.priority.name}</span>
          )}
          {fields.labels.slice(0, 2).map((label) => (
            <span
              key={label}
              className="px-1.5 py-0.5 rounded-full text-xs bg-surface-elevated text-secondary border border-border-subtle"
            >
              {label}
            </span>
          ))}
        </div>
      </div>

      <ExternalLink className="h-3.5 w-3.5 text-muted opacity-0 group-hover:opacity-100 flex-shrink-0 mt-0.5 transition-opacity" />
    </button>
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

  if (!user && isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spinner size="lg" />
      </div>
    );
  }

  const domain = credentials?.domain ?? '';
  const profileUrl = `https://${domain}.atlassian.net/people/${user?.accountId}`;

  const tabs: { id: Tab; label: string; icon: React.ElementType; count: number }[] = [
    { id: 'assigned', label: 'Assigned', icon: SquareKanban, count: assignedIssues.length },
    { id: 'inprogress', label: 'In Progress', icon: CircleDot, count: inProgressIssues.length },
    { id: 'reported', label: 'Reported', icon: FileText, count: reportedIssues.length },
    { id: 'recent', label: 'Recent', icon: History, count: recentIssues.length },
  ];

  const issueList = (): JiraIssue[] => {
    if (activeTab === 'assigned') return assignedIssues;
    if (activeTab === 'inprogress') return inProgressIssues;
    if (activeTab === 'reported') return reportedIssues;
    return recentIssues;
  };

  const emptyMessages: Record<Tab, string> = {
    assigned: 'No issues assigned to you',
    inprogress: 'No issues in progress',
    reported: 'No issues reported by you',
    recent: 'No recent activity',
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {user?.avatarUrls['48x48'] && (
            <img
              src={user.avatarUrls['48x48']}
              alt={user.displayName}
              className="h-10 w-10 rounded-full border-2 border-border"
            />
          )}
          <div>
            <h1 className="text-lg font-semibold text-primary">{user?.displayName}</h1>
            <button
              onClick={() => chrome.tabs.create({ url: profileUrl })}
              className="text-xs text-muted hover:text-accent transition-colors flex items-center gap-1"
            >
              {user?.emailAddress}
              <CheckCircle2 className="h-3 w-3 text-success" />
            </button>
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
      <div className="grid grid-cols-4 gap-2">
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
            {isLoading && assignedIssues.length === 0 ? (
              <div className="flex items-center justify-center py-12">
                <Spinner size="md" />
              </div>
            ) : issueList().length === 0 ? (
              <EmptyState icon={SquareKanban} text={emptyMessages[activeTab]} />
            ) : (
              issueList().map((issue) => (
                <IssueCard key={issue.id} issue={issue} domain={domain} />
              ))
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
