import { useState } from 'react';
import { Copy, Pin, Edit2, Trash2, Check } from 'lucide-react';
import { motion } from 'framer-motion';
import { useSnippetsStore, SNIPPET_CATEGORIES, type Snippet } from '@/store/snippets.store';
import { cn } from '@/lib/utils';

interface SnippetCardProps {
  snippet: Snippet;
  onEdit: (snippet: Snippet) => void;
}

export function SnippetCard({ snippet, onEdit }: SnippetCardProps) {
  const { remove, togglePin, markUsed } = useSnippetsStore();
  const [copied, setCopied] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const cat = SNIPPET_CATEGORIES[snippet.category];

  const handleCopy = async () => {
    await navigator.clipboard.writeText(snippet.content);
    await markUsed(snippet.id);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const isLong = snippet.content.length > 120;

  return (
    <motion.div
      layout
      data-testid={`snippet-card-${snippet.id}`}
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.97 }}
      className="group rounded-xl border border-border-subtle bg-surface hover:border-border transition-all"
    >
      {/* Header */}
      <div className="flex items-center gap-3 px-3 pt-3 pb-2">
        {/* Category badge */}
        <span
          className="flex-shrink-0 text-xs font-mono font-bold px-1.5 py-0.5 rounded-md"
          style={{ color: cat.color, backgroundColor: `${cat.color}18` }}
        >
          {cat.icon} {cat.label}
        </span>
        <span className="flex-1 text-sm font-medium text-primary truncate">{snippet.title}</span>
        {snippet.isPinned && <Pin className="h-3 w-3 text-accent flex-shrink-0" />}
      </div>

      {/* Code block */}
      <div
        className={cn(
          'mx-3 mb-2 relative rounded-lg bg-surface-elevated border border-border-subtle overflow-hidden cursor-pointer',
          !expanded && isLong && 'max-h-16'
        )}
        onClick={() => isLong && setExpanded((e) => !e)}
      >
        <pre className="text-xs font-mono text-secondary p-2.5 overflow-x-auto whitespace-pre-wrap break-all leading-relaxed">
          {snippet.content}
        </pre>
        {isLong && !expanded && (
          <div className="absolute bottom-0 left-0 right-0 h-6 bg-gradient-to-t from-surface-elevated to-transparent flex items-end justify-center pb-0.5">
            <span className="text-xs text-muted">show more</span>
          </div>
        )}
      </div>

      {/* Description + tags */}
      {(snippet.description || snippet.tags.length > 0) && (
        <div className="px-3 pb-2 flex items-center gap-2 flex-wrap">
          {snippet.description && <span className="text-xs text-muted">{snippet.description}</span>}
          {snippet.tags.map((tag) => (
            <span key={tag} className="tag text-xs">
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-1 px-3 pb-2.5 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          data-testid={`snippet-copy-${snippet.id}`}
          onClick={handleCopy}
          className={cn(
            'flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-all',
            copied ? 'bg-success/10 text-success' : 'bg-accent/10 text-accent hover:bg-accent/20'
          )}
        >
          {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
          {copied ? 'Copied!' : 'Copy'}
        </button>
        <button
          onClick={() => togglePin(snippet.id)}
          className={cn(
            'p-1.5 rounded-lg text-xs transition-colors',
            snippet.isPinned ? 'text-accent' : 'text-muted hover:text-secondary'
          )}
          title={snippet.isPinned ? 'Unpin' : 'Pin'}
        >
          <Pin className="h-3.5 w-3.5" />
        </button>
        <button
          onClick={() => onEdit(snippet)}
          className="p-1.5 rounded-lg text-muted hover:text-secondary transition-colors"
        >
          <Edit2 className="h-3.5 w-3.5" />
        </button>
        <button
          onClick={() => remove(snippet.id)}
          className="p-1.5 rounded-lg text-muted hover:text-destructive transition-colors ml-auto"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
    </motion.div>
  );
}
