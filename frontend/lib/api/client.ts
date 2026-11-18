const BASE =
  typeof window === 'undefined'
    ? process.env.INTERNAL_API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'
    : process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export const SESSION_EXPIRED_EVENT = 'brewlite:session-expired';
const ACCESS_TOKEN_KEY = 'brewlite_access_token';
const REFRESH_TOKEN_KEY = 'brewlite_refresh_token';

type TokenPair = { accessToken: string; refreshToken: string };

const inBrowser = () => typeof window !== 'undefined';

export const getAccessToken = () =>
  inBrowser() ? localStorage.getItem(ACCESS_TOKEN_KEY) : null;
export const getRefreshToken = () =>
  inBrowser() ? localStorage.getItem(REFRESH_TOKEN_KEY) : null;

export function saveTokens(tokens: TokenPair) {
  localStorage.setItem(ACCESS_TOKEN_KEY, tokens.accessToken);
  localStorage.setItem(REFRESH_TOKEN_KEY, tokens.refreshToken);
}

export function clearAuthSession() {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
}

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

async function send<T>(
  path: string,
  init?: RequestInit,
  token?: string | null,
): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...init?.headers,
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    cache: 'no-store',
    signal: AbortSignal.timeout(4000),
  });
  if (!res.ok) {
    const body = (await res.json().catch(() => null)) as { message?: unknown } | null;
    const message = body?.message;
    const detail =
      typeof message === 'string'
        ? message
        : Array.isArray(message)
          ? message.filter((item): item is string => typeof item === 'string').join(' ')
          : '';
    throw new ApiError(res.status, detail || `API ${res.status}: ${path}`);
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

let refreshing: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) return null;

  try {
    const tokens = await send<TokenPair>('/auth/refresh', {
      method: 'POST',
      body: JSON.stringify({ refreshToken }),
    });
    saveTokens(tokens);
    return tokens.accessToken;
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) {
      clearAuthSession();
      window.dispatchEvent(new Event(SESSION_EXPIRED_EVENT));
      return null;
    }
    throw error;
  }
}

function refreshSession() {
  refreshing ??= refreshAccessToken().finally(() => {
    refreshing = null;
  });
  return refreshing;
}

export async function request<T>(path: string, init?: RequestInit): Promise<T> {
  if (!inBrowser() || path.startsWith('/auth/')) return send<T>(path, init);

  try {
    return await send<T>(path, init, getAccessToken());
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) {
      const fresh = await refreshSession();
      if (fresh) return send<T>(path, init, fresh);
    }
    throw error;
  }
}