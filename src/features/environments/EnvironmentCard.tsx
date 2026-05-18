import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  ExternalLink,
  Copy,
  Plus,
  Trash2,
  Edit2,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Activity,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { useEnvironmentsStore } from '@/store/environments.store';
import { copyToClipboard, openUrls } from '@/utils';
import type { Environment, EnvironmentLink } from '@/types';

const LINK_TYPE_LABELS: Record<string, string> = {
  frontend: 'Frontend',
  backend: 'Backend',
  admin: 'Admin',
  logs: 'Logs',
  monitoring: 'Monitoring',
  api: 'API',
  grafana: 'Grafana',
  kibana: 'Kibana',
  sentry: 'Sentry',
  database: 'Database',
  deployment: 'Deployment',
  other: 'Other',
};

interface EnvironmentCardProps {
  environment: Environment;
  onEdit: (env: Environment) => void;
}

export function EnvironmentCard({ environment, onEdit }: EnvironmentCardProps) {
  const { removeLink } = useEnvironmentsStore();
  const [isExpanded, setIsExpanded] = useState(true);
  const [showProdWarning, setShowProdWarning] = useState(false);
  const [pendingUrl, setPendingUrl] = useState('');

  const isProduction = environment.type === 'production';

  const handleOpenLink = (link: EnvironmentLink) => {
    if (isProduction) {
      setPendingUrl(link.url);
      setShowProdWarning(true);
    } else {
      chrome.tabs.create({ url: link.url });
    }
  };

  const handleOpenAll = () => {
    if (isProduction) {
      setPendingUrl('__all__');
      setShowProdWarning(true);
    } else {
      openUrls(environment.links.map((l) => l.url));
    }
  };

  const confirmProdOpen = () => {
    if (pendingUrl === '__all__') {
      openUrls(environment.links.map((l) => l.url));
    } else {
      chrome.tabs.create({ url: pendingUrl });
    }
    setShowProdWarning(false);
    setPendingUrl('');
  };

  const healthColor = {
    healthy: 'text-success',
    degraded: 'text-warning',
    down: 'text-destructive',
    unknown: 'text-muted',
  }[environment.healthStatus ?? 'unknown'];

  const envBadgeVariant =
    environment.type === 'local' ? 'local' : environment.type === 'stage' ? 'stage' : 'production';

  return (
    <>
      <motion.div
        layout
        data-testid={`environment-card-${environment.id}`}
        className={cn('card overflow-hidden', isProduction && 'ring-1 ring-env-production/30')}
        style={{ borderColor: `${environment.color}20` }}
      >
        {/* Color bar */}
        <div
          className="h-1 w-full rounded-t-xl -mt-4 -mx-4 mb-3"
          style={{
            backgroundColor: environment.color,
            marginTop: '-1rem',
            marginLeft: '-1rem',
            marginRight: '-1rem',
            width: 'calc(100% + 2rem)',
          }}
        />

        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Badge variant={envBadgeVariant as any}>{environment.name}</Badge>
            <Activity className={cn('h-3.5 w-3.5', healthColor)} />
            {isProduction && <AlertTriangle className="h-3.5 w-3.5 text-destructive" />}
          </div>
          <div className="flex items-center gap-1">
            {environment.links.length > 1 && (
              <Button variant="ghost" size="icon-sm" onClick={handleOpenAll} title="Open all links">
                <ExternalLink className="h-3.5 w-3.5" />
              </Button>
            )}
            <Button variant="ghost" size="icon-sm" onClick={() => onEdit(environment)}>
              <Edit2 className="h-3.5 w-3.5" />
            </Button>
            <Button variant="ghost" size="icon-sm" onClick={() => setIsExpanded((e) => !e)}>
              {isExpanded ? (
                <ChevronUp className="h-3.5 w-3.5" />
              ) : (
                <ChevronDown className="h-3.5 w-3.5" />
              )}
            </Button>
          </div>
        </div>

        {/* Links */}
        {isExpanded && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-1.5">
            {environment.links.length === 0 ? (
              <p className="text-xs text-muted py-2 text-center">No links configured</p>
            ) : (
              environment.links.map((link, i) => (
                <div
                  key={i}
                  className="group flex items-center gap-2 rounded-lg px-2.5 py-1.5 hover:bg-surface-elevated transition-colors"
                >
                  <span className="text-xs text-muted w-20 flex-shrink-0 truncate">
                    {LINK_TYPE_LABELS[link.type] ?? link.type}
                  </span>
                  <button
                    onClick={() => handleOpenLink(link)}
                    className="flex-1 text-xs text-secondary hover:text-accent truncate text-left transition-colors"
                    title={link.url}
                  >
                    {link.label || link.url}
                  </button>
                  <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1 transition-opacity">
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      className="h-6 w-6"
                      onClick={() => copyToClipboard(link.url)}
                      title="Copy URL"
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      className="h-6 w-6 hover:text-destructive"
                      onClick={() => removeLink(environment.id, link.label)}
                      title="Remove"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </motion.div>
        )}

        {/* Notes */}
        {environment.notes && isExpanded && (
          <p className="text-xs text-muted mt-3 pt-3 border-t border-border-subtle">
            {environment.notes}
          </p>
        )}
      </motion.div>

      {/* Production warning modal */}
      <Modal
        isOpen={showProdWarning}
        onClose={() => setShowProdWarning(false)}
        title="⚠️ Production Environment"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-sm text-secondary">
            You are about to open a{' '}
            <span className="text-destructive font-semibold">Production</span> link. Make sure you
            know what you're doing.
          </p>
          <div className="flex gap-2 justify-end">
            <Button variant="ghost" onClick={() => setShowProdWarning(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmProdOpen}>
              Open Anyway
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
