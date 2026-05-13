import { useSubscriptionStore } from '@/store/subscription.store';
import type { ProFeature } from '@/constants/subscription';

export function usePro() {
  const plan = useSubscriptionStore((s) => s.plan);
  const openUpgradeModal = useSubscriptionStore((s) => s.openUpgradeModal);
  const isPro = plan === 'pro' || plan === 'team';
  const isTeam = plan === 'team';

  const canUse = (_feature: ProFeature): boolean => {
    return isPro;
  };

  const requirePro = (feature: ProFeature): boolean => {
    if (isPro) return true;
    openUpgradeModal(feature);
    return false;
  };

  return { plan, isPro, isTeam, canUse, requirePro };
}
