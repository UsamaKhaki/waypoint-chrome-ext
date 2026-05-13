import { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw } from 'lucide-react';
import { cn } from '@/lib/utils';

type Mode = 'focus' | 'break';
type State = 'idle' | 'running' | 'paused';

const FOCUS_SECS = 25 * 60;
const BREAK_SECS = 5 * 60;
const RADIUS = 32;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export function PomodoroWidget() {
  const [mode, setMode] = useState<Mode>('focus');
  const [timerState, setTimerState] = useState<State>('idle');
  const [remaining, setRemaining] = useState(FOCUS_SECS);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const total = mode === 'focus' ? FOCUS_SECS : BREAK_SECS;

  const stop = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = null;
  };

  useEffect(() => {
    if (timerState === 'running') {
      intervalRef.current = setInterval(() => {
        setRemaining((r) => {
          if (r <= 1) {
            stop();
            const next: Mode = mode === 'focus' ? 'break' : 'focus';
            setMode(next);
            setTimerState('idle');
            const nextSecs = next === 'focus' ? FOCUS_SECS : BREAK_SECS;
            setRemaining(nextSecs);
            try {
              if (typeof chrome !== 'undefined' && chrome.notifications) {
                chrome.notifications.create({
                  type: 'basic',
                  iconUrl: '/icon-128.png',
                  title: 'Waypoint',
                  message:
                    next === 'break' ? 'Focus done. Take a break.' : 'Break over. Back to work.',
                });
              }
            } catch {
              /* outside extension context */
            }
            return nextSecs;
          }
          return r - 1;
        });
      }, 1000);
    } else {
      stop();
    }
    return stop;
  }, [timerState, mode]);

  const handleReset = () => {
    stop();
    setTimerState('idle');
    setRemaining(mode === 'focus' ? FOCUS_SECS : BREAK_SECS);
  };

  const mins = String(Math.floor(remaining / 60)).padStart(2, '0');
  const secs = String(remaining % 60).padStart(2, '0');
  const progress = remaining / total;
  const dashOffset = CIRCUMFERENCE * (1 - progress);
  const isRunning = timerState === 'running';

  return (
    <div className="flex items-center gap-5 h-full py-1">
      {/* Ring */}
      <div className="relative flex-shrink-0">
        <svg width="80" height="80" className="-rotate-90">
          <circle
            cx="40"
            cy="40"
            r={RADIUS}
            fill="none"
            strokeWidth="3"
            stroke="hsl(var(--surface-elevated))"
          />
          <circle
            cx="40"
            cy="40"
            r={RADIUS}
            fill="none"
            strokeWidth="3"
            stroke={mode === 'focus' ? 'hsl(var(--accent))' : 'hsl(var(--success))'}
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={dashOffset}
            strokeLinecap="round"
            style={{ transition: 'stroke-dashoffset 0.5s ease' }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span
            className="text-base font-semibold text-primary tabular-nums leading-none"
            style={{ fontFamily: "'JetBrains Mono', monospace" }}
          >
            {mins}:{secs}
          </span>
        </div>
      </div>

      {/* Info + controls */}
      <div className="flex flex-col gap-3 flex-1 min-w-0">
        <div>
          <p className="text-sm font-medium text-primary capitalize">
            {mode === 'focus' ? 'Focus' : 'Break'}
          </p>
          <p className="text-xs text-muted">
            {mode === 'focus' ? '25 min session' : '5 min break'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setTimerState(isRunning ? 'paused' : 'running')}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all',
              isRunning
                ? 'bg-surface-elevated text-secondary hover:text-primary'
                : 'bg-accent/10 text-accent hover:bg-accent/15'
            )}
          >
            {isRunning ? (
              <>
                <Pause className="h-3 w-3" /> Pause
              </>
            ) : (
              <>
                <Play className="h-3 w-3" /> {timerState === 'paused' ? 'Resume' : 'Start'}
              </>
            )}
          </button>
          {timerState !== 'idle' && (
            <button
              onClick={handleReset}
              className="flex items-center justify-center h-7 w-7 rounded-lg text-muted hover:text-primary hover:bg-surface-elevated transition-colors"
            >
              <RotateCcw className="h-3 w-3" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
