import { useState } from 'react';
import { GitBranch, Key, ExternalLink, Shield } from 'lucide-react';
import { useGitHubAuthStore } from '@/store/githubAuth.store';
import { Spinner } from '@/components/ui/Spinner';

export function GitHubConnect() {
  const { connect, isLoading, error } = useGitHubAuthStore();
  const [token, setToken] = useState('');

  const handleConnect = () => {
    if (token.trim()) connect(token.trim());
  };

  return (
    <div data-testid="github-connect" className="flex flex-col items-center justify-center min-h-[400px] max-w-md mx-auto text-center space-y-6 px-4">
      {/* Icon */}
      <div className="p-5 rounded-3xl bg-surface-elevated border border-border-subtle">
        <GitBranch className="h-12 w-12 text-primary" />
      </div>

      {/* Text */}
      <div className="space-y-2">
        <h2 className="text-xl font-semibold text-primary">Connect GitHub</h2>
        <p className="text-sm text-muted leading-relaxed">
          Connect your GitHub account to see your open PRs, assigned issues, and review requests —
          all in one place.
        </p>
      </div>

      {/* Token input */}
      <div className="w-full space-y-3">
        <div className="relative">
          <Key className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" />
          <input
            data-testid="github-token-input"
            type="password"
            placeholder="Paste your Personal Access Token"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleConnect()}
            className="w-full rounded-xl bg-surface border border-border-subtle text-primary text-sm pl-10 pr-4 py-3 outline-none focus:border-accent transition-colors"
            autoFocus
          />
        </div>

        {error && <p data-testid="github-connect-error" className="text-xs text-destructive text-left">{error}</p>}

        <button
          data-testid="github-connect-btn"
          onClick={handleConnect}
          disabled={!token.trim() || isLoading}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-accent text-white text-sm font-medium hover:bg-accent-hover transition-colors disabled:opacity-50"
        >
          {isLoading ? <Spinner size="sm" /> : <GitBranch className="h-4 w-4" />}
          {isLoading ? 'Connecting…' : 'Connect GitHub'}
        </button>
      </div>

      {/* Help */}
      <div className="w-full p-3 rounded-xl bg-surface border border-border-subtle text-left space-y-2">
        <div className="flex items-center gap-2 text-xs font-medium text-secondary">
          <Shield className="h-3.5 w-3.5 text-success" />
          How to create a token
        </div>
        <ol className="text-xs text-muted space-y-1 list-decimal list-inside">
          <li>Go to GitHub → Settings → Developer settings</li>
          <li>Personal access tokens → Tokens (classic)</li>
          <li>
            Generate new token with scopes: <code className="text-accent">repo</code>,{' '}
            <code className="text-accent">notifications</code>,{' '}
            <code className="text-accent">read:user</code>
          </li>
          <li>Copy and paste the token above</li>
        </ol>
        <button
          onClick={() =>
            chrome.tabs.create({
              url: 'https://github.com/settings/tokens/new?scopes=repo,notifications,read:user&description=Waypoint',
            })
          }
          className="flex items-center gap-1 text-xs text-accent hover:underline mt-1"
        >
          <ExternalLink className="h-3 w-3" />
          Create token on GitHub
        </button>
      </div>
    </div>
  );
}
