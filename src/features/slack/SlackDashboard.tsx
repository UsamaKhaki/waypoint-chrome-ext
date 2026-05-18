import { useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { Hash, Bell, Zap, AlertTriangle, GitBranch, Server, ChevronRight } from 'lucide-react';
import { useSlackAuthStore } from '@/store/slackAuth.store';
import { cn } from '@/lib/utils';
import type { SlackChannel, SlackUser } from '@/services/slackApi';
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

const DEV_KEYWORDS = [
  'deploy',
  'deployment',
  'release',
  'build',
  'ci',
  'cd',
  'pipeline',
  'alert',
  'alerts',
  'alarm',
  'incident',
  'incidents',
  'oncall',
  'on-call',
  'prod',
  'production',
  'staging',
  'infra',
  'infrastructure',
  'ops',
  'devops',
  'monitor',
  'monitoring',
  'error',
  'errors',
  'log',
  'logs',
  'github',
  'jenkins',
  'k8s',
  'kubernetes',
  'docker',
  'aws',
  'terraform',
  'pagerduty',
];

function isDevChannel(name: string): boolean {
  const lower = name.toLowerCase();
  return DEV_KEYWORDS.some((kw) => lower.includes(kw));
}

function devChannelIcon(name: string) {
  const lower = name.toLowerCase();
  if (
    ['deploy', 'release', 'build', 'ci', 'cd', 'pipeline', 'github', 'jenkins'].some((k) =>
      lower.includes(k)
    )
  )
    return GitBranch;
  if (['alert', 'incident', 'oncall', 'pagerduty', 'alarm'].some((k) => lower.includes(k)))
    return AlertTriangle;
  if (
    ['infra', 'k8s', 'kubernetes', 'docker', 'aws', 'terraform', 'server', 'prod', 'staging'].some(
      (k) => lower.includes(k)
    )
  )
    return Server;
  return Zap;
}

function timeAgo(ts: string): string {
  const diff = Date.now() - parseFloat(ts) * 1000;
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function truncate(text: string, max = 90): string {
  return text.length <= max ? text : text.slice(0, max) + '…';
}

function Avatar({ name, src }: { name: string; src?: string }) {
  if (src)
    return <img src={src} alt={name} className="h-9 w-9 rounded-lg flex-shrink-0 object-cover" />;
  return (
    <div className="h-9 w-9 rounded-lg bg-surface-elevated border border-border-subtle flex items-center justify-center flex-shrink-0">
      <span className="text-sm font-semibold text-secondary">{name.charAt(0).toUpperCase()}</span>
    </div>
  );
}

function ActiveRow({ channel, contact }: { channel: SlackChannel; contact?: SlackUser }) {
  const url = `https://slack.com/app_redirect?channel=${channel.id}`;
  const isDm = channel.is_im;
  const name = isDm
    ? contact?.real_name || contact?.profile?.display_name || contact?.name || 'Direct Message'
    : `#${channel.name}`;
  const avatar = isDm ? contact?.profile?.image_48 : undefined;
  const latestText = channel.latest?.text ?? '';
  const latestTs = channel.latest?.ts;
  const unread = channel.unread_count ?? 0;

  return (
    <DashboardRow
      stateBarClass={unread > 0 ? 'bg-accent' : undefined}
      className="items-center"
      onClick={() => chrome.tabs.create({ url })}
    >
      <div className="pl-2 flex-shrink-0">
        {isDm ? (
          <Avatar name={name} src={avatar} />
        ) : (
          <div className="h-9 w-9 rounded-lg bg-surface-elevated border border-border-subtle flex items-center justify-center">
            <Hash className="h-4 w-4 text-secondary" />
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <span className="text-sm font-semibold text-primary group-hover:text-accent transition-colors truncate">
            {name}
          </span>
          <div className="flex items-center gap-1.5 flex-shrink-0">
            {unread > 0 && (
              <span className="min-w-[20px] text-center px-1.5 py-0.5 rounded-full text-xs font-bold bg-accent text-white">
                {unread}
              </span>
            )}
            {latestTs && <span className="text-xs text-muted">{timeAgo(latestTs)}</span>}
          </div>
        </div>
        {latestText && <p className="text-xs text-muted mt-0.5 truncate">{truncate(latestText)}</p>}
      </div>
      <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity text-xs text-muted flex-shrink-0">
        <span>Open</span>
        <ChevronRight className="h-3 w-3" />
      </div>
    </DashboardRow>
  );
}

function DevChannelRow({ channel }: { channel: SlackChannel }) {
  const url = `https://slack.com/app_redirect?channel=${channel.id}`;
  const Icon = devChannelIcon(channel.name);
  const unread = channel.unread_count ?? 0;

  return (
    <DashboardRow
      stateBarClass={unread > 0 ? 'bg-destructive' : 'bg-muted/40'}
      className="items-center"
      onClick={() => chrome.tabs.create({ url })}
    >
      <div
        className={cn(
          'pl-2 h-9 w-9 rounded-lg flex items-center justify-center flex-shrink-0 border',
          unread > 0
            ? 'bg-destructive/10 border-destructive/20 text-destructive'
            : 'bg-surface-elevated border-border-subtle text-secondary'
        )}
      >
        <Icon className="h-4 w-4" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <span className="text-sm font-semibold text-primary group-hover:text-accent transition-colors truncate">
            #{channel.name}
          </span>
          {unread > 0 && (
            <span className="min-w-[20px] text-center px-1.5 py-0.5 rounded-full text-xs font-bold bg-destructive/10 text-destructive border border-destructive/30 flex-shrink-0">
              {unread}
            </span>
          )}
        </div>
        {channel.latest?.text && (
          <p className="text-xs text-muted mt-0.5 truncate">{truncate(channel.latest.text)}</p>
        )}
      </div>
      <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity text-xs text-muted">
        <span>Open</span>
        <ChevronRight className="h-3 w-3" />
      </div>
    </DashboardRow>
  );
}

type Tab = 'active' | 'dev';

export function SlackDashboard() {
  const {
    user,
    authInfo,
    unreadConversations,
    dmUsers,
    channels,
    isLoading,
    error,
    refresh,
    disconnect,
  } = useSlackAuthStore();
  const [activeTab, setActiveTab] = useState<Tab>('active');

  if (!user && isLoading) return <DashboardLoading size="lg" />;

  const activeItems = [...unreadConversations].sort(
    (a, b) => (b.unread_count ?? 0) - (a.unread_count ?? 0)
  );
  const devChannels = channels
    .filter((ch) => isDevChannel(ch.name))
    .sort((a, b) => (b.unread_count ?? 0) - (a.unread_count ?? 0));

  const tabs = [
    {
      id: 'active' as Tab,
      label: 'Active',
      icon: Bell,
      count: activeItems.length,
      highlight: (activeItems.length > 0 ? 'accent' : 'default') as 'accent' | 'default',
    },
    {
      id: 'dev' as Tab,
      label: 'Dev Channels',
      icon: Zap,
      count: devChannels.length,
      highlight: 'default' as const,
    },
  ];

  const active = tabs.find((t) => t.id === activeTab)!;

  return (
    <div data-testid="slack-dashboard" className={cn('p-6 space-y-6', DASHBOARD_MAX_WIDTH_CLASS)}>
      <DashboardHero
        avatar={user?.profile?.image_48}
        avatarFallback={<Hash className="h-7 w-7 text-muted" />}
        name={user?.real_name || authInfo?.userName || ''}
        subtitle={authInfo?.teamName}
        isLoading={isLoading}
        onRefresh={refresh}
        onDisconnect={disconnect}
      />

      <div className="grid grid-cols-2 gap-3">
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
            {isLoading && activeItems.length === 0 ? (
              <DashboardLoading />
            ) : activeTab === 'active' ? (
              activeItems.length === 0 ? (
                <DashboardEmptyState
                  icon={Bell}
                  title="All caught up"
                  hint="No unread messages across channels or DMs."
                />
              ) : (
                <div className="space-y-2">
                  {activeItems.map((ch) => (
                    <ActiveRow
                      key={ch.id}
                      channel={ch}
                      contact={ch.user ? dmUsers[ch.user] : undefined}
                    />
                  ))}
                </div>
              )
            ) : devChannels.length === 0 ? (
              <DashboardEmptyState
                icon={Zap}
                title="No dev channels detected"
                hint="Channels named with keywords like deploy, alerts, incidents, ci, or infra will appear here."
              />
            ) : (
              <div className="space-y-2">
                {devChannels.map((ch) => (
                  <DevChannelRow key={ch.id} channel={ch} />
                ))}
              </div>
            )}
          </DashboardTabPanel>
        </AnimatePresence>
      </DashboardContentCard>
    </div>
  );
}
