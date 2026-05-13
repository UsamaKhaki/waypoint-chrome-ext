import { useState, useEffect, useCallback } from 'react';
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
import { EnvironmentsPanel } from '@/features/environments';
import { GitHubPanel } from '@/features/github';
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

type Section =
  | 'overview'
  | 'bookmarks'
  | 'environments'
  | 'github'
  | 'focus'
  | 'tabs'
  | 'snippets'
  | 'sessions'
  | 'settings';

export default function App() {
  const [activeSection, setActiveSection] = useState<Section>('overview');
  const [isBooting, setIsBooting] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(false);

  const handleNavigate = useCallback((s: string) => setActiveSection(s as Section), []);
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
        const onboardingCompleted = await storage.get<boolean>('onboardingCompleted');
        if (!onboardingCompleted) setShowOnboarding(true);
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
    switch (activeSection) {
      case 'overview':
        return <OverviewPanel onNavigate={handleNavigate} />;
      case 'bookmarks':
        return <BookmarksPanel />;
      case 'environments':
        return <EnvironmentsPanel />;
      case 'github':
        return <GitHubPanel />;
      case 'focus':
        return <DailyFocusWidget />;
      case 'tabs':
        return <TabsPanel />;
      case 'snippets':
        return <SnippetsPanel />;
      case 'sessions':
        return <SessionsPanel />;
      case 'settings':
        return <SettingsPanel />;
      default:
        return null;
    }
  };

  return (
    <>
      <MainLayout
        sidebar={
          <SidebarNav
            activeSection={activeSection}
            onSectionChange={(s) => setActiveSection(s as Section)}
          />
        }
        header={<TopBar />}
      >
        <>
          <WorkspaceModeIndicator />
          {renderSection()}
        </>
      </MainLayout>
      <CommandPalette />
      {showOnboarding && <OnboardingFlow onComplete={() => setShowOnboarding(false)} />}
      <UpgradeModal />
    </>
  );
}
