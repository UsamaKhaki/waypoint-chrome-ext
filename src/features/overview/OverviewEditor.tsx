import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Eye, EyeOff, RotateCcw } from 'lucide-react';
import { motion } from 'framer-motion';
import { useOverviewLayoutStore, type OverviewSectionConfig } from '@/store/overviewLayout.store';
import { cn } from '@/lib/utils';

function SortableRow({ section }: { section: OverviewSectionConfig }) {
  const { toggleVisibility } = useOverviewLayoutStore();
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: section.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'flex items-center gap-3 px-4 py-3 rounded-xl border transition-all',
        isDragging
          ? 'bg-accent/10 border-accent/30 shadow-lg z-10'
          : 'bg-surface border-border-subtle hover:border-border'
      )}
    >
      {/* Drag handle */}
      <button
        {...listeners}
        {...attributes}
        className="text-muted hover:text-secondary cursor-grab active:cursor-grabbing touch-none"
      >
        <GripVertical className="h-4 w-4" />
      </button>

      {/* Label */}
      <span
        className={cn(
          'flex-1 text-sm',
          section.visible ? 'text-primary' : 'text-muted line-through'
        )}
      >
        {section.label}
      </span>

      {/* Visibility toggle */}
      <button
        onClick={() => toggleVisibility(section.id)}
        className={cn(
          'p-1.5 rounded-lg transition-all',
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

interface OverviewEditorProps {
  onClose: () => void;
}

export function OverviewEditor({ onClose }: OverviewEditorProps) {
  const { sections, reorder, reset } = useOverviewLayoutStore();

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = sections.findIndex((s) => s.id === active.id);
    const newIndex = sections.findIndex((s) => s.id === over.id);
    reorder(arrayMove(sections, oldIndex, newIndex));
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.2 }}
      className="card p-5 space-y-4"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-primary">Customize Overview</h3>
          <p className="text-xs text-muted mt-0.5">Drag to reorder · click eye to show/hide</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={reset}
            className="flex items-center gap-1.5 text-xs text-muted hover:text-secondary transition-colors"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Reset
          </button>
          <button
            onClick={onClose}
            className="px-3 py-1.5 rounded-lg bg-accent text-white text-xs font-medium hover:bg-accent-hover transition-colors"
          >
            Done
          </button>
        </div>
      </div>

      {/* Sortable list */}
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={sections.map((s) => s.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-2">
            {sections.map((section) => (
              <SortableRow key={section.id} section={section} />
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </motion.div>
  );
}
