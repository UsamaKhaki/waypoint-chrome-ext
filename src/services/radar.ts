/**
 * Lightweight pollers for the Radar panel. These all hit endpoints that send
 * permissive CORS headers (Statuspage v2, npm registry, PyPI JSON), so they can
 * be fetched directly from the extension page without extra host permissions.
 */

export type StatusIndicator = 'operational' | 'minor' | 'major' | 'critical' | 'unknown';

export interface ServiceTarget {
  id: string;
  name: string;
  /** Statuspage v2 summary endpoint. */
  statusUrl: string;
  /** Public status page to open on click. */
  pageUrl: string;
}

export interface ServiceStatus {
  indicator: StatusIndicator;
  description: string;
}

/** Curated set of Statuspage-powered services developers care about. */
export const SERVICE_TARGETS: ServiceTarget[] = [
  {
    id: 'github',
    name: 'GitHub',
    statusUrl: 'https://www.githubstatus.com/api/v2/status.json',
    pageUrl: 'https://www.githubstatus.com',
  },
  {
    id: 'npm',
    name: 'npm',
    statusUrl: 'https://status.npmjs.org/api/v2/status.json',
    pageUrl: 'https://status.npmjs.org',
  },
  {
    id: 'cloudflare',
    name: 'Cloudflare',
    statusUrl: 'https://www.cloudflarestatus.com/api/v2/status.json',
    pageUrl: 'https://www.cloudflarestatus.com',
  },
  {
    id: 'vercel',
    name: 'Vercel',
    statusUrl: 'https://www.vercel-status.com/api/v2/status.json',
    pageUrl: 'https://www.vercel-status.com',
  },
  {
    id: 'openai',
    name: 'OpenAI',
    statusUrl: 'https://status.openai.com/api/v2/status.json',
    pageUrl: 'https://status.openai.com',
  },
  {
    id: 'atlassian',
    name: 'Atlassian',
    statusUrl: 'https://status.atlassian.com/api/v2/status.json',
    pageUrl: 'https://status.atlassian.com',
  },
  {
    id: 'digitalocean',
    name: 'DigitalOcean',
    statusUrl: 'https://status.digitalocean.com/api/v2/status.json',
    pageUrl: 'https://status.digitalocean.com',
  },
  {
    id: 'discord',
    name: 'Discord',
    statusUrl: 'https://discordstatus.com/api/v2/status.json',
    pageUrl: 'https://discordstatus.com',
  },
  {
    id: 'datadog',
    name: 'Datadog',
    statusUrl: 'https://status.datadoghq.com/api/v2/status.json',
    pageUrl: 'https://status.datadoghq.com',
  },
];

function normalizeIndicator(raw: string): StatusIndicator {
  switch (raw) {
    case 'none':
      return 'operational';
    case 'minor':
      return 'minor';
    case 'major':
      return 'major';
    case 'critical':
      return 'critical';
    default:
      return 'unknown';
  }
}

export async function fetchServiceStatus(target: ServiceTarget): Promise<ServiceStatus> {
  try {
    const res = await fetch(target.statusUrl, { cache: 'no-store' });
    if (!res.ok) return { indicator: 'unknown', description: `HTTP ${res.status}` };
    const data = (await res.json()) as { status?: { indicator?: string; description?: string } };
    return {
      indicator: normalizeIndicator(data.status?.indicator ?? ''),
      description: data.status?.description ?? 'Unknown',
    };
  } catch {
    return { indicator: 'unknown', description: 'Unreachable' };
  }
}

export type Registry = 'npm' | 'pypi';

export interface PackageLatest {
  version: string;
  homepage?: string;
  publishedAt?: string;
}

export async function fetchPackageLatest(
  name: string,
  registry: Registry
): Promise<PackageLatest | null> {
  try {
    if (registry === 'npm') {
      const res = await fetch(`https://registry.npmjs.org/${encodeURIComponent(name)}/latest`, {
        cache: 'no-store',
      });
      if (!res.ok) return null;
      const data = (await res.json()) as { version: string; homepage?: string };
      return { version: data.version, homepage: data.homepage };
    }
    const res = await fetch(`https://pypi.org/pypi/${encodeURIComponent(name)}/json`, {
      cache: 'no-store',
    });
    if (!res.ok) return null;
    const data = (await res.json()) as {
      info: { version: string; home_page?: string; project_url?: string };
    };
    return { version: data.info.version, homepage: data.info.home_page || data.info.project_url };
  } catch {
    return null;
  }
}

export function packageUrl(name: string, registry: Registry): string {
  return registry === 'npm'
    ? `https://www.npmjs.com/package/${name}`
    : `https://pypi.org/project/${name}/`;
}
