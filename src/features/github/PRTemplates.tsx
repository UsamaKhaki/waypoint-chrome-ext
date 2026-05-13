import { Copy, Trash2, Plus, ChevronDown, ChevronUp } from 'lucide-react';
import { useState } from 'react';
import { useGitHubStore } from '@/store/github.store';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { copyToClipboard } from '@/utils';

export function PRTemplates() {
  const { prTemplates, addPRTemplate, removePRTemplate } = useGitHubStore();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [name, setName] = useState('');
  const [body, setBody] = useState('');

  const handleAdd = async () => {
    if (!name.trim() || !body.trim()) return;
    await addPRTemplate({ name: name.trim(), body: body.trim() });
    setName('');
    setBody('');
    setIsAdding(false);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <p className="section-title">PR Templates</p>
        <Button variant="ghost" size="sm" onClick={() => setIsAdding(true)}>
          <Plus className="h-3.5 w-3.5" />
        </Button>
      </div>
      <div className="space-y-2">
        {prTemplates.map((t) => (
          <div key={t.id} className="rounded-xl border border-border-subtle overflow-hidden">
            <div className="flex items-center gap-3 px-3 py-2 hover:bg-surface-elevated transition-colors">
              <button
                className="flex-1 text-sm text-secondary text-left font-medium"
                onClick={() => setExpandedId(expandedId === t.id ? null : t.id)}
              >
                {t.name}
              </button>
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => copyToClipboard(t.body)}
                  title="Copy body"
                >
                  <Copy className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  className="hover:text-destructive"
                  onClick={() => removePRTemplate(t.id)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => setExpandedId(expandedId === t.id ? null : t.id)}
                >
                  {expandedId === t.id ? (
                    <ChevronUp className="h-3.5 w-3.5" />
                  ) : (
                    <ChevronDown className="h-3.5 w-3.5" />
                  )}
                </Button>
              </div>
            </div>
            {expandedId === t.id && (
              <pre className="px-3 py-2 text-xs text-muted bg-surface whitespace-pre-wrap border-t border-border-subtle font-mono max-h-40 overflow-y-auto">
                {t.body}
              </pre>
            )}
          </div>
        ))}
      </div>

      <Modal isOpen={isAdding} onClose={() => setIsAdding(false)} title="Add PR Template" size="md">
        <div className="space-y-3">
          <Input
            placeholder="Template name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <textarea
            placeholder="Template body (markdown)..."
            value={body}
            onChange={(e) => setBody(e.target.value)}
            className="w-full h-40 rounded-xl bg-surface border border-border-subtle text-primary text-sm px-3 py-2 outline-none focus:border-accent resize-none font-mono"
          />
          <div className="flex gap-2 justify-end">
            <Button variant="ghost" onClick={() => setIsAdding(false)}>
              Cancel
            </Button>
            <Button onClick={handleAdd}>Add Template</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
