import { useState, type CSSProperties } from 'react';
import { AnimatePresence } from 'framer-motion';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core';
import { SortableContext, rectSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useWidgetsStore } from '@/store/widgets.store';
import type { WidgetConfig, WidgetSize } from '@/store/widgets.store';
import { WidgetShell } from './WidgetShell';
import { WidgetPicker } from './WidgetPicker';
import { ClockWidget } from './widgets/ClockWidget';
import { PomodoroWidget } from './widgets/PomodoroWidget';
import { GoalsWidget } from './widgets/GoalsWidget';
import { GitHubPRsWidget } from './widgets/GitHubPRsWidget';
import { CicdWidget } from './widgets/CicdWidget';
import { QuickStatsWidget } from './widgets/QuickStatsWidget';
import { JiraWidget } from './widgets/JiraWidget';
import { LinearWidget } from './widgets/LinearWidget';
import { CalendarWidget } from './widgets/CalendarWidget';

interface DashboardPanelProps {
  onNavigate: (section: string) => void;
}

function renderWidget(config: WidgetConfig, onNavigate: (s: string) => void) {
  switch (config.type) {
    case 'clock':
      return <ClockWidget />;
    case 'pomodoro':
      return <PomodoroWidget />;
    case 'goals':
      return <GoalsWidget />;
    case 'github-prs':
      return <GitHubPRsWidget onNavigate={onNavigate} />;
    case 'cicd':
      return <CicdWidget />;
    case 'quick-stats':
      return <QuickStatsWidget onNavigate={onNavigate} />;
    case 'jira':
      return <JiraWidget />;
    case 'linear':
      return <LinearWidget />;
    case 'calendar':
      return <CalendarWidget />;
    default:
      return null;
  }
}

interface SortableWidgetProps {
  config: WidgetConfig;
  onRemove: (id: string) => void;
  onResize: (id: string, size: WidgetSize) => void;
  onNavigate: (s: string) => void;
}

function SortableWidget({ config, onRemove, onResize, onNavigate }: SortableWidgetProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: config.id,
  });

  const style: CSSProperties = {
    transform: CSS.Transform.toString(transform) || undefined,
    transition: transition ?? undefined,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        config.size === 'sm' && 'col-span-3',
        config.size === 'md' && 'col-span-6',
        config.size === 'lg' && 'col-span-12',
        'max-sm:col-span-12'
      )}
    >
      <WidgetShell
        id={config.id}
        type={config.type}
        size={config.size}
        isDragging={isDragging}
        dragHandleProps={{ ...attributes, ...listeners }}
        onRemove={onRemove}
        onResize={onResize}
      >
        {renderWidget(config, onNavigate)}
      </WidgetShell>
    </div>
  );
}

export function DashboardPanel({ onNavigate }: DashboardPanelProps) {
  const widgets = useWidgetsStore((s) => s.widgets);
  const removeWidget = useWidgetsStore((s) => s.removeWidget);
  const reorderWidgets = useWidgetsStore((s) => s.reorderWidgets);
  const resizeWidget = useWidgetsStore((s) => s.resizeWidget);

  const [showPicker, setShowPicker] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

  const sorted = [...widgets].sort((a, b) => a.position - b.position);
  const ids = sorted.map((w) => w.id);
  const activeWidget = activeId ? sorted.find((w) => w.id === activeId) : null;

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(String(event.active.id));
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);
    if (!over || active.id === over.id) return;

    const oldIndex = ids.indexOf(String(active.id));
    const newIndex = ids.indexOf(String(over.id));
    if (oldIndex === -1 || newIndex === -1) return;

    const newIds = [...ids];
    newIds.splice(oldIndex, 1);
    newIds.splice(newIndex, 0, String(active.id));
    reorderWidgets(newIds);
  };

  return (
    <div className="flex flex-col h-full p-6 gap-6 overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-lg font-semibold text-primary">Dashboard</h1>
          <p className="text-xs text-muted mt-0.5">Drag widgets to reorder</p>
        </div>
        <button
          onClick={() => setShowPicker(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-border-subtle text-xs font-medium text-secondary hover:text-primary hover:bg-surface-elevated hover:border-border transition-all flex-shrink-0"
        >
          <Plus className="h-3.5 w-3.5" />
          Add Widget
        </button>
      </div>

      {/* Grid */}
      {sorted.length === 0 ? (
        <div className="flex flex-col items-center justify-center flex-1 gap-4 text-center">
          <p className="text-lg text-muted">Your dashboard is empty</p>
          <button
            onClick={() => setShowPicker(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-accent text-white text-sm hover:bg-accent-hover transition-colors"
          >
            <Plus className="h-4 w-4" />
            Add your first widget
          </button>
        </div>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <SortableContext items={ids} strategy={rectSortingStrategy}>
            <div className="grid grid-cols-12 gap-4">
              {sorted.map((config) => (
                <SortableWidget
                  key={config.id}
                  config={config}
                  onRemove={removeWidget}
                  onResize={resizeWidget}
                  onNavigate={onNavigate}
                />
              ))}
            </div>
          </SortableContext>

          <DragOverlay>
            {activeWidget && (
              <div
                className={cn(
                  activeWidget.size === 'sm' && 'w-64',
                  activeWidget.size === 'md' && 'w-96',
                  activeWidget.size === 'lg' && 'w-full',
                  'opacity-80 rotate-1'
                )}
              >
                <WidgetShell
                  id={activeWidget.id}
                  type={activeWidget.type}
                  size={activeWidget.size}
                  isDragging
                  onRemove={() => {}}
                  onResize={() => {}}
                >
                  {renderWidget(activeWidget, onNavigate)}
                </WidgetShell>
              </div>
            )}
          </DragOverlay>
        </DndContext>
      )}

      {/* Widget picker modal */}
      <AnimatePresence>
        {showPicker && <WidgetPicker onClose={() => setShowPicker(false)} />}
      </AnimatePresence>
    </div>
  );
}
