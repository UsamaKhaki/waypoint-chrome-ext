import { useState, useEffect } from 'react';
import {
  useSnippetsStore,
  SNIPPET_CATEGORIES,
  type Snippet,
  type SnippetCategory,
} from '@/store/snippets.store';
import { useSubscriptionStore } from '@/store/subscription.store';
import { PRO_FEATURES } from '@/constants/subscription';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

interface SnippetFormProps {
  isOpen: boolean;
  onClose: () => void;
  snippet?: Snippet;
  prefill?: { content: string; title: string };
}

export function SnippetForm({ isOpen, onClose, snippet, prefill }: SnippetFormProps) {
  const { add, update } = useSnippetsStore();
  const plan = useSubscriptionStore((s) => s.plan);
  const openUpgradeModal = useSubscriptionStore((s) => s.openUpgradeModal);
  const isPro = plan === 'pro' || plan === 'team';
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState<SnippetCategory>('terminal');
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (snippet) {
      setTitle(snippet.title);
      setContent(snippet.content);
      setCategory(snippet.category);
      setDescription(snippet.description ?? '');
      setTags(snippet.tags.join(', '));
    } else if (prefill) {
      setTitle(prefill.title);
      setContent(prefill.content);
      setCategory('other');
      setDescription('');
      setTags('');
    } else {
      setTitle('');
      setContent('');
      setCategory('terminal');
      setDescription('');
      setTags('');
    }
    setError('');
  }, [snippet, prefill, isOpen]);

  const handleSubmit = async () => {
    if (!title.trim()) return setError('Title is required');
    if (!content.trim()) return setError('Content is required');
    const payload = {
      title: title.trim(),
      content: content.trim(),
      category,
      description: description.trim() || undefined,
      tags: tags
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean),
      isPinned: snippet?.isPinned ?? false,
    };
    if (snippet) await update(snippet.id, payload);
    else await add(payload);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={snippet ? 'Edit Snippet' : 'Add Snippet'}
      size="lg"
    >
      <div data-testid="snippet-form" className="space-y-3">
        <Input
          data-testid="snippet-form-title"
          placeholder="Title *"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          autoFocus
        />
        <div>
          <label className="text-xs text-muted mb-1 block">Category</label>
          <div className="flex gap-2 flex-wrap">
            {(Object.keys(SNIPPET_CATEGORIES) as SnippetCategory[]).map((cat) => {
              const meta = SNIPPET_CATEGORIES[cat];
              return (
                <button
                  key={cat}
                  onClick={() => setCategory(cat)}
                  className="px-3 py-1 rounded-lg text-xs font-medium transition-all border"
                  style={{
                    color: category === cat ? meta.color : undefined,
                    backgroundColor: category === cat ? `${meta.color}18` : undefined,
                    borderColor: category === cat ? `${meta.color}50` : undefined,
                  }}
                >
                  {meta.icon} {meta.label}
                </button>
              );
            })}
          </div>
        </div>
        <div>
          <label className="text-xs text-muted mb-1 block">Content *</label>
          <textarea
            data-testid="snippet-form-content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Paste your snippet, command, or query..."
            className="w-full h-32 rounded-xl bg-surface-elevated border border-border-subtle text-primary text-xs font-mono px-3 py-2.5 outline-none focus:border-accent resize-none"
          />
          {!isPro && (
            <p className="text-xs text-muted mt-1">
              💡{' '}
              <button
                type="button"
                onClick={() => openUpgradeModal(PRO_FEATURES.SNIPPET_VARIABLES)}
                className="text-accent underline"
              >
                Upgrade to Pro
              </button>{' '}
              to use variables like {'{{branch}}'} and {'{{env}}'}
            </p>
          )}
        </div>
        <Input
          placeholder="Description (optional)"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
        <Input
          placeholder="Tags (comma separated, e.g. docker, prod)"
          value={tags}
          onChange={(e) => setTags(e.target.value)}
        />
        {error && <p className="text-xs text-destructive">{error}</p>}
        <div className="flex gap-2 justify-end pt-1">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button data-testid="snippet-form-save" onClick={handleSubmit}>{snippet ? 'Save Changes' : 'Add Snippet'}</Button>
        </div>
      </div>
    </Modal>
  );
}
