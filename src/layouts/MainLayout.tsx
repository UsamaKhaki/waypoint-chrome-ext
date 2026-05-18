import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useSettingsStore } from '@/store/settings.store';

interface MainLayoutProps {
  sidebar?: React.ReactNode;
  header?: React.ReactNode;
  /** Optional banner rendered between header and content (e.g. workspace mode). */
  banner?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

export function MainLayout({ sidebar, header, banner, children, className }: MainLayoutProps) {
  const isCollapsed = useSettingsStore((s) => s.settings.sidebarCollapsed ?? false);

  return (
    <div data-testid="main-layout" className="h-screen w-screen flex overflow-hidden bg-background">
      {sidebar && (
        <motion.aside
          animate={{ width: isCollapsed ? 56 : 240 }}
          transition={{ duration: 0.2, ease: 'easeInOut' }}
          className="flex-shrink-0 flex flex-col border-r border-border-subtle bg-surface overflow-visible"
          style={{ minWidth: isCollapsed ? 56 : 240 }}
        >
          {sidebar}
        </motion.aside>
      )}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {header && (
          <header className="flex-shrink-0 border-b border-border-subtle glass px-6 py-3">
            {header}
          </header>
        )}
        {banner}
        <main className={cn('flex-1 overflow-y-auto p-6 flex flex-col', className)}>
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className="flex-1 min-h-0"
          >
            {children}
          </motion.div>
        </main>
      </div>
    </div>
  );
}
