import type { WorkspaceConfig, AppSettings, BookmarkCategory } from '@/types';

export const KEYBOARD_SHORTCUTS = {
  COMMAND_PALETTE: 'mod+k',
  FOCUS_SEARCH: '/',
  CLOSE: 'Escape',
  GITHUB_SECTION: 'g h',
  PULL_REQUESTS: 'g p',
  LOCAL_ENV: 'e l',
  STAGE_ENV: 'e s',
  PROD_ENV: 'e p',
} as const;

export const SECTION_SHORTCUTS: Record<number, string> = {
  1: 'bookmarks',
  2: 'environments',
  3: 'github',
  4: 'focus',
  5: 'tabs',
  6: 'settings',
};

export const BOOKMARK_CATEGORIES: Record<BookmarkCategory, { label: string; color: string }> = {
  github: { label: 'GitHub', color: '#6e40c9' },
  'pull-requests': { label: 'Pull Requests', color: '#8b5cf6' },
  'ci-cd': { label: 'CI/CD', color: '#f59e0b' },
  'company-tools': { label: 'Company Tools', color: '#3b82f6' },
  monitoring: { label: 'Monitoring', color: '#ef4444' },
  documentation: { label: 'Documentation', color: '#10b981' },
  'local-dev': { label: 'Local Dev', color: '#06b6d4' },
  stage: { label: 'Stage', color: '#f97316' },
  production: { label: 'Production', color: '#ef4444' },
  design: { label: 'Design', color: '#ec4899' },
  personal: { label: 'Personal', color: '#84cc16' },
  custom: { label: 'Custom', color: '#94a3b8' },
};

export const ENVIRONMENT_COLORS = {
  local: '#06b6d4',
  stage: '#f97316',
  production: '#ef4444',
} as const;

export const WORKSPACE_CONFIGS: Record<string, WorkspaceConfig> = {
  default: {
    mode: 'default',
    visibleCategories: [
      'github',
      'pull-requests',
      'ci-cd',
      'company-tools',
      'monitoring',
      'documentation',
      'local-dev',
      'stage',
      'production',
      'design',
      'personal',
      'custom',
    ],
    visibleEnvironments: ['local', 'stage', 'production'],
    activeWidgets: ['daily-focus', 'github-hub', 'tab-manager'],
    description: 'Show everything',
  },
  frontend: {
    mode: 'frontend',
    visibleCategories: ['github', 'pull-requests', 'local-dev', 'stage', 'design', 'documentation'],
    visibleEnvironments: ['local', 'stage'],
    activeWidgets: ['daily-focus', 'github-hub'],
    description: 'Frontend development focus',
  },
  backend: {
    mode: 'backend',
    visibleCategories: [
      'github',
      'pull-requests',
      'ci-cd',
      'local-dev',
      'stage',
      'documentation',
      'monitoring',
    ],
    visibleEnvironments: ['local', 'stage', 'production'],
    activeWidgets: ['daily-focus', 'github-hub', 'tab-manager'],
    description: 'Backend development focus',
  },
  devops: {
    mode: 'devops',
    visibleCategories: ['ci-cd', 'monitoring', 'production', 'stage', 'company-tools'],
    visibleEnvironments: ['local', 'stage', 'production'],
    activeWidgets: ['github-hub', 'tab-manager'],
    description: 'DevOps & infrastructure focus',
  },
  debugging: {
    mode: 'debugging',
    visibleCategories: ['monitoring', 'local-dev', 'stage', 'production', 'documentation'],
    visibleEnvironments: ['local', 'stage', 'production'],
    activeWidgets: ['daily-focus', 'tab-manager'],
    description: 'Debugging & troubleshooting focus',
  },
  'sprint-planning': {
    mode: 'sprint-planning',
    visibleCategories: ['github', 'pull-requests', 'company-tools', 'documentation'],
    visibleEnvironments: [],
    activeWidgets: ['daily-focus'],
    description: 'Sprint planning & project management',
  },
  'production-support': {
    mode: 'production-support',
    visibleCategories: ['monitoring', 'production', 'ci-cd', 'company-tools'],
    visibleEnvironments: ['production', 'stage'],
    activeWidgets: ['tab-manager'],
    description: 'Production incident & support',
  },
  meeting: {
    mode: 'meeting',
    visibleCategories: ['documentation', 'company-tools', 'personal'],
    visibleEnvironments: [],
    activeWidgets: ['daily-focus'],
    description: 'Meeting & collaboration mode',
  },
  'deep-work': {
    mode: 'deep-work',
    visibleCategories: ['documentation', 'local-dev'],
    visibleEnvironments: ['local'],
    activeWidgets: ['daily-focus', 'pomodoro'],
    description: 'Distraction-free deep work',
  },
};

export const BACKGROUND_PRESETS: Record<
  string,
  {
    label: string;
    preview: string; // CSS gradient/color for the swatch
    bg: string; // --background HSL values
    surface: string;
    surfaceElevated: string;
    border: string;
    borderSubtle: string;
  }
> = {
  midnight: {
    label: 'Midnight',
    preview: 'hsl(222,47%,5%)',
    bg: '222 47% 5%',
    surface: '222 47% 8%',
    surfaceElevated: '222 47% 11%',
    border: '222 47% 16%',
    borderSubtle: '222 47% 13%',
  },
  obsidian: {
    label: 'Obsidian',
    preview: 'hsl(0,0%,4%)',
    bg: '0 0% 4%',
    surface: '0 0% 7%',
    surfaceElevated: '0 0% 10%',
    border: '0 0% 15%',
    borderSubtle: '0 0% 12%',
  },
  forest: {
    label: 'Forest',
    preview: 'hsl(150,30%,5%)',
    bg: '150 30% 5%',
    surface: '150 25% 8%',
    surfaceElevated: '150 20% 11%',
    border: '150 20% 16%',
    borderSubtle: '150 20% 13%',
  },
  aurora: {
    label: 'Aurora',
    preview: 'hsl(270,40%,6%)',
    bg: '270 40% 6%',
    surface: '270 35% 9%',
    surfaceElevated: '270 30% 12%',
    border: '270 25% 17%',
    borderSubtle: '270 25% 14%',
  },
  slate: {
    label: 'Slate',
    preview: 'hsl(215,35%,6%)',
    bg: '215 35% 6%',
    surface: '215 30% 9%',
    surfaceElevated: '215 25% 12%',
    border: '215 20% 17%',
    borderSubtle: '215 20% 14%',
  },
  charcoal: {
    label: 'Charcoal',
    preview: 'hsl(30,8%,7%)',
    bg: '30 8% 7%',
    surface: '30 6% 10%',
    surfaceElevated: '30 5% 13%',
    border: '30 5% 18%',
    borderSubtle: '30 5% 15%',
  },
  'rose-dark': {
    label: 'Rose Dark',
    preview: 'hsl(340,30%,6%)',
    bg: '340 30% 6%',
    surface: '340 25% 9%',
    surfaceElevated: '340 20% 12%',
    border: '340 15% 17%',
    borderSubtle: '340 15% 14%',
  },
  'gradient-blue': {
    label: 'Gradient Blue',
    preview: 'linear-gradient(135deg,hsl(222,60%,6%),hsl(200,60%,7%))',
    bg: '222 60% 6%',
    surface: '222 50% 9%',
    surfaceElevated: '222 45% 12%',
    border: '222 40% 17%',
    borderSubtle: '222 40% 14%',
  },
  'gradient-purple': {
    label: 'Gradient Purple',
    preview: 'linear-gradient(135deg,hsl(260,50%,6%),hsl(220,50%,7%))',
    bg: '260 50% 6%',
    surface: '260 40% 9%',
    surfaceElevated: '260 35% 12%',
    border: '260 30% 17%',
    borderSubtle: '260 30% 14%',
  },
};

export const DEFAULT_SETTINGS: AppSettings = {
  theme: 'dark',
  userName: '',
  accentColor: '#6366f1',
  backgroundColor: '#070a13',
  backgroundPreset: 'midnight',
  fontSize: 'md',
  compactMode: false,
  showClock: true,
  showWeather: false,
  sidebarCollapsed: false,
  defaultWorkspaceMode: 'default',
  keyboardShortcuts: {},
};

export const STORAGE_KEYS = {
  BOOKMARKS: 'bookmarks',
  ENVIRONMENTS: 'environments',
  DAILY_FOCUS: 'dailyFocus',
  SETTINGS: 'settings',
  WORKSPACE_MODE: 'workspaceMode',
  RECENT_COMMANDS: 'recentCommands',
  SAVED_SESSIONS: 'savedSessions',
  GITHUB_REPOS: 'githubRepos',
  PR_TEMPLATES: 'prTemplates',
  BRANCH_TEMPLATES: 'branchTemplates',
  ONBOARDING_COMPLETED: 'onboardingCompleted',
} as const;

export const ANIMATION_PRESETS = {
  fadeIn: { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 } },
  slideUp: {
    initial: { opacity: 0, y: 8 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: 8 },
  },
  slideDown: {
    initial: { opacity: 0, y: -8 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -8 },
  },
  scale: {
    initial: { opacity: 0, scale: 0.95 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.95 },
  },
} as const;

export const COMMAND_PALETTE_MAX_RESULTS = 8;
export const RECENT_COMMANDS_MAX = 5;
