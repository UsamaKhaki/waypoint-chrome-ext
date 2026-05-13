import { useState } from 'react';
import { Plus } from 'lucide-react';
import { useEnvironmentsStore } from '@/store/environments.store';
import { useWorkspaceStore } from '@/store/workspace.store';
import { Button } from '@/components/ui/Button';
import { EnvironmentCard } from './EnvironmentCard';
import { EnvironmentForm } from './EnvironmentForm';
import type { Environment } from '@/types';

export function EnvironmentsPanel() {
  const { environments } = useEnvironmentsStore();
  const { config } = useWorkspaceStore();
  const [editingEnv, setEditingEnv] = useState<Environment | undefined>(undefined);
  const [isFormOpen, setIsFormOpen] = useState(false);

  const visibleEnvs = environments.filter(
    (e) => config.visibleEnvironments.length === 0 || config.visibleEnvironments.includes(e.type)
  );

  const openAdd = () => {
    setEditingEnv(undefined);
    setIsFormOpen(true);
  };
  const openEdit = (env: Environment) => {
    setEditingEnv(env);
    setIsFormOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-primary">Environments</h1>
          <p className="text-sm text-muted mt-0.5">{visibleEnvs.length} environments configured</p>
        </div>
        <Button size="sm" onClick={openAdd}>
          <Plus className="h-3.5 w-3.5" /> Add Environment
        </Button>
      </div>

      {visibleEnvs.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="text-4xl mb-3">🌐</div>
          <h3 className="text-base font-medium text-secondary">No environments configured</h3>
          <p className="text-sm text-muted mt-1">Add your first environment to get started</p>
          <Button className="mt-4" size="sm" onClick={openAdd}>
            <Plus className="h-3.5 w-3.5" /> Add Environment
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {visibleEnvs.map((env) => (
            <EnvironmentCard key={env.id} environment={env} onEdit={openEdit} />
          ))}
        </div>
      )}

      <EnvironmentForm
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        environment={editingEnv}
      />
    </div>
  );
}
