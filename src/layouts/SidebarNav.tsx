import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bookmark,
  Globe,
  Target,
  Layers,
  Settings,
  LayoutDashboard,
  PanelLeftClose,
  PanelLeftOpen,
  Code2,
  FolderOpen,
  ChevronDown,
} from 'lucide-react';
import {
  GitHubIcon,
  LinearIcon,
  JiraIcon,
  SlackIcon,
  NotionIcon,
  GoogleCalendarIcon,
} from '@/components/icons/ConnectorIcons';
import { cn } from '@/lib/utils';
import { useWorkspaceStore } from '@/store/workspace.store';
import { useSettingsStore } from '@/store/settings.store';
import { Badge } from '@/components/ui/Badge';

type NavItemDef = { id: string; label: string; icon: React.ElementType; shortcut: string };

const NAV_GROUPS: { label: string; items: NavItemDef[] }[] = [
  {
    label: 'Workspace',
    items: [
      { id: 'overview', label: 'Overview', icon: LayoutDashboard, shortcut: '1' },
      { id: 'bookmarks', label: 'Bookmarks', icon: Bookmark, shortcut: '2' },
    ],
  },
  {
    label: 'Connectors',
    items: [
      { id: 'environments', label: 'Environments', icon: Globe, shortcut: '3' },
      { id: 'github', label: 'GitHub', icon: GitHubIcon, shortcut: '4' },
      { id: 'linear', label: 'Linear', icon: LinearIcon, shortcut: 'l i' },
      { id: 'jira', label: 'Jira', icon: JiraIcon, shortcut: 'j i' },
      { id: 'slack', label: 'Slack', icon: SlackIcon, shortcut: 's l' },
      { id: 'notion', label: 'Notion', icon: NotionIcon, shortcut: 'n o' },
      { id: 'google-calendar', label: 'Calendar', icon: GoogleCalendarIcon, shortcut: 'g c' },
    ],
  },
  {
    label: 'Tools',
    items: [
      { id: 'focus', label: 'Focus', icon: Target, shortcut: '5' },
      { id: 'tabs', label: 'Tabs', icon: Layers, shortcut: '6' },
      { id: 'snippets', label: 'Snippets', icon: Code2, shortcut: '7' },
      { id: 'sessions', label: 'Sessions', icon: FolderOpen, shortcut: '8' },
    ],
  },
];

const SETTINGS_ITEM: NavItemDef = { id: 'settings', label: 'Settings', icon: Settings, shortcut: '9' };

interface SidebarNavProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
}

function NavPopover({ label, shortcut }: { label: string; shortcut: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -6 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -6 }}
      transition={{ duration: 0.12 }}
      className="absolute left-full ml-3 top-0 bottom-0 my-auto h-fit z-50 flex items-center gap-2 pointer-events-none"
    >
      <div className="glass-elevated rounded-xl px-3 py-1.5 flex items-center gap-2 shadow-xl whitespace-nowrap">
        <span className="text-sm font-medium text-primary">{label}</span>
        <span className="kbd text-xs">{shortcut}</span>
      </div>
    </motion.div>
  );
}

function NavItem({
  item,
  isActive,
  isCollapsed,
  onClick,
}: {
  item: NavItemDef;
  isActive: boolean;
  isCollapsed: boolean;
  onClick: () => void;
}) {
  const [hovered, setHovered] = useState(false);
  const Icon = item.icon;

  return (
    <div
      className="relative"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <motion.button
        onClick={onClick}
        whileTap={{ scale: 0.95 }}
        className={cn(
          'w-full flex items-center rounded-xl text-sm transition-all duration-150 group',
          isCollapsed ? 'justify-center px-0 py-2.5' : 'gap-3 px-3 py-2',
          isActive
            ? 'bg-accent/10 text-accent font-medium'
            : 'text-secondary hover:text-primary hover:bg-surface-elevated'
        )}
      >
        <Icon className="h-4 w-4 flex-shrink-0" />
        {!isCollapsed && (
          <>
            <span className="flex-1 text-left">{item.label}</span>
            <span
              className={cn(
                'text-xs opacity-0 group-hover:opacity-60 transition-opacity',
                isActive && 'opacity-60'
              )}
            >
              {item.shortcut}
            </span>
          </>
        )}
      </motion.button>

      {isCollapsed && (
        <AnimatePresence>
          {hovered && <NavPopover label={item.label} shortcut={`⌘${item.shortcut}`} />}
        </AnimatePresence>
      )}
    </div>
  );
}

function NavGroup({
  group,
  activeSection,
  isCollapsed,
  onSectionChange,
}: {
  group: (typeof NAV_GROUPS)[0];
  activeSection: string;
  isCollapsed: boolean;
  onSectionChange: (id: string) => void;
}) {
  const [open, setOpen] = useState(true);

  if (isCollapsed) {
    return (
      <div className="w-full">
        <div className="my-1 border-t border-border-subtle" />
        {group.items.map((item) => (
          <NavItem
            key={item.id}
            item={item}
            isActive={activeSection === item.id}
            isCollapsed={true}
            onClick={() => onSectionChange(item.id)}
          />
        ))}
      </div>
    );
  }

  return (
    <div className="w-full">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-2 py-1 mb-0.5 text-xs font-semibold text-muted uppercase tracking-wider hover:text-secondary transition-colors"
      >
        <span>{group.label}</span>
        <ChevronDown
          className={cn('h-3 w-3 transition-transform duration-150', !open && '-rotate-90')}
        />
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="overflow-hidden space-y-0.5"
          >
            {group.items.map((item) => (
              <NavItem
                key={item.id}
                item={item}
                isActive={activeSection === item.id}
                isCollapsed={false}
                onClick={() => onSectionChange(item.id)}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function SidebarNav({ activeSection, onSectionChange }: SidebarNavProps) {
  const { currentMode } = useWorkspaceStore();
  const isCollapsed = useSettingsStore((s) => s.settings.sidebarCollapsed ?? false);
  const updateSettings = useSettingsStore((s) => s.update);

  const toggle = () => updateSettings({ sidebarCollapsed: !isCollapsed });

  return (
    <nav
      className={cn(
        'flex flex-col h-full py-4 transition-all duration-200 overflow-visible',
        isCollapsed ? 'items-center px-2' : 'px-2'
      )}
    >
      {/* Logo */}
      <div
        className={cn(
          'mb-6 flex items-center',
          isCollapsed ? 'justify-center w-full' : 'px-2 justify-between'
        )}
      >
        <button
          onClick={() => onSectionChange('overview')}
          className="h-7 w-7 rounded-lg bg-accent/20 flex items-center justify-center hover:bg-accent/30 transition-colors flex-shrink-0"
          title="Overview"
        >
          <span className="text-accent text-sm font-bold">D</span>
        </button>

        {!isCollapsed && (
          <span className="font-semibold text-primary text-sm flex-1 ml-2">Waypoint</span>
        )}

        {!isCollapsed && currentMode !== 'default' && (
          <Badge variant="default" className="text-xs capitalize">
            {currentMode.replace(/-/g, ' ')}
          </Badge>
        )}
      </div>

      {/* Grouped nav items */}
      <div className="flex-1 w-full space-y-1">
        {NAV_GROUPS.map((group) => (
          <NavGroup
            key={group.label}
            group={group}
            activeSection={activeSection}
            isCollapsed={isCollapsed}
            onSectionChange={onSectionChange}
          />
        ))}
      </div>

      {/* Bottom — settings + collapse toggle */}
      <div className="w-full border-t border-border-subtle pt-2 mt-2">
        <div className={cn('flex items-center gap-1', isCollapsed ? 'flex-col' : 'flex-row')}>
          <div className={cn(isCollapsed ? 'w-full' : 'flex-1')}>
            <NavItem
              item={SETTINGS_ITEM}
              isActive={activeSection === 'settings'}
              isCollapsed={isCollapsed}
              onClick={() => onSectionChange('settings')}
            />
          </div>

          <button
            onClick={toggle}
            title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            className="p-2 rounded-xl text-muted hover:text-primary hover:bg-surface-elevated transition-all flex-shrink-0"
          >
            {isCollapsed ? (
              <PanelLeftOpen className="h-4 w-4" />
            ) : (
              <PanelLeftClose className="h-4 w-4" />
            )}
          </button>
        </div>
      </div>
    </nav>
  );
}
