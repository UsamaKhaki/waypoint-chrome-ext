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
            reject(new Error(chrome.runtime.lastError.message));
            return;
          }
          if (!response?.ok) {
            // Surface the API's own error message when available
            const apiMessage =
              (response?.data as { message?: string } | undefined)?.message;
            reject(new Error(apiMessage ?? response?.error ?? `HTTP ${response?.status}`));
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
