import { useEffect } from 'react';
import { useLinearAuthStore } from '@/store/linearAuth.store';
import { LinearConnect } from './LinearConnect';
import { LinearDashboard } from './LinearDashboard';
import { Spinner } from '@/components/ui/Spinner';

export function LinearPanel() {
  const { isConnected, isInitializing, loadApiKey } = useLinearAuthStore();

  useEffect(() => {
    loadApiKey();
  }, []);

  if (isInitializing) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spinner size="lg" />
      </div>
    );
  }

  return isConnected ? <LinearDashboard /> : <LinearConnect />;
}
