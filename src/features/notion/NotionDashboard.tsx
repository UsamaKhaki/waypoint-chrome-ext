import { useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { BookOpen, Clock, FileText, Database, LayoutGrid, ChevronRight } from 'lucide-react';
import { useNotionAuthStore } from '@/store/notionAuth.store';
import { cn } from '@/lib/utils';
import type { NotionPage } from '@/services/notionApi';
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

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function PageRow({ page }: { page: NotionPage }) {
  const parentType = (page.parent?.type ?? 'workspace').replace(/_/g, ' ');
  const isDb = page.object === 'database';
  return (
    <DashboardRow
      stateBarClass={isDb ? 'bg-accent' : 'bg-muted/40'}
      onClick={() => chrome.tabs.create({ url: page.url })}
    >
      <div className="pl-2 flex-shrink-0 mt-0.5 h-6 w-6 rounded-md bg-surface-elevated border border-border-subtle flex items-center justify-center text-base leading-none">
        {page.icon?.type === 'emoji' ? (
          <span>{page.icon.emoji}</span>
        ) : page.icon?.type === 'external' ? (
          <img src={page.icon.external.url} alt="" className="h-3.5 w-3.5 rounded" />
        ) : isDb ? (
          <Database className="h-3.5 w-3.5 text-muted" />
        ) : (
          <FileText className="h-3.5 w-3.5 text-muted" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <span className="text-sm font-semibold text-primary group-hover:text-accent transition-colors truncate block">
          {page.title}
        </span>
        <div className="flex items-center gap-3 mt-1 text-xs text-muted flex-wrap">
          <span className="capitalize">{isDb ? 'Database' : 'Page'}</span>
          <span>·</span>
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {timeAgo(page.last_edited_time)}
          </span>
          <span>·</span>
          <span className="capitalize text-[11px]">{parentType}</span>
        </div>
      </div>
      <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity text-xs text-muted">
        <span>Open</span>
        <ChevronRight className="h-3 w-3" />
      </div>
    </DashboardRow>
  );
}

type Tab = 'recent' | 'databases' | 'all';

export function NotionDashboard() {
  const { user, recentPages, databases, isLoading, error, refresh, disconnect } =
    useNotionAuthStore();
  const [activeTab, setActiveTab] = useState<Tab>('recent');

  if (!user && isLoading) return <DashboardLoading size="lg" />;

  const allPages: NotionPage[] = [
    ...recentPages,
    ...databases.filter((db) => !recentPages.some((p) => p.id === db.id)),
  ];

  const tabs = [
    {
      id: 'recent' as Tab,
      label: 'Recent',
      icon: Clock,
      count: recentPages.length,
      highlight: 'accent' as const,
    },
    {
      id: 'databases' as Tab,
      label: 'Databases',
      icon: Database,
      count: databases.length,
      highlight: 'default' as const,
    },
    {
      id: 'all' as Tab,
      label: 'All',
      icon: LayoutGrid,
      count: allPages.length,
      highlight: 'default' as const,
    },
  ];

  const active = tabs.find((t) => t.id === activeTab)!;
  const pageList: NotionPage[] =
    activeTab === 'recent' ? recentPages : activeTab === 'databases' ? databases : allPages;

  const emptyMessages: Record<Tab, { title: string; hint: string }> = {
    recent: {
      title: 'No recent pages',
      hint: "Pages you've recently edited or visited will appear here.",
    },
    databases: {
      title: 'No databases found',
      hint: 'Databases your integration has access to will show up here.',
    },
    all: {
      title: 'Nothing here yet',
      hint: 'Connect more pages to the integration to see them listed.',
    },
  };
  const empty = emptyMessages[activeTab];

  return (
    <div data-testid="notion-dashboard" className={cn('p-6 space-y-6', DASHBOARD_MAX_WIDTH_CLASS)}>
      <DashboardHero
        avatar={user?.avatar_url}
        avatarFallback={<BookOpen className="h-7 w-7 text-muted" />}
        name={user?.name || ''}
        subtitle={user?.type ?? 'bot'}
        isLoading={isLoading}
        onRefresh={refresh}
        onDisconnect={disconnect}
      />

      <div className="grid grid-cols-3 gap-3">
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
            {isLoading && recentPages.length === 0 ? (
              <DashboardLoading />
            ) : pageList.length === 0 ? (
              <DashboardEmptyState icon={BookOpen} title={empty.title} hint={empty.hint} />
            ) : (
              <div className="space-y-2">
                {pageList.map((p) => (
                  <PageRow key={p.id} page={p} />
                ))}
              </div>
            )}
          </DashboardTabPanel>
        </AnimatePresence>
      </DashboardContentCard>
    </div>
  );
}
