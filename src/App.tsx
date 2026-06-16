import { useState, useEffect, useCallback, useRef, type ReactNode } from 'react';
import { Sentry } from '@/lib/sentry';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { analytics } from '@/lib/analytics';
import { MainLayout } from '@/layouts/MainLayout';
import { SidebarNav } from '@/layouts/SidebarNav';
import { TopBar } from '@/layouts/TopBar';
import { useBookmarksStore } from '@/store/bookmarks.store';
import { useEnvironmentsStore } from '@/store/environments.store';
import { useSettingsStore } from '@/store/settings.store';
import { useWorkspaceStore } from '@/store/workspace.store';
import { useTabsStore } from '@/store/tabs.store';
import { useCommandPaletteStore } from '@/store/commandPalette.store';
import { Spinner } from '@/components/ui/Spinner';
import { CommandPalette, useCommandRegistration } from '@/features/command-palette';
import { BookmarksPanel } from '@/features/bookmarks';
import { GitHubPanel } from '@/features/github';
import { LinearPanel } from '@/features/linear';
import { JiraPanel } from '@/features/jira';
import { SlackPanel } from '@/features/slack';
import { NotionPanel } from '@/features/notion';
import { GoogleCalendarPanel } from '@/features/google-calendar';
import { useGitHubStore } from '@/store/github.store';
import { DailyFocusWidget } from '@/features/widgets';
import { WorkspaceModeIndicator } from '@/features/focus-modes';
import { TabsPanel } from '@/features/tabs';
import { useKeyboardShortcuts, useApplySettings } from '@/hooks';
import { OnboardingFlow } from '@/features/onboarding';
import { OverviewPanel } from '@/features/overview/OverviewPanel';
import { SettingsPanel } from '@/features/settings';
import { SnippetsPanel } from '@/features/snippets';
import { useSnippetsStore } from '@/store/snippets.store';
import { useSnippetCommands } from '@/features/snippets/useSnippetCommands';
import { UpgradeModal } from '@/features/subscription';
import { useSubscriptionStore } from '@/store/subscription.store';
import { SessionsPanel } from '@/features/sessions';
import { ActivityPanel } from '@/features/activity';
import { ToolboxPanel } from '@/features/toolbox';
import { ApiClientPanel } from '@/features/api-client';
import { ConnectionsPanel } from '@/features/connections';
import { RadarPanel } from '@/features/radar';
import { useSessionsStore } from '@/store/sessions.store';
import { useGoogleProfileStore } from '@/store/googleProfile.store';
import { useActivityStore } from '@/store/activity.store';
import { useGitHubAuthStore } from '@/store/githubAuth.store';
import { useLinearAuthStore } from '@/store/linearAuth.store';
import { useJiraAuthStore } from '@/store/jiraAuth.store';
import { useSlackAuthStore } from '@/store/slackAuth.store';
import { useNotionAuthStore } from '@/store/notionAuth.store';
import { useGoogleCalendarAuthStore } from '@/store/googleCalendarAuth.store';
import { storage } from '@/services/storage';
import { migrateEnvironmentsToBookmarks } from '@/services/migrateEnvironmentsToBookmarks';

type Section =
  | 'overview'
  | 'bookmarks'
  | 'environments'
  | 'github'
  | 'linear'
  | 'jira'
  | 'slack'
  | 'notion'
  | 'google-calendar'
  | 'focus'
  | 'tabs'
  | 'snippets'
  | 'sessions'
  | 'activity'
  | 'toolbox'
  | 'api-client'
  | 'connections'
  | 'radar'
  | 'settings';

// Sections that manage their own internal padding (via PanelShell or their own
// sticky header layout). MainLayout skips the outer `p-6` for these.
const SELF_PADDED_SECTIONS = new Set([
  'github',
  'linear',
  'jira',
  'slack',
  'notion',
  'google-calendar',
  'bookmarks',
  'snippets',
  'sessions',
  'activity',
  'toolbox',
  'api-client',
  'connections',
  'radar',
  'tabs',
  'focus',
]);

export default function App() {
  const [activeSection, setActiveSection] = useState<Section>('overview');
  const [isBooting, setIsBooting] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(false);

  // Track time-on-section for abandonment analysis
  const sectionEnteredAt = useRef<number>(Date.now());
  const prevSection = useRef<string>('overview');

  const handleNavigate = useCallback((rawSection: string) => {
    // Environments has been merged into Bookmarks; route any lingering
    // references (saved active section, deep links, keyboard shortcuts,
    // command palette items) to the bookmarks panel.
    const s = rawSection === 'environments' ? 'bookmarks' : rawSection;
    const duration = Date.now() - sectionEnteredAt.current;
    analytics.sectionLeft(prevSection.current, duration);
    analytics.sectionViewed(s);
    prevSection.current = s;
    sectionEnteredAt.current = Date.now();
    setActiveSection(s as Section);
    storage.set('activeSection', s);
  }, []);
  useCommandRegistration({ onNavigate: handleNavigate });
  useKeyboardShortcuts(handleNavigate);
  useApplySettings();

  const loadBookmarks = useBookmarksStore((s) => s.load);
  const loadEnvironments = useEnvironmentsStore((s) => s.load);
  const loadSettings = useSettingsStore((s) => s.load);
  const loadWorkspace = useWorkspaceStore((s) => s.load);
  const loadTabs = useTabsStore((s) => s.load);
  const loadRecentCommands = useCommandPaletteStore((s) => s.loadRecentCommands);
  const loadGitHub = useGitHubStore((s) => s.load);
  const loadSnippets = useSnippetsStore((s) => s.load);
  const loadSubscription = useSubscriptionStore((s) => s.load);
  const loadSessions = useSessionsStore((s) => s.load);
  const loadActivity = useActivityStore((s) => s.load);
  const loadGoogleProfile = useGoogleProfileStore((s) => s.load);
  // Connector auth stores — hydrated at boot so the sidebar's "show only
  // connected connectors" filter sees the right `isConnected` flags even when
  // the user lands directly on a connector or non-overview section.
  const loadGitHubAuth = useGitHubAuthStore((s) => s.loadToken);
  const loadLinearAuth = useLinearAuthStore((s) => s.loadApiKey);
  const loadJiraAuth = useJiraAuthStore((s) => s.loadCredentials);
  const loadSlackAuth = useSlackAuthStore((s) => s.loadToken);
  const loadNotionAuth = useNotionAuthStore((s) => s.loadToken);
  const loadCalendarAuth = useGoogleCalendarAuthStore((s) => s.loadConnection);

  useSnippetCommands();

  useEffect(() => {
    // Migrate legacy environment links into Chrome bookmarks before the
    // bookmarks store loads, so the migrated items show up on first render.
    migrateEnvironmentsToBookmarks().catch(() => {
      /* migration is best-effort; failures don't block app boot */
    });
    (async () => {
      try {
        // Resolve the cloud-sync preference before stores load so reads/writes
        // route to the correct storage area from the very first call.
        await storage.initCloudSync().catch(() => {});
        await Promise.all([
          loadBookmarks(),
          loadEnvironments(),
          loadSettings(),
          loadWorkspace(),
          loadTabs(),
          loadRecentCommands(),
          loadGitHub(),
          loadSnippets(),
          loadSubscription(),
          loadSessions(),
          loadActivity(),
          loadGoogleProfile(),
          loadGitHubAuth(),
          loadLinearAuth(),
          loadJiraAuth(),
          loadSlackAuth(),
          loadNotionAuth(),
          loadCalendarAuth(),
        ]);
        const [onboardingCompleted, savedSection] = await Promise.all([
          storage.get<boolean>('onboardingCompleted'),
          storage.get<Section>('activeSection'),
        ]);
        if (!onboardingCompleted) {
          setShowOnboarding(true);
          analytics.onboardingStarted();
        }
        const section = savedSection ?? 'overview';
        setActiveSection(section);
        prevSection.current = section;
        analytics.sectionViewed(section);
      } catch (err) {
        Sentry.captureException(err as Error, { tags: { phase: 'app_boot' } });
      } finally {
        setIsBooting(false);
      }
    })();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (isBooting) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-background">
        <Spinner size="lg" />
      </div>
    );
  }

  const renderSection = () => {
    const wrap = (name: string, node: ReactNode) => (
      <ErrorBoundary name={name}>{node}</ErrorBoundary>
    );
    switch (activeSection) {
      case 'overview':
        return wrap('overview', <OverviewPanel onNavigate={handleNavigate} />);
      case 'bookmarks':
      // 'environments' is now merged into the bookmarks panel — fall through.
      case 'environments':
        return wrap('bookmarks', <BookmarksPanel />);
      case 'github':
        return wrap('github', <GitHubPanel />);
      case 'linear':
        return wrap('linear', <LinearPanel />);
      case 'jira':
        return wrap('jira', <JiraPanel />);
      case 'slack':
        return wrap('slack', <SlackPanel />);
      case 'notion':
        return wrap('notion', <NotionPanel />);
      case 'google-calendar':
        return wrap('google-calendar', <GoogleCalendarPanel />);
      case 'focus':
        return wrap('focus', <DailyFocusWidget />);
      case 'tabs':
        return wrap('tabs', <TabsPanel />);
      case 'snippets':
        return wrap('snippets', <SnippetsPanel />);
      case 'sessions':
        return wrap('sessions', <SessionsPanel />);
      case 'activity':
        return wrap('activity', <ActivityPanel />);
      case 'toolbox':
        return wrap('toolbox', <ToolboxPanel />);
      case 'api-client':
        return wrap('api-client', <ApiClientPanel />);
      case 'connections':
        return wrap('connections', <ConnectionsPanel />);
      case 'radar':
        return wrap('radar', <RadarPanel />);
      case 'settings':
        return wrap('settings', <SettingsPanel />);
      default:
        return null;
    }
  };

  return (
    <>
      <MainLayout
        sidebar={
          <SidebarNav activeSection={activeSection} onSectionChange={(s) => handleNavigate(s)} />
        }
        header={<TopBar />}
        banner={<WorkspaceModeIndicator />}
        className={SELF_PADDED_SECTIONS.has(activeSection) ? 'p-0' : undefined}
      >
        {renderSection()}
      </MainLayout>
      <CommandPalette />
      {showOnboarding && <OnboardingFlow onComplete={() => setShowOnboarding(false)} />}
      <UpgradeModal />
    </>
  );
}
