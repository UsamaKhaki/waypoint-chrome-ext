import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CalendarDays, RefreshCw, LogOut, MapPin, Video, Users, ExternalLink } from 'lucide-react';
import { useGoogleCalendarAuthStore } from '@/store/googleCalendarAuth.store';
import { Spinner } from '@/components/ui/Spinner';
import { cn } from '@/lib/utils';
import type { CalendarEvent } from '@/services/googleCalendarApi';

// Maps Google Calendar colorId (1–11) to CSS color values
const COLOR_ID_MAP: Record<string, string> = {
  '1': '#ac725e', // Tomato
  '2': '#d06c64', // Flamingo
  '3': '#f83a22', // Tangerine
  '4': '#fa573c', // Banana
  '5': '#ff7537', // Sage
  '6': '#ffad46', // Basil
  '7': '#42d692', // Peacock
  '8': '#16a765', // Blueberry
  '9': '#7bd148', // Lavender
  '10': '#51b749', // Grape
  '11': '#dc2127', // Graphite
};

function eventColor(colorId?: string): string {
  return colorId ? (COLOR_ID_MAP[colorId] ?? '#6366f1') : '#6366f1';
}

function formatTime(event: CalendarEvent): string {
  if (event.start.date) return 'All day';
  if (!event.start.dateTime) return '';
  const date = new Date(event.start.dateTime);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function formatDate(event: CalendarEvent): string {
  if (!event.start.dateTime && !event.start.date) return '';
  const raw = event.start.dateTime ?? event.start.date ?? '';
  const date = new Date(raw);
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);

  if (date.toDateString() === today.toDateString()) return 'Today';
  if (date.toDateString() === tomorrow.toDateString()) return 'Tomorrow';
  return date.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' });
}

function EventCard({ event }: { event: CalendarEvent }) {
  const dot = eventColor(event.colorId);

  return (
    <button
      onClick={() => chrome.tabs.create({ url: event.htmlLink })}
      className="w-full flex items-start gap-3 p-3 rounded-xl hover:bg-surface-elevated transition-colors text-left group"
    >
      {/* Color dot */}
      <div className="h-3 w-3 rounded-full flex-shrink-0 mt-1" style={{ backgroundColor: dot }} />

      <div className="flex-1 min-w-0">
        {/* Title */}
        <p className="text-sm font-medium text-primary group-hover:text-accent transition-colors truncate">
          {event.summary}
        </p>

        {/* Time + date */}
        <div className="flex items-center gap-2 mt-0.5 text-xs text-muted flex-wrap">
          <span>{formatTime(event)}</span>
          <span className="opacity-50">·</span>
          <span>{formatDate(event)}</span>
        </div>

        {/* Location */}
        {event.location && (
          <div className="flex items-center gap-1 mt-1 text-xs text-muted">
            <MapPin className="h-3 w-3 flex-shrink-0" />
            <span className="truncate max-w-[200px]">{event.location}</span>
          </div>
        )}

        {/* Attendee count */}
        {event.attendees && event.attendees.length > 0 && (
          <div className="flex items-center gap-1 mt-1 text-xs text-muted">
            <Users className="h-3 w-3" />
            <span>
              {event.attendees.length} attendee{event.attendees.length !== 1 ? 's' : ''}
            </span>
          </div>
        )}
      </div>

      {/* Meet link button */}
      {event.hangoutLink && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            chrome.tabs.create({ url: event.hangoutLink! });
          }}
          className="p-1.5 rounded-lg bg-success/10 text-success hover:bg-success/20 transition-colors flex-shrink-0"
          title="Join Google Meet"
        >
          <Video className="h-3.5 w-3.5" />
        </button>
      )}

      <ExternalLink className="h-3.5 w-3.5 text-muted opacity-0 group-hover:opacity-100 flex-shrink-0 mt-0.5 transition-opacity" />
    </button>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <CalendarDays className="h-8 w-8 text-muted mb-3 opacity-40" />
      <p className="text-sm text-muted">{text}</p>
    </div>
  );
}

type Tab = 'today' | 'upcoming';

export function GoogleCalendarDashboard() {
  const { userProfile, todayEvents, upcomingEvents, isLoading, error, refresh, disconnect } =
    useGoogleCalendarAuthStore();

  const [activeTab, setActiveTab] = useState<Tab>('today');

  if (!userProfile && isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spinner size="lg" />
      </div>
    );
  }

  const tabs: { id: Tab; label: string; count: number }[] = [
    { id: 'today', label: 'Today', count: todayEvents.length },
    { id: 'upcoming', label: 'Upcoming', count: upcomingEvents.length },
  ];

  const eventList = (): CalendarEvent[] => (activeTab === 'today' ? todayEvents : upcomingEvents);

  const emptyMessages: Record<Tab, string> = {
    today: 'No events scheduled for today',
    upcoming: 'No upcoming events this week',
  };

  return (
    <div data-testid="google-calendar-dashboard" className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {userProfile?.picture && (
            <img
              src={userProfile.picture}
              alt={userProfile.name}
              className="h-10 w-10 rounded-full border-2 border-border"
            />
          )}
          <div>
            <h1 className="text-lg font-semibold text-primary">{userProfile?.name}</h1>
            <p className="text-xs text-muted">{userProfile?.email}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={refresh}
            disabled={isLoading}
            className="p-2 rounded-xl hover:bg-surface-elevated text-muted hover:text-primary transition-all"
            title="Refresh"
          >
            <RefreshCw className={cn('h-4 w-4', isLoading && 'animate-spin')} />
          </button>
          <button
            onClick={disconnect}
            className="p-2 rounded-xl hover:bg-surface-elevated text-muted hover:text-destructive transition-all"
            title="Disconnect"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Tab strip / stats */}
      <div className="grid grid-cols-2 gap-2">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              'flex flex-col items-center gap-1 p-3 rounded-xl border transition-all duration-150',
              activeTab === tab.id
                ? 'bg-accent/10 border-accent/30 text-accent'
                : 'bg-surface border-border-subtle text-secondary hover:border-border hover:bg-surface-elevated'
            )}
          >
            <CalendarDays className="h-4 w-4" />
            <span className="text-lg font-bold">{tab.count}</span>
            <span className="text-xs opacity-80">{tab.label}</span>
          </button>
        ))}
      </div>

      {error && (
        <div className="text-xs text-destructive bg-destructive/10 rounded-xl px-4 py-2">
          {error}
        </div>
      )}

      {/* Tab content */}
      <div className="card p-2 min-h-[300px]">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15 }}
          >
            {isLoading && todayEvents.length === 0 ? (
              <div className="flex items-center justify-center py-12">
                <Spinner size="md" />
              </div>
            ) : eventList().length === 0 ? (
              <EmptyState text={emptyMessages[activeTab]} />
            ) : (
              eventList().map((event) => <EventCard key={event.id} event={event} />)
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
