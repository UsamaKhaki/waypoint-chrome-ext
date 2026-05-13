import { useEffect } from 'react';
import { useGitHubAuthStore } from '@/store/githubAuth.store';
import { GitHubConnect } from './GitHubConnect';
import { GitHubDashboard } from './GitHubDashboard';
import { Spinner } from '@/components/ui/Spinner';

export function GitHubPanel() {
  const { isConnected, isInitializing, loadToken, user } = useGitHubAuthStore();

  useEffect(() => {
    loadToken();
  }, []);

  // Wait for the storage check to finish before deciding which screen to show
  if (isInitializing) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spinner size="lg" />
      </div>
    );
  }

  return isConnected ? <GitHubDashboard /> : <GitHubConnect />;
}
