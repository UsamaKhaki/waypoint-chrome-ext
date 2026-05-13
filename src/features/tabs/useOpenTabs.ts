import { useState, useEffect, useCallback } from 'react';

export interface OpenTab {
  id: number;
  title: string;
  url: string;
  favicon?: string;
  windowId: number;
  active: boolean;
  groupId?: number;
}

export function useOpenTabs() {
  const [tabs, setTabs] = useState<OpenTab[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchTabs = useCallback(async () => {
    setIsLoading(true);
    try {
      const chromeTabs = await chrome.tabs.query({ currentWindow: true });
      setTabs(
        chromeTabs.map((t) => ({
          id: t.id ?? 0,
          title: t.title ?? 'Untitled',
          url: t.url ?? '',
          favicon: t.favIconUrl,
          windowId: t.windowId,
          active: t.active,
          groupId: t.groupId,
        }))
      );
    } catch {
      setTabs([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTabs();
  }, [fetchTabs]);

  return { tabs, isLoading, refetch: fetchTabs };
}
