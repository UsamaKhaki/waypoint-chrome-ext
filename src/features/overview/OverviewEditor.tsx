import { useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Eye, EyeOff, RotateCcw, X } from 'lucide-react';
import { useOverviewLayoutStore, type OverviewSectionConfig } from '@/store/overviewLayout.store';
import { cn } from '@/lib/utils';

// ── Sortable row (operates on local draft) ────────────────────────────────────

function SortableRow({
  section,
  onToggle,
}: {
  section: OverviewSectionConfig;
  onToggle: (id: string) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: section.id,
  });

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn(
        'flex items-center gap-3 px-4 py-3 rounded-xl border transition-all',
        isDragging
          ? 'bg-accent/10 border-accent/30 shadow-lg z-10'
          : 'bg-surface border-border-subtle hover:border-border'
      )}
    >
      <button
        {...listeners}
        {...attributes}
        className="text-muted hover:text-secondary cursor-grab active:cursor-grabbing touch-none flex-shrink-0"
      >
        <GripVertical className="h-4 w-4" />
      </button>

      <span className={cn('flex-1 text-sm', !section.visible && 'text-muted line-through')}>
        {section.label}
      </span>

      <button
        onClick={() => onToggle(section.id)}
        className={cn(
          'p-1.5 rounded-lg transition-all flex-shrink-0',
          section.visible
            ? 'text-accent hover:bg-accent/10'
            : 'text-muted hover:bg-surface-elevated'
        )}
        title={section.visible ? 'Hide section' : 'Show section'}
      >
        {section.visible ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
      </button>
    </div>
  );
}

// ── Modal ────────────────────────────────────────────────────────────────────

interface OverviewEditorProps {
  onClose: () => void;
}

export function OverviewEditor({ onClose }: OverviewEditorProps) {
  const { sections, reorder, reset } = useOverviewLayoutStore();

  // Local draft — changes only committed on Done
  const [draft, setDraft] = useState<OverviewSectionConfig[]>(() =>
    sections.map((s) => ({ ...s }))
  );

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = draft.findIndex((s) => s.id === active.id);
    const newIndex = draft.findIndex((s) => s.id === over.id);
    setDraft((d) => arrayMove(d, oldIndex, newIndex));
  };

  const handleToggle = (id: string) => {
    setDraft((d) => d.map((s) => (s.id === id ? { ...s, visible: !s.visible } : s)));
  };

  const handleReset = () => {
    // Reset draft to store defaults — don't touch the store yet
    reset().then(() => {
      setDraft(useOverviewLayoutStore.getState().sections.map((s) => ({ ...s })));
    });
  };

  const handleDone = () => {
    reorder(draft);
    onClose();
  };

  return createPortal(
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.15 }}
        className="fixed inset-0 z-[9998] flex items-center justify-center p-4"
        style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)' }}
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.97, y: 8 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.97, y: 8 }}
          transition={{ duration: 0.15, ease: 'easeOut' }}
          className="glass-elevated rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-border-subtle">
            <div>
              <h3 className="text-sm font-semibold text-primary">Customize Overview</h3>
              <p className="text-xs text-muted mt-0.5">Drag to reorder · click eye to show/hide</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleReset}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs text-muted hover:text-secondary hover:bg-surface-elevated transition-all"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                Reset
              </button>
              <button
                onClick={handleDone}
                className="px-4 py-1.5 rounded-lg bg-accent text-white text-xs font-semibold hover:bg-accent-hover transition-colors"
              >
                Done
              </button>
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg text-muted hover:text-primary hover:bg-surface-elevated transition-all"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Sortable list */}
          <div className="p-4 max-h-[60vh] overflow-y-auto">
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={draft.map((s) => s.id)}
                strategy={verticalListSortingStrategy}
              >
                <div className="space-y-2">
                  {draft.map((section) => (
                    <SortableRow key={section.id} section={section} onToggle={handleToggle} />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          </div>

          {/* Footer hint */}
          <div className="px-5 py-3 border-t border-border-subtle">
            <p className="text-xs text-muted">Changes apply when you click Done.</p>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>,
    document.body
  );
}
