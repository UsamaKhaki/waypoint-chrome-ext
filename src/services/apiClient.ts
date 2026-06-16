/**
 * Sends API-client requests through the background service worker so they
 * bypass page CORS (the worker isn't subject to the new-tab page's origin).
 * Falls back to a direct `fetch` when running outside the extension (dev).
 */

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'HEAD' | 'OPTIONS';

export interface ApiRequestInput {
  method: HttpMethod;
  url: string;
  headers: Record<string, string>;
  body?: string;
}

export interface ApiResponseResult {
  ok: boolean;
  status?: number;
  statusText?: string;
  headers?: Record<string, string>;
  body?: string;
  size?: number;
  timeMs: number;
  error?: string;
}

const hasRuntime = (): boolean => typeof chrome !== 'undefined' && !!chrome?.runtime?.sendMessage;

export async function sendApiRequest(input: ApiRequestInput): Promise<ApiResponseResult> {
  // Strip empty headers.
  const headers: Record<string, string> = {};
  for (const [k, v] of Object.entries(input.headers)) {
    if (k.trim()) headers[k.trim()] = v;
  }
  const payload = {
    type: 'API_FETCH' as const,
    url: input.url,
    method: input.method,
    headers,
    body: ['GET', 'HEAD'].includes(input.method) ? undefined : input.body || undefined,
  };

  if (hasRuntime()) {
    return new Promise<ApiResponseResult>((resolve) => {
      chrome.runtime.sendMessage(payload, (res: ApiResponseResult | undefined) => {
        if (chrome.runtime.lastError || !res) {
          resolve({
            ok: false,
            error: chrome.runtime.lastError?.message ?? 'No response',
            timeMs: 0,
          });
        } else {
          resolve(res);
        }
      });
    });
  }

  // Dev fallback — subject to CORS, but lets the UI work in `vite dev`.
  const started = Date.now();
  try {
    const res = await fetch(input.url, { method: input.method, headers, body: payload.body });
    const text = await res.text();
    const h: Record<string, string> = {};
    res.headers.forEach((v, k) => (h[k] = v));
    return {
      ok: res.ok,
      status: res.status,
      statusText: res.statusText,
      headers: h,
      body: text,
      size: text.length,
      timeMs: Date.now() - started,
    };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Request failed',
      timeMs: Date.now() - started,
    };
  }
}

/** Interpolate {{var}} tokens from an environment map into a string. */
export function interpolate(text: string, env: Record<string, string>): string {
  return text.replace(/\{\{\s*([\w.-]+)\s*\}\}/g, (_, key: string) => env[key] ?? `{{${key}}}`);
}
