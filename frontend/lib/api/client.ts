const PUBLIC_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';
const BASE =
  typeof window === 'undefined'
    ? (process.env.INTERNAL_API_URL ?? PUBLIC_URL)
    : PUBLIC_URL;

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...init?.headers },
    cache: 'no-store',
    signal: AbortSignal.timeout(4000),
  });
  if (!res.ok) {
    const body = (await res.json().catch(() => null)) as { message?: unknown } | null;
    const message = body?.message;
    const detail = typeof message === 'string'
      ? message
      : Array.isArray(message)
        ? message.filter((item): item is string => typeof item === 'string').join(' ')
        : '';
    throw new ApiError(res.status, detail || `API ${res.status}: ${path}`);
  }
  return res.json() as Promise<T>;
}
