/**
 * Tool Proxy Module
 * Proxies tool execution to remote mini-PC boxes via relay gateway
 */

// Types
export * from "./types.js";

// Executor
export { ToolProxyExecutor, getToolProxyExecutor, resetToolProxyExecutor } from "./executor.js";

// Bash Proxy
export {
  proxyBashExec,
  proxyBashWrite,
  proxyBashRead,
  shouldProxyToBox,
  executeOnBox,
} from "./bash-proxy.js";

// Browser Proxy
export {
  proxyBrowserNavigate,
  proxyBrowserClick,
  proxyBrowserType,
  proxyBrowserScreenshot,
  executeBrowserOnBox,
} from "./browser-proxy.js";

// File Proxy
export { proxyFileRead, proxyFileWrite, proxyFileList, executeFileOnBox } from "./file-proxy.js";

// System Proxy
export {
  proxySystemInfo,
  proxySystemProcess,
  getBoxSystemInfo,
  listBoxProcesses,
  killBoxProcess,
  executeSystemOnBox,
} from "./system-proxy.js";
