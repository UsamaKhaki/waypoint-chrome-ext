import { useState } from 'react';
import { Save, RotateCcw, Trash2 } from 'lucide-react';
import { useTabsStore } from '@/store/tabs.store';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';

export function SessionManager() {
  const { savedSessions, saveSession, restoreSession, removeSession } = useTabsStore();
  const [isSaving, setIsSaving] = useState(false);
  const [sessionName, setSessionName] = useState('');

  const handleSave = async () => {
    const name = sessionName.trim() || `Session ${new Date().toLocaleTimeString()}`;
    await saveSession(name);
    setSessionName('');
    setIsSaving(false);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <p className="section-title">Saved Sessions</p>
        <Button variant="ghost" size="sm" onClick={() => setIsSaving(true)}>
          <Save className="h-3.5 w-3.5" /> Save Current
        </Button>
      </div>

      {savedSessions.length === 0 ? (
        <div className="text-center py-6 text-sm text-muted">
          No saved sessions. Save your current tabs as a workspace snapshot.
        </div>
      ) : (
        <div className="space-y-2">
          {savedSessions.map((session) => (
            <div
              key={session.id}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl border border-border-subtle hover:border-border hover:bg-surface-elevated transition-all group"
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-secondary group-hover:text-primary transition-colors truncate">
                  {session.name}
                </p>
                <p className="text-xs text-muted">
                  {session.tabs.length} tabs · {new Date(session.createdAt).toLocaleDateString()}
                </p>
              </div>
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button
                  variant="ghost"
                  size="icon-sm"
                  title="Restore session"
                  onClick={() => restoreSession(session.id)}
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  className="hover:text-destructive"
                  onClick={() => removeSession(session.id)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal isOpen={isSaving} onClose={() => setIsSaving(false)} title="Save Session" size="sm">
        <div className="space-y-3">
          <Input
            placeholder="Session name (optional)"
            value={sessionName}
            onChange={(e) => setSessionName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSave()}
            autoFocus
          />
          <div className="flex gap-2 justify-end">
            <Button variant="ghost" onClick={() => setIsSaving(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave}>Save</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
