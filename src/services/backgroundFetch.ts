import { captureApiError } from '@/lib/sentry';

interface BgFetchOptions {
  method?: string;
  headers?: Record<string, string>;
  body?: string;
}

interface BgFetchResponse {
  ok: boolean;
  status: number;
  data: unknown;
  error?: string;
}

/**
 * Routes fetch through the background service worker to bypass CORS.
 * Falls back to direct fetch in dev environments where chrome.runtime is unavailable.
 */
export async function backgroundFetch(url: string, options?: BgFetchOptions): Promise<unknown> {
  if (typeof chrome !== 'undefined' && chrome?.runtime?.sendMessage) {
    return new Promise((resolve, reject) => {
      chrome.runtime.sendMessage(
        { type: 'FETCH', url, ...options },
        (response: BgFetchResponse) => {
          if (chrome.runtime.lastError) {
            const error = new Error(chrome.runtime.lastError.message);
            captureApiError(error, 'background_fetch', { url });
            reject(error);
            return;
          }
          if (!response?.ok) {
            const apiMessage = (response?.data as { message?: string } | undefined)?.message;
            const error = new Error(apiMessage ?? response?.error ?? `HTTP ${response?.status}`);
            captureApiError(error, 'background_fetch', { url, status: response?.status });
            reject(error);
            return;
          }
          resolve(response.data);
        }
      );
    });
  }

  // Dev fallback — direct fetch (will hit CORS in dev but that's expected)
  const res = await fetch(url, options);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}
