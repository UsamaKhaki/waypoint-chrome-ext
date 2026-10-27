import { AlertCircle, Trash2, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { useOpenTabs, type OpenTab } from './useOpenTabs';
import { truncate } from '@/utils';

function findDuplicates(tabs: OpenTab[]): Map<string, OpenTab[]> {
  const map = new Map<string, OpenTab[]>();
  for (const tab of tabs) {
    const key = tab.url;
    if (!key || key.startsWith('chrome://') || key.startsWith('chrome-extension://')) continue;
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(tab);
  }
  return new Map([...map.entries()].filter(([, v]) => v.length > 1));
}

export function DuplicateDetector() {
  const { tabs, isLoading, refetch } = useOpenTabs();
  const duplicates = findDuplicates(tabs);

  const closeTab = async (tabId: number) => {
    await chrome.tabs.remove(tabId);
    refetch();
  };

  const closeAllDuplicates = async () => {
    const toClose: number[] = [];
    for (const group of duplicates.values()) {
      // Keep the first (oldest), close the rest
      group.slice(1).forEach((t) => toClose.push(t.id));
    }
    await chrome.tabs.remove(toClose);
    refetch();
  };

  if (isLoading) return <p className="text-xs text-muted">Scanning tabs...</p>;

  if (duplicates.size === 0) {
    return (
      <div className="flex items-center gap-2 text-sm text-success py-2">
        <span>✅</span>
        <span>No duplicate tabs found</span>
        <Button variant="ghost" size="icon-sm" onClick={refetch} title="Refresh">
          <RefreshCw className="h-3.5 w-3.5" />
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <AlertCircle className="h-4 w-4 text-warning" />
          <span className="text-sm text-secondary">
            {duplicates.size} duplicate URL{duplicates.size > 1 ? 's' : ''} found
          </span>
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" size="icon-sm" onClick={refetch} title="Refresh">
            <RefreshCw className="h-3.5 w-3.5" />
          </Button>
          <Button variant="destructive" size="sm" onClick={closeAllDuplicates}>
            Close All Duplicates
          </Button>
        </div>
      </div>

      <div className="space-y-2">
        {[...duplicates.entries()].map(([url, group]) => (
          <div key={url} className="rounded-xl border border-border-subtle overflow-hidden">
            <div className="px-3 py-2 bg-surface-elevated">
              <p className="text-xs text-muted truncate">{truncate(url, 60)}</p>
              <Badge variant="warning" className="mt-1">
                {group.length} tabs
              </Badge>
            </div>
            <div className="divide-y divide-border-subtle">
              {group.map((tab, i) => (
                <div key={tab.id} className="flex items-center gap-3 px-3 py-2 group">
                  {tab.favicon && (
                    <img
                      src={tab.favicon}
                      alt=""
                      className="h-4 w-4 rounded flex-shrink-0"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  )}
                  <span className="flex-1 text-xs text-secondary truncate">{tab.title}</span>
                  {i === 0 && (
                    <Badge variant="secondary" className="text-xs">
                      keep
                    </Badge>
                  )}
                  {i > 0 && (
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      className="opacity-0 group-hover:opacity-100 hover:text-destructive"
                      onClick={() => closeTab(tab.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
