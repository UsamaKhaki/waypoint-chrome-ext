import { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, Coffee } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';
import { logActivity } from '@/store/activity.store';

type Phase = 'work' | 'short-break' | 'long-break';

const DURATIONS: Record<Phase, number> = {
  work: 25 * 60,
  'short-break': 5 * 60,
  'long-break': 15 * 60,
};

const PHASE_LABELS: Record<Phase, string> = {
  work: 'Focus',
  'short-break': 'Short Break',
  'long-break': 'Long Break',
};

const PHASE_COLORS: Record<Phase, string> = {
  work: 'text-accent',
  'short-break': 'text-success',
  'long-break': 'text-env-local',
};

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60)
    .toString()
    .padStart(2, '0');
  const s = (seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

export function PomodoroTimer() {
  const [phase, setPhase] = useState<Phase>('work');
  const [secondsLeft, setSecondsLeft] = useState(DURATIONS.work);
  const [isRunning, setIsRunning] = useState(false);
  const [sessions, setSessions] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const total = DURATIONS[phase];
  const progress = (secondsLeft / total) * 100;

  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        setSecondsLeft((s) => {
          if (s <= 1) {
            clearInterval(intervalRef.current!);
            setIsRunning(false);
            if (phase === 'work') {
              setSessions((n) => n + 1);
              logActivity({ type: 'focus_session', title: '25-minute focus session' });
            }
            return 0;
          }
          return s - 1;
        });
      }, 1000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isRunning, phase]);

  const switchPhase = (newPhase: Phase) => {
    setPhase(newPhase);
    setSecondsLeft(DURATIONS[newPhase]);
    setIsRunning(false);
  };

  const reset = () => {
    setSecondsLeft(DURATIONS[phase]);
    setIsRunning(false);
  };

  const circumference = 2 * Math.PI * 54;

  return (
    <div className="flex flex-col items-center gap-6 py-4">
      {/* Phase selector */}
      <div className="flex items-center gap-1 bg-surface-elevated rounded-xl p-1">
        {(Object.keys(PHASE_LABELS) as Phase[]).map((p) => (
          <button
            key={p}
            onClick={() => switchPhase(p)}
            className={cn(
              'px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-150',
              phase === p ? 'bg-accent/10 text-accent' : 'text-muted hover:text-secondary'
            )}
          >
            {PHASE_LABELS[p]}
          </button>
        ))}
      </div>

      {/* Circle timer */}
      <div className="relative">
        <svg width="128" height="128" className="rotate-[-90deg]">
          <circle
            cx="64"
            cy="64"
            r="54"
            fill="none"
            stroke="hsl(var(--surface-elevated))"
            strokeWidth="8"
          />
          <circle
            cx="64"
            cy="64"
            r="54"
            fill="none"
            stroke="hsl(var(--accent))"
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={circumference * (1 - progress / 100)}
            className="transition-all duration-1000"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={cn('text-2xl font-bold font-mono', PHASE_COLORS[phase])}>
            {formatTime(secondsLeft)}
          </span>
          <span className="text-xs text-muted mt-0.5">{PHASE_LABELS[phase]}</span>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={reset} title="Reset">
          <RotateCcw className="h-4 w-4" />
        </Button>
        <Button size="lg" onClick={() => setIsRunning((r) => !r)} className="w-24">
          {isRunning ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
          {isRunning ? 'Pause' : 'Start'}
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => switchPhase('short-break')}
          title="Take a break"
        >
          <Coffee className="h-4 w-4" />
        </Button>
      </div>

      {/* Session count */}
      {sessions > 0 && (
        <p className="text-xs text-muted">
          🍅 {sessions} session{sessions > 1 ? 's' : ''} completed today
        </p>
      )}
    </div>
  );
}
