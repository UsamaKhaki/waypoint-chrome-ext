/**
 * Premium shell for connector dashboards (GitHub, Linear, Jira, Notion, Slack,
 * Google Calendar). Provides a consistent hero, stat-tab strip, and content
 * card so each dashboard only has to supply its rows.
 */
import { motion } from 'framer-motion';
import { RefreshCw, LogOut, ExternalLink, AlertCircle, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Spinner } from '@/components/ui/Spinner';

type Highlight = 'accent' | 'warning' | 'success' | 'destructive' | 'default';

const HIGHLIGHT_TILE_BG: Record<Highlight, string> = {
  accent: 'text-accent bg-accent/10',
  warning: 'text-warning bg-warning/10',
  success: 'text-success bg-success/10',
  destructive: 'text-destructive bg-destructive/10',
  default: 'text-secondary bg-surface-elevated',
};

interface HeroProps {
  avatar?: string | null;
  avatarFallback?: React.ReactNode;
  name: string;
  subtitle?: string;
  /** Optional URL for the user's profile (opens in new tab). */
  profileUrl?: string;
  /** Text shown on the active pill (default "Active"). */
  statusLabel?: string;
  isLoading?: boolean;
  onRefresh?: () => void;
  onDisconnect?: () => void;
  /** Optional extra action shown alongside refresh / view profile. */
  extraActions?: React.ReactNode;
}

export function DashboardHero({
  avatar,
  avatarFallback,
  name,
  subtitle,
  profileUrl,
  statusLabel = 'Active',
  isLoading,
  onRefresh,
  onDisconnect,
  extraActions,
}: HeroProps) {
  return (
    <div className="flex items-center justify-between gap-4 flex-wrap">
      <div className="flex items-center gap-3 min-w-0">
        <div className="relative flex-shrink-0">
          {avatar ? (
            <img
              src={avatar}
              alt={name}
              className="h-12 w-12 rounded-xl border border-border-subtle object-cover"
            />
          ) : (
            <div className="h-12 w-12 rounded-xl border border-border-subtle bg-surface-elevated flex items-center justify-center">
              {avatarFallback}
            </div>
          )}
          <span
            className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-success border-2 border-background"
            title="Connected"
          />
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-primary tracking-tight truncate">{name}</h1>
            <span className="flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-success/10 text-success text-[10px] font-semibold uppercase tracking-wider flex-shrink-0">
              <span className="h-1.5 w-1.5 rounded-full bg-success" />
              {statusLabel}
            </span>
          </div>
          {subtitle && (
            <button
              onClick={() => profileUrl && chrome.tabs.create({ url: profileUrl })}
              disabled={!profileUrl}
              className="text-sm text-muted hover:text-accent transition-colors flex items-center gap-1 disabled:cursor-default disabled:hover:text-muted truncate"
            >
              {subtitle}
              {profileUrl && <ExternalLink className="h-3 w-3 flex-shrink-0" />}
            </button>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 flex-shrink-0">
        {onRefresh && (
          <button
            onClick={onRefresh}
            disabled={isLoading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-border-subtle hover:border-border bg-surface hover:bg-surface-elevated text-secondary hover:text-primary text-xs font-medium transition-all"
            title="Refresh"
          >
            <RefreshCw className={cn('h-3.5 w-3.5', isLoading && 'animate-spin')} />
            <span className="hidden sm:inline">{isLoading ? 'Syncing…' : 'Refresh'}</span>
          </button>
        )}
        {profileUrl && (
          <button
            onClick={() => chrome.tabs.create({ url: profileUrl })}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-border-subtle hover:border-border bg-surface hover:bg-surface-elevated text-secondary hover:text-primary text-xs font-medium transition-all"
            title="View profile"
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">View profile</span>
          </button>
        )}
        {extraActions}
        {onDisconnect && (
          <button
            onClick={onDisconnect}
            className="p-2 rounded-xl border border-border-subtle hover:border-destructive/40 bg-surface hover:bg-destructive/5 text-muted hover:text-destructive transition-all"
            title="Disconnect"
          >
            <LogOut className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}

interface StatTabProps {
  icon: React.ElementType;
  label: string;
  count: number;
  highlight?: Highlight;
  isActive: boolean;
  onClick: () => void;
  /** Override the secondary line (defaults to "N items" / "All clear"). */
  hint?: string;
}

export function DashboardStatTab({
  icon: Icon,
  label,
  count,
  highlight = 'default',
  isActive,
  onClick,
  hint,
}: StatTabProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'group relative flex flex-col gap-3 p-4 rounded-xl border text-left transition-all duration-150',
        isActive
          ? 'border-accent/40 bg-accent/5'
          : 'border-border-subtle bg-surface hover:border-border hover:bg-surface-elevated'
      )}
    >
      <div className="flex items-center justify-between">
        <div
          className={cn(
            'h-8 w-8 rounded-lg flex items-center justify-center',
            isActive ? 'bg-accent/15 text-accent' : HIGHLIGHT_TILE_BG[highlight]
          )}
        >
          <Icon className="h-4 w-4" />
        </div>
        <span
          className={cn(
            'text-[10px] font-semibold uppercase tracking-widest',
            isActive ? 'text-accent' : 'text-muted'
          )}
        >
          {label}
        </span>
      </div>

      <div>
        <div
          className={cn(
            'text-2xl font-bold tracking-tight',
            isActive ? 'text-accent' : 'text-primary'
          )}
        >
          {count}
        </div>
        <div
          className={cn(
            'text-xs mt-0.5 transition-colors',
            isActive ? 'text-accent/80' : 'text-muted'
          )}
        >
          {hint ?? (count === 0 ? 'All clear' : count === 1 ? '1 item' : `${count} items`)}
        </div>
      </div>
    </button>
  );
}

interface EmptyStateProps {
  icon: React.ElementType;
  title: string;
  hint?: string;
}

export function DashboardEmptyState({ icon: Icon, title, hint }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="h-12 w-12 rounded-xl bg-surface-elevated border border-border-subtle flex items-center justify-center mb-3">
        <Icon className="h-5 w-5 text-muted" />
      </div>
      <p className="text-sm font-semibold text-primary">{title}</p>
      {hint && <p className="text-xs text-muted mt-1 max-w-xs">{hint}</p>}
    </div>
  );
}

interface ContentCardProps {
  icon: React.ElementType;
  label: string;
  count: number;
  isLoading?: boolean;
  onRefresh?: () => void;
  children: React.ReactNode;
}

export function DashboardContentCard({
  icon: Icon,
  label,
  count,
  isLoading,
  onRefresh,
  children,
}: ContentCardProps) {
  return (
    <div className="rounded-xl border border-border-subtle bg-surface overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border-subtle">
        <div className="flex items-center gap-2.5">
          <Icon className="h-4 w-4 text-accent" />
          <h2 className="text-sm font-semibold text-primary">{label}</h2>
          <span className="text-xs text-muted">
            {count === 0 ? '· nothing here' : `· ${count} ${count === 1 ? 'item' : 'items'}`}
          </span>
        </div>
        {onRefresh && (
          <button
            onClick={onRefresh}
            disabled={isLoading}
            className="text-xs text-muted hover:text-accent transition-colors flex items-center gap-1.5"
            title="Refresh"
          >
            <RefreshCw className={cn('h-3 w-3', isLoading && 'animate-spin')} />
          </button>
        )}
      </div>
      <div className="p-3 min-h-[280px]">{children}</div>
    </div>
  );
}

interface ErrorBannerProps {
  message: string;
}

export function DashboardErrorBanner({ message }: ErrorBannerProps) {
  return (
    <div className="flex items-center gap-2 text-xs text-destructive bg-destructive/10 border border-destructive/20 rounded-xl px-4 py-2">
      <AlertCircle className="h-3.5 w-3.5 flex-shrink-0" />
      {message}
    </div>
  );
}

interface LoadingProps {
  size?: 'sm' | 'md' | 'lg';
}

export function DashboardLoading({ size = 'md' }: LoadingProps) {
  return (
    <div className="flex items-center justify-center py-16">
      <Spinner size={size} />
    </div>
  );
}

/* Animated wrapper for tab content (use as a child of `<AnimatePresence mode="wait">`). */
interface TabPanelProps {
  tabKey: string;
  children: React.ReactNode;
}

export function DashboardTabPanel({ tabKey, children }: TabPanelProps) {
  return (
    <motion.div
      key={tabKey}
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -6 }}
      transition={{ duration: 0.18 }}
      className="space-y-2"
    >
      {children}
    </motion.div>
  );
}

/* ─────────────────────────── Row primitive ───────────────────────────
 * A generic "premium row" wrapper with a colored left state bar and a
 * subtle hover affordance. Each connector reuses this so PR rows, issue
 * rows, event rows, channel rows all look consistent.
 */

interface RowProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** Tailwind bg class for the left state bar (e.g. "bg-accent"). */
  stateBarClass?: string;
  children: React.ReactNode;
}

export function DashboardRow({ stateBarClass, className, children, ...props }: RowProps) {
  return (
    <button
      {...props}
      className={cn(
        'group relative w-full flex items-start gap-3 p-4 rounded-xl border border-border-subtle bg-surface hover:bg-surface-elevated hover:border-border transition-all duration-150 text-left',
        className
      )}
    >
      {stateBarClass && (
        <span className={cn('absolute left-0 top-3 bottom-3 w-1 rounded-r-full', stateBarClass)} />
      )}
      {children}
    </button>
  );
}

export const DASHBOARD_MAX_WIDTH_CLASS = 'max-w-[1400px] mx-auto w-full';
