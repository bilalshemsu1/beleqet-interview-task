/**
 * Client-side API fetch wrapper.
 *
 * Used by React Client Components (dashboards, forms, etc.) to call the
 * NestJS backend. Automatically injects the Authorization header from the
 * current session, handles 401s by attempting a token refresh, and retries
 * the original request once.
 *
 * For server-side (SSR/ISR) fetching, continue using lib/api.ts which uses
 * Next.js `fetch` with `next.revalidate`.
 */

import {
  loadAuthSession,
  saveAuthSession,
  refresh,
  clearAuthSession,
  type AuthSession,
} from "@/lib/auth";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api/v1";

// ── Error types ────────────────────────────────────────────────────────────

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public body?: unknown,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

// ── Core fetch ─────────────────────────────────────────────────────────────

interface RequestOptions extends RequestInit {
  /** Skip auth header even if session exists */
  noAuth?: boolean;
}

/**
 * Low-level fetch that targets the NestJS backend.
 * Does NOT inject auth headers — use `apiFetch` for that.
 */
async function rawFetch<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const url = path.startsWith("http") ? path : `${API_BASE}${path}`;

  const response = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers as Record<string, string>),
    },
  });

  // Parse error body for structured messages
  if (!response.ok) {
    let body: unknown;
    let message = `Request failed with status ${response.status}`;
    try {
      body = await response.json();
      const msg = (body as { message?: string | string[] })?.message;
      if (Array.isArray(msg)) {
        message = msg.join(", ");
      } else if (typeof msg === "string") {
        message = msg;
      }
    } catch {
      // Non-JSON error body
    }
    throw new ApiError(response.status, message, body);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

// ── Token refresh logic ────────────────────────────────────────────────────

/** Prevents multiple concurrent refresh attempts */
let refreshPromise: Promise<AuthSession | null> | null = null;

async function attemptRefresh(session: AuthSession): Promise<AuthSession | null> {
  // Coalesce concurrent refresh calls
  if (refreshPromise) return refreshPromise;

  refreshPromise = (async () => {
    try {
      const nextSession = await refresh(session.refreshToken);
      saveAuthSession(nextSession);
      return nextSession;
    } catch {
      clearAuthSession();
      return null;
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

// ── Public API ─────────────────────────────────────────────────────────────

/**
 * Fetch from the Beleqet API with automatic auth.
 *
 * - Reads the current session from localStorage
 * - Injects `Authorization: Bearer <token>`
 * - On 401: attempts one token refresh, then retries the request
 * - Throws `ApiError` on failure
 */
export async function apiFetch<T>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const session = loadAuthSession();

  // No session → call without auth (e.g. public endpoints)
  if (!session || options.noAuth) {
    return rawFetch<T>(path, options);
  }

  // First attempt with current token
  const authHeaders: Record<string, string> = {
    Authorization: `Bearer ${session.accessToken}`,
    ...(options.headers as Record<string, string>),
  };

  try {
    return await rawFetch<T>(path, { ...options, headers: authHeaders });
  } catch (err) {
    // Only attempt refresh on 401
    if (!(err instanceof ApiError && err.status === 401)) {
      throw err;
    }

    // Attempt refresh
    const nextSession = await attemptRefresh(session);
    if (!nextSession) {
      // Refresh failed — session is cleared, throw so UI can redirect to login
      throw new ApiError(401, "Session expired. Please log in again.");
    }

    // Retry with new token
    const retryHeaders: Record<string, string> = {
      Authorization: `Bearer ${nextSession.accessToken}`,
      ...(options.headers as Record<string, string>),
    };
    return rawFetch<T>(path, { ...options, headers: retryHeaders });
  }
}

// ── Convenience methods ────────────────────────────────────────────────────

export function apiGet<T>(path: string, options?: RequestOptions) {
  return apiFetch<T>(path, { method: "GET", ...options });
}

export function apiPost<T>(path: string, body?: unknown, options?: RequestOptions) {
  return apiFetch<T>(path, {
    method: "POST",
    body: body != null ? JSON.stringify(body) : undefined,
    ...options,
  });
}

export function apiPatch<T>(path: string, body?: unknown, options?: RequestOptions) {
  return apiFetch<T>(path, {
    method: "PATCH",
    body: body != null ? JSON.stringify(body) : undefined,
    ...options,
  });
}

export function apiDelete<T>(path: string, options?: RequestOptions) {
  return apiFetch<T>(path, { method: "DELETE", ...options });
}
