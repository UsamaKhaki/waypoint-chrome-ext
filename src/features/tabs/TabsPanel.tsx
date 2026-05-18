import { RecentTabs } from './RecentTabs';
import { DuplicateDetector } from './DuplicateDetector';
import { SessionManager } from './SessionManager';
import { BulkTabActions } from './BulkTabActions';

export function TabsPanel() {
  return (
    <div data-testid="tabs-panel" className="space-y-8">
      <div>
        <h1 className="text-lg font-semibold text-primary">Tab Manager</h1>
        <p className="text-sm text-muted mt-0.5">Reduce tab chaos, manage sessions</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card p-4">
          <RecentTabs />
        </div>
        <div className="card p-4 space-y-6">
          <DuplicateDetector />
          <div className="border-t border-border-subtle pt-6">
            <BulkTabActions />
          </div>
        </div>
      </div>

      <div className="card p-4">
        <SessionManager />
      </div>
    </div>
  );
}
