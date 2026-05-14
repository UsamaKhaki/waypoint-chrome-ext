import { useEffect } from 'react';
import { useGoogleCalendarAuthStore } from '@/store/googleCalendarAuth.store';
import { GoogleCalendarConnect } from './GoogleCalendarConnect';
import { GoogleCalendarDashboard } from './GoogleCalendarDashboard';
import { Spinner } from '@/components/ui/Spinner';

export function GoogleCalendarPanel() {
  const { isConnected, isInitializing, loadConnection } = useGoogleCalendarAuthStore();

  useEffect(() => {
    loadConnection();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (isInitializing) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spinner size="lg" />
      </div>
    );
  }

  return isConnected ? <GoogleCalendarDashboard /> : <GoogleCalendarConnect />;
}
