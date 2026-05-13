import { create } from 'zustand';
import { storage } from '@/services/storage';
import type { Plan, ProFeature } from '@/constants/subscription';
import { PRO_FEATURES } from '@/constants/subscription';

interface SubscriptionState {
  plan: Plan;
  showUpgradeModal: boolean;
  upgradeFeature: ProFeature | null;
  isLoading: boolean;

  load: () => Promise<void>;
  openUpgradeModal: (feature?: ProFeature) => void;
  closeUpgradeModal: () => void;
  activateLicense: (key: string) => Promise<boolean>;
  deactivate: () => void;

  isPro: () => boolean;
  canUse: (feature: ProFeature) => boolean;
}

export const useSubscriptionStore = create<SubscriptionState>((set, get) => ({
  plan: 'free',
  showUpgradeModal: false,
  upgradeFeature: null,
  isLoading: false,

  load: async () => {
    const saved = await storage.get<{ plan: Plan }>('subscription');
    if (saved?.plan) set({ plan: saved.plan });
  },

  openUpgradeModal: (feature) => set({ showUpgradeModal: true, upgradeFeature: feature ?? null }),
  closeUpgradeModal: () => set({ showUpgradeModal: false, upgradeFeature: null }),

  activateLicense: async (key: string) => {
    set({ isLoading: true });
    await new Promise((r) => setTimeout(r, 1200));
    const upper = key.toUpperCase().trim();
    let activePlan: Plan;
    if (upper.startsWith('WAYPOINT-TEAM-')) activePlan = 'team';
    else if (upper.startsWith('WAYPOINT-PRO-') || upper.startsWith('WAYPOINT-')) activePlan = 'pro';
    else {
      set({ isLoading: false });
      return false;
    }
    await storage.set('subscription', { plan: activePlan });
    set({ plan: activePlan, isLoading: false });
    return true;
  },

  deactivate: () => {
    storage.set('subscription', { plan: 'free' });
    set({ plan: 'free' });
  },

  isPro: () => {
    const { plan } = get();
    return plan === 'pro' || plan === 'team';
  },

  canUse: (feature: ProFeature) => {
    const { plan } = get();
    const isPro = plan === 'pro' || plan === 'team';
    const proGated = Object.values(PRO_FEATURES) as ProFeature[];
    if (proGated.includes(feature)) return isPro;
    return true;
  },
}));
