import { useState, useRef } from 'react';
import { Plus, Check } from 'lucide-react';
import { useWorkspaceStore } from '@/store/workspace.store';
import { cn } from '@/lib/utils';

export function GoalsWidget() {
  const dailyFocus = useWorkspaceStore((s) => s.dailyFocus);
  const addPriority = useWorkspaceStore((s) => s.addPriority);
  const togglePriority = useWorkspaceStore((s) => s.togglePriority);
  const [inputValue, setInputValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const priorities = dailyFocus?.priorities ?? [];
  const completed = priorities.filter((p) => p.isCompleted).length;
  const total = priorities.length;
  const progressPct = total > 0 ? (completed / total) * 100 : 0;

  const handleAdd = () => {
    const text = inputValue.trim();
    if (!text) return;
    addPriority(text);
    setInputValue('');
  };

  return (
    <div className="flex flex-col h-full gap-2">
      {/* Progress bar */}
      <div className="flex items-center gap-2">
        <div className="flex-1 h-1.5 bg-surface-elevated rounded-full overflow-hidden">
          <div
            className="h-full bg-accent rounded-full transition-all duration-300"
            style={{ width: `${progressPct}%` }}
          />
        </div>
        <span className="text-xs text-muted whitespace-nowrap">
          {completed}/{total}
        </span>
      </div>

      {/* Priority list */}
      <div className="flex-1 min-h-0 overflow-y-auto space-y-1">
        {priorities.length === 0 && (
          <p className="text-xs text-muted text-center py-4">No goals yet — add one below</p>
        )}
        {priorities.map((p) => (
          <button
            key={p.id}
            onClick={() => togglePriority(p.id)}
            className="w-full flex items-start gap-2 py-1.5 px-1 rounded-lg hover:bg-surface-elevated transition-colors text-left group"
          >
            <span
              className={cn(
                'mt-0.5 flex-shrink-0 h-4 w-4 rounded border flex items-center justify-center transition-colors',
                p.isCompleted
                  ? 'bg-accent border-accent text-white'
                  : 'border-border group-hover:border-accent/50'
              )}
            >
              {p.isCompleted && <Check className="h-2.5 w-2.5" />}
            </span>
            <span
              className={cn(
                'text-xs flex-1',
                p.isCompleted ? 'line-through text-muted' : 'text-primary'
              )}
            >
              {p.text}
            </span>
          </button>
        ))}
      </div>

      {/* Add priority inline */}
      <div className="flex gap-1.5 pt-1 border-t border-border-subtle">
        <input
          ref={inputRef}
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
          placeholder="Add a goal..."
          className="flex-1 bg-transparent text-xs text-primary placeholder:text-muted outline-none"
        />
        <button
          onClick={handleAdd}
          disabled={!inputValue.trim()}
          className="h-6 w-6 flex items-center justify-center rounded text-muted hover:text-accent disabled:opacity-40 transition-colors"
        >
          <Plus className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
