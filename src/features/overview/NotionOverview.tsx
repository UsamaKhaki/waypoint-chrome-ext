import { useEffect } from 'react';
import { ArrowRight, ExternalLink, RefreshCw, FileText, Database } from 'lucide-react';
import { motion } from 'framer-motion';
import { useNotionAuthStore } from '@/store/notionAuth.store';
import { cn } from '@/lib/utils';

interface NotionOverviewProps {
  onNavigate: (section: string) => void;
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export function NotionOverview({ onNavigate }: NotionOverviewProps) {
  const { isConnected, isInitializing, isLoading, recentPages, databases, refresh, loadToken } =
    useNotionAuthStore();

  useEffect(() => {
    loadToken();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (isInitializing) return null;

  if (!isConnected) {
    return (
      <div className="card p-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-surface-elevated flex-shrink-0">
            <FileText className="h-4 w-4 text-primary" />
          </div>
          <div>
            <p className="text-sm font-medium text-primary">Notion</p>
            <p className="text-xs text-muted">Connect Notion to see your recent pages here</p>
          </div>
        </div>
        <button
          onClick={() => onNavigate('notion')}
          className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium bg-accent/10 text-accent hover:bg-accent/20 transition-colors"
        >
          Connect <ArrowRight className="h-3 w-3" />
        </button>
      </div>
    );
  }

  const top = recentPages.slice(0, 5);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-primary" />
          <span className="section-title">Notion — Recent</span>
          {recentPages.length > 0 && (
            <span className="px-1.5 py-0.5 rounded-full text-xs font-medium bg-surface-elevated text-secondary">
              {recentPages.length}
            </span>
          )}
          {databases.length > 0 && (
            <span className="flex items-center gap-1 px-1.5 py-0.5 rounded-full text-xs font-medium bg-surface-elevated text-muted">
              <Database className="h-3 w-3" />
              {databases.length}
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
            onClick={() => onNavigate('notion')}
            className="text-xs text-muted hover:text-accent transition-colors"
          >
            View all →
          </button>
        </div>
      </div>

      {isLoading && top.length === 0 ? (
        <div className="grid grid-cols-1 gap-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-12 rounded-xl bg-surface-elevated animate-pulse" />
          ))}
        </div>
      ) : top.length === 0 ? (
        <div className="card p-4 flex items-center gap-3 text-muted">
          <FileText className="h-5 w-5 opacity-40" />
          <p className="text-sm">No recent pages</p>
        </div>
      ) : (
        <div className="card divide-y divide-border-subtle">
          {top.map((page) => {
            const emoji = page.icon && page.icon.type === 'emoji' ? page.icon.emoji : null;
            const externalIcon =
              page.icon && page.icon.type === 'external' ? page.icon.external.url : null;
            return (
              <button
                key={page.id}
                onClick={() => chrome.tabs.create({ url: page.url })}
                className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-surface-elevated transition-colors text-left group first:rounded-t-xl last:rounded-b-xl"
              >
                <div className="h-6 w-6 rounded-md bg-surface-elevated flex items-center justify-center flex-shrink-0 text-sm">
                  {emoji ? (
                    <span>{emoji}</span>
                  ) : externalIcon ? (
                    <img src={externalIcon} alt="" className="h-4 w-4 rounded" />
                  ) : page.object === 'database' ? (
                    <Database className="h-3.5 w-3.5 text-muted" />
                  ) : (
                    <FileText className="h-3.5 w-3.5 text-muted" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-primary truncate group-hover:text-accent transition-colors">
                    {page.title}
                  </p>
                  <p className="text-xs text-muted">
                    {page.object === 'database' ? 'Database' : 'Page'} · edited{' '}
                    {timeAgo(page.last_edited_time)}
                  </p>
                </div>
                <ExternalLink className="h-3 w-3 text-muted opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
              </button>
            );
          })}
        </div>
      )}
    </motion.div>
  );
}
