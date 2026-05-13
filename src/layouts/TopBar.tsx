import { Search } from 'lucide-react';
import { useCommandPaletteStore } from '@/store/commandPalette.store';
import { Kbd } from '@/components/ui/Kbd';
import { WorkspaceModeSelector } from '@/features/focus-modes/WorkspaceModeSelector';
import { QuickNotesButton } from '@/features/widgets/QuickNotes';

export function TopBar() {
  const { open } = useCommandPaletteStore();

  return (
    <div className="flex items-center gap-3 w-full">
      <button
        onClick={open}
        className="flex items-center gap-2 flex-1 max-w-sm px-3 py-1.5 rounded-xl bg-surface-elevated border border-border-subtle text-muted text-sm hover:border-border hover:text-secondary transition-all duration-150 group"
      >
        <Search className="h-3.5 w-3.5" />
        <span>Search or run command...</span>
        <div className="ml-auto flex items-center gap-1">
          <Kbd>⌘</Kbd>
          <Kbd>K</Kbd>
        </div>
      </button>
      <div className="ml-auto flex items-center gap-2">
        <QuickNotesButton />
        <WorkspaceModeSelector />
      </div>
    </div>
  );
}
