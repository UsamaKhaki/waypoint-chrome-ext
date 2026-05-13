import { useState, useEffect } from 'react';
import { Plus, Trash2, ExternalLink, FolderOpen } from 'lucide-react';
import { useSessionsStore } from '@/store/sessions.store';
import { useSubscriptionStore } from '@/store/subscription.store';
import { SESSION_FREE_LIMIT, PRO_FEATURES } from '@/constants/subscription';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { UpgradePrompt } from '@/features/subscription';
import { cn } from '@/lib/utils';

export function SessionsPanel() {
  const { sessions, isLoading, load, saveCurrentTabs, restoreSession, deleteSession } =
    useSessionsStore();
  const plan = useSubscriptionStore((s) => s.plan);
  const openUpgradeModal = useSubscriptionStore((s) => s.openUpgradeModal);
  const isPro = plan === 'pro' || plan === 'team';

  const [saveName, setSaveName] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const atFreeLimit = !isPro && sessions.length >= SESSION_FREE_LIMIT;

  useEffect(() => {
    load();
  }, [load]);

  const handleSave = async () => {
    const name = saveName.trim() || `Session ${new Date().toLocaleDateString()}`;
    if (atFreeLimit) {
      openUpgradeModal(PRO_FEATURES.UNLIMITED_SNIPPETS);
      return;
    }
    setIsSaving(true);
    await saveCurrentTabs(name);
    setSaveName('');
    setIsSaving(false);
  };

  const handleDelete = (id: string) => {
    if (confirmDelete === id) {
      deleteSession(id);
      setConfirmDelete(null);
    } else {
      setConfirmDelete(id);
      setTimeout(() => setConfirmDelete(null), 3000);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-primary">Tab Sessions</h1>
          <p className="text-sm text-muted mt-0.5">Save and restore named tab sets</p>
        </div>
        {!isPro && (
          <span className="text-xs text-muted">
            {sessions.length}/{SESSION_FREE_LIMIT} sessions
          </span>
        )}
      </div>

      {/* Save current tabs */}
      <div className={cn('card p-4 space-y-3')}>
        <p className="text-sm font-medium text-secondary">Save current window</p>
        <div className="flex items-center gap-2">
          <Input
            placeholder="Session name (optional)"
            value={saveName}
            onChange={(e) => setSaveName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSave()}
            disabled={atFreeLimit}
            className="flex-1"
          />
          <Button
            onClick={handleSave}
            disabled={isSaving || isLoading}
            title={atFreeLimit ? 'Upgrade to Pro for unlimited sessions' : undefined}
            className="flex-shrink-0 h-9"
          >
            <Plus className="h-3.5 w-3.5" />
            Save
          </Button>
        </div>
        {atFreeLimit && (
          <UpgradePrompt
            feature={PRO_FEATURES.UNLIMITED_SNIPPETS}
            message={`You've used all ${SESSION_FREE_LIMIT} free sessions`}
          />
        )}
      </div>

      {/* Session list */}
      {sessions.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <FolderOpen className="h-10 w-10 text-muted mb-3" />
          <h3 className="text-base font-medium text-secondary">No saved sessions yet</h3>
          <p className="text-sm text-muted mt-1">Save your current tabs to resume later</p>
        </div>
      ) : (
        <div className="space-y-3">
          {sessions.map((session) => (
            <div key={session.id} className="card p-4 space-y-2">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-primary truncate">{session.name}</p>
                  <p className="text-xs text-muted mt-0.5">
                    {session.tabs.length} tab{session.tabs.length !== 1 ? 's' : ''} ·{' '}
                    {new Date(session.createdAt).toLocaleDateString(undefined, {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => restoreSession(session.id)}
                    className="gap-1.5"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                    Restore
                  </Button>
                  <Button
                    size="sm"
                    variant={confirmDelete === session.id ? 'destructive' : 'ghost'}
                    onClick={() => handleDelete(session.id)}
                    className="gap-1.5"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    {confirmDelete === session.id ? 'Confirm' : 'Delete'}
                  </Button>
                </div>
              </div>

              {/* Preview first few tab titles */}
              {session.tabs.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {session.tabs.slice(0, 5).map((tab, i) => (
                    <span
                      key={i}
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-surface-elevated text-xs text-muted truncate max-w-[200px]"
                    >
                      {tab.favIconUrl && (
                        <img src={tab.favIconUrl} alt="" className="h-3 w-3 flex-shrink-0" />
                      )}
                      {tab.title}
                    </span>
                  ))}
                  {session.tabs.length > 5 && (
                    <span className="px-2 py-0.5 rounded-md bg-surface-elevated text-xs text-muted">
                      +{session.tabs.length - 5} more
                    </span>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
