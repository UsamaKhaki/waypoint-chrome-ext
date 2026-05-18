import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check, Zap } from 'lucide-react';
import { useSubscriptionStore } from '@/store/subscription.store';
import {
  PLAN_CONFIG,
  CHECKOUT_URLS,
  PRO_FEATURES,
  type ProFeature,
} from '@/constants/subscription';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { cn } from '@/lib/utils';

const FEATURE_LABEL: Record<ProFeature, string> = {
  [PRO_FEATURES.UNLIMITED_SNIPPETS]: 'Unlimited Snippets',
  [PRO_FEATURES.SNIPPET_VARIABLES]: 'Snippet Variables',
  [PRO_FEATURES.CLOUD_SYNC]: 'Cloud Sync',
  [PRO_FEATURES.LINEAR_WIDGET]: 'Linear & Jira Widget',
  [PRO_FEATURES.CUSTOM_WORKSPACES]: 'Custom Workspaces',
};

const COMPARISON_ROWS = [
  { label: 'Custom workspaces', pro: true },
  { label: 'Unlimited snippets', pro: true },
  { label: 'Snippet variables', pro: true },
  { label: 'Cloud sync across devices', pro: true },
  { label: 'Linear & Jira widget', pro: true },
  { label: 'Multiple GitHub accounts', pro: true },
  { label: 'Priority support', pro: true },
];

export function UpgradeModal() {
  const show = useSubscriptionStore((s) => s.showUpgradeModal);
  const upgradeFeature = useSubscriptionStore((s) => s.upgradeFeature);
  const closeUpgradeModal = useSubscriptionStore((s) => s.closeUpgradeModal);
  const activateLicense = useSubscriptionStore((s) => s.activateLicense);
  const isLoading = useSubscriptionStore((s) => s.isLoading);

  const [billing, setBilling] = useState<'monthly' | 'yearly'>('monthly');
  const [licenseKey, setLicenseKey] = useState('');
  const [licenseError, setLicenseError] = useState('');
  const [activated, setActivated] = useState(false);

  useEffect(() => {
    if (!show) {
      setLicenseKey('');
      setLicenseError('');
      setActivated(false);
    }
  }, [show]);

  const handleCheckout = () => {
    const url = billing === 'monthly' ? CHECKOUT_URLS.pro_monthly : CHECKOUT_URLS.pro_yearly;
    console.log('[Waypoint] Checkout URL:', url);
  };

  const handleActivate = async () => {
    if (!licenseKey.trim()) return;
    setLicenseError('');
    const ok = await activateLicense(licenseKey.trim());
    if (ok) {
      setActivated(true);
      setTimeout(() => closeUpgradeModal(), 2000);
    } else {
      setLicenseError(
        'Invalid license key. Expected format: WAYPOINT-PRO-XXXX or WAYPOINT-TEAM-XXXX'
      );
    }
  };

  const proMonthly = PLAN_CONFIG.pro.monthlyPrice;
  const proYearly = PLAN_CONFIG.pro.yearlyPrice;

  const content = (
    <AnimatePresence>
      {show && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={closeUpgradeModal}
          />

          {/* Panel */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            className="relative glass-elevated rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden"
          >
            {/* Close */}
            <button
              onClick={closeUpgradeModal}
              className="absolute top-4 right-4 z-10 h-8 w-8 rounded-xl flex items-center justify-center text-muted hover:text-primary hover:bg-surface-elevated transition-colors"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="p-6 pb-0">
              {/* Header */}
              <div className="mb-5">
                {upgradeFeature && FEATURE_LABEL[upgradeFeature] ? (
                  <>
                    <p className="text-xs text-accent font-medium mb-1 flex items-center gap-1.5">
                      <Zap className="h-3.5 w-3.5" />
                      Pro Feature
                    </p>
                    <h2 className="text-xl font-semibold text-primary">
                      Unlock {FEATURE_LABEL[upgradeFeature]} with Pro
                    </h2>
                  </>
                ) : (
                  <>
                    <p className="text-xs text-accent font-medium mb-1 flex items-center gap-1.5">
                      <Zap className="h-3.5 w-3.5" />
                      Upgrade
                    </p>
                    <h2 className="text-xl font-semibold text-primary">Unlock Waypoint Pro</h2>
                  </>
                )}
                <p className="text-sm text-muted mt-1">
                  Supercharge your developer workflow with unlimited snippets, variables, and
                  integrations.
                </p>
              </div>

              {/* Billing toggle */}
              <div className="flex items-center gap-3 mb-5">
                <div className="flex items-center gap-1 p-1 bg-surface-elevated rounded-xl">
                  <button
                    onClick={() => setBilling('monthly')}
                    className={cn(
                      'px-4 py-1.5 rounded-lg text-xs font-medium transition-all duration-150',
                      billing === 'monthly'
                        ? 'bg-accent/10 text-accent'
                        : 'text-muted hover:text-secondary'
                    )}
                  >
                    Monthly
                  </button>
                  <button
                    onClick={() => setBilling('yearly')}
                    className={cn(
                      'px-4 py-1.5 rounded-lg text-xs font-medium transition-all duration-150',
                      billing === 'yearly'
                        ? 'bg-accent/10 text-accent'
                        : 'text-muted hover:text-secondary'
                    )}
                  >
                    Yearly
                  </button>
                </div>
                {billing === 'yearly' && (
                  <span className="text-xs text-success font-medium bg-success/10 px-2 py-0.5 rounded-full">
                    Save ~25%
                  </span>
                )}
              </div>
            </div>

            {/* Plan columns */}
            <div className="px-6 pb-4 grid grid-cols-2 gap-3">
              {/* Free */}
              <div className="rounded-xl border border-border-subtle bg-surface p-4 space-y-3">
                <div>
                  <p className="text-xs text-muted font-medium">Free</p>
                  <p className="text-2xl font-bold text-primary mt-0.5">$0</p>
                  <p className="text-xs text-muted">forever</p>
                </div>
                <div className="space-y-2">
                  {COMPARISON_ROWS.map((row) => (
                    <div key={row.label} className="flex items-center gap-2">
                      <X className="h-3.5 w-3.5 text-muted flex-shrink-0" />
                      <span className="text-xs text-muted">{row.label}</span>
                    </div>
                  ))}
                </div>
                <div className="pt-1">
                  <div className="w-full h-9 rounded-lg border border-border-subtle flex items-center justify-center text-xs text-muted">
                    Current plan
                  </div>
                </div>
              </div>

              {/* Pro */}
              <div className="rounded-xl border border-accent/40 bg-accent/5 p-4 space-y-3 relative overflow-hidden">
                <div className="absolute top-0 right-0 bg-accent text-white text-xs font-semibold px-3 py-1 rounded-bl-xl">
                  Popular
                </div>
                <div>
                  <p className="text-xs text-accent font-medium">Pro</p>
                  <p className="text-2xl font-bold text-primary mt-0.5">
                    {billing === 'monthly' ? `$${proMonthly}` : `$${(proYearly / 12).toFixed(2)}`}
                  </p>
                  <p className="text-xs text-muted">
                    {billing === 'monthly' ? 'per month' : `per month — $${proYearly}/yr`}
                  </p>
                </div>
                <div className="space-y-2">
                  {COMPARISON_ROWS.map((row) => (
                    <div key={row.label} className="flex items-center gap-2">
                      <Check className="h-3.5 w-3.5 text-accent flex-shrink-0" />
                      <span className="text-xs text-secondary">{row.label}</span>
                    </div>
                  ))}
                </div>
                <div className="pt-1">
                  <Button className="w-full" size="sm" onClick={handleCheckout}>
                    <Zap className="h-3.5 w-3.5" />
                    {billing === 'monthly'
                      ? `Start Pro — $${proMonthly}/mo`
                      : `Start Pro — $${proYearly}/yr`}
                  </Button>
                </div>
              </div>
            </div>

            {/* License key section */}
            <div className="px-6 pb-6 border-t border-border-subtle pt-4">
              <AnimatePresence mode="wait">
                {activated ? (
                  <motion.div
                    key="success"
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="flex items-center gap-2 text-success"
                  >
                    <Check className="h-4 w-4" />
                    <span className="text-sm font-medium">Pro activated! Closing…</span>
                  </motion.div>
                ) : (
                  <motion.div
                    key="form"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    <p className="text-xs text-muted mb-2">Already have a license?</p>
                    <div className="flex gap-2">
                      <Input
                        placeholder="WAYPOINT-PRO-XXXX"
                        value={licenseKey}
                        onChange={(e) => setLicenseKey(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleActivate()}
                        className="text-xs"
                      />
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={handleActivate}
                        disabled={!licenseKey.trim() || isLoading}
                        className="flex-shrink-0"
                      >
                        {isLoading ? 'Activating…' : 'Activate'}
                      </Button>
                    </div>
                    {licenseError && (
                      <p className="text-xs text-destructive mt-1.5">{licenseError}</p>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );

  return createPortal(content, document.body);
}
