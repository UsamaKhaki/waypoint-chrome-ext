import { Shield, ExternalLink, AlertTriangle } from 'lucide-react';
import { GoogleCalendarIcon } from '@/components/icons/ConnectorIcons';
import { useGoogleCalendarAuthStore } from '@/store/googleCalendarAuth.store';
import { Spinner } from '@/components/ui/Spinner';

const hasIdentityApi =
  typeof chrome !== 'undefined' && typeof chrome?.identity?.getAuthToken === 'function';

export function GoogleCalendarConnect() {
  const { connect, isLoading, error } = useGoogleCalendarAuthStore();

  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] max-w-md mx-auto text-center space-y-6 px-4">
      {/* Icon */}
      <div className="p-5 rounded-3xl bg-surface-elevated border border-border-subtle">
        <GoogleCalendarIcon className="h-12 w-12 text-primary" />
      </div>

      {/* Text */}
      <div className="space-y-2">
        <h2 className="text-xl font-semibold text-primary">Connect Google Calendar</h2>
        <p className="text-sm text-muted leading-relaxed">
          See today's meetings and upcoming events directly in Waypoint.
        </p>
      </div>

      {/* Setup required warning */}
      {!hasIdentityApi && (
        <div className="w-full p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-left space-y-2">
          <div className="flex items-center gap-2 text-xs font-medium text-amber-400">
            <AlertTriangle className="h-3.5 w-3.5" />
            One-time setup required
          </div>
          <p className="text-xs text-muted leading-relaxed">
            Google Calendar uses Chrome's identity API which requires a Google OAuth client ID in the
            manifest. Add your client ID to{' '}
            <code className="text-accent">public/manifest.json</code> under{' '}
            <code className="text-accent">oauth2.client_id</code>.
          </p>
          <button
            onClick={() =>
              chrome?.tabs?.create({ url: 'https://console.cloud.google.com/apis/credentials' })
            }
            className="flex items-center gap-1 text-xs text-accent hover:underline"
          >
            <ExternalLink className="h-3 w-3" />
            Create credentials on Google Cloud Console
          </button>
        </div>
      )}

      {/* Action */}
      <div className="w-full space-y-3">
        {error && <p className="text-xs text-destructive text-left">{error}</p>}

        <button
          onClick={connect}
          disabled={isLoading || !hasIdentityApi}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-accent text-white text-sm font-medium hover:bg-accent-hover transition-colors disabled:opacity-50"
        >
          {isLoading ? <Spinner size="sm" /> : <GoogleCalendarIcon className="h-4 w-4" />}
          {isLoading ? 'Connecting…' : 'Connect with Google'}
        </button>
      </div>

      {/* Privacy note */}
      <div className="w-full p-3 rounded-xl bg-surface border border-border-subtle text-left">
        <div className="flex items-center gap-2 text-xs font-medium text-secondary">
          <Shield className="h-3.5 w-3.5 text-success" />
          Secure OAuth via Chrome identity
        </div>
        <ol className="text-xs text-muted space-y-1 list-decimal list-inside mt-2">
          <li>Create a project in Google Cloud Console</li>
          <li>Enable the Google Calendar API</li>
          <li>Create an OAuth 2.0 client ID (Chrome extension type)</li>
          <li>
            Paste the client ID into <code className="text-accent">manifest.json → oauth2.client_id</code>
          </li>
        </ol>
      </div>
    </div>
  );
}
