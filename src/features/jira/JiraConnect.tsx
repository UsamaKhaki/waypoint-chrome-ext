import { useState } from 'react';
import { Key, ExternalLink, Shield, Globe, Mail } from 'lucide-react';
import { JiraIcon } from '@/components/icons/ConnectorIcons';
import { useJiraAuthStore } from '@/store/jiraAuth.store';
import { Spinner } from '@/components/ui/Spinner';

export function JiraConnect() {
  const { connect, isLoading, error } = useJiraAuthStore();
  const [domain, setDomain] = useState('');
  const [email, setEmail] = useState('');
  const [apiToken, setApiToken] = useState('');

  const handleConnect = () => {
    const d = domain.trim().replace(/\.atlassian\.net.*$/, '').replace(/^https?:\/\//, '');
    if (d && email.trim() && apiToken.trim()) {
      connect(d, email.trim(), apiToken.trim());
    }
  };

  const canSubmit = domain.trim() && email.trim() && apiToken.trim();

  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] max-w-md mx-auto text-center space-y-6 px-4">
      {/* Icon */}
      <div className="p-5 rounded-3xl bg-surface-elevated border border-border-subtle">
        <JiraIcon className="h-12 w-12 text-primary" />
      </div>

      {/* Text */}
      <div className="space-y-2">
        <h2 className="text-xl font-semibold text-primary">Connect Jira</h2>
        <p className="text-sm text-muted leading-relaxed">
          Connect your Jira Cloud account to see assigned issues, in-progress work, and recently
          updated tickets — all in one place.
        </p>
      </div>

      {/* Inputs */}
      <div className="w-full space-y-3">
        <div className="relative">
          <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" />
          <input
            type="text"
            placeholder="your-company (from your-company.atlassian.net)"
            value={domain}
            onChange={(e) => setDomain(e.target.value)}
            className="w-full rounded-xl bg-surface border border-border-subtle text-primary text-sm pl-10 pr-4 py-3 outline-none focus:border-accent transition-colors"
            autoFocus
          />
        </div>

        <div className="relative">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" />
          <input
            type="email"
            placeholder="your-email@company.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-xl bg-surface border border-border-subtle text-primary text-sm pl-10 pr-4 py-3 outline-none focus:border-accent transition-colors"
          />
        </div>

        <div className="relative">
          <Key className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" />
          <input
            type="password"
            placeholder="Paste your API token"
            value={apiToken}
            onChange={(e) => setApiToken(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleConnect()}
            className="w-full rounded-xl bg-surface border border-border-subtle text-primary text-sm pl-10 pr-4 py-3 outline-none focus:border-accent transition-colors"
          />
        </div>

        {error && <p className="text-xs text-destructive text-left">{error}</p>}

        <button
          onClick={handleConnect}
          disabled={!canSubmit || isLoading}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-accent text-white text-sm font-medium hover:bg-accent-hover transition-colors disabled:opacity-50"
        >
          {isLoading ? <Spinner size="sm" /> : <JiraIcon className="h-4 w-4" />}
          {isLoading ? 'Connecting…' : 'Connect Jira'}
        </button>
      </div>

      {/* Help */}
      <div className="w-full p-3 rounded-xl bg-surface border border-border-subtle text-left space-y-2">
        <div className="flex items-center gap-2 text-xs font-medium text-secondary">
          <Shield className="h-3.5 w-3.5 text-success" />
          How to create an API token
        </div>
        <ol className="text-xs text-muted space-y-1 list-decimal list-inside">
          <li>Go to Atlassian Account → Security</li>
          <li>Under API tokens, click Create API token</li>
          <li>Give it a label (e.g. Waypoint) and copy the token</li>
          <li>Paste the token above along with your domain and email</li>
        </ol>
        <button
          onClick={() =>
            chrome.tabs.create({
              url: 'https://id.atlassian.com/manage-profile/security/api-tokens',
            })
          }
          className="flex items-center gap-1 text-xs text-accent hover:underline mt-1"
        >
          <ExternalLink className="h-3 w-3" />
          Create API token on Atlassian
        </button>
      </div>
    </div>
  );
}
