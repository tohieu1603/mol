/**
 * Relay Gateway Module
 * WebSocket gateway for connecting cloud server to mini-PC boxes
 */

// Types
export * from "./types.js";

// Authentication
export {
  generateApiKey,
  hashApiKey,
  authenticateBox,
  createBoxApiKey,
  revokeApiKey,
  isValidHardwareId,
  generateHardwareId,
  type AuthResult,
} from "./box-auth.js";

// Box Registry
export {
  BoxRegistry,
  getBoxRegistry,
  resetBoxRegistry,
  type BoxRegistryEvents,
} from "./box-registry.js";

// Server
export { RelayGatewayServer, getRelayGateway, resetRelayGateway } from "./server.js";
