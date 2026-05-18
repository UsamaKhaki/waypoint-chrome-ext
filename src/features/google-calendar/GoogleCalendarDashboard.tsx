import { useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import {
  CalendarDays,
  MapPin,
  Video,
  Users,
  ChevronRight,
  Clock,
  Calendar as CalendarIcon,
} from 'lucide-react';
import { useGoogleCalendarAuthStore } from '@/store/googleCalendarAuth.store';
import { cn } from '@/lib/utils';
import type { CalendarEvent } from '@/services/googleCalendarApi';
import {
  DashboardHero,
  DashboardStatTab,
  DashboardEmptyState,
  DashboardContentCard,
  DashboardErrorBanner,
  DashboardLoading,
  DashboardTabPanel,
  DashboardRow,
  DASHBOARD_MAX_WIDTH_CLASS,
} from '@/features/shared/DashboardShell';

const COLOR_ID_MAP: Record<string, string> = {
  '1': '#ac725e',
  '2': '#d06c64',
  '3': '#f83a22',
  '4': '#fa573c',
  '5': '#ff7537',
  '6': '#ffad46',
  '7': '#42d692',
  '8': '#16a765',
  '9': '#7bd148',
  '10': '#51b749',
  '11': '#dc2127',
};

function eventColor(colorId?: string): string {
  return colorId ? (COLOR_ID_MAP[colorId] ?? '#6366f1') : '#6366f1';
}

function formatTime(event: CalendarEvent): string {
  if (event.start.date) return 'All day';
  if (!event.start.dateTime) return '';
  return new Date(event.start.dateTime).toLocaleTimeString([], {
    hour: 'numeric',
    minute: '2-digit',
  });
}

function formatTimeRange(event: CalendarEvent): string {
  if (event.start.date) return 'All day';
  const start = event.start.dateTime;
  const end = event.end.dateTime;
  if (!start || !end) return formatTime(event);
  const fmt = (s: string) =>
    new Date(s).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  return `${fmt(start)} – ${fmt(end)}`;
}

function formatDate(event: CalendarEvent): string {
  const raw = event.start.dateTime ?? event.start.date ?? '';
  if (!raw) return '';
  const date = new Date(raw);
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);
  if (date.toDateString() === today.toDateString()) return 'Today';
  if (date.toDateString() === tomorrow.toDateString()) return 'Tomorrow';
  return date.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' });
}

function isHappeningNow(event: CalendarEvent): boolean {
  const start = event.start.dateTime;
  const end = event.end.dateTime;
  if (!start || !end) return false;
  const now = Date.now();
  return new Date(start).getTime() <= now && new Date(end).getTime() >= now;
}

function EventRow({ event }: { event: CalendarEvent }) {
  const dot = eventColor(event.colorId);
  const live = isHappeningNow(event);

  return (
    <DashboardRow
      stateBarClass={live ? 'bg-success' : undefined}
      onClick={() => chrome.tabs.create({ url: event.htmlLink })}
    >
      {/* Time tile */}
      <div
        className={cn(
          'pl-2 flex-shrink-0 flex flex-col items-center justify-center w-16 rounded-lg py-1.5 text-[11px] font-mono',
          live
            ? 'bg-success/10 text-success border border-success/30'
            : 'bg-surface-elevated text-secondary'
        )}
      >
        <Clock className="h-3 w-3 mb-0.5 opacity-60" />
        <span className="leading-tight whitespace-nowrap">{formatTime(event)}</span>
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span
            className="h-2.5 w-2.5 rounded-full flex-shrink-0"
            style={{ backgroundColor: dot }}
          />
          <p className="text-sm font-semibold text-primary group-hover:text-accent transition-colors truncate">
            {event.summary || '(no title)'}
          </p>
          {live && (
            <span className="flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-success/10 text-success text-[10px] font-semibold uppercase tracking-wider border border-success/30">
              <span className="h-1.5 w-1.5 rounded-full bg-success animate-pulse" />
              Live
            </span>
          )}
        </div>
        <div className="flex items-center gap-3 mt-1 text-xs text-muted flex-wrap">
          <span>{formatDate(event)}</span>
          <span>·</span>
          <span>{formatTimeRange(event)}</span>
          {event.location && (
            <>
              <span>·</span>
              <span className="flex items-center gap-1 truncate max-w-[200px]">
                <MapPin className="h-3 w-3 flex-shrink-0" />
                {event.location}
              </span>
            </>
          )}
          {event.attendees && event.attendees.length > 0 && (
            <>
              <span>·</span>
              <span className="flex items-center gap-1">
                <Users className="h-3 w-3" />
                {event.attendees.length}
              </span>
            </>
          )}
        </div>
      </div>

      {event.hangoutLink ? (
        <button
          onClick={(e) => {
            e.stopPropagation();
            chrome.tabs.create({ url: event.hangoutLink! });
          }}
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-success/10 text-success hover:bg-success/20 border border-success/30 transition-colors text-xs font-medium"
          title="Join Google Meet"
        >
          <Video className="h-3.5 w-3.5" />
          Join
        </button>
      ) : (
        <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity text-xs text-muted">
          <span>Open</span>
          <ChevronRight className="h-3 w-3" />
        </div>
      )}
    </DashboardRow>
  );
}

type Tab = 'today' | 'upcoming';

export function GoogleCalendarDashboard() {
  const { userProfile, todayEvents, upcomingEvents, isLoading, error, refresh, disconnect } =
    useGoogleCalendarAuthStore();
  const [activeTab, setActiveTab] = useState<Tab>('today');

  if (!userProfile && isLoading) return <DashboardLoading size="lg" />;

  const tabs = [
    {
      id: 'today' as Tab,
      label: 'Today',
      icon: CalendarDays,
      count: todayEvents.length,
      highlight: 'accent' as const,
    },
    {
      id: 'upcoming' as Tab,
      label: 'Upcoming',
      icon: CalendarIcon,
      count: upcomingEvents.length,
      highlight: 'default' as const,
    },
  ];

  const active = tabs.find((t) => t.id === activeTab)!;
  const eventList = activeTab === 'today' ? todayEvents : upcomingEvents;

  const emptyMessages: Record<Tab, { title: string; hint: string }> = {
    today: { title: 'Nothing scheduled today', hint: 'Enjoy the quiet — your day is open.' },
    upcoming: {
      title: 'No upcoming events',
      hint: 'Future events from your primary calendar will show up here.',
    },
  };
  const empty = emptyMessages[activeTab];

  return (
    <div
      data-testid="google-calendar-dashboard"
      className={cn('p-6 space-y-6', DASHBOARD_MAX_WIDTH_CLASS)}
    >
      <DashboardHero
        avatar={userProfile?.picture}
        avatarFallback={<CalendarDays className="h-7 w-7 text-muted" />}
        name={userProfile?.name || ''}
        subtitle={userProfile?.email}
        isLoading={isLoading}
        onRefresh={refresh}
        onDisconnect={disconnect}
      />

      <div className="grid grid-cols-2 gap-3">
        {tabs.map((tab) => (
          <DashboardStatTab
            key={tab.id}
            icon={tab.icon}
            label={tab.label}
            count={tab.count}
            highlight={tab.highlight}
            isActive={activeTab === tab.id}
            onClick={() => setActiveTab(tab.id)}
          />
        ))}
      </div>

      {error && <DashboardErrorBanner message={error} />}

      <DashboardContentCard
        icon={active.icon}
        label={active.label}
        count={active.count}
        isLoading={isLoading}
        onRefresh={refresh}
      >
        <AnimatePresence mode="wait">
          <DashboardTabPanel tabKey={activeTab}>
            {isLoading && eventList.length === 0 ? (
              <DashboardLoading />
            ) : eventList.length === 0 ? (
              <DashboardEmptyState icon={CalendarDays} title={empty.title} hint={empty.hint} />
            ) : (
              <div className="space-y-2">
                {eventList.map((event) => (
                  <EventRow key={event.id} event={event} />
                ))}
              </div>
            )}
          </DashboardTabPanel>
        </AnimatePresence>
      </DashboardContentCard>
    </div>
  );
}
