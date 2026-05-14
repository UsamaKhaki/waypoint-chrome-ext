import { useEffect } from 'react';
import { useJiraAuthStore } from '@/store/jiraAuth.store';
import { JiraConnect } from './JiraConnect';
import { JiraDashboard } from './JiraDashboard';
import { Spinner } from '@/components/ui/Spinner';

export function JiraPanel() {
  const { isConnected, isInitializing, loadCredentials } = useJiraAuthStore();

  useEffect(() => {
    loadCredentials();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (isInitializing) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spinner size="lg" />
      </div>
    );
  }

  return isConnected ? <JiraDashboard /> : <JiraConnect />;
}
