import { useSnippetsStore } from '@/store/snippets.store';
import { useSessionsStore } from '@/store/sessions.store';
import { useGitHubAuthStore } from '@/store/githubAuth.store';

interface QuickStatsWidgetProps {
  onNavigate: (section: string) => void;
}

function Stat({ value, label, onClick }: { value: number; label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex flex-col flex-1 gap-1 py-2 px-3 rounded-xl hover:bg-surface-elevated transition-colors text-left group"
    >
      <span
        className="text-2xl font-semibold text-primary tabular-nums leading-none group-hover:text-accent transition-colors"
        style={{ fontFamily: "'JetBrains Mono', monospace" }}
      >
        {value}
      </span>
      <span className="text-xs text-muted">{label}</span>
    </button>
  );
}

export function QuickStatsWidget({ onNavigate }: QuickStatsWidgetProps) {
  const snippetCount = useSnippetsStore((s) => s.snippets.length);
  const sessionCount = useSessionsStore((s) => s.sessions.length);
  const prCount = useGitHubAuthStore((s) => s.myPRs.length);

  return (
    <div className="flex items-stretch h-full gap-1 -mx-1">
      <Stat value={snippetCount} label="Snippets" onClick={() => onNavigate('snippets')} />
      <div className="w-px bg-border-subtle self-stretch my-2" />
      <Stat value={sessionCount} label="Sessions" onClick={() => onNavigate('sessions')} />
      <div className="w-px bg-border-subtle self-stretch my-2" />
      <Stat value={prCount} label="Open PRs" onClick={() => onNavigate('github')} />
    </div>
  );
}
