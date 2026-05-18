import { useEffect } from 'react';
import { ArrowRight, ExternalLink, RefreshCw, Layers } from 'lucide-react';
import { motion } from 'framer-motion';
import { useJiraAuthStore } from '@/store/jiraAuth.store';
import { cn } from '@/lib/utils';

const JIRA_BLUE = '#2684FF';

interface JiraOverviewProps {
  onNavigate: (section: string) => void;
}

function statusColor(category: string): string {
  // Atlassian uses: new, indeterminate, done
  if (category === 'done') return 'bg-success/10 text-success';
  if (category === 'indeterminate') return 'bg-warning/10 text-warning';
  return 'bg-surface-elevated text-secondary';
}

export function JiraOverview({ onNavigate }: JiraOverviewProps) {
  const {
    isConnected,
    isInitializing,
    isLoading,
    assignedIssues,
    inProgressIssues,
    credentials,
    refresh,
    loadCredentials,
  } = useJiraAuthStore();

  useEffect(() => {
    loadCredentials();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (isInitializing) return null;

  if (!isConnected) {
    return (
      <div className="card p-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div
            className="p-2 rounded-xl flex-shrink-0"
            style={{ backgroundColor: `${JIRA_BLUE}1a` }}
          >
            <Layers className="h-4 w-4" style={{ color: JIRA_BLUE }} />
          </div>
          <div>
            <p className="text-sm font-medium text-primary">Jira Issues</p>
            <p className="text-xs text-muted">Connect Jira to see your tickets here</p>
          </div>
        </div>
        <button
          onClick={() => onNavigate('jira')}
          className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium bg-accent/10 text-accent hover:bg-accent/20 transition-colors"
        >
          Connect <ArrowRight className="h-3 w-3" />
        </button>
      </div>
    );
  }

  const topIssues = [...inProgressIssues, ...assignedIssues].slice(0, 5);
  const total = assignedIssues.length;
  const domain = credentials?.domain;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Layers className="h-4 w-4" style={{ color: JIRA_BLUE }} />
          <span className="section-title">Jira Issues</span>
          {total > 0 && (
            <span
              className="px-1.5 py-0.5 rounded-full text-xs font-medium"
              style={{ backgroundColor: `${JIRA_BLUE}1a`, color: JIRA_BLUE }}
            >
              {total}
            </span>
          )}
          {inProgressIssues.length > 0 && (
            <span className="px-1.5 py-0.5 rounded-full text-xs font-medium bg-warning/10 text-warning">
              {inProgressIssues.length} in progress
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
            onClick={() => onNavigate('jira')}
            className="text-xs text-muted hover:text-accent transition-colors"
          >
            View all →
          </button>
        </div>
      </div>

      {isLoading && topIssues.length === 0 ? (
        <div className="grid grid-cols-1 gap-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-14 rounded-xl bg-surface-elevated animate-pulse" />
          ))}
        </div>
      ) : topIssues.length === 0 ? (
        <div className="card p-4 flex items-center gap-3 text-muted">
          <Layers className="h-5 w-5 opacity-40" />
          <p className="text-sm">No assigned Jira issues</p>
        </div>
      ) : (
        <div className="space-y-1.5">
          {topIssues.map((issue) => {
            const url = domain ? `https://${domain}.atlassian.net/browse/${issue.key}` : '#';
            const cat = issue.fields.status.statusCategory.key;
            return (
              <button
                key={issue.id}
                onClick={() => chrome.tabs.create({ url })}
                className="w-full flex items-start gap-3 p-3 rounded-xl border border-border-subtle bg-surface hover:bg-surface-elevated hover:border-border transition-all duration-150 text-left group"
              >
                {issue.fields.issuetype.iconUrl ? (
                  <img
                    src={issue.fields.issuetype.iconUrl}
                    alt={issue.fields.issuetype.name}
                    className="h-4 w-4 mt-0.5 flex-shrink-0"
                  />
                ) : (
                  <Layers className="h-4 w-4 mt-0.5 flex-shrink-0 text-muted" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-primary group-hover:text-accent truncate transition-colors">
                    {issue.fields.summary}
                  </p>
                  <div className="flex items-center gap-2 mt-0.5 text-xs text-muted flex-wrap">
                    <span className="font-mono">{issue.key}</span>
                    <span>·</span>
                    <span className="truncate max-w-[140px]">{issue.fields.project.name}</span>
                    <span
                      className={cn(
                        'px-1.5 py-0.5 rounded-full text-xs font-medium',
                        statusColor(cat)
                      )}
                    >
                      {issue.fields.status.name}
                    </span>
                    {issue.fields.priority && (
                      <span className="flex items-center gap-1">
                        <img src={issue.fields.priority.iconUrl} alt="" className="h-3 w-3" />
                        {issue.fields.priority.name}
                      </span>
                    )}
                  </div>
                </div>
                <ExternalLink className="h-3.5 w-3.5 text-muted opacity-0 group-hover:opacity-100 flex-shrink-0 transition-opacity mt-0.5" />
              </button>
            );
          })}
          {total > 5 && (
            <button
              onClick={() => onNavigate('jira')}
              className="w-full text-xs text-muted hover:text-accent text-center py-2 transition-colors"
            >
              +{total - 5} more → View in Jira
            </button>
          )}
        </div>
      )}
    </motion.div>
  );
}
