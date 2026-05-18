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
import { useSessionsStore } from '@/store/sessions.store';
import { useGoogleProfileStore } from '@/store/googleProfile.store';
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
  | 'settings';

// Sections that render their own sticky header + scroll area and so opt out
// of the MainLayout's outer `p-6` padding.
const CONNECTOR_SECTIONS = new Set([
  'github',
  'linear',
  'jira',
  'slack',
  'notion',
  'google-calendar',
  'bookmarks',
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
  const loadGoogleProfile = useGoogleProfileStore((s) => s.load);

  useSnippetCommands();

  useEffect(() => {
    // Migrate legacy environment links into Chrome bookmarks before the
    // bookmarks store loads, so the migrated items show up on first render.
    migrateEnvironmentsToBookmarks().catch(() => {
      /* migration is best-effort; failures don't block app boot */
    });
    Promise.all([
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
      loadGoogleProfile(),
    ])
      .then(async () => {
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
      })
      .catch((err: Error) => {
        Sentry.captureException(err, { tags: { phase: 'app_boot' } });
      })
      .finally(() => setIsBooting(false));
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
        className={CONNECTOR_SECTIONS.has(activeSection) ? 'p-0' : undefined}
      >
        {renderSection()}
      </MainLayout>
      <CommandPalette />
      {showOnboarding && <OnboardingFlow onComplete={() => setShowOnboarding(false)} />}
      <UpgradeModal />
    </>
  );
}
