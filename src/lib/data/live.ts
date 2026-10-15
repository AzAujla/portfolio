export async function getJson<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, init);
  const payload = await response.json();
  if (!response.ok) throw new Error(payload?.error ?? `Request failed: ${response.status}`);
  return payload as T;
}

export function startRefresh(callback: () => void | Promise<void>, intervalMs = 60_000) {
  const timer = window.setInterval(() => void callback(), intervalMs);
  return () => window.clearInterval(timer);
}
