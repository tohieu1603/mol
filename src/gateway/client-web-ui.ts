/**
 * Client Web UI Handler
 * Serves the Operis client-web UI from /client path
 * Used when gateway bundles the web UI for local client access
 */

import fs from "node:fs";
import type { IncomingMessage, ServerResponse } from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";

const CLIENT_PREFIX = "/client";

export interface ClientWebUiConfig {
  operisApiUrl?: string;  // Remote Operis API URL for auth/billing
  gatewayToken?: string;  // Local gateway token
}

function resolveClientWebRoot(): string | null {
  const here = path.dirname(fileURLToPath(import.meta.url));
  const execDir = (() => {
    try {
      return path.dirname(fs.realpathSync(process.execPath));
    } catch {
      return null;
    }
  })();
  const candidates = [
    // Packaged app: client-web lives alongside the executable
    execDir ? path.resolve(execDir, "client-web") : null,
    // Running from dist: dist/gateway/client-web-ui.js -> dist/client-web
    path.resolve(here, "../client-web"),
    // Running from source: src/gateway/client-web-ui.ts -> dist/client-web
    path.resolve(here, "../../dist/client-web"),
    // Fallback to cwd (dev)
    path.resolve(process.cwd(), "dist", "client-web"),
  ].filter((dir): dir is string => Boolean(dir));

  for (const dir of candidates) {
    if (fs.existsSync(path.join(dir, "index.html"))) return dir;
  }
  return null;
}

function contentTypeForExt(ext: string): string {
  switch (ext) {
    case ".html":
      return "text/html; charset=utf-8";
    case ".js":
      return "application/javascript; charset=utf-8";
    case ".css":
      return "text/css; charset=utf-8";
    case ".json":
    case ".map":
      return "application/json; charset=utf-8";
    case ".svg":
      return "image/svg+xml";
    case ".png":
      return "image/png";
    case ".jpg":
    case ".jpeg":
      return "image/jpeg";
    case ".gif":
      return "image/gif";
    case ".webp":
      return "image/webp";
    case ".ico":
      return "image/x-icon";
    case ".txt":
      return "text/plain; charset=utf-8";
    case ".woff":
      return "font/woff";
    case ".woff2":
      return "font/woff2";
    default:
      return "application/octet-stream";
  }
}

function respondNotFound(res: ServerResponse) {
  res.statusCode = 404;
  res.setHeader("Content-Type", "text/plain; charset=utf-8");
  res.end("Not Found");
}

function serveFile(res: ServerResponse, filePath: string) {
  const ext = path.extname(filePath).toLowerCase();
  res.setHeader("Content-Type", contentTypeForExt(ext));
  res.setHeader("Cache-Control", "no-cache");
  res.end(fs.readFileSync(filePath));
}

/**
 * Inject runtime config into index.html
 * This allows the client-web to know where Operis API is
 */
function injectClientWebConfig(html: string, config: ClientWebUiConfig): string {
  const script =
    `<script>` +
    `window.__OPERIS_API_URL__=${JSON.stringify(config.operisApiUrl || "")};` +
    `window.__GATEWAY_URL__="";` + // Same origin
    `window.__GATEWAY_TOKEN__=${JSON.stringify(config.gatewayToken || "")};` +
    `</script>`;

  // Check if already injected
  if (html.includes("__OPERIS_API_URL__")) return html;

  const headClose = html.indexOf("</head>");
  if (headClose !== -1) {
    return `${html.slice(0, headClose)}${script}${html.slice(headClose)}`;
  }
  return `${script}${html}`;
}

function isSafeRelativePath(relPath: string) {
  if (!relPath) return false;
  const normalized = path.posix.normalize(relPath);
  if (normalized.startsWith("../") || normalized === "..") return false;
  if (normalized.includes("\0")) return false;
  return true;
}

/**
 * Handle HTTP requests for client-web UI
 * Serves static files from dist/client-web at /client path
 */
export function handleClientWebUiRequest(
  req: IncomingMessage,
  res: ServerResponse,
  config?: ClientWebUiConfig,
): boolean {
  const urlRaw = req.url;
  if (!urlRaw) return false;
  if (req.method !== "GET" && req.method !== "HEAD") return false;

  const url = new URL(urlRaw, "http://localhost");
  const pathname = url.pathname;

  // Only handle /client paths
  if (pathname !== CLIENT_PREFIX && !pathname.startsWith(`${CLIENT_PREFIX}/`)) {
    return false;
  }

  // Redirect /client to /client/
  if (pathname === CLIENT_PREFIX) {
    res.statusCode = 302;
    res.setHeader("Location", `${CLIENT_PREFIX}/${url.search}`);
    res.end();
    return true;
  }

  const root = resolveClientWebRoot();
  if (!root) {
    res.statusCode = 503;
    res.setHeader("Content-Type", "text/plain; charset=utf-8");
    res.end(
      "Client Web UI assets not found. Build them with `pnpm client-web:build`, " +
      "or run `pnpm client-web:dev` during development.",
    );
    return true;
  }

  // Strip /client prefix to get relative path
  const relativePath = pathname.slice(CLIENT_PREFIX.length);
  const rel = relativePath === "/" ? "" : relativePath.slice(1);
  const requested = rel && !rel.endsWith("/") ? rel : `${rel}index.html`;
  const fileRel = requested || "index.html";

  if (!isSafeRelativePath(fileRel)) {
    respondNotFound(res);
    return true;
  }

  const filePath = path.join(root, fileRel);
  if (!filePath.startsWith(root)) {
    respondNotFound(res);
    return true;
  }

  if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
    // Inject config for index.html
    if (path.basename(filePath) === "index.html") {
      const raw = fs.readFileSync(filePath, "utf8");
      const html = injectClientWebConfig(raw, config || {});
      res.setHeader("Content-Type", "text/html; charset=utf-8");
      res.setHeader("Cache-Control", "no-cache");
      res.end(html);
      return true;
    }
    serveFile(res, filePath);
    return true;
  }

  // SPA fallback: serve index.html for unknown paths (client-side routing)
  const indexPath = path.join(root, "index.html");
  if (fs.existsSync(indexPath)) {
    const raw = fs.readFileSync(indexPath, "utf8");
    const html = injectClientWebConfig(raw, config || {});
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.setHeader("Cache-Control", "no-cache");
    res.end(html);
    return true;
  }

  respondNotFound(res);
  return true;
}
