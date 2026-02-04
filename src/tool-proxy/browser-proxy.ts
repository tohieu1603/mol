/**
 * Browser Tool Proxy
 * Proxies browser automation commands to remote boxes
 */

import { getToolProxyExecutor } from "./executor.js";
import type {
  BrowserNavigateArgs,
  BrowserClickArgs,
  BrowserTypeArgs,
  BrowserScreenshotArgs,
  BrowserScreenshotResult,
  ProxyOptions,
  ProxyCommandResponse,
} from "./types.js";

// ============================================================================
// Browser Proxy Functions
// ============================================================================

/**
 * Navigate to a URL on a remote box's browser
 */
export async function proxyBrowserNavigate(
  args: BrowserNavigateArgs,
  options: ProxyOptions,
): Promise<ProxyCommandResponse> {
  const executor = getToolProxyExecutor();

  return executor.execute(
    "browser.navigate",
    {
      url: args.url,
      waitFor: args.waitFor ?? "load",
      timeoutMs: args.timeoutMs,
    },
    options,
  );
}

/**
 * Click an element on a remote box's browser
 */
export async function proxyBrowserClick(
  args: BrowserClickArgs,
  options: ProxyOptions,
): Promise<ProxyCommandResponse> {
  const executor = getToolProxyExecutor();

  return executor.execute(
    "browser.click",
    {
      selector: args.selector,
      button: args.button ?? "left",
      clickCount: args.clickCount ?? 1,
    },
    options,
  );
}

/**
 * Type text into an element on a remote box's browser
 */
export async function proxyBrowserType(
  args: BrowserTypeArgs,
  options: ProxyOptions,
): Promise<ProxyCommandResponse> {
  const executor = getToolProxyExecutor();

  return executor.execute(
    "browser.type",
    {
      selector: args.selector,
      text: args.text,
      delay: args.delay,
    },
    options,
  );
}

/**
 * Take a screenshot on a remote box's browser
 */
export async function proxyBrowserScreenshot(
  args: BrowserScreenshotArgs,
  options: ProxyOptions,
): Promise<ProxyCommandResponse & { result?: BrowserScreenshotResult }> {
  const executor = getToolProxyExecutor();

  return executor.execute<BrowserScreenshotArgs, BrowserScreenshotResult>(
    "browser.screenshot",
    {
      selector: args.selector,
      fullPage: args.fullPage ?? false,
      format: args.format ?? "png",
      quality: args.quality,
    },
    options,
  );
}

// ============================================================================
// Integration with Existing Browser Tools
// ============================================================================

/**
 * Execute browser command on box via proxy
 * Generic integration point for browser tools
 */
export async function executeBrowserOnBox(params: {
  boxId: string;
  action: "navigate" | "click" | "type" | "screenshot";
  args: Record<string, unknown>;
  agentId?: string;
  timeoutMs?: number;
}): Promise<ProxyCommandResponse> {
  const options: ProxyOptions = {
    boxId: params.boxId,
    agentId: params.agentId,
    timeoutMs: params.timeoutMs,
    logCommand: true,
  };

  switch (params.action) {
    case "navigate":
      return proxyBrowserNavigate(params.args as unknown as BrowserNavigateArgs, options);
    case "click":
      return proxyBrowserClick(params.args as unknown as BrowserClickArgs, options);
    case "type":
      return proxyBrowserType(params.args as unknown as BrowserTypeArgs, options);
    case "screenshot":
      return proxyBrowserScreenshot(params.args as unknown as BrowserScreenshotArgs, options);
    default:
      return {
        commandId: "",
        success: false,
        error: `Unknown browser action: ${params.action}`,
      };
  }
}
