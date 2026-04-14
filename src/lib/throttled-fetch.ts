// Client-side fetch throttle — prevents rapid-fire API calls
let lastRequestTime = 0;
const MIN_INTERVAL = 250; // 250ms between requests minimum

export async function throttledFetch(url: string, options?: RequestInit): Promise<Response> {
  const now = Date.now();
  const wait = MIN_INTERVAL - (now - lastRequestTime);
  if (wait > 0) {
    await new Promise(r => setTimeout(r, wait));
  }
  lastRequestTime = Date.now();
  return fetch(url, options);
}

export async function throttledPost(url: string, body: any): Promise<any> {
  const res = await throttledFetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (res.status === 429) {
    return { error: 'rate_limit', message: 'Please wait a moment and try again' };
  }
  if (!res.ok) return null;
  return res.json();
}
