import { describe, expect, it, vi } from 'vitest';
import { interpolate, sendApiRequest } from './apiClient';

describe('interpolate', () => {
  const env = { baseUrl: 'https://api.example.com', 'auth.token': 'abc' };

  it('replaces {{var}} tokens, tolerating whitespace', () => {
    expect(interpolate('{{baseUrl}}/users', env)).toBe('https://api.example.com/users');
    expect(interpolate('Bearer {{ auth.token }}', env)).toBe('Bearer abc');
  });

  it('leaves unknown tokens in place so the user can see what is missing', () => {
    expect(interpolate('{{baseUrl}}/{{version}}/users', env)).toBe(
      'https://api.example.com/{{version}}/users'
    );
  });
});

describe('sendApiRequest (outside the extension)', () => {
  it('strips blank header names and never sends a body with GET', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(new Response('{"ok":true}', { status: 200, statusText: 'OK' }));
    vi.stubGlobal('fetch', fetchMock);

    const result = await sendApiRequest({
      method: 'GET',
      url: 'https://api.example.com/health',
      headers: { ' Accept ': 'application/json', '  ': 'ignored' },
      body: '{"should":"not be sent"}',
    });

    expect(fetchMock).toHaveBeenCalledWith('https://api.example.com/health', {
      method: 'GET',
      headers: { Accept: 'application/json' },
      body: undefined,
    });
    expect(result).toMatchObject({ ok: true, status: 200, body: '{"ok":true}', size: 11 });
    vi.unstubAllGlobals();
  });

  it('reports network failures instead of throwing', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('ECONNREFUSED')));

    const result = await sendApiRequest({ method: 'POST', url: 'http://x', headers: {} });

    expect(result.ok).toBe(false);
    expect(result.error).toBe('ECONNREFUSED');
    vi.unstubAllGlobals();
  });
});
