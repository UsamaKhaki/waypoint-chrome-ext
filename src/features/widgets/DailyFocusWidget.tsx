import { useState, useCallback, useEffect } from 'react';
import { Plus, Trash2, CheckCircle2, Circle, Target, FileText, Flag } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useWorkspaceStore } from '@/store/workspace.store';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { cn } from '@/lib/utils';
import { debounce } from '@/utils';
import { PanelShell, PanelHeader, PanelEmptyState } from '@/features/shared/PanelShell';

export function DailyFocusWidget() {
  const { dailyFocus, addPriority, togglePriority, removePriority, updateNotes, updateGoals } =
    useWorkspaceStore();
  const [newPriority, setNewPriority] = useState('');
  const [notes, setNotes] = useState(dailyFocus?.notes ?? '');
  const [goals, setGoals] = useState(dailyFocus?.goals ?? '');
  const [activeTab, setActiveTab] = useState<'priorities' | 'notes' | 'goals'>('priorities');

  // Sync local state when store changes on mount
  useEffect(() => {
    if (dailyFocus) {
      setNotes(dailyFocus.notes);
      setGoals(dailyFocus.goals);
    }
  }, [dailyFocus?.date]); // only on date change (new day)

  // Auto-save notes with debounce
  const saveNotes = useCallback(
    debounce((...args: unknown[]) => updateNotes(args[0] as string), 800),
    [updateNotes]
  );
  const saveGoals = useCallback(
    debounce((...args: unknown[]) => updateGoals(args[0] as string), 800),
    [updateGoals]
  );

  const handleNotesChange = (v: string) => {
    setNotes(v);
    saveNotes(v);
  };

  const handleGoalsChange = (v: string) => {
    setGoals(v);
    saveGoals(v);
  };

  const handleAddPriority = async () => {
    if (!newPriority.trim()) return;
    await addPriority(newPriority.trim());
    setNewPriority('');
  };

  const priorities = dailyFocus?.priorities ?? [];
  const completed = priorities.filter((p) => p.isCompleted).length;
  const total = priorities.length;

  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  const tabs = [
    { id: 'priorities', label: 'Priorities', icon: Flag },
    { id: 'notes', label: 'Notes', icon: FileText },
    { id: 'goals', label: 'Goals', icon: Target },
  ] as const;

  return (
    <PanelShell testId="focus-panel">
      <PanelHeader
        icon={Target}
        title="Daily Focus"
        subtitle={today}
        actions={
          total > 0 && (
            <div className="flex flex-col items-end gap-1.5">
              <span className="text-xs text-muted font-medium">
                {completed}/{total} done · {Math.round((completed / total) * 100)}%
              </span>
              <div className="w-32 h-1.5 bg-surface-elevated rounded-full overflow-hidden">
                <div
                  className="h-full bg-accent rounded-full transition-all duration-500"
                  style={{ width: `${total ? (completed / total) * 100 : 0}%` }}
                />
              </div>
            </div>
          )
        }
      />

      {/* Tabs */}
      <div className="flex items-center gap-1 bg-surface-elevated rounded-xl p-1 w-fit">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              data-testid={`focus-tab-${tab.id}`}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-150',
                activeTab === tab.id
                  ? 'bg-accent/10 text-accent'
                  : 'text-muted hover:text-secondary'
              )}
            >
              <Icon className="h-3 w-3" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Content */}
      <AnimatePresence mode="wait">
        {activeTab === 'priorities' && (
          <motion.div
            key="priorities"
            initial={{ opacity: 0, x: -4 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 4 }}
            transition={{ duration: 0.15 }}
            className="space-y-3"
          >
            {/* Add input */}
            <div className="flex gap-2">
              <Input
                data-testid="priority-input"
                placeholder="Add a priority for today..."
                value={newPriority}
                onChange={(e) => setNewPriority(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddPriority()}
              />
              <Button onClick={handleAddPriority} size="md" variant="outline">
                <Plus className="h-4 w-4" />
              </Button>
            </div>

            {/* Empty state */}
            {priorities.length === 0 && (
              <PanelEmptyState
                icon={Flag}
                title="No priorities yet"
                hint="Add what matters most today — keep the list short and intentional."
              />
            )}

            {/* Priority list */}
            <div className="space-y-2">
              <AnimatePresence>
                {priorities.map((item) => (
                  <motion.div
                    key={item.id}
                    data-testid={`priority-item-${item.id}`}
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.15 }}
                    className="group flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-surface-elevated transition-colors"
                  >
                    <button
                      data-testid={`priority-check-${item.id}`}
                      onClick={() => togglePriority(item.id)}
                      className="flex-shrink-0 transition-colors text-muted hover:text-accent"
                    >
                      {item.isCompleted ? (
                        <CheckCircle2 className="h-5 w-5 text-success" />
                      ) : (
                        <Circle className="h-5 w-5" />
                      )}
                    </button>
                    <span
                      className={cn(
                        'flex-1 text-sm transition-all',
                        item.isCompleted ? 'line-through text-muted' : 'text-primary'
                      )}
                    >
                      {item.text}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      className="opacity-0 group-hover:opacity-100 hover:text-destructive transition-all"
                      onClick={() => removePriority(item.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </motion.div>
        )}

        {activeTab === 'notes' && (
          <motion.div
            key="notes"
            initial={{ opacity: 0, x: -4 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 4 }}
            transition={{ duration: 0.15 }}
          >
            <textarea
              data-testid="focus-notes"
              value={notes}
              onChange={(e) => handleNotesChange(e.target.value)}
              placeholder="Write your notes for today... (markdown supported)"
              className="w-full h-72 rounded-xl bg-surface border border-border-subtle text-primary text-sm px-4 py-3 outline-none focus:border-accent resize-none font-mono transition-all duration-150 placeholder:text-muted"
            />
            <p className="text-xs text-muted mt-1.5 text-right">Auto-saved</p>
          </motion.div>
        )}

        {activeTab === 'goals' && (
          <motion.div
            key="goals"
            initial={{ opacity: 0, x: -4 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 4 }}
            transition={{ duration: 0.15 }}
          >
            <div className="card mb-4 p-4">
              <p className="text-xs text-muted mb-2 flex items-center gap-1.5">
                <Target className="h-3.5 w-3.5" />
                What do you want to achieve today?
              </p>
              <textarea
                value={goals}
                onChange={(e) => handleGoalsChange(e.target.value)}
                placeholder="e.g. Ship the auth feature, review 3 PRs, finish sprint planning..."
                className="w-full h-32 bg-transparent text-primary text-sm outline-none resize-none placeholder:text-muted"
              />
            </div>
            <p className="text-xs text-muted text-right">Auto-saved</p>
          </motion.div>
        )}
      </AnimatePresence>
    </PanelShell>
  );
}
