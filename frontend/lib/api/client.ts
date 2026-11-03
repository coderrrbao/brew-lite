const PUBLIC_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';
const BASE =
  typeof window === 'undefined'
    ? (process.env.INTERNAL_API_URL ?? PUBLIC_URL)
    : PUBLIC_URL;

export async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...init?.headers },
    cache: 'no-store',
    signal: AbortSignal.timeout(4000),
  });
  if (!res.ok) throw new Error(`API ${res.status}: ${path}`);
  return res.json() as Promise<T>;
}
