import { useEffect } from 'react';
import { ArrowRight, ExternalLink, RefreshCw, Calendar, Video, MapPin, Clock } from 'lucide-react';
import { motion } from 'framer-motion';
import { useGoogleCalendarAuthStore } from '@/store/googleCalendarAuth.store';
import { cn } from '@/lib/utils';

const GCAL_BLUE = '#4285F4';

interface CalendarOverviewProps {
  onNavigate: (section: string) => void;
}

function formatTime(iso?: string): string {
  if (!iso) return 'All day';
  return new Date(iso).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  });
}

function isHappeningNow(start?: string, end?: string): boolean {
  if (!start || !end) return false;
  const now = Date.now();
  return new Date(start).getTime() <= now && new Date(end).getTime() >= now;
}

export function CalendarOverview({ onNavigate }: CalendarOverviewProps) {
  const {
    isConnected,
    isInitializing,
    isLoading,
    todayEvents,
    upcomingEvents,
    refresh,
    loadConnection,
  } = useGoogleCalendarAuthStore();

  useEffect(() => {
    loadConnection();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (isInitializing) return null;

  if (!isConnected) {
    return (
      <div className="card p-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div
            className="p-2 rounded-xl flex-shrink-0"
            style={{ backgroundColor: `${GCAL_BLUE}1a` }}
          >
            <Calendar className="h-4 w-4" style={{ color: GCAL_BLUE }} />
          </div>
          <div>
            <p className="text-sm font-medium text-primary">Calendar</p>
            <p className="text-xs text-muted">Connect Google Calendar to see today's schedule</p>
          </div>
        </div>
        <button
          onClick={() => onNavigate('google-calendar')}
          className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium bg-accent/10 text-accent hover:bg-accent/20 transition-colors"
        >
          Connect <ArrowRight className="h-3 w-3" />
        </button>
      </div>
    );
  }

  const all = [...todayEvents, ...upcomingEvents];
  // Find the next event we should highlight
  const now = Date.now();
  const upcoming = all
    .filter((e) => {
      const end = e.end.dateTime || e.end.date;
      return end ? new Date(end).getTime() >= now : true;
    })
    .slice(0, 5);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4" style={{ color: GCAL_BLUE }} />
          <span className="section-title">Today</span>
          {todayEvents.length > 0 && (
            <span
              className="px-1.5 py-0.5 rounded-full text-xs font-medium"
              style={{ backgroundColor: `${GCAL_BLUE}1a`, color: GCAL_BLUE }}
            >
              {todayEvents.length}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={refresh}
            disabled={isLoading}
            className="text-muted hover:text-secondary transition-colors"
            title="Refresh"
          >
            <RefreshCw className={cn('h-3.5 w-3.5', isLoading && 'animate-spin')} />
          </button>
          <button
            onClick={() => onNavigate('google-calendar')}
            className="text-xs text-muted hover:text-accent transition-colors"
          >
            View all →
          </button>
        </div>
      </div>

      {isLoading && upcoming.length === 0 ? (
        <div className="grid grid-cols-1 gap-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-14 rounded-xl bg-surface-elevated animate-pulse" />
          ))}
        </div>
      ) : upcoming.length === 0 ? (
        <div className="card p-4 flex items-center gap-3 text-muted">
          <Calendar className="h-5 w-5 opacity-40" />
          <p className="text-sm">Nothing on your calendar — enjoy 🎉</p>
        </div>
      ) : (
        <div className="space-y-1.5">
          {upcoming.map((event) => {
            const start = event.start.dateTime || event.start.date;
            const end = event.end.dateTime || event.end.date;
            const live = isHappeningNow(event.start.dateTime, event.end.dateTime);
            return (
              <button
                key={event.id}
                onClick={() => chrome.tabs.create({ url: event.htmlLink })}
                className={cn(
                  'w-full flex items-start gap-3 p-3 rounded-xl border bg-surface hover:bg-surface-elevated transition-all duration-150 text-left group',
                  live
                    ? 'border-success/40 hover:border-success/60'
                    : 'border-border-subtle hover:border-border'
                )}
              >
                <div
                  className={cn(
                    'flex-shrink-0 mt-0.5 flex flex-col items-center justify-center w-12 rounded-md py-1 text-xs font-mono',
                    live ? 'bg-success/10 text-success' : 'bg-surface-elevated text-secondary'
                  )}
                >
                  <Clock className="h-3 w-3 mb-0.5 opacity-60" />
                  <span className="leading-none">{formatTime(event.start.dateTime)}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-primary group-hover:text-accent truncate transition-colors">
                    {event.summary || '(no title)'}
                  </p>
                  <div className="flex items-center gap-2 mt-0.5 text-xs text-muted flex-wrap">
                    {live && (
                      <span className="flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-success/10 text-success text-xs font-medium">
                        <span className="h-1.5 w-1.5 rounded-full bg-success animate-pulse" />
                        Live now
                      </span>
                    )}
                    {start && end && (
                      <span>
                        {formatTime(event.start.dateTime)} – {formatTime(event.end.dateTime)}
                      </span>
                    )}
                    {event.location && (
                      <span className="flex items-center gap-1 truncate max-w-[160px]">
                        <MapPin className="h-3 w-3" />
                        {event.location}
                      </span>
                    )}
                    {event.hangoutLink && (
                      <span className="flex items-center gap-1 text-accent">
                        <Video className="h-3 w-3" />
                        Meet
                      </span>
                    )}
                  </div>
                </div>
                <ExternalLink className="h-3.5 w-3.5 text-muted opacity-0 group-hover:opacity-100 flex-shrink-0 transition-opacity mt-0.5" />
              </button>
            );
          })}
        </div>
      )}
    </motion.div>
  );
}
