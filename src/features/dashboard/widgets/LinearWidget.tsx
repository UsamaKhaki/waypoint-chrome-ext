import { useSubscriptionStore } from '@/store/subscription.store';
import { UpgradePrompt } from '@/features/subscription/UpgradePrompt';

export function LinearWidget() {
  const isPro = useSubscriptionStore((s) => s.isPro());

  if (!isPro) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3 py-2">
        <span className="text-3xl">◆</span>
        <p className="text-sm font-medium text-primary">Linear Integration</p>
        <p className="text-xs text-muted text-center">
          View assigned Linear issues directly in your dashboard
        </p>
        <UpgradePrompt
          feature="linear_widget"
          message="Linear integration is a Pro feature"
          className="w-full"
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center h-full gap-2 text-center">
      <span className="text-3xl">◆</span>
      <p className="text-sm font-medium text-primary">Linear</p>
      <p className="text-xs text-muted">Coming soon — Linear integration is in development</p>
      <div className="flex gap-1 mt-1">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="h-1.5 w-1.5 rounded-full bg-accent animate-bounce"
            style={{ animationDelay: `${i * 0.15}s` }}
          />
        ))}
      </div>
    </div>
  );
}
