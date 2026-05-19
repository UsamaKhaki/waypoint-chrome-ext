import { useEffect } from 'react';
import { Hash, ArrowRight, Bell } from 'lucide-react';
import { motion } from 'framer-motion';
import { useSlackAuthStore } from '@/store/slackAuth.store';
import { cn } from '@/lib/utils';

interface SlackOverviewProps {
  onNavigate: (section: string) => void;
}

export function SlackOverview({ onNavigate }: SlackOverviewProps) {
  const { isConnected, isInitializing, unreadCount, loadToken } = useSlackAuthStore();

  useEffect(() => {
    loadToken();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (isInitializing) return null;

  if (!isConnected) {
    return (
      <div className="card p-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-green-500/10">
            <Hash className="h-4 w-4 text-green-400" />
          </div>
          <div>
            <p className="text-sm font-medium text-primary">Slack</p>
            <p className="text-xs text-muted">Connect to see unread messages</p>
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

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="card p-4 flex items-center justify-between gap-4"
    >
      <div className="flex items-center gap-3">
        <div
          className={cn(
            'p-2 rounded-xl',
            unreadCount > 0 ? 'bg-accent/10' : 'bg-surface-elevated border border-border-subtle'
          )}
        >
          <Bell className={cn('h-4 w-4', unreadCount > 0 ? 'text-accent' : 'text-muted')} />
        </div>
        <div>
          <p className="text-sm font-medium text-primary">Slack</p>
          <p className="text-xs text-muted">
            {unreadCount > 0 ? `${unreadCount} unread messages` : 'All caught up'}
          </p>
        </div>
      </div>
      <button
        onClick={() => onNavigate('slack')}
        className="text-xs text-muted hover:text-accent transition-colors flex-shrink-0"
      >
        View →
      </button>
    </motion.div>
  );
}
