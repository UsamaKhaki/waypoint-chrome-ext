import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Lock, Check } from 'lucide-react';
import { useWidgetsStore, WIDGET_META } from '@/store/widgets.store';
import type { WidgetType } from '@/store/widgets.store';
import { useSubscriptionStore } from '@/store/subscription.store';

interface WidgetPickerProps {
  onClose: () => void;
}

const SIZE_LABEL: Record<string, string> = { sm: 'Small', md: 'Medium', lg: 'Large' };

export function WidgetPicker({ onClose }: WidgetPickerProps) {
  const widgets = useWidgetsStore((s) => s.widgets);
  const addWidget = useWidgetsStore((s) => s.addWidget);
  const removeWidget = useWidgetsStore((s) => s.removeWidget);
  const isPro = useSubscriptionStore((s) => s.isPro());
  const openUpgradeModal = useSubscriptionStore((s) => s.openUpgradeModal);

  const allTypes = Object.keys(WIDGET_META) as WidgetType[];

  const handleToggle = (type: WidgetType) => {
    const meta = WIDGET_META[type];
    if (meta.isPro && !isPro) {
      openUpgradeModal('linear_widget');
      return;
    }
    const existing = widgets.find((w) => w.type === type);
    if (existing) {
      removeWidget(existing.id);
    } else {
      addWidget(type);
    }
  };

  return createPortal(
    <AnimatePresence>
      <motion.div
        key="picker-backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[9998] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
        onClick={(e) => e.target === e.currentTarget && onClose()}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.15 }}
          className="card w-full max-w-lg max-h-[80vh] flex flex-col"
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-semibold text-primary">Add Widget</h2>
              <p className="text-xs text-muted mt-0.5">Click a widget to add or remove it</p>
            </div>
            <button
              onClick={onClose}
              className="h-8 w-8 flex items-center justify-center rounded-lg text-muted hover:text-primary hover:bg-surface-elevated transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Widget grid */}
          <div className="overflow-y-auto -mx-1">
            <div className="grid grid-cols-2 gap-2 px-1">
              {allTypes.map((type) => {
                const meta = WIDGET_META[type];
                const isAdded = widgets.some((w) => w.type === type);
                const isLocked = meta.isPro && !isPro;

                return (
                  <button
                    key={type}
                    onClick={() => handleToggle(type)}
                    className="relative flex flex-col items-start gap-1.5 p-3 rounded-xl border border-border hover:border-accent/40 hover:bg-surface-elevated transition-all text-left group"
                  >
                    {/* Status badge */}
                    <div className="absolute top-2 right-2 flex items-center gap-1">
                      {isLocked && (
                        <span className="flex items-center gap-1 text-xs text-muted bg-surface-elevated px-1.5 py-0.5 rounded-full">
                          <Lock className="h-3 w-3" />
                          Pro
                        </span>
                      )}
                      {isAdded && !isLocked && (
                        <span className="flex items-center gap-1 text-xs text-accent bg-accent/10 px-1.5 py-0.5 rounded-full">
                          <Check className="h-3 w-3" />
                          Added
                        </span>
                      )}
                    </div>

                    <div>
                      <p className="text-sm font-medium text-primary">{meta.label}</p>
                      <p className="text-xs text-muted mt-1 line-clamp-2 leading-relaxed">
                        {meta.description}
                      </p>
                    </div>
                    <span className="text-[10px] text-muted uppercase tracking-wider">
                      {SIZE_LABEL[meta.defaultSize]}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>,
    document.body
  );
}
