import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Hash,
  Bell,
  RefreshCw,
  LogOut,
  ExternalLink,
  Zap,
  AlertTriangle,
  GitBranch,
  Server,
} from 'lucide-react';
import { useSlackAuthStore } from '@/store/slackAuth.store';
import { Spinner } from '@/components/ui/Spinner';
import { cn } from '@/lib/utils';
import type { SlackChannel, SlackUser } from '@/services/slackApi';

const DEV_KEYWORDS = [
  'deploy', 'deployment', 'release', 'build', 'ci', 'cd', 'pipeline',
  'alert', 'alerts', 'alarm', 'incident', 'incidents', 'oncall', 'on-call',
  'prod', 'production', 'staging', 'infra', 'infrastructure', 'ops', 'devops',
  'monitor', 'monitoring', 'error', 'errors', 'log', 'logs', 'github',
  'jenkins', 'k8s', 'kubernetes', 'docker', 'aws', 'terraform', 'pagerduty',
];

function isDevChannel(name: string): boolean {
  const lower = name.toLowerCase();
  return DEV_KEYWORDS.some((kw) => lower.includes(kw));
}

function devChannelIcon(name: string) {
  const lower = name.toLowerCase();
  if (['deploy', 'release', 'build', 'ci', 'cd', 'pipeline', 'github', 'jenkins'].some((k) => lower.includes(k)))
    return GitBranch;
  if (['alert', 'incident', 'oncall', 'pagerduty', 'alarm'].some((k) => lower.includes(k)))
    return AlertTriangle;
  if (['infra', 'k8s', 'kubernetes', 'docker', 'aws', 'terraform', 'server', 'prod', 'staging'].some((k) => lower.includes(k)))
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
  if (src) return <img src={src} alt={name} className="h-9 w-9 rounded-full flex-shrink-0 object-cover" />;
  return (
    <div className="h-9 w-9 rounded-full bg-surface-elevated border border-border-subtle flex items-center justify-center flex-shrink-0">
      <span className="text-sm font-semibold text-secondary">{name.charAt(0).toUpperCase()}</span>
    </div>
  );
}

function ActiveCard({ channel, contact }: { channel: SlackChannel; contact?: SlackUser }) {
  const url = `https://slack.com/app_redirect?channel=${channel.id}`;
  const isDm = channel.is_im;
  const name = isDm
    ? (contact?.real_name || contact?.profile?.display_name || contact?.name || 'Direct Message')
    : `#${channel.name}`;
  const avatar = isDm ? contact?.profile?.image_48 : undefined;
  const latestText = channel.latest?.text ?? '';
  const latestTs = channel.latest?.ts;

  return (
    <button
      onClick={() => chrome.tabs.create({ url })}
      className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-surface-elevated transition-colors text-left group"
    >
      {isDm ? (
        <Avatar name={name} src={avatar} />
      ) : (
        <div className="h-9 w-9 rounded-xl bg-surface-elevated border border-border-subtle flex items-center justify-center flex-shrink-0">
          <Hash className="h-4 w-4 text-secondary" />
        </div>
      )}

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <span className="text-sm font-medium text-primary group-hover:text-accent transition-colors truncate">
            {name}
          </span>
          <div className="flex items-center gap-1.5 flex-shrink-0">
            {(channel.unread_count ?? 0) > 0 && (
              <span className="min-w-[20px] text-center px-1.5 py-0.5 rounded-full text-xs font-bold bg-accent text-white">
                {channel.unread_count}
              </span>
            )}
            {latestTs && <span className="text-xs text-muted">{timeAgo(latestTs)}</span>}
          </div>
        </div>
        {latestText && (
          <p className="text-xs text-muted mt-0.5 truncate">{truncate(latestText)}</p>
        )}
      </div>

      <ExternalLink className="h-3.5 w-3.5 text-muted opacity-0 group-hover:opacity-100 flex-shrink-0 transition-opacity" />
    </button>
  );
}

function DevChannelCard({ channel }: { channel: SlackChannel }) {
  const url = `https://slack.com/app_redirect?channel=${channel.id}`;
  const Icon = devChannelIcon(channel.name);
  const unread = channel.unread_count ?? 0;

  return (
    <button
      onClick={() => chrome.tabs.create({ url })}
      className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-surface-elevated transition-colors text-left group"
    >
      <div className={cn(
        'h-9 w-9 rounded-xl flex items-center justify-center flex-shrink-0 border',
        unread > 0
          ? 'bg-destructive/10 border-destructive/20 text-destructive'
          : 'bg-surface-elevated border-border-subtle text-secondary'
      )}>
        <Icon className="h-4 w-4" />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <span className="text-sm font-medium text-primary group-hover:text-accent transition-colors truncate">
            #{channel.name}
          </span>
          {unread > 0 && (
            <span className="min-w-[20px] text-center px-1.5 py-0.5 rounded-full text-xs font-bold bg-destructive/10 text-destructive flex-shrink-0">
              {unread}
            </span>
          )}
        </div>
        {channel.latest?.text && (
          <p className="text-xs text-muted mt-0.5 truncate">{truncate(channel.latest.text)}</p>
        )}
      </div>

      <ExternalLink className="h-3.5 w-3.5 text-muted opacity-0 group-hover:opacity-100 flex-shrink-0 transition-opacity" />
    </button>
  );
}

function EmptyState({ icon: Icon, text, sub }: { icon: React.ElementType; text: string; sub?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center gap-1">
      <Icon className="h-8 w-8 text-muted mb-2 opacity-40" />
      <p className="text-sm text-primary font-medium">{text}</p>
      {sub && <p className="text-xs text-muted max-w-xs">{sub}</p>}
    </div>
  );
}

type Tab = 'active' | 'dev';

export function SlackDashboard() {
  const { user, authInfo, unreadConversations, dmUsers, channels, isLoading, error, refresh, disconnect } =
    useSlackAuthStore();
  const [activeTab, setActiveTab] = useState<Tab>('active');

  if (!user && isLoading) {
    return <div className="flex items-center justify-center h-64"><Spinner size="lg" /></div>;
  }

  // Active: all unreads sorted by count desc
  const activeItems = [...unreadConversations].sort(
    (a, b) => (b.unread_count ?? 0) - (a.unread_count ?? 0)
  );

  // Dev channels: from channels list, keyword-matched, unread ones float to top
  const devChannels = channels
    .filter((ch) => isDevChannel(ch.name))
    .sort((a, b) => (b.unread_count ?? 0) - (a.unread_count ?? 0));

  const tabs = [
    { id: 'active' as Tab, label: 'Active', icon: Bell, count: activeItems.length },
    { id: 'dev' as Tab, label: 'Dev Channels', icon: Zap, count: devChannels.length },
  ];

  return (
    <div data-testid="slack-dashboard" className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {user?.profile?.image_48 ? (
            <img src={user.profile.image_48} alt={user.real_name} className="h-10 w-10 rounded-full border-2 border-border" />
          ) : (
            <div className="h-10 w-10 rounded-full bg-surface-elevated border border-border flex items-center justify-center">
              <Hash className="h-5 w-5 text-muted" />
            </div>
          )}
          <div>
            <h1 className="text-lg font-semibold text-primary">{user?.real_name || authInfo?.userName}</h1>
            <p className="text-xs text-muted">{authInfo?.teamName}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={refresh} disabled={isLoading} className="p-2 rounded-xl hover:bg-surface-elevated text-muted hover:text-primary transition-all" title="Refresh">
            <RefreshCw className={cn('h-4 w-4', isLoading && 'animate-spin')} />
          </button>
          <button onClick={disconnect} className="p-2 rounded-xl hover:bg-surface-elevated text-muted hover:text-destructive transition-all" title="Disconnect">
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Tab strip */}
      <div className="grid grid-cols-2 gap-2">
        {tabs.map(({ id, label, icon: Icon, count }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={cn(
              'flex flex-col items-center gap-1 p-3 rounded-xl border transition-all duration-150',
              activeTab === id
                ? 'bg-accent/10 border-accent/30 text-accent'
                : 'bg-surface border-border-subtle text-secondary hover:border-border hover:bg-surface-elevated'
            )}
          >
            <Icon className="h-4 w-4" />
            <span className="text-lg font-bold">{count}</span>
            <span className="text-xs opacity-80">{label}</span>
          </button>
        ))}
      </div>

      {error && (
        <div className="text-xs text-destructive bg-destructive/10 rounded-xl px-4 py-2">{error}</div>
      )}

      {/* Content */}
      <div className="card p-2 min-h-[300px]">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15 }}
          >
            {isLoading && activeItems.length === 0 ? (
              <div className="flex items-center justify-center py-12"><Spinner size="md" /></div>
            ) : activeTab === 'active' ? (
              activeItems.length === 0 ? (
                <EmptyState icon={Bell} text="All caught up" sub="No unread messages across channels or DMs." />
              ) : (
                activeItems.map((ch) => (
                  <ActiveCard key={ch.id} channel={ch} contact={ch.user ? dmUsers[ch.user] : undefined} />
                ))
              )
            ) : devChannels.length === 0 ? (
              <EmptyState
                icon={Zap}
                text="No dev channels detected"
                sub="Channels named with keywords like deploy, alerts, incidents, ci, or infra will appear here."
              />
            ) : (
              devChannels.map((ch) => <DevChannelCard key={ch.id} channel={ch} />)
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
