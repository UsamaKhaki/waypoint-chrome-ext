import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BookOpen,
  Clock,
  RefreshCw,
  LogOut,
  FileText,
  Database,
  LayoutGrid,
} from 'lucide-react';
import { useNotionAuthStore } from '@/store/notionAuth.store';
import { Spinner } from '@/components/ui/Spinner';
import { cn } from '@/lib/utils';
import type { NotionPage } from '@/services/notionApi';

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

function PageCard({ page }: { page: NotionPage }) {
  const parentType = page.parent?.type ?? 'workspace';

  return (
    <button
      onClick={() => chrome.tabs.create({ url: page.url })}
      className="w-full flex items-start gap-3 p-3 rounded-xl hover:bg-surface-elevated transition-colors text-left group"
    >
      {/* Icon */}
      <div className="flex-shrink-0 mt-0.5 h-5 w-5 flex items-center justify-center text-base leading-none">
        {page.icon?.type === 'emoji' ? (
          <span>{page.icon.emoji}</span>
        ) : (
          <FileText className="h-4 w-4 text-muted" />
        )}
      </div>

      <div className="flex-1 min-w-0">
        <span className="text-sm font-medium text-primary group-hover:text-accent transition-colors truncate block">
          {page.title}
        </span>

        <div className="flex items-center gap-3 mt-1 text-xs text-muted flex-wrap">
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {timeAgo(page.last_edited_time)}
          </span>
          <span className="px-1.5 py-0.5 rounded-full bg-surface-elevated text-secondary border border-border-subtle capitalize">
            {parentType.replace(/_/g, ' ')}
          </span>
        </div>
      </div>
    </button>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <BookOpen className="h-8 w-8 text-muted mb-3 opacity-40" />
      <p className="text-sm text-muted">{text}</p>
    </div>
  );
}

type Tab = 'recent' | 'databases' | 'all';

export function NotionDashboard() {
  const {
    user,
    recentPages,
    databases,
    isLoading,
    error,
    refresh,
    disconnect,
  } = useNotionAuthStore();
  const [activeTab, setActiveTab] = useState<Tab>('recent');

  if (!user && isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spinner size="lg" />
      </div>
    );
  }

  const allPages: NotionPage[] = [
    ...recentPages,
    ...databases.filter((db) => !recentPages.some((p) => p.id === db.id)),
  ];

  const tabs: { id: Tab; label: string; icon: React.ElementType; count: number }[] = [
    { id: 'recent', label: 'Recent', icon: Clock, count: recentPages.length },
    { id: 'databases', label: 'Databases', icon: Database, count: databases.length },
    { id: 'all', label: 'All', icon: LayoutGrid, count: allPages.length },
  ];

  const pageList = (): NotionPage[] => {
    if (activeTab === 'recent') return recentPages;
    if (activeTab === 'databases') return databases;
    return allPages;
  };

  const emptyMessages: Record<Tab, string> = {
    recent: 'No recent pages found',
    databases: 'No databases found',
    all: 'No pages or databases found',
  };

  return (
    <div data-testid="notion-dashboard" className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {user?.avatar_url ? (
            <img
              src={user.avatar_url}
              alt={user.name}
              className="h-10 w-10 rounded-full border-2 border-border"
            />
          ) : (
            <div className="h-10 w-10 rounded-full border-2 border-border bg-surface-elevated flex items-center justify-center">
              <BookOpen className="h-5 w-5 text-muted" />
            </div>
          )}
          <div>
            <h1 className="text-lg font-semibold text-primary">{user?.name}</h1>
            <span className="text-xs text-muted capitalize">{user?.type ?? 'bot'}</span>
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
      <div className="grid grid-cols-3 gap-2">
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
            {isLoading && recentPages.length === 0 ? (
              <div className="flex items-center justify-center py-12">
                <Spinner size="md" />
              </div>
            ) : pageList().length === 0 ? (
              <EmptyState text={emptyMessages[activeTab]} />
            ) : (
              pageList().map((page) => <PageCard key={page.id} page={page} />)
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
