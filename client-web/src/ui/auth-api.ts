/**
 * Auth API Service
 * Handles authentication with Operis API
 */

import { API_CONFIG } from "../config";

// Token storage keys (camelCase to match existing localStorage)
const ACCESS_TOKEN_KEY = "operis_accessToken";
const REFRESH_TOKEN_KEY = "operis_refreshToken";

// Types
export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: string;
  token_balance: number;
}

export interface AuthResult {
  user: AuthUser;
  accessToken: string;
  refreshToken: string;
  expiresIn: string;
}

export interface AuthError {
  error: string;
  code?: string;
}

// Token management
export function getAccessToken(): string | null {
  return localStorage.getItem(ACCESS_TOKEN_KEY);
}

export function getRefreshToken(): string | null {
  return localStorage.getItem(REFRESH_TOKEN_KEY);
}

export function setTokens(accessToken: string, refreshToken: string): void {
  localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
  localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
}

export function clearTokens(): void {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
}

export function isAuthenticated(): boolean {
  return !!getAccessToken();
}

// Track refresh state to avoid multiple refresh calls
let isRefreshing = false;
let refreshPromise: Promise<AuthResult> | null = null;

// Shared API request helper with auto-refresh on 401
export async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {},
  skipAutoRefresh = false,
): Promise<T> {
  const url = `${API_CONFIG.baseUrl}${endpoint}`;
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...((options.headers as Record<string, string>) || {}),
  };

  // Add auth token if available
  const token = getAccessToken();
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  // Handle 401 - try to refresh token and retry
  if (response.status === 401 && !skipAutoRefresh) {
    const refreshToken = getRefreshToken();
    if (refreshToken) {
      try {
        // Avoid multiple concurrent refresh calls
        if (!isRefreshing) {
          isRefreshing = true;
          refreshPromise = doRefreshTokens();
        }
        await refreshPromise;
        isRefreshing = false;
        refreshPromise = null;

        // Retry original request with new token
        return apiRequest<T>(endpoint, options, true);
      } catch {
        isRefreshing = false;
        refreshPromise = null;
        clearTokens();
        throw new Error("Session expired. Please login again.");
      }
    }
  }

  const data = await response.json();

  if (!response.ok) {
    const error = data as AuthError;
    throw new Error(error.error || `Request failed: ${response.status}`);
  }

  return data as T;
}

// Internal refresh function (doesn't use apiRequest to avoid circular)
async function doRefreshTokens(): Promise<AuthResult> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) {
    throw new Error("No refresh token available");
  }

  const url = `${API_CONFIG.baseUrl}/auth/refresh`;
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refreshToken }),
  });

  if (!response.ok) {
    throw new Error("Refresh failed");
  }

  const result = (await response.json()) as AuthResult;
  setTokens(result.accessToken, result.refreshToken);
  return result;
}

// Auth API functions
export async function login(email: string, password: string): Promise<AuthResult> {
  const result = await apiRequest<AuthResult>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });

  // Store tokens
  setTokens(result.accessToken, result.refreshToken);

  return result;
}

export async function register(
  email: string,
  password: string,
  name: string,
): Promise<AuthResult> {
  const result = await apiRequest<AuthResult>("/auth/register", {
    method: "POST",
    body: JSON.stringify({ email, password, name }),
  });

  // Store tokens
  setTokens(result.accessToken, result.refreshToken);

  return result;
}

export async function refreshTokens(): Promise<AuthResult> {
  return doRefreshTokens();
}

export async function logout(): Promise<void> {
  try {
    await apiRequest("/auth/logout", { method: "POST" });
  } catch {
    // Ignore logout errors - just clear tokens
  }
  clearTokens();
}

export async function getMe(): Promise<AuthUser> {
  return apiRequest<AuthUser>("/auth/me");
}

// Try to restore session from stored tokens
export async function restoreSession(): Promise<AuthUser | null> {
  const token = getAccessToken();
  if (!token) return null;

  try {
    return await getMe();
  } catch {
    // Token invalid, try to refresh
    try {
      const result = await refreshTokens();
      return result.user;
    } catch {
      // Refresh failed, clear tokens
      clearTokens();
      return null;
    }
  }
}
