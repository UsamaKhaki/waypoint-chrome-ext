import { useEffect } from 'react';
import { useCommandPaletteStore } from '@/store/commandPalette.store';
import type { Command } from '@/types';

interface UseCommandRegistrationOptions {
  onNavigate?: (section: string) => void;
}

export function useCommandRegistration({ onNavigate }: UseCommandRegistrationOptions = {}) {
  const registerCommands = useCommandPaletteStore((s) => s.registerCommands);

  useEffect(() => {
    const commands: Command[] = [
      {
        id: 'nav-overview',
        title: 'Go to Overview',
        category: 'navigation',
        keywords: ['home', 'dashboard', 'main'],
        shortcut: '⌘1',
        action: () => onNavigate?.('overview'),
      },
      {
        id: 'nav-bookmarks',
        title: 'Go to Bookmarks',
        category: 'navigation',
        keywords: ['links', 'favorites', 'saved'],
        shortcut: '⌘2',
        action: () => onNavigate?.('bookmarks'),
      },
      {
        id: 'nav-environments',
        title: 'Go to Environments',
        category: 'navigation',
        keywords: ['local', 'stage', 'production', 'env'],
        shortcut: '⌘3',
        action: () => onNavigate?.('environments'),
      },
      {
        id: 'nav-github',
        title: 'Go to GitHub Hub',
        category: 'github',
        keywords: ['pr', 'pull request', 'issues', 'repos'],
        shortcut: '⌘4 or G→H',
        action: () => onNavigate?.('github'),
      },
      {
        id: 'nav-focus',
        title: 'Go to Daily Focus',
        category: 'navigation',
        keywords: ['tasks', 'priorities', 'notes', 'goals'],
        shortcut: '⌘5',
        action: () => onNavigate?.('focus'),
      },
      {
        id: 'nav-tabs',
        title: 'Go to Tab Manager',
        category: 'navigation',
        keywords: ['tabs', 'sessions', 'windows'],
        shortcut: '⌘6',
        action: () => onNavigate?.('tabs'),
      },
      {
        id: 'nav-settings',
        title: 'Open Settings',
        category: 'settings',
        keywords: ['preferences', 'config', 'theme'],
        shortcut: '⌘7',
        action: () => onNavigate?.('settings'),
      },
      {
        id: 'open-github',
        title: 'Open GitHub',
        category: 'github',
        keywords: ['github.com'],
        action: () => chrome.tabs.create({ url: 'https://github.com' }),
      },
      {
        id: 'open-github-prs',
        title: 'Open GitHub Pull Requests',
        category: 'github',
        keywords: ['pr', 'review', 'merge'],
        action: () => chrome.tabs.create({ url: 'https://github.com/pulls' }),
      },
      {
        id: 'open-github-issues',
        title: 'Open GitHub Issues',
        category: 'github',
        keywords: ['issues', 'bugs', 'tickets'],
        action: () => chrome.tabs.create({ url: 'https://github.com/issues' }),
      },
      {
        id: 'open-github-notifications',
        title: 'Open GitHub Notifications',
        category: 'github',
        keywords: ['alerts', 'mentions'],
        action: () => chrome.tabs.create({ url: 'https://github.com/notifications' }),
      },
    ];
    registerCommands(commands);
  }, [registerCommands, onNavigate]);
}
