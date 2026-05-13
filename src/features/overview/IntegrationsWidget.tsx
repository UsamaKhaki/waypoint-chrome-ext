import { Zap } from 'lucide-react';
import { motion } from 'framer-motion';
import { usePro } from '@/hooks/usePro';
import { PRO_FEATURES } from '@/constants/subscription';
import { useSubscriptionStore } from '@/store/subscription.store';
import { Button } from '@/components/ui/Button';

export function IntegrationsWidget() {
  const { isPro } = usePro();
  const openUpgradeModal = useSubscriptionStore((s) => s.openUpgradeModal);

  if (isPro) {
    return (
      <motion.div
        layout
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="card p-5"
      >
        <div className="flex items-center gap-2 mb-2">
          <Zap className="h-4 w-4 text-accent" />
          <h3 className="text-sm font-semibold text-primary">Linear & Jira</h3>
        </div>
        <p className="text-xs text-muted">
          Integration coming soon — your assigned tickets will appear here.
        </p>
      </motion.div>
    );
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="relative rounded-2xl overflow-hidden"
      style={{
        background:
          'linear-gradient(135deg, hsl(var(--accent)/0.15) 0%, hsl(var(--accent)/0.05) 100%)',
      }}
    >
      <div className="absolute inset-0 border border-accent/20 rounded-2xl pointer-events-none" />
      <div className="p-5">
        <div className="flex items-center gap-2 mb-2">
          <Zap className="h-4 w-4 text-accent" />
          <h3 className="text-sm font-semibold text-primary">Linear & Jira</h3>
        </div>
        <p className="text-xs text-muted mb-4">
          Pull your assigned tickets directly into your workspace.
        </p>
        <Button size="sm" onClick={() => openUpgradeModal(PRO_FEATURES.LINEAR_WIDGET)}>
          Unlock with Pro →
        </Button>
      </div>
    </motion.div>
  );
}
