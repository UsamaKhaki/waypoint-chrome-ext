import { useState } from 'react';
import { Key, ExternalLink, Shield, Kanban } from 'lucide-react';
import { useLinearAuthStore } from '@/store/linearAuth.store';
import { Spinner } from '@/components/ui/Spinner';

export function LinearConnect() {
  const { connect, isLoading, error } = useLinearAuthStore();
  const [apiKey, setApiKey] = useState('');

  const handleConnect = () => {
    if (apiKey.trim()) connect(apiKey.trim());
  };

  return (
    <div data-testid="linear-connect" className="flex flex-col items-center justify-center min-h-[400px] max-w-md mx-auto text-center space-y-6 px-4">
      <div className="p-5 rounded-3xl bg-surface-elevated border border-border-subtle">
        <Kanban className="h-12 w-12 text-primary" />
      </div>

      <div className="space-y-2">
        <h2 className="text-xl font-semibold text-primary">Connect Linear</h2>
        <p className="text-sm text-muted leading-relaxed">
          Connect your Linear account to see assigned issues, in-progress work, and team activity —
          all in one place.
        </p>
      </div>

      <div className="w-full space-y-3">
        <div className="relative">
          <Key className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" />
          <input
            data-testid="linear-input"
            type="password"
            placeholder="Paste your Linear API key"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleConnect()}
            className="w-full rounded-xl bg-surface border border-border-subtle text-primary text-sm pl-10 pr-4 py-3 outline-none focus:border-accent transition-colors"
            autoFocus
          />
        </div>

        {error && <p data-testid="linear-error" className="text-xs text-destructive text-left">{error}</p>}

        <button
          data-testid="linear-connect-btn"
          onClick={handleConnect}
          disabled={!apiKey.trim() || isLoading}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-accent text-white text-sm font-medium hover:bg-accent-hover transition-colors disabled:opacity-50"
        >
          {isLoading ? <Spinner size="sm" /> : <Kanban className="h-4 w-4" />}
          {isLoading ? 'Connecting…' : 'Connect Linear'}
        </button>
      </div>

      <div className="w-full p-3 rounded-xl bg-surface border border-border-subtle text-left space-y-2">
        <div className="flex items-center gap-2 text-xs font-medium text-secondary">
          <Shield className="h-3.5 w-3.5 text-success" />
          How to create an API key
        </div>
        <ol className="text-xs text-muted space-y-1 list-decimal list-inside">
          <li>Go to Linear → Settings → Account</li>
          <li>Click on the &quot;API&quot; section in the sidebar</li>
          <li>Create a new Personal API key</li>
          <li>Copy and paste the key above</li>
        </ol>
        <button
          onClick={() =>
            chrome.tabs.create({ url: 'https://linear.app/settings/api' })
          }
          className="flex items-center gap-1 text-xs text-accent hover:underline mt-1"
        >
          <ExternalLink className="h-3 w-3" />
          Open Linear API settings
        </button>
      </div>
    </div>
  );
}
