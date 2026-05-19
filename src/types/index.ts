// Bookmark
export interface Bookmark {
  id: string;
  title: string;
  url: string;
  description?: string;
  favicon?: string;
  tags: string[];
  category: BookmarkCategory;
  environment?: EnvironmentType;
  isPinned: boolean;
  isFavorite: boolean;
  order: number;
  createdAt: number;
  lastUsedAt?: number;
  /** Immediate Chrome parent folder name, e.g. "Work". */
  folder?: string;
  /** Full Chrome folder path, e.g. "Bookmarks bar / Dev / Work". */
  folderPath?: string;
}

export type BookmarkCategory =
  | 'github'
  | 'pull-requests'
  | 'ci-cd'
  | 'company-tools'
  | 'monitoring'
  | 'documentation'
  | 'local-dev'
  | 'stage'
  | 'production'
  | 'design'
  | 'personal'
  | 'custom';

// Environment
export type EnvironmentType = 'local' | 'stage' | 'production';

export interface EnvironmentLink {
  label: string;
  url: string;
  type:
    | 'frontend'
    | 'backend'
    | 'admin'
    | 'logs'
    | 'monitoring'
    | 'api'
    | 'grafana'
    | 'kibana'
    | 'sentry'
    | 'database'
    | 'deployment'
    | 'other';
}

export interface Environment {
  id: string;
  name: string;
  type: EnvironmentType;
  links: EnvironmentLink[];
  notes?: string;
  healthStatus?: 'healthy' | 'degraded' | 'down' | 'unknown';
  color: string;
  isActive: boolean;
}

// Command Palette
export interface Command {
  id: string;
  title: string;
  description?: string;
  category: CommandCategory;
  shortcut?: string;
  action: () => void;
  keywords?: string[];
  icon?: string;
}

export type CommandCategory =
  | 'bookmarks'
  | 'environments'
  | 'navigation'
  | 'actions'
  | 'settings'
  | 'github';

export interface RecentCommand {
  commandId: string;
  usedAt: number;
}

// Workspace / Focus Modes
/** Workspace mode IDs are open-ended now that users can create custom modes. */
export type WorkspaceMode = string;

export const BUILTIN_WORKSPACE_MODES = [
  'default',
  'frontend',
  'backend',
  'devops',
  'debugging',
  'sprint-planning',
  'production-support',
  'meeting',
  'deep-work',
] as const;

/** A user-defined workspace mode persisted in storage. */
export interface CustomWorkspaceMode {
  id: string;
  label: string;
  description: string;
  emoji: string;
  /** Sidebar section ids to hide while this mode is active. */
  hiddenSidebarItems?: string[];
  /** Overview section ids to hide while this mode is active. */
  hiddenOverviewSections?: string[];
}

export interface WorkspaceConfig {
  mode: WorkspaceMode;
  visibleCategories: BookmarkCategory[];
  visibleEnvironments: EnvironmentType[];
  activeWidgets: WidgetType[];
  description: string;
}

export type WidgetType =
  | 'daily-focus'
  | 'github-hub'
  | 'tab-manager'
  | 'quick-notes'
  | 'pomodoro'
  | 'weather'
  | 'clock';

// Daily Focus
export interface FocusItem {
  id: string;
  text: string;
  isCompleted: boolean;
  createdAt: number;
}

export interface DailyFocus {
  date: string; // YYYY-MM-DD
  priorities: FocusItem[];
  notes: string; // markdown
  goals: string;
}

// Tab management
export interface SavedSession {
  id: string;
  name: string;
  tabs: SessionTab[];
  createdAt: number;
}

export interface SessionTab {
  url: string;
  title: string;
  favicon?: string;
  groupId?: number;
}

// Settings
export type BackgroundPreset =
  | 'midnight' // default deep navy
  | 'obsidian' // pure near-black
  | 'forest' // dark green tint
  | 'aurora' // dark purple/violet
  | 'slate' // cool blue-grey
  | 'charcoal' // warm dark grey
  | 'rose-dark' // dark with rose tint
  | 'gradient-blue' // subtle blue gradient
  | 'gradient-purple'; // subtle purple gradient

export interface AppSettings {
  theme: 'dark' | 'light' | 'system';
  userName: string;
  accentColor: string;
  backgroundColor: string;
  backgroundPreset: BackgroundPreset;
  fontSize: 'sm' | 'md' | 'lg';
  compactMode: boolean;
  showClock: boolean;
  showWeather: boolean;
  sidebarCollapsed: boolean;
  defaultWorkspaceMode: WorkspaceMode;
  keyboardShortcuts: Record<string, string>;
}

// GitHub
export interface GitHubRepo {
  id: string;
  owner: string;
  name: string;
  fullName: string;
  url: string;
  description?: string;
  isStarred: boolean;
  order: number;
}

export interface PRTemplate {
  id: string;
  name: string;
  body: string;
}

export interface BranchTemplate {
  id: string;
  name: string;
  pattern: string; // e.g. "feat/{ticket}-{description}"
}

// Storage keys
export type StorageKey =
  | 'bookmarks'
  | 'environments'
  | 'dailyFocus'
  | 'settings'
  | 'workspaceMode'
  | 'recentCommands'
  | 'savedSessions'
  | 'githubRepos'
  | 'prTemplates'
  | 'branchTemplates'
  | 'onboardingCompleted'
  | 'overviewLayout'
  | 'snippets'
  | 'subscription'
  | 'sessions'
  | 'pendingSnippet'
  | 'notificationsEnabled'
  | 'githubToken'
  | 'widgets'
  | 'googleProfile'
  | 'linearApiKey'
  | 'jiraCredentials'
  | 'slackToken'
  | 'slackCache'
  | 'notionToken'
  | 'googleCalendarConnected'
  | 'activeSection'
  | 'bookmarksMeta'
  | 'environmentsMigratedToBookmarks'
  | 'customWorkspaceModes';
