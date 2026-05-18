import { useState } from 'react';
import { Key, ExternalLink, Shield } from 'lucide-react';
import { SlackIcon } from '@/components/icons/ConnectorIcons';
import { useSlackAuthStore } from '@/store/slackAuth.store';
import { Spinner } from '@/components/ui/Spinner';

export function SlackConnect() {
  const { connect, isLoading, error } = useSlackAuthStore();
  const [token, setToken] = useState('');

  const handleConnect = () => {
    const t = token.trim();
    if (t) {
      connect(t);
    }
  };

  const canSubmit = token.trim().length > 0;

  return (
    <div data-testid="slack-connect" className="flex flex-col items-center justify-center min-h-[400px] max-w-md mx-auto text-center space-y-6 px-4">
      {/* Icon */}
      <div className="p-5 rounded-3xl bg-surface-elevated border border-border-subtle">
        <SlackIcon className="h-12 w-12" />
      </div>

      {/* Text */}
      <div className="space-y-2">
        <h2 className="text-xl font-semibold text-primary">Connect Slack</h2>
        <p className="text-sm text-muted leading-relaxed">
          Connect your Slack workspace to see direct messages, mentions, and channels — all in one
          place.
        </p>
      </div>

      {/* Input */}
      <div className="w-full space-y-3">
        <div className="relative">
          <Key className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" />
          <input
            data-testid="slack-input"
            type="password"
            placeholder="xoxb-your-bot-token"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleConnect()}
            className="w-full rounded-xl bg-surface border border-border-subtle text-primary text-sm pl-10 pr-4 py-3 outline-none focus:border-accent transition-colors"
            autoFocus
          />
        </div>

        {error && <p data-testid="slack-error" className="text-xs text-destructive text-left">{error}</p>}

        <button
          data-testid="slack-connect-btn"
          onClick={handleConnect}
          disabled={!canSubmit || isLoading}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-accent text-white text-sm font-medium hover:bg-accent-hover transition-colors disabled:opacity-50"
        >
          {isLoading ? <Spinner size="sm" /> : <SlackIcon className="h-4 w-4" />}
          {isLoading ? 'Connecting…' : 'Connect Slack'}
        </button>
      </div>

      {/* Help */}
      <div className="w-full p-3 rounded-xl bg-surface border border-border-subtle text-left space-y-2">
        <div className="flex items-center gap-2 text-xs font-medium text-secondary">
          <Shield className="h-3.5 w-3.5 text-success" />
          How to get a Bot User OAuth Token
        </div>
        <ol className="text-xs text-muted space-y-1 list-decimal list-inside">
          <li>Go to api.slack.com/apps and create a new app</li>
          <li>Choose "From scratch" and select your workspace</li>
          <li>
            Under "OAuth &amp; Permissions", add Bot Token Scopes:{' '}
            <code className="text-accent">channels:read</code>,{' '}
            <code className="text-accent">im:read</code>,{' '}
            <code className="text-accent">users:read</code>
          </li>
          <li>Install the app to your workspace and copy the Bot User OAuth Token</li>
        </ol>
        <button
          onClick={() =>
            chrome.tabs.create({
              url: 'https://api.slack.com/apps',
            })
          }
          className="flex items-center gap-1 text-xs text-accent hover:underline mt-1"
        >
          <ExternalLink className="h-3 w-3" />
          Open Slack API Apps
        </button>
      </div>
    </div>
  );
}
