import { useState, useRef, useEffect } from 'react';
import {
  Download,
  Upload,
  RotateCcw,
  Check,
  ExternalLink,
  Cloud,
  Lock,
  Bell,
  Bug,
  CreditCard,
  User,
  Palette,
  Database,
  Info,
  ChevronRight,
  LogOut,
  Plug,
} from 'lucide-react';
import { Avatar } from '@/components/ui/Avatar';
import { GitHubIcon, LinearIcon, JiraIcon, SlackIcon, NotionIcon, GoogleCalendarIcon } from '@/components/icons/ConnectorIcons';
import { useGoogleProfileStore } from '@/store/googleProfile.store';
import { useGitHubAuthStore } from '@/store/githubAuth.store';
import { useLinearAuthStore } from '@/store/linearAuth.store';
import { useJiraAuthStore } from '@/store/jiraAuth.store';
import { useSlackAuthStore } from '@/store/slackAuth.store';
import { useNotionAuthStore } from '@/store/notionAuth.store';
import { useGoogleCalendarAuthStore } from '@/store/googleCalendarAuth.store';
import { motion, AnimatePresence } from 'framer-motion';
import { BugReportModal } from './BugReportModal';
import { useSettingsStore } from '@/store/settings.store';
import { useSubscriptionStore } from '@/store/subscription.store';
import { PRO_FEATURES } from '@/constants/subscription';
import { storage } from '@/services/storage';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { cn } from '@/lib/utils';

// ── Constants ─────────────────────────────────────────────────────────────────

const ACCENT_COLORS = [
  { label: 'Indigo', value: '#6366f1' },
  { label: 'Violet', value: '#8b5cf6' },
  { label: 'Blue', value: '#3b82f6' },
  { label: 'Cyan', value: '#06b6d4' },
  { label: 'Green', value: '#10b981' },
  { label: 'Orange', value: '#f97316' },
  { label: 'Rose', value: '#f43f5e' },
];

const BG_PRESETS = [
  { label: 'Midnight', value: '#070a13' },
  { label: 'Obsidian', value: '#0a0a0a' },
  { label: 'Navy', value: '#050d1a' },
  { label: 'Forest', value: '#060f0a' },
  { label: 'Aubergine', value: '#0d0614' },
  { label: 'Slate', value: '#080c12' },
  { label: 'Espresso', value: '#0f0b09' },
];

type SectionId =
  | 'subscription'
  | 'profile'
  | 'appearance'
  | 'notifications'
  | 'connectors'
  | 'data'
  | 'about';

const NAV_SECTIONS: { id: SectionId; label: string; icon: React.ElementType; badge?: string }[] = [
  { id: 'subscription', label: 'Subscription', icon: CreditCard },
  { id: 'profile', label: 'Profile', icon: User },
  { id: 'appearance', label: 'Appearance', icon: Palette },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'connectors', label: 'Connectors', icon: Plug },
  { id: 'data', label: 'Data', icon: Database },
  { id: 'about', label: 'About', icon: Info },
];

// ── Small reusable pieces ────────────────────────────────────────────────────

function Toggle({ on, onToggle }: { on: boolean; onToggle: () => void }) {
  return (
    <button
      onClick={onToggle}
      className={cn(
        'relative inline-flex h-6 w-11 flex-shrink-0 items-center rounded-full transition-colors duration-200',
        on ? 'bg-accent' : 'bg-surface-elevated border border-border'
      )}
    >
      <span
        className={cn(
          'inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform duration-200',
          on ? 'translate-x-6' : 'translate-x-1'
        )}
      />
    </button>
  );
}

function SettingRow({
  label,
  description,
  children,
  locked,
}: {
  label: string;
  description?: string;
  children: React.ReactNode;
  locked?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-6 px-4 py-4 border-b border-border-subtle last:border-0">
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium text-primary">{label}</p>
          {locked && (
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-accent/15 text-accent">
              <Lock className="h-2.5 w-2.5" /> Pro
            </span>
          )}
        </div>
        {description && <p className="text-xs text-muted mt-0.5 leading-relaxed">{description}</p>}
      </div>
      <div className="flex-shrink-0">{children}</div>
    </div>
  );
}

function SectionHeader({ title, description }: { title: string; description: string }) {
  return (
    <div className="mb-6 pb-4 border-b border-border-subtle">
      <h2 className="text-base font-semibold text-primary">{title}</h2>
      <p className="text-sm text-muted mt-0.5">{description}</p>
    </div>
  );
}

// ── Section content components ────────────────────────────────────────────────

function SubscriptionSection() {
  const plan = useSubscriptionStore((s) => s.plan);
  const openUpgradeModal = useSubscriptionStore((s) => s.openUpgradeModal);
  const deactivate = useSubscriptionStore((s) => s.deactivate);
  const [deactivateKey, setDeactivateKey] = useState('');
  const isPro = plan === 'pro' || plan === 'team';

  return (
    <>
      <SectionHeader title="Subscription" description="Manage your Waypoint plan and license." />

      {/* Plan badge */}
      <div className="flex items-center justify-between p-4 rounded-xl bg-surface border border-border-subtle mb-4">
        <div className="flex items-center gap-3">
          <div
            className={cn(
              'h-9 w-9 rounded-lg flex items-center justify-center',
              isPro ? 'bg-accent/15' : 'bg-surface-elevated'
            )}
          >
            <CreditCard className={cn('h-4 w-4', isPro ? 'text-accent' : 'text-muted')} />
          </div>
          <div>
            <p className="text-sm font-semibold text-primary capitalize">{plan} plan</p>
            <p className="text-xs text-muted">
              {plan === 'free' && 'Limited to 20 snippets · local storage only'}
              {plan === 'pro' && 'Unlimited snippets · cloud sync · all Pro features'}
              {plan === 'team' && 'Everything in Pro · shared team library'}
            </p>
          </div>
        </div>
        {plan === 'free' && <Badge variant="secondary">Free</Badge>}
        {plan === 'pro' && <Badge variant="success">Pro</Badge>}
        {plan === 'team' && <Badge variant="default">Team</Badge>}
      </div>

      {!isPro ? (
        <div className="rounded-xl border border-accent/25 bg-accent/5 p-5 space-y-3">
          <p className="text-sm font-semibold text-primary">Upgrade to Pro — $5/mo</p>
          <ul className="space-y-1.5 text-xs text-muted">
            {[
              'Unlimited snippets',
              'Cloud sync across devices',
              'Desktop notifications (PR & CI)',
              'Global ⌘K on any webpage',
              'Right-click → Save snippet',
              'Unlimited tab sessions',
            ].map((f) => (
              <li key={f} className="flex items-center gap-2">
                <Check className="h-3 w-3 text-accent flex-shrink-0" />
                {f}
              </li>
            ))}
          </ul>
          <Button onClick={() => openUpgradeModal()} className="mt-1">
            Upgrade to Pro →
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm text-success">
            <Check className="h-4 w-4" />
            {plan === 'team' ? 'Team plan active' : 'Pro plan active'}
          </div>
          <div className="space-y-2 pt-2 border-t border-border-subtle">
            <p className="text-xs text-muted font-medium">Deactivate license</p>
            <div className="flex gap-2">
              <Input
                placeholder="Type DEACTIVATE to confirm"
                value={deactivateKey}
                onChange={(e) => setDeactivateKey(e.target.value)}
                className="text-xs"
              />
              <Button
                size="sm"
                variant="destructive"
                disabled={deactivateKey !== 'DEACTIVATE'}
                onClick={() => {
                  deactivate();
                  setDeactivateKey('');
                }}
                className="flex-shrink-0"
              >
                Deactivate
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function ProfileSection() {
  const { settings, update } = useSettingsStore();
  const googleProfile = useGoogleProfileStore((s) => s.profile);
  const googleSignIn = useGoogleProfileStore((s) => s.signIn);
  const googleSignOut = useGoogleProfileStore((s) => s.signOut);
  const googleLoading = useGoogleProfileStore((s) => s.isLoading);
  const googleError = useGoogleProfileStore((s) => s.error);
  const isExtension = typeof chrome !== 'undefined' && !!chrome.identity;
  const githubUser = useGitHubAuthStore((s) => s.user);
  const githubConnected = useGitHubAuthStore((s) => s.isConnected);

  const avatarSrc = googleProfile?.picture ?? githubUser?.avatar_url ?? null;
  const displayName = googleProfile?.name ?? settings.userName ?? '';

  return (
    <>
      <SectionHeader title="Profile" description="Your identity and connected accounts." />
      <div className="space-y-5">
        {/* Avatar preview */}
        <div className="flex items-center gap-4 p-4 rounded-xl bg-surface border border-border-subtle">
          <Avatar
            src={avatarSrc}
            name={displayName || 'W'}
            size="lg"
            className="ring-2 ring-border-subtle"
          />
          <div>
            <p className="text-sm font-semibold text-primary">{displayName || 'No name set'}</p>
            <p className="text-xs text-muted mt-0.5">
              {googleProfile?.email ??
                (githubUser ? `@${githubUser.login}` : 'Add a connected account below')}
            </p>
          </div>
        </div>

        {/* Display name */}
        <div>
          <label className="text-xs font-medium text-muted block mb-2">Display name</label>
          <input
            type="text"
            placeholder="e.g. Usama"
            value={settings.userName ?? ''}
            onChange={(e) => update({ userName: e.target.value })}
            className="w-full max-w-sm rounded-xl bg-surface border border-border-subtle text-primary text-sm px-3 py-2.5 outline-none focus:border-accent transition-colors placeholder:text-muted"
          />
        </div>

        {/* Connected accounts */}
        <div>
          <p className="text-xs font-medium text-muted mb-3 uppercase tracking-wider">
            Connected Accounts
          </p>
          <div className="rounded-xl border border-border-subtle overflow-hidden">
            {/* Google */}
            <div className="flex items-center gap-3 px-4 py-3 border-b border-border-subtle">
              <div className="h-8 w-8 rounded-lg bg-surface-elevated flex items-center justify-center flex-shrink-0">
                <svg viewBox="0 0 24 24" className="h-4 w-4" xmlns="http://www.w3.org/2000/svg">
                  <path
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    fill="#4285F4"
                  />
                  <path
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    fill="#34A853"
                  />
                  <path
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    fill="#FBBC05"
                  />
                  <path
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    fill="#EA4335"
                  />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-primary">Google</p>
                {googleProfile ? (
                  <p className="text-xs text-muted truncate">{googleProfile.email}</p>
                ) : (
                  <p className="text-xs text-muted">Not connected</p>
                )}
              </div>
              {googleProfile ? (
                <button
                  onClick={googleSignOut}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs text-muted hover:text-destructive hover:bg-destructive/10 transition-all"
                >
                  <LogOut className="h-3.5 w-3.5" /> Sign out
                </button>
              ) : isExtension ? (
                <Button size="sm" variant="outline" onClick={googleSignIn} disabled={googleLoading}>
                  {googleLoading ? 'Connecting…' : 'Connect'}
                </Button>
              ) : (
                <span className="text-xs text-muted italic">Extension only</span>
              )}
            </div>

            {/* GitHub */}
            <div className="flex items-center gap-3 px-4 py-3">
              <div className="h-8 w-8 rounded-lg bg-surface-elevated flex items-center justify-center flex-shrink-0">
                <svg
                  viewBox="0 0 24 24"
                  className="h-4 w-4 text-primary fill-current"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-primary">GitHub</p>
                {githubConnected && githubUser ? (
                  <p className="text-xs text-muted truncate">@{githubUser.login}</p>
                ) : (
                  <p className="text-xs text-muted">Not connected</p>
                )}
              </div>
              {githubConnected ? (
                <span className="flex items-center gap-1 text-xs text-success">
                  <Check className="h-3.5 w-3.5" /> Connected
                </span>
              ) : (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    /* navigate to github section */
                  }}
                >
                  Connect
                </Button>
              )}
            </div>
          </div>
          {googleError && isExtension && (
            <p className="text-xs text-destructive mt-2">{googleError}</p>
          )}
        </div>
      </div>
    </>
  );
}

function AppearanceSection() {
  const { settings, update } = useSettingsStore();
  const plan = useSubscriptionStore((s) => s.plan);
  const openUpgradeModal = useSubscriptionStore((s) => s.openUpgradeModal);
  const [cloudSync, setCloudSync] = useState(false);
  const isPro = plan === 'pro' || plan === 'team';

  return (
    <>
      <SectionHeader title="Appearance" description="Customise how Waypoint looks and feels." />

      {/* Accent color */}
      <div className="mb-6">
        <p className="text-xs font-medium text-muted mb-3 uppercase tracking-wider">Accent Color</p>
        <div className="flex gap-2.5 flex-wrap">
          {ACCENT_COLORS.map((color) => (
            <button
              key={color.value}
              onClick={() => update({ accentColor: color.value })}
              title={color.label}
              className="relative h-8 w-8 rounded-full ring-offset-2 ring-offset-background transition-all hover:scale-110 active:scale-95"
              style={{
                backgroundColor: color.value,
                boxShadow:
                  settings.accentColor === color.value ? `0 0 0 2px ${color.value}` : 'none',
                outline:
                  settings.accentColor === color.value
                    ? `2px solid hsl(var(--background))`
                    : 'none',
                outlineOffset: '2px',
              }}
            >
              {settings.accentColor === color.value && (
                <Check className="h-4 w-4 text-white absolute inset-0 m-auto drop-shadow" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Background */}
      <div className="mb-6">
        <p className="text-xs font-medium text-muted mb-3 uppercase tracking-wider">Background</p>
        <div className="flex gap-2.5 flex-wrap items-center">
          {BG_PRESETS.map((preset) => {
            const isActive = (settings.backgroundColor ?? '#070a13') === preset.value;
            return (
              <button
                key={preset.value}
                onClick={() => update({ backgroundColor: preset.value })}
                title={preset.label}
                className="group relative h-8 w-8 rounded-full border-2 transition-all hover:scale-110 active:scale-95"
                style={{
                  backgroundColor: preset.value,
                  borderColor: isActive ? 'hsl(var(--accent))' : 'hsl(var(--border))',
                }}
              >
                {isActive && <Check className="h-3.5 w-3.5 text-white absolute inset-0 m-auto" />}
                <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 rounded-md bg-surface-elevated text-[10px] text-primary whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                  {preset.label}
                </span>
              </button>
            );
          })}
          <label
            className="relative h-8 w-8 rounded-full border-2 border-border overflow-hidden cursor-pointer hover:scale-110 transition-transform"
            title="Custom color"
            style={{ background: 'conic-gradient(red,yellow,lime,cyan,blue,magenta,red)' }}
          >
            <input
              type="color"
              value={settings.backgroundColor ?? '#070a13'}
              onChange={(e) => update({ backgroundColor: e.target.value })}
              className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
            />
          </label>
        </div>
      </div>

      {/* Font size */}
      <div className="mb-2">
        <p className="text-xs font-medium text-muted mb-3 uppercase tracking-wider">Font Size</p>
        <div className="flex gap-1 bg-surface-elevated rounded-xl p-1 w-fit">
          {(['sm', 'md', 'lg'] as const).map((size) => (
            <button
              key={size}
              onClick={() => update({ fontSize: size })}
              className={cn(
                'px-5 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150',
                settings.fontSize === size
                  ? 'bg-surface text-primary shadow-sm'
                  : 'text-muted hover:text-secondary'
              )}
            >
              {size === 'sm' ? 'Small' : size === 'md' ? 'Medium' : 'Large'}
            </button>
          ))}
        </div>
      </div>

      {/* Toggles */}
      <div className="mt-4 rounded-xl border border-border-subtle overflow-hidden">
        <SettingRow label="Compact Mode" description="Reduce spacing and padding throughout the UI">
          <Toggle
            on={!!settings.compactMode}
            onToggle={() => update({ compactMode: !settings.compactMode })}
          />
        </SettingRow>
        <SettingRow
          label="Show Clock in Sidebar"
          description="Display the current time at the bottom of the sidebar"
        >
          <Toggle
            on={!!settings.showClock}
            onToggle={() => update({ showClock: !settings.showClock })}
          />
        </SettingRow>
        <SettingRow
          label="Cloud Sync"
          description="Sync snippets and settings across all your Chrome devices"
          locked={!isPro}
        >
          <Toggle
            on={isPro && cloudSync}
            onToggle={() => {
              if (!isPro) {
                openUpgradeModal(PRO_FEATURES.CLOUD_SYNC);
                return;
              }
              setCloudSync((v) => !v);
            }}
          />
        </SettingRow>
      </div>

      <div className="mt-4 flex items-center justify-between p-4 rounded-xl bg-surface border border-border-subtle">
        <div>
          <p className="text-sm font-medium text-primary">Chrome Appearance</p>
          <p className="text-xs text-muted mt-0.5">Change Chrome theme, fonts, and page zoom</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="gap-2 flex-shrink-0"
          onClick={() => chrome.tabs.create({ url: 'chrome://settings/appearance' })}
        >
          <ExternalLink className="h-3.5 w-3.5" /> Open
        </Button>
      </div>
    </>
  );
}

function NotificationsSection() {
  const plan = useSubscriptionStore((s) => s.plan);
  const isPro = plan === 'pro' || plan === 'team';
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [pollDone, setPollDone] = useState(false);

  useEffect(() => {
    if (typeof chrome === 'undefined' || !chrome.storage) return;
    chrome.storage.local.get('notificationsEnabled', (res) => {
      setNotificationsEnabled(res.notificationsEnabled !== false);
    });
  }, []);

  const toggle = (val: boolean) => {
    setNotificationsEnabled(val);
    if (typeof chrome !== 'undefined' && chrome.storage) {
      chrome.storage.local.set({ notificationsEnabled: val });
    }
  };

  const handlePollNow = () => {
    if (typeof chrome !== 'undefined' && chrome.runtime) {
      chrome.runtime.sendMessage({ type: 'POLL_NOW' }, () => {
        setPollDone(true);
        setTimeout(() => setPollDone(false), 2000);
      });
    }
  };

  return (
    <>
      <SectionHeader
        title="Notifications"
        description="Configure GitHub PR and CI/CD desktop alerts."
      />

      {!isPro ? (
        <div className="rounded-xl border border-border-subtle bg-surface p-5 flex items-start gap-4">
          <div className="h-10 w-10 rounded-lg bg-accent/10 flex items-center justify-center flex-shrink-0">
            <Lock className="h-5 w-5 text-accent" />
          </div>
          <div>
            <p className="text-sm font-semibold text-primary mb-1">Pro feature</p>
            <p className="text-sm text-muted mb-3">
              Get native desktop notifications when CI builds fail or PRs need your review — without
              even opening Waypoint.
            </p>
            <Button size="sm" onClick={() => useSubscriptionStore.getState().openUpgradeModal()}>
              Upgrade to Pro →
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="rounded-xl border border-border-subtle overflow-hidden">
            <SettingRow
              label="PR review reminders"
              description="Notify when pull requests are waiting for your review · polls every 15 min"
            >
              <Toggle on={notificationsEnabled} onToggle={() => toggle(!notificationsEnabled)} />
            </SettingRow>
            <SettingRow
              label="CI failure alerts"
              description="Notify when a build fails on your tracked repositories"
            >
              <Toggle on={notificationsEnabled} onToggle={() => toggle(!notificationsEnabled)} />
            </SettingRow>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" onClick={handlePollNow} className="gap-2">
              {pollDone ? (
                <>
                  <Check className="h-3.5 w-3.5 text-success" /> Triggered!
                </>
              ) : (
                <>
                  <Bell className="h-3.5 w-3.5" /> Send test notification
                </>
              )}
            </Button>
            <p className="text-xs text-muted">Manually trigger a GitHub poll right now.</p>
          </div>
        </div>
      )}
    </>
  );
}

function DataSection() {
  const { reset } = useSettingsStore();
  const [exportDone, setExportDone] = useState(false);
  const [importError, setImportError] = useState('');
  const [confirmReset, setConfirmReset] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExport = async () => {
    const json = await storage.exportAll();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `waypoint-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setExportDone(true);
    setTimeout(() => setExportDone(false), 2000);
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      await storage.importAll(text);
      setImportError('');
      window.location.reload();
    } catch {
      setImportError('Invalid file. Please use a Waypoint backup JSON.');
    }
  };

  return (
    <>
      <SectionHeader
        title="Data Management"
        description="Export, import, or reset your Waypoint data."
      />
      <div className="space-y-4">
        {/* Export/Import */}
        <div className="rounded-xl border border-border-subtle overflow-hidden">
          <div className="p-4 flex items-center justify-between border-b border-border-subtle">
            <div>
              <p className="text-sm font-medium text-primary">Export backup</p>
              <p className="text-xs text-muted mt-0.5">Download all your data as a JSON file</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleExport}
              className="gap-2 flex-shrink-0"
            >
              {exportDone ? (
                <Check className="h-3.5 w-3.5 text-success" />
              ) : (
                <Download className="h-3.5 w-3.5" />
              )}
              {exportDone ? 'Exported!' : 'Export'}
            </Button>
          </div>
          <div className="p-4 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-primary">Import backup</p>
              <p className="text-xs text-muted mt-0.5">
                Restore from a previously exported JSON file
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              className="gap-2 flex-shrink-0"
            >
              <Upload className="h-3.5 w-3.5" /> Import
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              className="hidden"
              onChange={handleImport}
            />
          </div>
        </div>
        {importError && <p className="text-xs text-destructive">{importError}</p>}

        {/* Reset */}
        <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-4">
          <p className="text-sm font-semibold text-primary mb-1">Danger Zone</p>
          <p className="text-xs text-muted mb-3">
            Permanently reset all settings to their defaults. Your bookmarks and snippets are not
            affected.
          </p>
          <AnimatePresence mode="wait">
            {confirmReset ? (
              <motion.div
                key="confirm"
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                className="flex items-center gap-3"
              >
                <p className="text-xs text-destructive flex-1">
                  This cannot be undone. Are you sure?
                </p>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => {
                    reset();
                    setConfirmReset(false);
                  }}
                >
                  Yes, Reset
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setConfirmReset(false)}>
                  Cancel
                </Button>
              </motion.div>
            ) : (
              <motion.div key="button" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setConfirmReset(true)}
                  className="gap-2 border-destructive/30 text-destructive hover:bg-destructive/10"
                >
                  <RotateCcw className="h-3.5 w-3.5" /> Reset All Settings
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </>
  );
}

function AboutSection({ onBugReport }: { onBugReport: () => void }) {
  const techStack = ['React 18', 'TypeScript', 'Vite', 'TailwindCSS', 'Zustand', 'Framer Motion'];
  return (
    <>
      <SectionHeader title="About Waypoint" description="Version info, tech stack, and support." />
      <div className="space-y-4">
        {/* Version card */}
        <div className="rounded-xl border border-border-subtle bg-surface p-4 flex items-center gap-4">
          <div className="h-12 w-12 rounded-xl bg-accent/15 flex items-center justify-center flex-shrink-0">
            <span className="text-accent font-black text-lg">W</span>
          </div>
          <div>
            <p className="text-sm font-semibold text-primary">Waypoint</p>
            <p className="text-xs text-muted">Version 1.0.0 · Chrome Extension (Manifest V3)</p>
          </div>
          <Badge variant="secondary" className="ml-auto flex-shrink-0">
            Stable
          </Badge>
        </div>

        {/* Tech stack */}
        <div>
          <p className="text-xs font-medium text-muted mb-2 uppercase tracking-wider">Built with</p>
          <div className="flex flex-wrap gap-2">
            {techStack.map((t) => (
              <span
                key={t}
                className="px-2.5 py-1 rounded-lg bg-surface border border-border-subtle text-xs text-secondary font-medium"
              >
                {t}
              </span>
            ))}
          </div>
        </div>

        {/* Links */}
        <div className="rounded-xl border border-border-subtle overflow-hidden">
          <button
            onClick={onBugReport}
            className="w-full flex items-center gap-3 px-4 py-3 hover:bg-surface-elevated transition-colors border-b border-border-subtle group"
          >
            <Bug className="h-4 w-4 text-muted group-hover:text-primary transition-colors" />
            <span className="text-sm text-secondary group-hover:text-primary transition-colors flex-1 text-left">
              Report a Bug
            </span>
            <ChevronRight className="h-4 w-4 text-muted" />
          </button>
          <button
            className="w-full flex items-center gap-3 px-4 py-3 hover:bg-surface-elevated transition-colors border-b border-border-subtle group"
            onClick={() => chrome.tabs.create({ url: 'https://waypoint.dev/changelog' })}
          >
            <ExternalLink className="h-4 w-4 text-muted group-hover:text-primary transition-colors" />
            <span className="text-sm text-secondary group-hover:text-primary transition-colors flex-1 text-left">
              Changelog
            </span>
            <ChevronRight className="h-4 w-4 text-muted" />
          </button>
          <button
            className="w-full flex items-center gap-3 px-4 py-3 hover:bg-surface-elevated transition-colors group"
            onClick={() => chrome.tabs.create({ url: 'https://waypoint.dev' })}
          >
            <ExternalLink className="h-4 w-4 text-muted group-hover:text-primary transition-colors" />
            <span className="text-sm text-secondary group-hover:text-primary transition-colors flex-1 text-left">
              Website
            </span>
            <ChevronRight className="h-4 w-4 text-muted" />
          </button>
        </div>

        <p className="text-xs text-muted text-center pt-2">
          Your dev environment. One destination. · © 2025 Waypoint
        </p>
      </div>
    </>
  );
}

// ── Connectors ───────────────────────────────────────────────────────────────

type ConnectorStatus = 'connected' | 'coming_soon' | 'not_connected';

interface ConnectorDef {
  id: string;
  name: string;
  description: string;
  status: ConnectorStatus;
  logo: React.ReactNode;
  docsUrl?: string;
}

function ConnectorCard({
  connector,
  onConnect,
}: {
  connector: ConnectorDef;
  onConnect?: () => void;
}) {
  return (
    <div className="flex items-center gap-4 px-4 py-4 border-b border-border-subtle last:border-0">
      <div className="h-10 w-10 rounded-xl bg-surface-elevated border border-border-subtle flex items-center justify-center flex-shrink-0">
        {connector.logo}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium text-primary">{connector.name}</p>
          {connector.status === 'coming_soon' && (
            <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-surface-elevated text-muted uppercase tracking-wide">
              Soon
            </span>
          )}
        </div>
        <p className="text-xs text-muted mt-0.5">{connector.description}</p>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        {connector.status === 'connected' && (
          <span className="flex items-center gap-1.5 text-xs text-success font-medium">
            <Check className="h-3.5 w-3.5" /> Connected
          </span>
        )}
        {connector.status === 'not_connected' && (
          <Button size="sm" variant="outline" onClick={onConnect}>
            Connect
          </Button>
        )}
        {connector.status === 'coming_soon' && (
          <Button size="sm" variant="outline" disabled>
            Coming soon
          </Button>
        )}
      </div>
    </div>
  );
}

function ConnectorsSection({
  onNavigateToGitHub,
  onNavigateToLinear,
  onNavigateToJira,
  onNavigateToSlack,
  onNavigateToNotion,
  onNavigateToCalendar,
}: {
  onNavigateToGitHub: () => void;
  onNavigateToLinear: () => void;
  onNavigateToJira: () => void;
  onNavigateToSlack: () => void;
  onNavigateToNotion: () => void;
  onNavigateToCalendar: () => void;
}) {
  const githubConnected = useGitHubAuthStore((s) => s.isConnected);
  const githubUser = useGitHubAuthStore((s) => s.user);
  const linearConnected = useLinearAuthStore((s) => s.isConnected);
  const linearUser = useLinearAuthStore((s) => s.user);
  const jiraConnected = useJiraAuthStore((s) => s.isConnected);
  const jiraUser = useJiraAuthStore((s) => s.user);
  const slackConnected = useSlackAuthStore((s) => s.isConnected);
  const slackUser = useSlackAuthStore((s) => s.user);
  const notionConnected = useNotionAuthStore((s) => s.isConnected);
  const notionUser = useNotionAuthStore((s) => s.user);
  const calendarConnected = useGoogleCalendarAuthStore((s) => s.isConnected);
  const calendarProfile = useGoogleCalendarAuthStore((s) => s.userProfile);

  const connectors: ConnectorDef[] = [
    {
      id: 'github',
      name: 'GitHub',
      description:
        githubConnected && githubUser
          ? `Connected as @${githubUser.login} · PRs, CI/CD, and repo data`
          : 'Pull requests, CI/CD status, issues, and notifications',
      status: githubConnected ? 'connected' : 'not_connected',
      logo: <GitHubIcon className="h-5 w-5" />,
    },
    {
      id: 'linear',
      name: 'Linear',
      description:
        linearConnected && linearUser
          ? `Connected as ${linearUser.name} · Issues, cycles, and projects`
          : 'Issues assigned to you, cycles, and project updates',
      status: linearConnected ? 'connected' : 'not_connected',
      logo: <LinearIcon className="h-5 w-5" />,
    },
    {
      id: 'jira',
      name: 'Jira',
      description:
        jiraConnected && jiraUser
          ? `Connected as ${jiraUser.displayName} · Issues and sprint tracking`
          : 'Assigned tickets, sprint board, and issue tracking',
      status: jiraConnected ? 'connected' : 'not_connected',
      logo: <JiraIcon className="h-5 w-5" />,
    },
    {
      id: 'slack',
      name: 'Slack',
      description:
        slackConnected && slackUser
          ? `Connected as ${slackUser.real_name} · DMs, mentions, and channels`
          : 'Mentions, DMs, and channel notifications',
      status: slackConnected ? 'connected' : 'not_connected',
      logo: <SlackIcon className="h-5 w-5" />,
    },
    {
      id: 'notion',
      name: 'Notion',
      description:
        notionConnected && notionUser
          ? `Connected as ${notionUser.name} · Pages and databases`
          : 'Quick-access pages, databases, and recent docs',
      status: notionConnected ? 'connected' : 'not_connected',
      logo: <NotionIcon className="h-5 w-5" />,
    },
    {
      id: 'google-calendar',
      name: 'Google Calendar',
      description:
        calendarConnected && calendarProfile
          ? `Connected as ${calendarProfile.email} · Today's meetings`
          : "Today's meetings and upcoming events in your overview",
      status: calendarConnected ? 'connected' : 'not_connected',
      logo: <GoogleCalendarIcon className="h-5 w-5" />,
    },
  ];

  const onConnectMap: Record<string, (() => void) | undefined> = {
    github: onNavigateToGitHub,
    linear: onNavigateToLinear,
    jira: onNavigateToJira,
    slack: onNavigateToSlack,
    notion: onNavigateToNotion,
    'google-calendar': onNavigateToCalendar,
  };

  const active = connectors.filter((c) => c.status !== 'coming_soon');
  const soon = connectors.filter((c) => c.status === 'coming_soon');

  return (
    <>
      <SectionHeader
        title="Connectors"
        description="Connect your tools to bring data into Waypoint."
      />

      <div className="space-y-6">
        <div>
          <p className="text-xs font-medium text-muted mb-3 uppercase tracking-wider">Available</p>
          <div className="rounded-xl border border-border-subtle overflow-hidden">
            {active.map((c) => (
              <ConnectorCard key={c.id} connector={c} onConnect={onConnectMap[c.id]} />
            ))}
          </div>
        </div>

        {soon.length > 0 && (
          <div>
            <p className="text-xs font-medium text-muted mb-3 uppercase tracking-wider">
              Coming soon
            </p>
            <div className="rounded-xl border border-border-subtle overflow-hidden">
              {soon.map((c) => (
                <ConnectorCard key={c.id} connector={c} />
              ))}
            </div>
          </div>
        )}

        <p className="text-xs text-muted">
          Want a specific integration?{' '}
          <button
            onClick={() =>
              chrome.tabs?.create?.({ url: 'https://github.com/your-org/waypoint/issues/new' })
            }
            className="text-accent hover:underline"
          >
            Request it on GitHub →
          </button>
        </p>
      </div>
    </>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export function SettingsPanel() {
  const [activeSection, setActiveSection] = useState<SectionId>('subscription');
  const [showBugReport, setShowBugReport] = useState(false);
  const plan = useSubscriptionStore((s) => s.plan);
  const compactMode = useSettingsStore((s) => s.settings.compactMode);

  const renderContent = () => {
    switch (activeSection) {
      case 'subscription':
        return <SubscriptionSection />;
      case 'profile':
        return <ProfileSection />;
      case 'appearance':
        return <AppearanceSection />;
      case 'notifications':
        return <NotificationsSection />;
      case 'connectors':
        return (
          <ConnectorsSection
            onNavigateToGitHub={() => {}}
            onNavigateToLinear={() => {}}
            onNavigateToJira={() => {}}
            onNavigateToSlack={() => {}}
            onNavigateToNotion={() => {}}
            onNavigateToCalendar={() => {}}
          />
        );
      case 'data':
        return <DataSection />;
      case 'about':
        return <AboutSection onBugReport={() => setShowBugReport(true)} />;
    }
  };

  return (
    <>
      <div className={cn('flex h-full justify-center', compactMode ? '-m-3' : '-m-6')}>
        <div className="flex h-full w-full max-w-5xl">
          {/* ── Left sidebar nav ── */}
          <aside className="w-52 flex-shrink-0 flex flex-col py-6 px-3">
            <div className="px-3 mb-5">
              <h1 className="text-sm font-semibold text-primary">Settings</h1>
              <p className="text-xs text-muted mt-0.5">Waypoint preferences</p>
            </div>

            <nav className="flex-1 space-y-0.5">
              {NAV_SECTIONS.map((s) => {
                const Icon = s.icon;
                const isActive = activeSection === s.id;
                return (
                  <button
                    key={s.id}
                    onClick={() => setActiveSection(s.id)}
                    className={cn(
                      'w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm transition-all duration-100 group',
                      isActive
                        ? 'bg-accent/10 text-accent font-medium'
                        : 'text-secondary hover:bg-surface-elevated hover:text-primary'
                    )}
                  >
                    <Icon
                      className={cn(
                        'h-4 w-4 flex-shrink-0',
                        isActive ? 'text-accent' : 'text-muted group-hover:text-primary'
                      )}
                    />
                    <span className="flex-1 text-left">{s.label}</span>
                    {s.id === 'subscription' && plan !== 'free' && (
                      <span className="text-[10px] font-semibold text-success">PRO</span>
                    )}
                  </button>
                );
              })}
            </nav>
          </aside>

          {/* ── Right content area ── */}
          <main className="flex-1 overflow-y-auto">
            <div className="max-w-2xl mx-auto px-8 py-8">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeSection}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.15 }}
                >
                  {renderContent()}
                </motion.div>
              </AnimatePresence>
            </div>
          </main>
        </div>
      </div>

      {showBugReport && <BugReportModal onClose={() => setShowBugReport(false)} />}
    </>
  );
}
