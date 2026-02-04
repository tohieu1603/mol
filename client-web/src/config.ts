// API Configuration
export const API_CONFIG = {
  // Gateway URL - in dev, Vite proxies to avoid CORS
  baseUrl: import.meta.env.CLIENT_WEB_API_TARGET
    ? "/api"
    : "http://127.0.0.1:18789/api",
  token: import.meta.env.VITE_GATEWAY_TOKEN || "dev123",
};
