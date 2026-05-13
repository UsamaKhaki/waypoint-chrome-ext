import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bookmark,
  Globe,
  GitBranch,
  Target,
  Layers,
  Settings,
  LayoutDashboard,
  Clock,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useWorkspaceStore } from '@/store/workspace.store';
import { useSettingsStore } from '@/store/settings.store';
import { Badge } from '@/components/ui/Badge';

const NAV_ITEMS = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard, shortcut: '1' },
  { id: 'bookmarks', label: 'Bookmarks', icon: Bookmark, shortcut: '2' },
  { id: 'environments', label: 'Environments', icon: Globe, shortcut: '3' },
  { id: 'github', label: 'GitHub', icon: GitBranch, shortcut: '4' },
  { id: 'focus', label: 'Focus', icon: Target, shortcut: '5' },
  { id: 'tabs', label: 'Tabs', icon: Layers, shortcut: '6' },
  { id: 'settings', label: 'Settings', icon: Settings, shortcut: '7' },
];

interface SidebarNavProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
}

// Hover popover label shown to the right of icon when sidebar is collapsed
function NavPopover({ label, shortcut }: { label: string; shortcut: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -6 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -6 }}
      transition={{ duration: 0.12 }}
      className="absolute left-full ml-3 top-1/2 -translate-y-1/2 z-50 flex items-center gap-2 pointer-events-none"
    >
      <div className="glass-elevated rounded-xl px-3 py-1.5 flex items-center gap-2 shadow-xl whitespace-nowrap">
        <span className="text-sm font-medium text-primary">{label}</span>
        <span className="kbd text-xs">{shortcut}</span>
      </div>
    </motion.div>
  );
}

// A single nav button — handles both expanded and collapsed layouts
function NavItem({
  item,
  isActive,
  isCollapsed,
  onClick,
}: {
  item: (typeof NAV_ITEMS)[0];
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

      {/* Popover only in collapsed mode */}
      {isCollapsed && (
        <AnimatePresence>
          {hovered && <NavPopover label={item.label} shortcut={`⌘${item.shortcut}`} />}
        </AnimatePresence>
      )}
    </div>
  );
}

export function SidebarNav({ activeSection, onSectionChange }: SidebarNavProps) {
  const { currentMode } = useWorkspaceStore();
  const showClock = useSettingsStore((s) => s.settings.showClock);
  const isCollapsed = useSettingsStore((s) => s.settings.sidebarCollapsed ?? false);
  const updateSettings = useSettingsStore((s) => s.update);

  const toggle = () => updateSettings({ sidebarCollapsed: !isCollapsed });

  const mainItems = NAV_ITEMS.filter((i) => i.id !== 'settings');
  const settingsItem = NAV_ITEMS.find((i) => i.id === 'settings')!;

  return (
    <nav
      className={cn(
        'flex flex-col h-full py-4 transition-all duration-200 overflow-visible',
        isCollapsed ? 'items-center px-2' : 'px-2'
      )}
    >
      {/* Logo + toggle */}
      <div
        className={cn(
          'mb-6 flex items-center',
          isCollapsed ? 'flex-col gap-2 w-full' : 'px-2 justify-between'
        )}
      >
        {/* Logo mark */}
        <button
          onClick={() => onSectionChange('overview')}
          className="h-7 w-7 rounded-lg bg-accent/20 flex items-center justify-center hover:bg-accent/30 transition-colors flex-shrink-0"
          title="Overview"
        >
          <span className="text-accent text-sm font-bold">D</span>
        </button>

        {/* Label — hidden when collapsed */}
        {!isCollapsed && (
          <span className="font-semibold text-primary text-sm flex-1 ml-2">DevFlow</span>
        )}

        {/* Mode badge — only expanded */}
        {!isCollapsed && currentMode !== 'default' && (
          <Badge variant="default" className="text-xs capitalize">
            {currentMode.replace(/-/g, ' ')}
          </Badge>
        )}

        {/* Toggle button */}
        <button
          onClick={toggle}
          className={cn(
            'flex-shrink-0 p-1 rounded-lg text-muted hover:text-primary hover:bg-surface-elevated transition-all',
            isCollapsed && 'mt-1'
          )}
          title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {isCollapsed ? (
            <ChevronRight className="h-3.5 w-3.5" />
          ) : (
            <ChevronLeft className="h-3.5 w-3.5" />
          )}
        </button>
      </div>

      {/* Nav items */}
      <div className="flex-1 w-full space-y-0.5">
        {mainItems.map((item) => (
          <NavItem
            key={item.id}
            item={item}
            isActive={activeSection === item.id}
            isCollapsed={isCollapsed}
            onClick={() => onSectionChange(item.id)}
          />
        ))}
      </div>

      {/* Bottom — settings + clock */}
      <div className={cn('w-full border-t border-border-subtle pt-2 mt-2 space-y-0.5')}>
        <NavItem
          item={settingsItem}
          isActive={activeSection === 'settings'}
          isCollapsed={isCollapsed}
          onClick={() => onSectionChange('settings')}
        />

        {showClock && (
          <div
            className={cn(
              'flex items-center gap-2 py-2 text-xs text-muted',
              isCollapsed ? 'justify-center px-0' : 'px-3'
            )}
          >
            <Clock className="h-3.5 w-3.5 flex-shrink-0" />
            {!isCollapsed && <ClockDisplay />}
          </div>
        )}
      </div>
    </nav>
  );
}

function ClockDisplay() {
  const [time, setTime] = useState('');
  useEffect(() => {
    const update = () =>
      setTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, []);
  return <span>{time}</span>;
}
