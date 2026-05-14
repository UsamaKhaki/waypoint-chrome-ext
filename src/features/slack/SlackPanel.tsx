import { useEffect } from 'react';
import { useSlackAuthStore } from '@/store/slackAuth.store';
import { SlackConnect } from './SlackConnect';
import { SlackDashboard } from './SlackDashboard';
import { Spinner } from '@/components/ui/Spinner';

export function SlackPanel() {
  const { isConnected, isInitializing, loadToken } = useSlackAuthStore();

  useEffect(() => {
    loadToken();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (isInitializing) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spinner size="lg" />
      </div>
    );
  }

  return isConnected ? <SlackDashboard /> : <SlackConnect />;
}
