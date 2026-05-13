import { useState, useEffect } from 'react';

export function ClockWidget() {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const time = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
  const seconds = String(now.getSeconds()).padStart(2, '0');
  const day = now.toLocaleDateString([], { weekday: 'long' });
  const date = now.toLocaleDateString([], { month: 'long', day: 'numeric', year: 'numeric' });

  return (
    <div className="flex flex-col justify-center h-full gap-1 py-1">
      <div className="flex items-end gap-1.5">
        <span
          className="text-4xl font-semibold text-primary tabular-nums leading-none tracking-tight"
          style={{ fontFamily: "'JetBrains Mono', monospace" }}
        >
          {time}
        </span>
        <span
          className="text-lg font-medium text-muted tabular-nums leading-none mb-0.5"
          style={{ fontFamily: "'JetBrains Mono', monospace" }}
        >
          {seconds}
        </span>
      </div>
      <p className="text-sm text-secondary">{day}</p>
      <p className="text-xs text-muted">{date}</p>
    </div>
  );
}
