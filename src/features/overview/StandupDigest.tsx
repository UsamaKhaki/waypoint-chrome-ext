import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Sunrise,
  Eye,
  GitPullRequest,
  AlertTriangle,
  CalendarClock,
  Target,
  CheckCircle2,
  Copy,
  Check,
  RefreshCw,
  ArrowRight,
} from 'lucide-react';
import { useGitHubAuthStore } from '@/store/githubAuth.store';
import { useLinearAuthStore } from '@/store/linearAuth.store';
import { useJiraAuthStore } from '@/store/jiraAuth.store';
import { useGoogleCalendarAuthStore } from '@/store/googleCalendarAuth.store';
import { useWorkspaceStore } from '@/store/workspace.store';
import { useActivityStore, yesterdayKey } from '@/store/activity.store';
import { cn } from '@/lib/utils';

interface StandupDigestProps {
  onNavigate: (section: string) => void;
}

interface DigestItem {
  title: string;
  url?: string;
  context?: string;
}

function eventTime(ev: { start: { dateTime?: string; date?: string } }): number {
  const raw = ev.start.dateTime ?? ev.start.date;
  return raw ? new Date(raw).getTime() : 0;
}

export function StandupDigest({ onNavigate }: StandupDigestProps) {
  const [copied, setCopied] = useState(false);

  // ── GitHub ──────────────────────────────────────────────────────────────
  const githubConnected = useGitHubAuthStore((s) => s.isConnected);
  const reviewRequests = useGitHubAuthStore((s) => s.reviewRequests);
  const myPRs = useGitHubAuthStore((s) => s.myPRs);
  const ciStatus = useGitHubAuthStore((s) => s.ciStatus);
  const ghLoading = useGitHubAuthStore((s) => s.isLoading);
  const ghRefresh = useGitHubAuthStore((s) => s.refresh);

  // ── Issue trackers ────────────────────────────────────────────────────────
  const linearConnected = useLinearAuthStore((s) => s.isConnected);
  const linearIssues = useLinearAuthStore((s) => s.assignedIssues);
  const jiraConnected = useJiraAuthStore((s) => s.isConnected);
  const jiraIssues = useJiraAuthStore((s) => s.assignedIssues);
  const jiraDomain = useJiraAuthStore((s) => s.credentials?.domain);

  // ── Calendar ────────────────────────────────────────────────────────────
  const calendarConnected = useGoogleCalendarAuthStore((s) => s.isConnected);
  const todayEvents = useGoogleCalendarAuthStore((s) => s.todayEvents);

  // ── Local ─────────────────────────────────────────────────────────────────
  const dailyFocus = useWorkspaceStore((s) => s.dailyFocus);
  const activityEvents = useActivityStore((s) => s.events);

  const anyConnected = githubConnected || linearConnected || jiraConnected || calendarConnected;

  // ── Derived sections ────────────────────────────────────────────────────
  const needsReview: DigestItem[] = useMemo(
    () =>
      reviewRequests.map((pr) => ({
        title: pr.title,
        url: pr.html_url,
        context: `${pr.repoName} #${pr.number}`,
      })),
    [reviewRequests]
  );

  // Your PRs that are blocked on you: have unresolved review comments and aren't drafts.
  const changesRequested: DigestItem[] = useMemo(
    () =>
      myPRs
        .filter((pr) => !pr.draft && pr.review_comments > 0)
        .map((pr) => ({
          title: pr.title,
          url: pr.html_url,
          context: `${pr.repoName} · ${pr.review_comments} unresolved`,
        })),
    [myPRs]
  );

  const brokenCI: DigestItem[] = useMemo(
    () =>
      ciStatus
        .filter((c) => c.latestRun?.conclusion === 'failure')
        .map((c) => ({
          title: c.repoFullName.split('/')[1] ?? c.repoFullName,
          url: c.latestRun?.html_url,
          context: c.latestRun?.head_branch,
        })),
    [ciStatus]
  );

  const nextMeeting = useMemo(() => {
    const now = Date.now();
    const upcoming = todayEvents
      .filter((e) => eventTime(e) >= now)
      .sort((a, b) => eventTime(a) - eventTime(b));
    return upcoming[0] ?? null;
  }, [todayEvents]);

  const assigned: DigestItem[] = useMemo(() => {
    const linear = linearIssues.map((i) => ({
      title: i.title,
      url: i.url,
      context: `${i.identifier} · ${i.state.name}`,
    }));
    const jira = jiraIssues.map((i) => ({
      title: i.fields.summary,
      url: jiraDomain ? `https://${jiraDomain}.atlassian.net/browse/${i.key}` : undefined,
      context: `${i.key} · ${i.fields.status.name}`,
    }));
    return [...linear, ...jira];
  }, [linearIssues, jiraIssues, jiraDomain]);

  const priorities = dailyFocus?.priorities.filter((p) => !p.isCompleted) ?? [];

  // Yesterday's shipped work, from the activity log.
  const yesterday = useMemo(() => {
    const key = yesterdayKey();
    const sameDay = (ts: number) => {
      const d = new Date(ts);
      const k = `${d.getFullYear()}-${`${d.getMonth() + 1}`.padStart(2, '0')}-${`${d.getDate()}`.padStart(2, '0')}`;
      return k === key;
    };
    const ev = activityEvents.filter((e) => sameDay(e.timestamp));
    return {
      merged: ev.filter((e) => e.type === 'pr_merged'),
      closed: ev.filter((e) => e.type === 'issue_closed'),
      focus: ev.filter((e) => e.type === 'focus_session').length,
      priorities: ev.filter((e) => e.type === 'priority_completed'),
    };
  }, [activityEvents]);

  const allClear =
    needsReview.length === 0 &&
    changesRequested.length === 0 &&
    brokenCI.length === 0 &&
    assigned.length === 0 &&
    priorities.length === 0 &&
    !nextMeeting;

  // ── Copy-for-standup markdown ─────────────────────────────────────────────
  const buildStandupText = (): string => {
    const lines: string[] = [];
    lines.push('*Standup*');

    const yLines: string[] = [];
    yesterday.merged.forEach((e) => yLines.push(`Merged: ${e.title}`));
    yesterday.closed.forEach((e) => yLines.push(`Closed: ${e.title}`));
    yesterday.priorities.forEach((e) => yLines.push(`Done: ${e.title}`));
    if (yesterday.focus > 0) yLines.push(`${yesterday.focus} focus session(s)`);
    lines.push('', 'Yesterday:');
    lines.push(...(yLines.length ? yLines.map((l) => `• ${l}`) : ['• —']));

    const tLines: string[] = [];
    priorities.forEach((p) => tLines.push(p.text));
    assigned.slice(0, 5).forEach((a) => tLines.push(`${a.context ?? ''} ${a.title}`.trim()));
    if (nextMeeting)
      tLines.push(
        `Meeting: ${nextMeeting.summary} at ${new Date(eventTime(nextMeeting)).toLocaleTimeString(
          'en-US',
          { hour: 'numeric', minute: '2-digit' }
        )}`
      );
    lines.push('', 'Today:');
    lines.push(...(tLines.length ? tLines.map((l) => `• ${l}`) : ['• —']));

    const bLines: string[] = [];
    brokenCI.forEach((c) =>
      bLines.push(`CI failing: ${c.title}${c.context ? ` (${c.context})` : ''}`)
    );
    changesRequested.forEach((c) => bLines.push(`Changes requested: ${c.title}`));
    needsReview.forEach((r) => bLines.push(`Awaiting my review: ${r.title}`));
    lines.push('', 'Blockers:');
    lines.push(...(bLines.length ? bLines.map((l) => `• ${l}`) : ['• None']));

    return lines.join('\n');
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(buildStandupText());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard unavailable — ignore */
    }
  };

  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  // Not connected to anything — show a lightweight prompt instead of an empty card.
  if (!anyConnected) {
    return (
      <div className="card p-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-accent/10">
            <Sunrise className="h-4 w-4 text-accent" />
          </div>
          <div>
            <p className="text-sm font-medium text-primary">Morning Standup</p>
            <p className="text-xs text-muted">
              Connect GitHub, Linear, Jira, or Calendar to get a daily digest here
            </p>
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
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className="card overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-border-subtle bg-gradient-to-r from-accent/[0.06] to-transparent">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="p-1.5 rounded-lg bg-accent/15 flex-shrink-0">
            <Sunrise className="h-4 w-4 text-accent" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-primary leading-tight">Morning Standup</p>
            <p className="text-xs text-muted truncate">{today}</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <button
            onClick={ghRefresh}
            disabled={ghLoading}
            title="Refresh"
            className="p-1.5 rounded-lg text-muted hover:text-secondary hover:bg-surface-elevated transition-colors"
          >
            <RefreshCw className={cn('h-3.5 w-3.5', ghLoading && 'animate-spin')} />
          </button>
          <button
            onClick={handleCopy}
            className={cn(
              'flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors',
              copied
                ? 'bg-success/15 text-success'
                : 'bg-surface-elevated text-secondary hover:text-primary'
            )}
          >
            {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
            {copied ? 'Copied' : 'Copy for standup'}
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="p-4 space-y-4">
        {allClear ? (
          <div className="flex flex-col items-center justify-center py-6 text-center">
            <span className="text-3xl mb-2">☕️</span>
            <p className="text-sm text-primary font-medium">You're all caught up</p>
            <p className="text-xs text-muted mt-0.5">
              No reviews, blockers, or meetings pending. Have a good one.
            </p>
          </div>
        ) : (
          <>
            <DigestRow
              icon={Eye}
              accent="#22c55e"
              label="Needs your review"
              count={needsReview.length}
              items={needsReview}
              onMore={needsReview.length > 0 ? () => onNavigate('github') : undefined}
            />
            <DigestRow
              icon={AlertTriangle}
              accent="#ef4444"
              label="CI failing"
              count={brokenCI.length}
              items={brokenCI}
            />
            <DigestRow
              icon={GitPullRequest}
              accent="#f59e0b"
              label="Changes requested on your PRs"
              count={changesRequested.length}
              items={changesRequested}
            />
            <DigestRow
              icon={Target}
              accent="#6366f1"
              label="Assigned to you"
              count={assigned.length}
              items={assigned}
              onMore={
                assigned.length > 0
                  ? () => onNavigate(linearConnected ? 'linear' : 'jira')
                  : undefined
              }
            />

            {/* Next meeting */}
            {nextMeeting && (
              <div className="flex items-center gap-3 px-1">
                <div
                  className="h-7 w-7 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: '#3b82f61a', color: '#3b82f6' }}
                >
                  <CalendarClock className="h-4 w-4" />
                </div>
                <button
                  onClick={() =>
                    nextMeeting.htmlLink && chrome.tabs.create({ url: nextMeeting.htmlLink })
                  }
                  className="flex-1 min-w-0 text-left group"
                >
                  <p className="text-sm text-primary truncate group-hover:text-accent transition-colors">
                    {nextMeeting.summary}
                  </p>
                  <p className="text-xs text-muted">
                    Next meeting ·{' '}
                    {new Date(eventTime(nextMeeting)).toLocaleTimeString('en-US', {
                      hour: 'numeric',
                      minute: '2-digit',
                    })}
                  </p>
                </button>
              </div>
            )}

            {/* Today's priorities */}
            {priorities.length > 0 && (
              <DigestRow
                icon={CheckCircle2}
                accent="#8b5cf6"
                label="Today's priorities"
                count={priorities.length}
                items={priorities.map((p) => ({ title: p.text }))}
                onMore={() => onNavigate('focus')}
              />
            )}
          </>
        )}

        {/* Yesterday recap footer */}
        {(yesterday.merged.length > 0 ||
          yesterday.closed.length > 0 ||
          yesterday.focus > 0 ||
          yesterday.priorities.length > 0) && (
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 pt-3 border-t border-border-subtle text-xs text-muted">
            <span className="font-medium text-secondary">Yesterday</span>
            {yesterday.merged.length > 0 && <span>· {yesterday.merged.length} merged</span>}
            {yesterday.closed.length > 0 && <span>· {yesterday.closed.length} closed</span>}
            {yesterday.priorities.length > 0 && (
              <span>· {yesterday.priorities.length} priorities done</span>
            )}
            {yesterday.focus > 0 && <span>· {yesterday.focus} focus session(s)</span>}
            <button
              onClick={() => onNavigate('activity')}
              className="ml-auto text-accent hover:underline"
            >
              View activity →
            </button>
          </div>
        )}
      </div>
    </motion.div>
  );
}

// ── Sub-component: a labeled, collapsible digest row ──────────────────────────
function DigestRow({
  icon: Icon,
  accent,
  label,
  count,
  items,
  onMore,
}: {
  icon: React.ElementType;
  accent: string;
  label: string;
  count: number;
  items: DigestItem[];
  onMore?: () => void;
}) {
  if (count === 0) return null;
  const shown = items.slice(0, 3);
  const rest = count - shown.length;

  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-2.5">
        <div
          className="h-7 w-7 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: `${accent}1a`, color: accent }}
        >
          <Icon className="h-4 w-4" />
        </div>
        <span className="text-sm font-medium text-primary">{label}</span>
        <span
          className="px-1.5 py-0.5 rounded-full text-xs font-semibold"
          style={{ backgroundColor: `${accent}1a`, color: accent }}
        >
          {count}
        </span>
      </div>
      <div className="pl-9 space-y-1">
        {shown.map((item, i) => (
          <button
            key={`${item.title}-${i}`}
            onClick={() => item.url && chrome.tabs.create({ url: item.url })}
            disabled={!item.url}
            className={cn(
              'group w-full flex items-baseline gap-2 text-left',
              item.url ? 'cursor-pointer' : 'cursor-default'
            )}
          >
            <span className="text-sm text-secondary truncate group-hover:text-accent transition-colors">
              {item.title}
            </span>
            {item.context && (
              <span className="text-xs text-muted flex-shrink-0 whitespace-nowrap">
                {item.context}
              </span>
            )}
          </button>
        ))}
        {rest > 0 && (
          <button
            onClick={onMore}
            disabled={!onMore}
            className={cn(
              'text-xs text-muted',
              onMore ? 'hover:text-accent transition-colors' : ''
            )}
          >
            +{rest} more{onMore ? ' →' : ''}
          </button>
        )}
      </div>
    </div>
  );
}
