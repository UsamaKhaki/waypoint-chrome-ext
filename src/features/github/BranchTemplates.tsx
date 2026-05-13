import { Copy, Trash2, Plus } from 'lucide-react';
import { useState } from 'react';
import { useGitHubStore } from '@/store/github.store';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { copyToClipboard } from '@/utils';

export function BranchTemplates() {
  const { branchTemplates, addBranchTemplate, removeBranchTemplate } = useGitHubStore();
  const [isAdding, setIsAdding] = useState(false);
  const [name, setName] = useState('');
  const [pattern, setPattern] = useState('');

  const handleAdd = async () => {
    if (!name.trim() || !pattern.trim()) return;
    await addBranchTemplate({ name: name.trim(), pattern: pattern.trim() });
    setName('');
    setPattern('');
    setIsAdding(false);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <p className="section-title">Branch Templates</p>
        <Button variant="ghost" size="sm" onClick={() => setIsAdding(true)}>
          <Plus className="h-3.5 w-3.5" />
        </Button>
      </div>
      <div className="space-y-1.5">
        {branchTemplates.map((t) => (
          <div
            key={t.id}
            className="group flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-surface-elevated transition-colors"
          >
            <div className="flex-1 min-w-0">
              <div className="text-xs font-medium text-secondary">{t.name}</div>
              <div className="text-xs text-muted font-mono truncate">{t.pattern}</div>
            </div>
            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => copyToClipboard(t.pattern)}
                title="Copy pattern"
              >
                <Copy className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="icon-sm"
                className="hover:text-destructive"
                onClick={() => removeBranchTemplate(t.id)}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        ))}
      </div>

      <Modal
        isOpen={isAdding}
        onClose={() => setIsAdding(false)}
        title="Add Branch Template"
        size="sm"
      >
        <div className="space-y-3">
          <Input
            placeholder="Name (e.g. Feature)"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <Input
            placeholder="Pattern (e.g. feat/{ticket}-{description})"
            value={pattern}
            onChange={(e) => setPattern(e.target.value)}
          />
          <div className="flex gap-2 justify-end">
            <Button variant="ghost" onClick={() => setIsAdding(false)}>
              Cancel
            </Button>
            <Button onClick={handleAdd}>Add</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
