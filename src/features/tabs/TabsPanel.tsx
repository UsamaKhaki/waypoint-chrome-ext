import { Layers } from 'lucide-react';
import { RecentTabs } from './RecentTabs';
import { DuplicateDetector } from './DuplicateDetector';
import { SessionManager } from './SessionManager';
import { BulkTabActions } from './BulkTabActions';
import { PanelShell, PanelHeader } from '@/features/shared/PanelShell';

export function TabsPanel() {
  return (
    <PanelShell testId="tabs-panel">
      <PanelHeader
        icon={Layers}
        title="Tab Manager"
        subtitle="Reduce tab chaos, find duplicates, manage sessions"
      />

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
    </PanelShell>
  );
}
