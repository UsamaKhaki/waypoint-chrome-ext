import { useState, useEffect, useMemo } from 'react';
import { Plus, Search } from 'lucide-react';
import { AnimatePresence } from 'framer-motion';
import {
  useSnippetsStore,
  SNIPPET_CATEGORIES,
  type SnippetCategory,
  type Snippet,
} from '@/store/snippets.store';
import { useSubscriptionStore } from '@/store/subscription.store';
import { SNIPPET_FREE_LIMIT, PRO_FEATURES } from '@/constants/subscription';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { SnippetCard } from './SnippetCard';
import { SnippetForm } from './SnippetForm';
import { useSnippetCommands } from './useSnippetCommands';
import { UpgradePrompt } from '@/features/subscription';

export function SnippetsPanel() {
  const { snippets, load } = useSnippetsStore();
  const plan = useSubscriptionStore((s) => s.plan);
  const openUpgradeModal = useSubscriptionStore((s) => s.openUpgradeModal);
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState<SnippetCategory | 'all' | 'pinned'>('all');
  const [editingSnippet, setEditingSnippet] = useState<Snippet | undefined>();
  const [isFormOpen, setIsFormOpen] = useState(false);

  const atFreeLimit = plan === 'free' && snippets.length >= SNIPPET_FREE_LIMIT;
  const [prefill, setPrefill] = useState<{ content: string; title: string } | null>(null);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (typeof chrome === 'undefined' || !chrome.storage) return;
    chrome.storage.local.get('pendingSnippet', (result) => {
      if (result.pendingSnippet) {
        const { content, title } = result.pendingSnippet as { content: string; title: string };
        setPrefill({ content, title });
        setIsFormOpen(true);
        chrome.storage.local.remove('pendingSnippet');
      }
    });
  }, []);

  useSnippetCommands();

  const filtered = useMemo(() => {
    let result = [...snippets];
    if (activeCategory === 'pinned') result = result.filter((s) => s.isPinned);
    else if (activeCategory !== 'all') result = result.filter((s) => s.category === activeCategory);
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (s) =>
          s.title.toLowerCase().includes(q) ||
          s.content.toLowerCase().includes(q) ||
          s.tags.some((t) => t.toLowerCase().includes(q)) ||
          s.description?.toLowerCase().includes(q)
      );
    }
    return result.sort((a, b) => (b.isPinned ? 1 : 0) - (a.isPinned ? 1 : 0));
  }, [snippets, search, activeCategory]);

  const openAdd = () => {
    if (atFreeLimit) {
      openUpgradeModal(PRO_FEATURES.UNLIMITED_SNIPPETS);
      return;
    }
    setEditingSnippet(undefined);
    setPrefill(null);
    setIsFormOpen(true);
  };
  const openEdit = (snippet: Snippet) => {
    setPrefill(null);
    setEditingSnippet(snippet);
    setIsFormOpen(true);
  };

  const categories: { id: SnippetCategory | 'all' | 'pinned'; label: string }[] = [
    { id: 'all', label: 'All' },
    { id: 'pinned', label: '📌' },
    ...Object.entries(SNIPPET_CATEGORIES).map(([id, meta]) => ({
      id: id as SnippetCategory,
      label: meta.label,
    })),
  ];

  return (
    <div data-testid="snippets-panel" className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-primary">Snippets</h1>
          <p className="text-sm text-muted mt-0.5">{snippets.length} saved snippets</p>
        </div>
        <Button
          data-testid="add-snippet-btn"
          size="sm"
          onClick={openAdd}
          title={atFreeLimit ? 'Upgrade to Pro for unlimited snippets' : undefined}
        >
          <Plus className="h-3.5 w-3.5" /> Add Snippet
        </Button>
      </div>

      {/* Search */}
      <Input
        data-testid="snippet-search"
        placeholder="Search snippets..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        leftIcon={<Search className="h-3.5 w-3.5" />}
      />

      {/* Category filter */}
      <div className="flex gap-1.5 flex-wrap">
        {categories.map((cat) => (
          <button
            key={cat.id}
            data-testid={`snippet-filter-${cat.id}`}
            onClick={() => setActiveCategory(cat.id)}
            className={`px-3 py-1 rounded-lg text-xs font-medium transition-all border ${
              activeCategory === cat.id
                ? 'bg-accent/10 border-accent/30 text-accent'
                : 'border-border-subtle text-muted hover:text-secondary hover:border-border'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Free limit banner */}
      {atFreeLimit && (
        <UpgradePrompt
          feature={PRO_FEATURES.UNLIMITED_SNIPPETS}
          message={`You've used all ${SNIPPET_FREE_LIMIT} free snippets`}
        />
      )}

      {/* Snippet list */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="text-4xl mb-3">📋</div>
          <h3 className="text-base font-medium text-secondary">
            {search ? 'No snippets match your search' : 'No snippets yet'}
          </h3>
          <p className="text-sm text-muted mt-1">
            {search ? 'Try different keywords' : 'Save your first command or code snippet'}
          </p>
          {!search && (
            <Button className="mt-4" size="sm" onClick={openAdd}>
              <Plus className="h-3.5 w-3.5" /> Add Snippet
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          <AnimatePresence>
            {filtered.map((snippet) => (
              <SnippetCard key={snippet.id} snippet={snippet} onEdit={openEdit} />
            ))}
          </AnimatePresence>
        </div>
      )}

      <SnippetForm
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setPrefill(null);
        }}
        snippet={editingSnippet}
        prefill={prefill ?? undefined}
      />
    </div>
  );
}
