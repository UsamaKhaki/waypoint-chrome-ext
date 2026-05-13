import { X, Info } from 'lucide-react';
import { useState } from 'react';
import { useWorkspaceStore } from '@/store/workspace.store';
import { WORKSPACE_CONFIGS } from '@/constants';
import { cn } from '@/lib/utils';

export function WorkspaceModeIndicator() {
  const { currentMode, setMode } = useWorkspaceStore();
  const [dismissed, setDismissed] = useState(false);

  if (currentMode === 'default' || dismissed) return null;

  const config = WORKSPACE_CONFIGS[currentMode];

  return (
    <div
      className={cn(
        'flex items-center gap-3 px-4 py-2 rounded-xl text-xs mb-6',
        'bg-accent/5 border border-accent/20 text-secondary'
      )}
    >
      <Info className="h-3.5 w-3.5 text-accent flex-shrink-0" />
      <span>
        <span className="text-primary font-medium capitalize">
          {currentMode.replace(/-/g, ' ')} mode
        </span>
        {' — '}
        {config.description}
      </span>
      <div className="ml-auto flex items-center gap-2">
        <button
          onClick={() => setMode('default')}
          className="text-accent hover:text-accent-hover text-xs font-medium transition-colors"
        >
          Reset
        </button>
        <button
          onClick={() => setDismissed(true)}
          className="text-muted hover:text-secondary transition-colors"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
