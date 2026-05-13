import { Trash2, ExternalLink, Copy } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useOpenTabs } from './useOpenTabs';

export function BulkTabActions() {
  const { tabs, refetch } = useOpenTabs();

  const closeAllExceptActive = async () => {
    const toClose = tabs.filter((t) => !t.active).map((t) => t.id);
    if (toClose.length === 0) return;
    await chrome.tabs.remove(toClose);
    refetch();
  };

  const openAllInNewWindow = async () => {
    const urls = tabs
      .filter((t) => !t.url.startsWith('chrome://') && !t.url.startsWith('chrome-extension://'))
      .map((t) => t.url);
    if (urls.length === 0) return;
    try {
      await (chrome.windows as typeof chrome.windows).create({ url: urls });
    } catch {
      // chrome.windows may not be available in all contexts
    }
  };

  const copyAllUrls = () => {
    const urls = tabs
      .filter((t) => !t.url.startsWith('chrome://') && !t.url.startsWith('chrome-extension://'))
      .map((t) => t.url)
      .join('\n');
    navigator.clipboard.writeText(urls);
  };

  return (
    <div>
      <p className="section-title mb-3">Bulk Actions</p>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={closeAllExceptActive}
          className="justify-start gap-2"
        >
          <Trash2 className="h-3.5 w-3.5" />
          Close Others
        </Button>
        <Button variant="outline" size="sm" onClick={copyAllUrls} className="justify-start gap-2">
          <Copy className="h-3.5 w-3.5" />
          Copy All URLs
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={openAllInNewWindow}
          className="justify-start gap-2"
        >
          <ExternalLink className="h-3.5 w-3.5" />
          New Window
        </Button>
      </div>
    </div>
  );
}
