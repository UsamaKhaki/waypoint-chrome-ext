import { useState, useEffect, useMemo } from 'react';
import { Plus, Search, Code2 } from 'lucide-react';
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
import { PanelShell, PanelHeader, PanelEmptyState } from '@/features/shared/PanelShell';

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
    <PanelShell testId="snippets-panel">
      <PanelHeader
        icon={Code2}
        title="Snippets"
        subtitle={`${snippets.length} saved · ${snippets.filter((s) => s.isPinned).length} pinned`}
        actions={
          <Button
            data-testid="add-snippet-btn"
            onClick={openAdd}
            title={atFreeLimit ? 'Upgrade to Pro for unlimited snippets' : undefined}
          >
            <Plus className="h-4 w-4" /> New Snippet
          </Button>
        }
      />

      <Input
        data-testid="snippet-search"
        placeholder="Search snippets…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        leftIcon={<Search className="h-4 w-4" />}
      />

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

      {atFreeLimit && (
        <UpgradePrompt
          feature={PRO_FEATURES.UNLIMITED_SNIPPETS}
          message={`You've used all ${SNIPPET_FREE_LIMIT} free snippets`}
        />
      )}

      {filtered.length === 0 ? (
        <PanelEmptyState
          icon={Code2}
          title={search ? 'No snippets match your search' : 'No snippets yet'}
          hint={
            search
              ? 'Try a different keyword or clear your search.'
              : "Save your first command, code block, or template — they're searchable from the command palette."
          }
          action={
            !search && (
              <Button onClick={openAdd}>
                <Plus className="h-4 w-4" /> Add Snippet
              </Button>
            )
          }
        />
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
    </PanelShell>
  );
}
