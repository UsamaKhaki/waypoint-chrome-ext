import { useState, useEffect } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useEnvironmentsStore } from '@/store/environments.store';
import type { Environment, EnvironmentLink, EnvironmentType } from '@/types';
import { ENVIRONMENT_COLORS } from '@/constants';

interface EnvironmentFormProps {
  isOpen: boolean;
  onClose: () => void;
  environment?: Environment;
}

const LINK_TYPES = [
  'frontend',
  'backend',
  'admin',
  'logs',
  'monitoring',
  'api',
  'grafana',
  'kibana',
  'sentry',
  'database',
  'deployment',
  'other',
] as const;

export function EnvironmentForm({ isOpen, onClose, environment }: EnvironmentFormProps) {
  const { add, update } = useEnvironmentsStore();
  const [name, setName] = useState('');
  const [type, setType] = useState<EnvironmentType>('local');
  const [notes, setNotes] = useState('');
  const [links, setLinks] = useState<EnvironmentLink[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    if (environment) {
      setName(environment.name);
      setType(environment.type);
      setNotes(environment.notes ?? '');
      setLinks([...environment.links]);
    } else {
      setName('');
      setType('local');
      setNotes('');
      setLinks([]);
    }
    setError('');
  }, [environment, isOpen]);

  const addLink = () => {
    setLinks((l) => [...l, { label: '', url: '', type: 'frontend' }]);
  };

  const updateLink = (i: number, key: keyof EnvironmentLink, value: string) => {
    setLinks((l) => l.map((link, idx) => (idx === i ? { ...link, [key]: value } : link)));
  };

  const removeLink = (i: number) => {
    setLinks((l) => l.filter((_, idx) => idx !== i));
  };

  const handleSubmit = async () => {
    if (!name.trim()) return setError('Name is required');
    const payload = {
      name: name.trim(),
      type,
      notes: notes.trim() || undefined,
      links: links.filter((l) => l.url.trim()),
      color: ENVIRONMENT_COLORS[type],
      isActive: true,
      healthStatus: 'unknown' as const,
    };
    if (environment) {
      await update(environment.id, payload);
    } else {
      await add(payload);
    }
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={environment ? 'Edit Environment' : 'Add Environment'}
      size="lg"
    >
      <div data-testid="environment-form" className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
        <div className="flex gap-3">
          <Input
            data-testid="env-form-name"
            placeholder="Environment name *"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="flex-1"
          />
          <select
            value={type}
            onChange={(e) => setType(e.target.value as EnvironmentType)}
            className="rounded-xl bg-surface border border-border-subtle text-primary text-sm px-3 py-2 outline-none focus:border-accent"
          >
            <option value="local">Local</option>
            <option value="stage">Stage</option>
            <option value="production">Production</option>
          </select>
        </div>
        <Input
          placeholder="Notes (optional)"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />

        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="section-title">Links</span>
            <Button variant="ghost" size="sm" onClick={addLink}>
              <Plus className="h-3.5 w-3.5" /> Add Link
            </Button>
          </div>
          <div className="space-y-2">
            {links.map((link, i) => (
              <div key={i} className="flex gap-2 items-start">
                <select
                  value={link.type}
                  onChange={(e) => updateLink(i, 'type', e.target.value)}
                  className="rounded-xl bg-surface border border-border-subtle text-primary text-xs px-2 py-2 outline-none focus:border-accent w-28 flex-shrink-0"
                >
                  {LINK_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
                <Input
                  placeholder="Label"
                  value={link.label}
                  onChange={(e) => updateLink(i, 'label', e.target.value)}
                  className="flex-1 text-xs"
                />
                <Input
                  placeholder="URL (https://...)"
                  value={link.url}
                  onChange={(e) => updateLink(i, 'url', e.target.value)}
                  className="flex-1 text-xs"
                />
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => removeLink(i)}
                  className="hover:text-destructive flex-shrink-0"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            ))}
          </div>
        </div>

        {error && <p className="text-xs text-destructive">{error}</p>}
        <div className="flex gap-2 justify-end pt-1">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button data-testid="env-form-save" onClick={handleSubmit}>{environment ? 'Save Changes' : 'Add Environment'}</Button>
        </div>
      </div>
    </Modal>
  );
}
