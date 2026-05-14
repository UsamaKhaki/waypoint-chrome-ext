import { useEffect } from 'react';
import { useNotionAuthStore } from '@/store/notionAuth.store';
import { NotionConnect } from './NotionConnect';
import { NotionDashboard } from './NotionDashboard';
import { Spinner } from '@/components/ui/Spinner';

export function NotionPanel() {
  const { isConnected, isInitializing, loadToken } = useNotionAuthStore();

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

  return isConnected ? <NotionDashboard /> : <NotionConnect />;
}
