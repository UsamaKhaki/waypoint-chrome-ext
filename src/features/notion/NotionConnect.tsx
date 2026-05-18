import { useState } from 'react';
import { Key, ExternalLink, Shield } from 'lucide-react';
import { NotionIcon } from '@/components/icons/ConnectorIcons';
import { useNotionAuthStore } from '@/store/notionAuth.store';
import { Spinner } from '@/components/ui/Spinner';

export function NotionConnect() {
  const { connect, isLoading, error } = useNotionAuthStore();
  const [token, setToken] = useState('');

  const handleConnect = () => {
    const t = token.trim();
    if (t) {
      connect(t);
    }
  };

  const canSubmit = token.trim().length > 0;

  return (
    <div data-testid="notion-connect" className="flex flex-col items-center justify-center min-h-[400px] max-w-md mx-auto text-center space-y-6 px-4">
      {/* Icon */}
      <div className="p-5 rounded-3xl bg-surface-elevated border border-border-subtle">
        <NotionIcon className="h-12 w-12" />
      </div>

      {/* Text */}
      <div className="space-y-2">
        <h2 className="text-xl font-semibold text-primary">Connect Notion</h2>
        <p className="text-sm text-muted leading-relaxed">
          Connect your Notion workspace to see recent pages and databases — all in one place.
        </p>
      </div>

      {/* Input */}
      <div className="w-full space-y-3">
        <div className="relative">
          <Key className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" />
          <input
            data-testid="notion-input"
            type="password"
            placeholder="Paste your Internal Integration Token (secret_…)"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleConnect()}
            className="w-full rounded-xl bg-surface border border-border-subtle text-primary text-sm pl-10 pr-4 py-3 outline-none focus:border-accent transition-colors"
            autoFocus
          />
        </div>

        {error && <p data-testid="notion-error" className="text-xs text-destructive text-left">{error}</p>}

        <button
          data-testid="notion-connect-btn"
          onClick={handleConnect}
          disabled={!canSubmit || isLoading}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-accent text-white text-sm font-medium hover:bg-accent-hover transition-colors disabled:opacity-50"
        >
          {isLoading ? <Spinner size="sm" /> : <NotionIcon className="h-4 w-4" />}
          {isLoading ? 'Connecting…' : 'Connect Notion'}
        </button>
      </div>

      {/* Help */}
      <div className="w-full p-3 rounded-xl bg-surface border border-border-subtle text-left space-y-2">
        <div className="flex items-center gap-2 text-xs font-medium text-secondary">
          <Shield className="h-3.5 w-3.5 text-success" />
          How to create an Integration Token
        </div>
        <ol className="text-xs text-muted space-y-1 list-decimal list-inside">
          <li>Go to notion.so/my-integrations</li>
          <li>Click "New integration"</li>
          <li>Give it a name, select your workspace</li>
          <li>Copy the "Internal Integration Token"</li>
          <li>Share your pages/databases with the integration</li>
        </ol>
        <button
          onClick={() =>
            chrome.tabs.create({ url: 'https://www.notion.so/my-integrations' })
          }
          className="flex items-center gap-1 text-xs text-accent hover:underline mt-1"
        >
          <ExternalLink className="h-3 w-3" />
          Open Notion Integrations
        </button>
      </div>
    </div>
  );
}
