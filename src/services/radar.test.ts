import { afterEach, describe, expect, it, vi } from 'vitest';
import { fetchPackageLatest, fetchServiceStatus, packageUrl, SERVICE_TARGETS } from './radar';

const github = SERVICE_TARGETS[0];

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status });
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('fetchServiceStatus', () => {
  it.each([
    ['none', 'operational'],
    ['minor', 'minor'],
    ['major', 'major'],
    ['critical', 'critical'],
    ['maintenance', 'unknown'],
  ])('maps Statuspage indicator "%s" to "%s"', async (raw, expected) => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(jsonResponse({ status: { indicator: raw, description: 'desc' } }))
    );
    await expect(fetchServiceStatus(github)).resolves.toEqual({
      indicator: expected,
      description: 'desc',
    });
  });

  it('reports HTTP errors as unknown', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse({}, 503)));
    await expect(fetchServiceStatus(github)).resolves.toEqual({
      indicator: 'unknown',
      description: 'HTTP 503',
    });
  });

  it('reports network failures as unreachable', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')));
    await expect(fetchServiceStatus(github)).resolves.toEqual({
      indicator: 'unknown',
      description: 'Unreachable',
    });
  });
});

describe('fetchPackageLatest', () => {
  it('reads the npm "latest" dist-tag and encodes scoped names', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(jsonResponse({ version: '7.3.0', homepage: 'https://fusejs.io' }));
    vi.stubGlobal('fetch', fetchMock);

    await expect(fetchPackageLatest('@dnd-kit/core', 'npm')).resolves.toEqual({
      version: '7.3.0',
      homepage: 'https://fusejs.io',
    });
    expect(fetchMock.mock.calls[0][0]).toBe('https://registry.npmjs.org/%40dnd-kit%2Fcore/latest');
  });

  it('falls back to project_url when a PyPI package has no home_page', async () => {
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValue(
          jsonResponse({
            info: { version: '2.32.0', home_page: '', project_url: 'https://pypi.org/p/x' },
          })
        )
    );
    await expect(fetchPackageLatest('requests', 'pypi')).resolves.toEqual({
      version: '2.32.0',
      homepage: 'https://pypi.org/p/x',
    });
  });

  it('returns null for unknown packages', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse({}, 404)));
    await expect(fetchPackageLatest('does-not-exist', 'npm')).resolves.toBeNull();
  });
});

describe('packageUrl', () => {
  it('links to the registry page', () => {
    expect(packageUrl('zustand', 'npm')).toBe('https://www.npmjs.com/package/zustand');
    expect(packageUrl('requests', 'pypi')).toBe('https://pypi.org/project/requests/');
  });
});
