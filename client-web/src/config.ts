// API Configuration
// Supports two modes:
// 1. Server mode: UI on server, calls local Operis API
// 2. Client mode: UI bundled with gateway, calls remote Operis API for auth

// Runtime config injected by gateway (client mode)
declare global {
  interface Window {
    __OPERIS_API_URL__?: string;  // Remote Operis API for auth/billing
    __GATEWAY_URL__?: string;     // Local gateway for chat (usually same origin)
    __GATEWAY_TOKEN__?: string;   // Gateway token (optional, for direct gateway mode)
  }
}

function resolveOperisApiUrl(): string {
  // 1. Check runtime injection (client mode - gateway serves UI)
  if (typeof window !== "undefined" && window.__OPERIS_API_URL__) {
    return window.__OPERIS_API_URL__;
  }
  // 2. Check env var
  if (import.meta.env.VITE_OPERIS_API_URL) {
    return import.meta.env.VITE_OPERIS_API_URL;
  }
  // 3. Default: dev proxy or local Operis API
  return import.meta.env.DEV ? "/api" : "http://127.0.0.1:3025/api";
}

function resolveGatewayUrl(): string {
  // 1. Check runtime injection
  if (typeof window !== "undefined" && window.__GATEWAY_URL__) {
    return window.__GATEWAY_URL__;
  }
  // 2. Check env var
  if (import.meta.env.VITE_GATEWAY_URL) {
    return import.meta.env.VITE_GATEWAY_URL;
  }
  // 3. Default: same origin (gateway serves UI)
  return "";
}

function resolveGatewayToken(): string {
  if (typeof window !== "undefined" && window.__GATEWAY_TOKEN__) {
    return window.__GATEWAY_TOKEN__;
  }
  return import.meta.env.VITE_GATEWAY_TOKEN || "";
}

export const API_CONFIG = {
  // Remote Operis API for auth, billing, user management
  operisApiUrl: resolveOperisApiUrl(),
  // Local gateway for chat (empty = same origin)
  gatewayUrl: resolveGatewayUrl(),
  // Gateway token (for direct gateway mode without Operis auth)
  gatewayToken: resolveGatewayToken(),
  // Legacy alias
  get baseUrl() { return this.operisApiUrl; },
  get token() { return this.gatewayToken; },
};
