import type { Environment } from '../../src/types/index';

export const ENVIRONMENT_FIXTURES: Environment[] = [
  {
    id: 'env-local',
    name: 'Local',
    type: 'local',
    links: [
      { label: 'Frontend', url: 'http://localhost:3000', type: 'frontend' },
      { label: 'Backend', url: 'http://localhost:8080', type: 'backend' },
    ],
    notes: 'Local development environment',
    healthStatus: 'healthy',
    color: '#22c55e',
    isActive: true,
  },
  {
    id: 'env-staging',
    name: 'Staging',
    type: 'stage',
    links: [
      { label: 'App', url: 'https://staging.acme.com', type: 'frontend' },
    ],
    notes: '',
    healthStatus: 'healthy',
    color: '#f59e0b',
    isActive: false,
  },
];
