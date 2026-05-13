import { ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';

const GITHUB_QUICK_LINKS = [
  { label: 'Pull Requests', url: 'https://github.com/pulls', emoji: '🔀' },
  { label: 'Issues', url: 'https://github.com/issues', emoji: '🐛' },
  { label: 'Notifications', url: 'https://github.com/notifications', emoji: '🔔' },
  { label: 'Actions', url: 'https://github.com/actions', emoji: '⚡' },
  { label: 'Explore', url: 'https://github.com/explore', emoji: '🔭' },
  { label: 'Gists', url: 'https://gist.github.com', emoji: '📝' },
];

export function QuickLinks() {
  return (
    <div>
      <p className="section-title mb-3">Quick Links</p>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {GITHUB_QUICK_LINKS.map((link) => (
          <button
            key={link.url}
            onClick={() => chrome.tabs.create({ url: link.url })}
            className={cn(
              'flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm text-secondary',
              'hover:bg-surface-elevated hover:text-primary transition-all duration-150',
              'border border-border-subtle hover:border-border',
              'group text-left'
            )}
          >
            <span className="text-base">{link.emoji}</span>
            <span className="flex-1 truncate">{link.label}</span>
            <ExternalLink className="h-3 w-3 opacity-0 group-hover:opacity-60 transition-opacity" />
          </button>
        ))}
      </div>
    </div>
  );
}
