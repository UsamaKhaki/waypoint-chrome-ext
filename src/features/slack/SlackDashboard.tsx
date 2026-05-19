import { Bell, ExternalLink, Hash } from 'lucide-react';
import { useSlackAuthStore } from '@/store/slackAuth.store';
import { cn } from '@/lib/utils';
import {
  DashboardHero,
  DashboardErrorBanner,
  DashboardLoading,
  DASHBOARD_MAX_WIDTH_CLASS,
} from '@/features/shared/DashboardShell';

export function SlackDashboard() {
  const { authInfo, unreadCount, isLoading, error, refresh, disconnect } = useSlackAuthStore();

  if (!authInfo && isLoading) return <DashboardLoading size="lg" />;

  return (
    <div data-testid="slack-dashboard" className={cn('p-6 space-y-6', DASHBOARD_MAX_WIDTH_CLASS)}>
      <DashboardHero
        avatarFallback={<Hash className="h-7 w-7 text-muted" />}
        name={authInfo?.teamName || ''}
        subtitle={authInfo?.userName ? `@${authInfo.userName}` : undefined}
        isLoading={isLoading}
        onRefresh={refresh}
        onDisconnect={disconnect}
      />

      {error && <DashboardErrorBanner message={error} />}

      <div className="flex flex-col items-center justify-center py-10 gap-5">
        {unreadCount > 0 ? (
          <>
            <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-accent/10">
              <Bell className="h-8 w-8 text-accent" />
            </div>
            <div className="text-center">
              <p className="text-4xl font-bold text-primary tabular-nums">{unreadCount}</p>
              <p className="text-sm text-muted mt-1">unread messages</p>
            </div>
            <button
              onClick={() => chrome.tabs.create({ url: 'https://app.slack.com' })}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-accent text-white text-sm font-medium hover:bg-accent/90 transition-colors"
            >
              Open Slack <ExternalLink className="h-3.5 w-3.5" />
            </button>
          </>
        ) : (
          <>
            <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-surface-elevated border border-border-subtle">
              <Bell className="h-8 w-8 text-muted opacity-40" />
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-primary">All caught up</p>
              <p className="text-xs text-muted mt-1">No unread messages</p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
