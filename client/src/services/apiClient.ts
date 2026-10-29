/**
 * SAKSHAM Unified API Client
 * Centralizes HTTP requests, timeout handling, error normalization, HttpOnly cookie credentials,
 * and automated CSRF token transmission for state-changing operations.
 */

const BASE_URL = (import.meta.env.VITE_API_BASE_URL || '/api').replace(/\/+$/, '');

export class ApiError extends Error {
  statusCode: number;
  details?: unknown;

  constructor(message: string, statusCode: number, details?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.details = details;
  }
}

export interface RequestOptions {
  timeoutMs?: number;
  headers?: Record<string, string>;
  _isCsrfRetry?: boolean;
}

const TOKEN_KEY = 'saksham_auth_token';
const CSRF_KEY = 'saksham_csrf_token';
let inMemoryToken: string | null = null;
let inMemoryCsrfToken: string | null = null;
let ongoingCsrfPromise: Promise<string | null> | null = null;

export function getAuthToken(): string | null {
  if (inMemoryToken) return inMemoryToken;
  try {
    const stored = sessionStorage.getItem(TOKEN_KEY) || localStorage.getItem(TOKEN_KEY);
    if (stored) {
      inMemoryToken = stored;
      return stored;
    }
  } catch {
    // Storage access might fail in restrictive iframe/private environments
  }
  return null;
}

export function setAuthToken(token: string | null): void {
  inMemoryToken = token;
  try {
    if (token) {
      sessionStorage.setItem(TOKEN_KEY, token);
      localStorage.setItem(TOKEN_KEY, token);
    } else {
      sessionStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(TOKEN_KEY);
    }
  } catch {
    // Ignore storage quota or access errors
  }
}

export function getCsrfToken(): string | null {
  if (inMemoryCsrfToken) return inMemoryCsrfToken;
  try {
    const stored = sessionStorage.getItem(CSRF_KEY) || localStorage.getItem(CSRF_KEY);
    if (stored) {
      inMemoryCsrfToken = stored;
      return stored;
    }
  } catch {
    // Storage access might fail in restrictive iframe/private environments
  }
  return null;
}

export function setCsrfToken(token: string | null): void {
  inMemoryCsrfToken = token;
  try {
    if (token) {
      sessionStorage.setItem(CSRF_KEY, token);
      localStorage.setItem(CSRF_KEY, token);
    } else {
      sessionStorage.removeItem(CSRF_KEY);
      localStorage.removeItem(CSRF_KEY);
    }
  } catch {
    // Ignore storage quota or access errors
  }
}

/**
 * Ensures a valid CSRF token is available. If missing or expired, fetches a fresh token
 * from the backend bootstrap endpoint /auth/csrf while deduplicating in-flight calls.
 */
export async function ensureCsrfToken(forceRefresh = false): Promise<string | null> {
  if (!forceRefresh) {
    const existing = getCsrfToken() || getCookie('saksham_csrf_token');
    if (existing) {
      if (!getCsrfToken()) {
        setCsrfToken(existing);
      }
      return existing;
    }
  }

  if (ongoingCsrfPromise) {
    return ongoingCsrfPromise;
  }

  ongoingCsrfPromise = (async () => {
    try {
      const response = await fetch(`${BASE_URL}/auth/csrf`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          Accept: 'application/json',
        },
      });

      if (!response.ok) {
        return null;
      }

      const headerToken = response.headers?.get?.('x-csrf-token') || null;
      const json = await response.json();
      const token = headerToken || json?.data?.csrfToken || json?.csrfToken || null;
      if (token) {
        setCsrfToken(token);
      }
      return token;
    } catch {
      return null;
    } finally {
      ongoingCsrfPromise = null;
    }
  })();

  return ongoingCsrfPromise;
}

/**
 * Helper to extract cookie value by name from document.cookie
 */
export function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(new RegExp('(^|;\\s*)(' + name + ')=([^;]*)'));
  return match ? decodeURIComponent(match[3]) : null;
}

/**
 * Standard GET request with timeout, cookie transmission, and Bearer token fallback
 */
export async function apiGet<T>(
  endpoint: string,
  params?: Record<string, string | number | boolean | undefined>,
  options: RequestOptions = {}
): Promise<T> {
  const { timeoutMs = 12000, headers = {} } = options;

  let url = `${BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

  if (params) {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, val]) => {
      if (val !== undefined && val !== null && val !== '') {
        searchParams.append(key, String(val));
      }
    });
    const queryString = searchParams.toString();
    if (queryString) {
      url += (url.includes('?') ? '&' : '?') + queryString;
    }
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  const authToken = getAuthToken();
  const requestHeaders: Record<string, string> = {
    Accept: 'application/json',
    ...headers,
  };

  if (authToken) {
    requestHeaders['Authorization'] = `Bearer ${authToken}`;
  }

  try {
    const response = await fetch(url, {
      method: 'GET',
      credentials: 'include', // Transmit saksham_token HttpOnly cookie
      headers: requestHeaders,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    const updatedCsrf = response.headers?.get?.('x-csrf-token');
    if (updatedCsrf) {
      setCsrfToken(updatedCsrf);
    }

    if (!response.ok) {
      let errorMessage = `HTTP Error ${response.status}: ${response.statusText}`;
      let errorDetails: unknown = null;
      try {
        const errorJson = await response.json();
        if (errorJson?.error?.message) {
          errorMessage = errorJson.error.message;
        } else if (errorJson?.message) {
          errorMessage = errorJson.message;
        }
        errorDetails = errorJson;
      } catch {
        // Fallback to default
      }
      throw new ApiError(errorMessage, response.status, errorDetails);
    }

    const data = await response.json();
    return data as T;
  } catch (error: any) {
    clearTimeout(timeoutId);

    if (error.name === 'AbortError') {
      throw new ApiError(
        `Request to '${endpoint}' timed out after ${timeoutMs / 1000}s. Please verify backend server connectivity.`,
        408
      );
    }

    if (error instanceof ApiError) {
      throw error;
    }

    throw new ApiError(
      error.message || 'Network request failed. Ensure PRAVAH API service is running on port 5000.',
      0
    );
  }
}

/**
 * Mutating HTTP request (POST, PUT, PATCH, DELETE) with automatic CSRF token inclusion
 */
export async function apiMutate<T>(
  method: 'POST' | 'PUT' | 'PATCH' | 'DELETE',
  endpoint: string,
  body?: unknown,
  options: RequestOptions = {}
): Promise<T> {
  const { timeoutMs = 12000, headers = {}, _isCsrfRetry = false } = options;
  const url = `${BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  const authToken = getAuthToken();
  let csrfToken = getCsrfToken() || getCookie('saksham_csrf_token');
  if (!csrfToken) {
    csrfToken = await ensureCsrfToken();
  }

  const requestHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    'X-Requested-With': 'XMLHttpRequest',
    ...headers,
  };

  if (authToken) {
    requestHeaders['Authorization'] = `Bearer ${authToken}`;
  }

  if (csrfToken) {
    requestHeaders['x-csrf-token'] = csrfToken;
  }

  try {
    const response = await fetch(url, {
      method,
      credentials: 'include',
      headers: requestHeaders,
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    const updatedCsrf = response.headers?.get?.('x-csrf-token');
    if (updatedCsrf) {
      setCsrfToken(updatedCsrf);
    }

    if (!response.ok) {
      let errorMessage = `HTTP Error ${response.status}: ${response.statusText}`;
      let errorDetails: unknown = null;
      try {
        const errorJson = await response.json();
        if (errorJson?.error?.message) {
          errorMessage = errorJson.error.message;
        } else if (errorJson?.message) {
          errorMessage = errorJson.message;
        }
        errorDetails = errorJson;
      } catch {
        // Fallback
      }

      const isCsrfError =
        response.status === 403 &&
        (errorMessage.toLowerCase().includes('csrf') ||
          (typeof errorDetails === 'object' && JSON.stringify(errorDetails).toLowerCase().includes('csrf')));

      if (isCsrfError && !_isCsrfRetry) {
        setCsrfToken(null);
        await ensureCsrfToken(true);
        return apiMutate<T>(method, endpoint, body, { ...options, _isCsrfRetry: true });
      }

      throw new ApiError(errorMessage, response.status, errorDetails);
    }

    const data = await response.json();
    return data as T;
  } catch (error: any) {
    clearTimeout(timeoutId);

    if (error.name === 'AbortError') {
      throw new ApiError(
        `Request to '${endpoint}' timed out after ${timeoutMs / 1000}s.`,
        408
      );
    }

    if (error instanceof ApiError) {
      throw error;
    }

    throw new ApiError(
      error.message || 'Network request failed. Ensure PRAVAH API service is running on port 5000.',
      0
    );
  }
}

export const apiPost = <T>(endpoint: string, body?: unknown, options?: RequestOptions) =>
  apiMutate<T>('POST', endpoint, body, options);

export const apiPut = <T>(endpoint: string, body?: unknown, options?: RequestOptions) =>
  apiMutate<T>('PUT', endpoint, body, options);

export const apiPatch = <T>(endpoint: string, body?: unknown, options?: RequestOptions) =>
  apiMutate<T>('PATCH', endpoint, body, options);

export const apiDelete = <T>(endpoint: string, options?: RequestOptions) =>
  apiMutate<T>('DELETE', endpoint, undefined, options);

/**
 * File upload helper sending multipart FormData with CSRF protection
 */
export async function apiUpload<T>(
  endpoint: string,
  formData: FormData,
  options: RequestOptions = {}
): Promise<T> {
  const { timeoutMs = 60000, headers = {}, _isCsrfRetry = false } = options;
  const url = `${BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  const authToken = getAuthToken();
  let csrfToken = getCsrfToken() || getCookie('saksham_csrf_token');
  if (!csrfToken) {
    csrfToken = await ensureCsrfToken();
  }
  const requestHeaders: Record<string, string> = {
    Accept: 'application/json',
    'X-Requested-With': 'XMLHttpRequest',
    ...headers,
  };

  if (authToken) {
    requestHeaders['Authorization'] = `Bearer ${authToken}`;
  }

  if (csrfToken) {
    requestHeaders['x-csrf-token'] = csrfToken;
  }

  try {
    const response = await fetch(url, {
      method: 'POST',
      credentials: 'include',
      headers: requestHeaders,
      body: formData,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    const updatedCsrf = response.headers?.get?.('x-csrf-token');
    if (updatedCsrf) {
      setCsrfToken(updatedCsrf);
    }

    if (!response.ok) {
      let errorMessage = `HTTP Error ${response.status}: ${response.statusText}`;
      let errorDetails: unknown = null;
      try {
        const errorJson = await response.json();
        if (errorJson?.error?.message) {
          errorMessage = errorJson.error.message;
        }
        errorDetails = errorJson;
      } catch {
        // Fallback
      }
      const isCsrfError =
        response.status === 403 &&
        (errorMessage.toLowerCase().includes('csrf') ||
          (typeof errorDetails === 'object' && JSON.stringify(errorDetails).toLowerCase().includes('csrf')));

      if (isCsrfError && !_isCsrfRetry) {
        setCsrfToken(null);
        await ensureCsrfToken(true);
        return apiUpload<T>(endpoint, formData, { ...options, _isCsrfRetry: true });
      }

      throw new ApiError(errorMessage, response.status, errorDetails);
    }

    const data = await response.json();
    return data as T;
  } catch (error: any) {
    clearTimeout(timeoutId);
    if (error instanceof ApiError) throw error;
    throw new ApiError(error.message || 'Upload failed.', 0);
  }
}
