import { ExternalLink, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useOpenTabs } from './useOpenTabs';
import { truncate } from '@/utils';

export function RecentTabs() {
  const { tabs, isLoading, refetch } = useOpenTabs();

  const recent = [...tabs]
    .filter((t) => !t.url.startsWith('chrome://') && !t.url.startsWith('chrome-extension://'))
    .slice(0, 10);

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <p className="section-title">Open Tabs ({tabs.length})</p>
        <Button variant="ghost" size="icon-sm" onClick={refetch} title="Refresh">
          <RefreshCw className="h-3.5 w-3.5" />
        </Button>
      </div>

      {isLoading ? (
        <p className="text-xs text-muted">Loading tabs...</p>
      ) : (
        <div className="space-y-1">
          {recent.map((tab) => (
            <div
              key={tab.id}
              data-testid={`tab-row-${tab.id}`}
              className="group flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-surface-elevated transition-colors cursor-pointer"
              onClick={() => chrome.tabs.update(tab.id, { active: true })}
            >
              {tab.favicon ? (
                <img
                  src={tab.favicon}
                  alt=""
                  className="h-4 w-4 rounded flex-shrink-0"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
              ) : (
                <div className="h-4 w-4 rounded bg-surface-elevated flex-shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm text-secondary group-hover:text-primary truncate transition-colors">
                  {tab.title}
                </p>
                <p className="text-xs text-muted truncate">{truncate(tab.url, 50)}</p>
              </div>
              {tab.active && (
                <span className="text-xs text-success font-medium flex-shrink-0">active</span>
              )}
              <ExternalLink className="h-3.5 w-3.5 text-muted opacity-0 group-hover:opacity-100 flex-shrink-0 transition-opacity" />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
