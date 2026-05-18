import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AlertCircle,
  Zap,
  Plus,
  Bell,
  RefreshCw,
  LogOut,
  ExternalLink,
  Clock,
  Users,
  Kanban,
} from 'lucide-react';
import { useLinearAuthStore } from '@/store/linearAuth.store';
import { Spinner } from '@/components/ui/Spinner';
import { cn } from '@/lib/utils';
import type { LinearIssue, LinearTeam, LinearNotification } from '@/services/linearApi';

const PRIORITY_COLORS: Record<number, string> = {
  0: 'text-muted',
  1: 'text-destructive',
  2: 'text-warning',
  3: 'text-blue-400',
  4: 'text-muted',
};

const PRIORITY_LABELS: Record<number, string> = {
  0: 'No priority',
  1: 'Urgent',
  2: 'High',
  3: 'Medium',
  4: 'Low',
};

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function IssueCard({ issue }: { issue: LinearIssue }) {
  return (
    <button
      onClick={() => chrome.tabs.create({ url: issue.url })}
      className="w-full flex items-start gap-3 p-3 rounded-xl hover:bg-surface-elevated transition-colors text-left group"
    >
      <span
        className="h-2.5 w-2.5 rounded-full flex-shrink-0 mt-1.5"
        style={{ backgroundColor: issue.state.color }}
      />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted font-mono flex-shrink-0">{issue.identifier}</span>
          <span className="text-sm font-medium text-primary group-hover:text-accent transition-colors truncate">
            {issue.title}
          </span>
        </div>
        <div className="flex items-center gap-3 mt-1 text-xs text-muted flex-wrap">
          <span>{issue.team.name}</span>
          <span
            className={cn('font-medium', PRIORITY_COLORS[issue.priority])}
          >
            {PRIORITY_LABELS[issue.priority] ?? issue.priorityLabel}
          </span>
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {timeAgo(issue.updatedAt)}
          </span>
        </div>
        {issue.labels.nodes.length > 0 && (
          <div className="flex gap-1 mt-1.5 flex-wrap">
            {issue.labels.nodes.slice(0, 3).map((l) => (
              <span
                key={l.name}
                className="px-1.5 py-0.5 rounded-full text-xs font-medium"
                style={{ backgroundColor: `${l.color}25`, color: l.color }}
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

function TeamCard({ team }: { team: LinearTeam }) {
  const donePercent =
    team.issueCount > 0 ? Math.round((team.completedIssues / team.issueCount) * 100) : 0;

  return (
    <div className="p-3 rounded-xl bg-surface border border-border-subtle space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-accent bg-accent/10 px-1.5 py-0.5 rounded">
            {team.key}
          </span>
          <span className="text-sm font-medium text-primary">{team.name}</span>
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

function NotificationCard({ n }: { n: LinearNotification }) {
  const isUnread = !n.readAt;
  return (
    <div className="flex items-start gap-3 p-3 rounded-xl hover:bg-surface-elevated transition-colors">
      <Bell
        className={cn('h-4 w-4 flex-shrink-0 mt-0.5', isUnread ? 'text-accent' : 'text-muted')}
      />
      <div className="flex-1 min-w-0">
        <span
          className={cn(
            'text-sm block truncate',
            isUnread ? 'text-primary font-medium' : 'text-secondary'
          )}
        >
          {n.issue?.title ?? n.type}
        </span>
        <div className="flex items-center gap-2 mt-0.5 text-xs text-muted">
          {n.issue && <span className="font-mono">{n.issue.identifier}</span>}
          <span>{timeAgo(n.updatedAt)}</span>
        </div>
      </div>
      {isUnread && <div className="h-2 w-2 rounded-full bg-accent flex-shrink-0 mt-1.5" />}
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

  if (!user && isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spinner size="lg" />
      </div>
    );
  }

  const unreadCount = notifications.filter((n) => !n.readAt).length;

  const tabs: { id: Tab; label: string; icon: React.ElementType; count: number }[] = [
    { id: 'assigned', label: 'Assigned', icon: AlertCircle, count: assignedIssues.length },
    { id: 'inprogress', label: 'In Progress', icon: Zap, count: inProgressIssues.length },
    { id: 'created', label: 'Created', icon: Plus, count: createdIssues.length },
    { id: 'teams', label: 'Teams', icon: Users, count: teams.length },
    { id: 'notifications', label: 'Inbox', icon: Bell, count: unreadCount },
  ];

  return (
    <div data-testid="linear-dashboard" className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {user?.avatarUrl ? (
            <img
              src={user.avatarUrl}
              alt={user.name}
              className="h-10 w-10 rounded-full border-2 border-border"
            />
          ) : (
            <div className="h-10 w-10 rounded-full border-2 border-border bg-surface-elevated flex items-center justify-center">
              <Kanban className="h-5 w-5 text-muted" />
            </div>
          )}
          <div>
            <h1 className="text-lg font-semibold text-primary">{user?.name}</h1>
            <span className="text-xs text-muted">{user?.email}</span>
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
            {isLoading && assignedIssues.length === 0 ? (
              <div className="flex items-center justify-center py-12">
                <Spinner size="md" />
              </div>
            ) : activeTab === 'assigned' ? (
              assignedIssues.length === 0 ? (
                <EmptyState icon={AlertCircle} text="No assigned issues" />
              ) : (
                assignedIssues.map((issue) => <IssueCard key={issue.id} issue={issue} />)
              )
            ) : activeTab === 'inprogress' ? (
              inProgressIssues.length === 0 ? (
                <EmptyState icon={Zap} text="No issues in progress" />
              ) : (
                inProgressIssues.map((issue) => <IssueCard key={issue.id} issue={issue} />)
              )
            ) : activeTab === 'created' ? (
              createdIssues.length === 0 ? (
                <EmptyState icon={Plus} text="No open issues created by you" />
              ) : (
                createdIssues.map((issue) => <IssueCard key={issue.id} issue={issue} />)
              )
            ) : activeTab === 'teams' ? (
              teams.length === 0 ? (
                <EmptyState icon={Users} text="No teams found" />
              ) : (
                <div className="space-y-2 p-1">
                  {teams.map((team) => (
                    <TeamCard key={team.id} team={team} />
                  ))}
                </div>
              )
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
