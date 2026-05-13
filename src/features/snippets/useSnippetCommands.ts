import { useEffect } from 'react';
import { useSnippetsStore } from '@/store/snippets.store';
import { useCommandPaletteStore } from '@/store/commandPalette.store';

export function useSnippetCommands() {
  const snippets = useSnippetsStore((s) => s.snippets);
  const markUsed = useSnippetsStore((s) => s.markUsed);
  const registerCommands = useCommandPaletteStore((s) => s.registerCommands);
  const existingCommands = useCommandPaletteStore((s) => s.commands);

  useEffect(() => {
    const snippetCommands = snippets.map((snippet) => ({
      id: `snippet-${snippet.id}`,
      title: snippet.title,
      description: `Copy snippet · ${snippet.category}`,
      category: 'actions' as const,
      keywords: ['snippet', 'copy', snippet.category, ...snippet.tags],
      action: () => {
        navigator.clipboard.writeText(snippet.content);
        markUsed(snippet.id);
      },
    }));
    // Merge with non-snippet commands to avoid duplicates
    const nonSnippetCommands = existingCommands.filter((c) => !c.id.startsWith('snippet-'));
    registerCommands([...nonSnippetCommands, ...snippetCommands]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [snippets]);
}
