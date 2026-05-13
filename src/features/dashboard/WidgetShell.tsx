import { useState } from 'react';
import { motion } from 'framer-motion';
import { GripVertical, X, Maximize2, Minimize2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { WIDGET_META } from '@/store/widgets.store';
import type { WidgetType, WidgetSize } from '@/store/widgets.store';

interface WidgetShellProps {
  id: string;
  type: WidgetType;
  size: WidgetSize;
  isDragging?: boolean;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  dragHandleProps?: Record<string, any>;
  children: React.ReactNode;
  onRemove: (id: string) => void;
  onResize: (id: string, size: WidgetSize) => void;
}

export function WidgetShell({
  id,
  type,
  size,
  isDragging,
  dragHandleProps,
  children,
  onRemove,
  onResize,
}: WidgetShellProps) {
  const [hovered, setHovered] = useState(false);
  const meta = WIDGET_META[type];

  const nextSize: WidgetSize = size === 'sm' ? 'md' : size === 'md' ? 'lg' : 'sm';

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: isDragging ? 0.4 : 1, y: 0 }}
      exit={{ opacity: 0, y: 6 }}
      transition={{ duration: 0.18 }}
      className={cn(
        'card h-full flex flex-col relative',
        isDragging && 'ring-1 ring-accent/50 shadow-lg shadow-accent/10'
      )}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Hover controls — top right corner */}
      <div
        className={cn(
          'absolute top-3 right-3 z-10 flex items-center gap-0.5 transition-all duration-150',
          hovered ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-1 pointer-events-none'
        )}
      >
        <span
          {...dragHandleProps}
          className="cursor-grab active:cursor-grabbing flex items-center justify-center h-6 w-6 rounded-lg text-muted hover:text-primary hover:bg-surface-elevated transition-colors"
        >
          <GripVertical className="h-3.5 w-3.5" />
        </span>
        <button
          onClick={() => onResize(id, nextSize)}
          className="flex items-center justify-center h-6 w-6 rounded-lg text-muted hover:text-primary hover:bg-surface-elevated transition-colors"
          title={`Change size (current: ${size})`}
        >
          {size === 'lg' ? <Minimize2 className="h-3 w-3" /> : <Maximize2 className="h-3 w-3" />}
        </button>
        <button
          onClick={() => onRemove(id)}
          className="flex items-center justify-center h-6 w-6 rounded-lg text-muted hover:text-destructive hover:bg-destructive/10 transition-colors"
        >
          <X className="h-3 w-3" />
        </button>
      </div>

      {/* Widget label */}
      <p className="section-title mb-3">{meta.label}</p>

      {/* Content */}
      <div className="flex-1 min-h-0">{children}</div>
    </motion.div>
  );
}
