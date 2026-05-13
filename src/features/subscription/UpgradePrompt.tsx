import { Lock } from 'lucide-react';
import { useSubscriptionStore } from '@/store/subscription.store';
import type { ProFeature } from '@/constants/subscription';
import { cn } from '@/lib/utils';

interface UpgradePromptProps {
  feature: ProFeature;
  message: string;
  className?: string;
}

export function UpgradePrompt({ feature, message, className }: UpgradePromptProps) {
  const openUpgradeModal = useSubscriptionStore((s) => s.openUpgradeModal);

  return (
    <div
      className={cn(
        'flex items-center gap-3 px-4 py-3 rounded-xl border border-accent/30 bg-accent/5',
        className
      )}
    >
      <Lock className="h-4 w-4 text-accent flex-shrink-0" />
      <p className="text-xs text-secondary flex-1">{message}</p>
      <button
        onClick={() => openUpgradeModal(feature)}
        className="text-xs text-accent font-medium hover:underline flex-shrink-0 whitespace-nowrap"
      >
        Upgrade to Pro →
      </button>
    </div>
  );
}
