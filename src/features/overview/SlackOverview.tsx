import { useEffect } from 'react';
import { Hash, ArrowRight, ExternalLink, Bell } from 'lucide-react';
import { motion } from 'framer-motion';
import { useSlackAuthStore } from '@/store/slackAuth.store';
import { cn } from '@/lib/utils';

function timeAgo(ts: string): string {
  const diff = Date.now() - parseFloat(ts) * 1000;
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

interface SlackOverviewProps {
  onNavigate: (section: string) => void;
}

export function SlackOverview({ onNavigate }: SlackOverviewProps) {
  const { isConnected, isInitializing, unreadConversations, dmUsers, loadToken } =
    useSlackAuthStore();

  useEffect(() => {
    loadToken();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Don't flash the connect prompt while we're still reading from storage
  if (isInitializing) return null;

  if (!isConnected) {
    return (
      <div className="card p-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-green-500/10">
            <Hash className="h-4 w-4 text-green-400" />
          </div>
          <div>
            <p className="text-sm font-medium text-primary">Slack Unread</p>
            <p className="text-xs text-muted">Connect Slack to see unread messages here</p>
          </div>
        </div>
        <button
          onClick={() => onNavigate('slack')}
          className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium bg-accent/10 text-accent hover:bg-accent/20 transition-colors"
        >
          Connect <ArrowRight className="h-3 w-3" />
        </button>
      </div>
    );
  }

  const topUnread = [...unreadConversations]
    .sort((a, b) => (b.unread_count ?? 0) - (a.unread_count ?? 0))
    .slice(0, 5);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <Bell className="h-4 w-4 text-green-400" />
          <span className="text-sm font-semibold text-primary">Slack Unread</span>
          {unreadConversations.length > 0 && (
            <span className="px-1.5 py-0.5 rounded-full text-xs font-bold bg-green-500/10 text-green-400">
              {unreadConversations.length}
            </span>
          )}
        </div>
        <button
          onClick={() => onNavigate('slack')}
          className="text-xs text-muted hover:text-accent transition-colors"
        >
          View all →
        </button>
      </div>

      {topUnread.length === 0 ? (
        <div className="card p-4 flex items-center gap-3">
          <Bell className="h-4 w-4 text-muted opacity-40" />
          <p className="text-sm text-muted">All caught up — no unread messages</p>
        </div>
      ) : (
        <div className="space-y-1.5">
          {topUnread.map((ch) => {
            const isDm = ch.is_im;
            const contact = isDm && ch.user ? dmUsers[ch.user] : undefined;
            const name = isDm
              ? contact?.real_name ||
                contact?.profile?.display_name ||
                contact?.name ||
                'Direct Message'
              : `#${ch.name}`;
            const avatar = contact?.profile?.image_48;
            const url = `https://slack.com/app_redirect?channel=${ch.id}`;

            return (
              <button
                key={ch.id}
                onClick={() => chrome.tabs.create({ url })}
                className="w-full flex items-center gap-3 p-3 rounded-xl border border-border-subtle bg-surface hover:bg-surface-elevated hover:border-border transition-all duration-150 text-left group"
              >
                {/* Avatar or channel icon */}
                {isDm && avatar ? (
                  <img
                    src={avatar}
                    alt={name}
                    className="h-7 w-7 rounded-full flex-shrink-0 object-cover"
                  />
                ) : isDm ? (
                  <div className="h-7 w-7 rounded-full bg-surface-elevated border border-border-subtle flex items-center justify-center flex-shrink-0">
                    <span className="text-xs font-semibold text-secondary">
                      {name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                ) : (
                  <div className="h-7 w-7 rounded-lg bg-surface-elevated border border-border-subtle flex items-center justify-center flex-shrink-0">
                    <Hash className="h-3.5 w-3.5 text-secondary" />
                  </div>
                )}

                {/* Name + message */}
                <div className="flex-1 min-w-0">
                  <span
                    className={cn(
                      'text-sm font-medium truncate block',
                      (ch.unread_count ?? 0) > 0 ? 'text-primary' : 'text-secondary'
                    )}
                  >
                    {name}
                  </span>
                  {ch.latest?.text && (
                    <p className="text-xs text-muted truncate mt-0.5">
                      {ch.latest.text.length > 60
                        ? ch.latest.text.slice(0, 60) + '…'
                        : ch.latest.text}
                    </p>
                  )}
                </div>

                {/* Meta */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  {ch.latest?.ts && (
                    <span className="text-xs text-muted">{timeAgo(ch.latest.ts)}</span>
                  )}
                  {(ch.unread_count ?? 0) > 0 && (
                    <span className="min-w-[20px] text-center px-1.5 py-0.5 rounded-full text-xs font-bold bg-accent text-white">
                      {ch.unread_count}
                    </span>
                  )}
                  <ExternalLink className="h-3 w-3 text-muted opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </button>
            );
          })}
        </div>
      )}

      {unreadConversations.length > 5 && (
        <button
          onClick={() => onNavigate('slack')}
          className="w-full text-center text-xs text-muted hover:text-accent transition-colors py-1"
        >
          +{unreadConversations.length - 5} more unread →
        </button>
      )}
    </motion.div>
  );
}
