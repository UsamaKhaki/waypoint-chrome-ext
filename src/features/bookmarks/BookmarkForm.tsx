import { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useBookmarksStore } from '@/store/bookmarks.store';
import { getFaviconUrl, isValidUrl } from '@/utils';
import type { Bookmark, BookmarkCategory, EnvironmentType } from '@/types';
import { BOOKMARK_CATEGORIES } from '@/constants';

interface BookmarkFormProps {
  isOpen: boolean;
  onClose: () => void;
  bookmark?: Bookmark;
  defaultCategory?: BookmarkCategory;
}

const emptyForm = {
  title: '',
  url: '',
  description: '',
  tags: '',
  category: 'github' as BookmarkCategory,
  environment: '' as EnvironmentType | '',
  isPinned: false,
  isFavorite: false,
};

export function BookmarkForm({ isOpen, onClose, bookmark, defaultCategory }: BookmarkFormProps) {
  const { add, update } = useBookmarksStore();
  const [form, setForm] = useState({ ...emptyForm });
  const [error, setError] = useState('');

  useEffect(() => {
    if (bookmark) {
      setForm({
        title: bookmark.title,
        url: bookmark.url,
        description: bookmark.description ?? '',
        tags: bookmark.tags.join(', '),
        category: bookmark.category,
        environment: bookmark.environment ?? '',
        isPinned: bookmark.isPinned,
        isFavorite: bookmark.isFavorite,
      });
    } else {
      setForm({ ...emptyForm, category: defaultCategory ?? 'github' });
    }
    setError('');
  }, [bookmark, defaultCategory, isOpen]);

  const set = (key: string, value: unknown) => setForm((f) => ({ ...f, [key]: value }));

  const handleSubmit = async () => {
    if (!form.title.trim()) return setError('Title is required');
    if (!isValidUrl(form.url)) return setError('Enter a valid URL (include https://)');
    setError('');

    const payload = {
      title: form.title.trim(),
      url: form.url.trim(),
      description: form.description.trim() || undefined,
      tags: form.tags
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean),
      category: form.category,
      environment: form.environment || undefined,
      isPinned: form.isPinned,
      isFavorite: form.isFavorite,
      favicon: getFaviconUrl(form.url.trim()),
    };

    if (bookmark) {
      await update(bookmark.id, payload);
    } else {
      await add(payload);
    }
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={bookmark ? 'Edit Bookmark' : 'Add Bookmark'}
      size="md"
    >
      <div data-testid="bookmark-form" className="space-y-4">
        <Input
          data-testid="bookmark-form-title"
          placeholder="Title *"
          value={form.title}
          onChange={(e) => set('title', e.target.value)}
        />
        <Input
          data-testid="bookmark-form-url"
          placeholder="URL * (https://...)"
          value={form.url}
          onChange={(e) => set('url', e.target.value)}
        />
        <Input
          placeholder="Description (optional)"
          value={form.description}
          onChange={(e) => set('description', e.target.value)}
        />
        <Input
          placeholder="Tags (comma separated)"
          value={form.tags}
          onChange={(e) => set('tags', e.target.value)}
        />
        <div className="flex gap-3">
          <div className="flex-1">
            <label className="text-xs text-muted mb-1 block">Category</label>
            <select
              value={form.category}
              onChange={(e) => set('category', e.target.value)}
              className="w-full rounded-xl bg-surface border border-border-subtle text-primary text-sm px-3 py-2 outline-none focus:border-accent"
            >
              {Object.entries(BOOKMARK_CATEGORIES).map(([key, meta]) => (
                <option key={key} value={key}>
                  {meta.label}
                </option>
              ))}
            </select>
          </div>
          <div className="flex-1">
            <label className="text-xs text-muted mb-1 block">Environment</label>
            <select
              value={form.environment}
              onChange={(e) => set('environment', e.target.value)}
              className="w-full rounded-xl bg-surface border border-border-subtle text-primary text-sm px-3 py-2 outline-none focus:border-accent"
            >
              <option value="">None</option>
              <option value="local">Local</option>
              <option value="stage">Stage</option>
              <option value="production">Production</option>
            </select>
          </div>
        </div>
        <div className="flex gap-4">
          <label className="flex items-center gap-2 text-sm text-secondary cursor-pointer">
            <input
              type="checkbox"
              checked={form.isPinned}
              onChange={(e) => set('isPinned', e.target.checked)}
              className="accent-accent"
            />
            Pin to top
          </label>
          <label className="flex items-center gap-2 text-sm text-secondary cursor-pointer">
            <input
              type="checkbox"
              checked={form.isFavorite}
              onChange={(e) => set('isFavorite', e.target.checked)}
              className="accent-accent"
            />
            Favorite
          </label>
        </div>
        {error && <p className="text-xs text-destructive">{error}</p>}
        <div className="flex gap-2 justify-end pt-1">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button data-testid="bookmark-form-save" onClick={handleSubmit}>
            {bookmark ? 'Save Changes' : 'Add Bookmark'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
