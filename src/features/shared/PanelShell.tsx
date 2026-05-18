/**
 * Premium shell primitives for top-level panels — Bookmarks, Snippets,
 * Sessions, Tabs, Focus, Settings. Connector dashboards use the richer
 * `DashboardShell` for hero + stat tabs; this shell is for "list /
 * config" pages that just need a header + content area.
 *
 * Design rules these encode:
 *   - Page title is `text-2xl font-bold tracking-tight`
 *   - Subtitle is `text-sm text-muted`
 *   - Pages cap at `max-w-[1400px] mx-auto`
 *   - Pages manage their own `p-6` (MainLayout doesn't add padding)
 *   - Empty states use a 56×56 icon tile + bold title + hint sentence
 */
import { cn } from '@/lib/utils';

export const PANEL_MAX_WIDTH_CLASS = 'max-w-[1400px] mx-auto w-full';

interface PanelShellProps {
  testId?: string;
  /** Whether to render the inner padding (defaults to `true`). Pages that
   * want their own sticky header (e.g. Bookmarks) set this to false and
   * handle padding themselves. */
  padded?: boolean;
  className?: string;
  children: React.ReactNode;
}

export function PanelShell({ testId, padded = true, className, children }: PanelShellProps) {
  return (
    <div
      data-testid={testId}
      className={cn(PANEL_MAX_WIDTH_CLASS, padded && 'p-6 space-y-6', className)}
    >
      {children}
    </div>
  );
}

interface PanelHeaderProps {
  /** Optional icon shown in a tile to the left of the title. */
  icon?: React.ElementType;
  title: string;
  subtitle?: React.ReactNode;
  /** Right-side action area (buttons, badges, etc.) */
  actions?: React.ReactNode;
}

export function PanelHeader({ icon: Icon, title, subtitle, actions }: PanelHeaderProps) {
  return (
    <div className="flex items-start justify-between gap-4 flex-wrap">
      <div className="flex items-center gap-3 min-w-0">
        {Icon && (
          <div className="h-10 w-10 rounded-xl border border-border-subtle bg-surface text-accent flex items-center justify-center flex-shrink-0">
            <Icon className="h-5 w-5" />
          </div>
        )}
        <div className="min-w-0">
          <h1 className="text-2xl font-bold text-primary tracking-tight truncate">{title}</h1>
          {subtitle && <p className="text-sm text-muted mt-0.5">{subtitle}</p>}
        </div>
      </div>
      {actions && <div className="flex items-center gap-2 flex-shrink-0">{actions}</div>}
    </div>
  );
}

interface PanelEmptyStateProps {
  icon: React.ElementType;
  title: string;
  hint?: string;
  action?: React.ReactNode;
}

export function PanelEmptyState({ icon: Icon, title, hint, action }: PanelEmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="h-14 w-14 rounded-xl bg-surface-elevated border border-border-subtle flex items-center justify-center mb-4">
        <Icon className="h-6 w-6 text-muted" />
      </div>
      <h3 className="text-base font-semibold text-primary">{title}</h3>
      {hint && <p className="text-sm text-muted mt-1.5 max-w-sm">{hint}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

interface PanelSectionTitleProps {
  children: React.ReactNode;
  count?: number;
  actions?: React.ReactNode;
}

/** Smaller heading used inside a panel (e.g. "Recent" / "Pinned" within Bookmarks). */
export function PanelSectionTitle({ children, count, actions }: PanelSectionTitleProps) {
  return (
    <div className="flex items-center justify-between px-1">
      <div className="flex items-center gap-2">
        <h2 className="text-xs font-semibold uppercase tracking-widest text-muted">{children}</h2>
        {typeof count === 'number' && <span className="text-xs text-muted">({count})</span>}
      </div>
      {actions}
    </div>
  );
}
