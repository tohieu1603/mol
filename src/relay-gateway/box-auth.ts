/**
 * Box Authentication
 * Handles API key verification and hardware ID binding
 */

import crypto from "node:crypto";
import { boxes } from "../db/models/index.js";
import type { Box, BoxApiKey } from "../db/models/types.js";

// ============================================================================
// API Key Generation & Hashing
// ============================================================================

/**
 * Generate a new API key for a box
 * Returns the raw key (show once) and the hash (store in DB)
 */
export function generateApiKey(): {
  rawKey: string;
  keyHash: string;
  keyPrefix: string;
} {
  // Generate 32 random bytes = 256 bits of entropy
  const randomBytes = crypto.randomBytes(32);

  // Encode as base64url (URL-safe)
  const rawKey = `box_${randomBytes.toString("base64url")}`;

  // Hash for storage
  const keyHash = hashApiKey(rawKey);

  // Prefix for display (first 8 chars after "box_")
  const keyPrefix = rawKey.slice(0, 12); // "box_XXXXXXXX"

  return { rawKey, keyHash, keyPrefix };
}

/**
 * Hash an API key for storage/comparison
 */
export function hashApiKey(rawKey: string): string {
  return crypto.createHash("sha256").update(rawKey).digest("hex");
}

// ============================================================================
// Authentication
// ============================================================================

export interface AuthResult {
  success: boolean;
  box?: Box;
  apiKey?: BoxApiKey;
  error?: string;
}

/**
 * Authenticate a box using API key
 */
export async function authenticateBox(rawApiKey: string, hardwareId?: string): Promise<AuthResult> {
  // Validate key format
  if (!rawApiKey || !rawApiKey.startsWith("box_")) {
    return { success: false, error: "Invalid API key format" };
  }

  // Hash the key
  const keyHash = hashApiKey(rawApiKey);

  // Look up in database
  const result = await boxes.verifyApiKey(keyHash);

  if (!result) {
    return { success: false, error: "Invalid API key" };
  }

  const { box, apiKey } = result;

  // Check if box is in a valid state
  if (box.status === "error") {
    return { success: false, error: "Box is in error state" };
  }

  // Hardware ID binding check
  if (box.hardware_id && hardwareId && box.hardware_id !== hardwareId) {
    return {
      success: false,
      error: "Hardware ID mismatch - box is bound to different hardware",
    };
  }

  // If no hardware ID is bound yet, bind it now
  if (!box.hardware_id && hardwareId) {
    await boxes.updateBox(box.id, { hardware_id: hardwareId });
    box.hardware_id = hardwareId;
  }

  return {
    success: true,
    box,
    apiKey,
  };
}

/**
 * Create a new API key for an existing box
 */
export async function createBoxApiKey(
  boxId: string,
  name: string = "Default",
): Promise<{ rawKey: string; apiKey: BoxApiKey } | null> {
  const { rawKey, keyHash, keyPrefix } = generateApiKey();

  const apiKey = await boxes.createApiKey({
    box_id: boxId,
    key_hash: keyHash,
    key_prefix: keyPrefix,
    name,
  });

  if (!apiKey) {
    return null;
  }

  return { rawKey, apiKey };
}

/**
 * Revoke an API key
 */
export async function revokeApiKey(apiKeyId: string): Promise<boolean> {
  return boxes.revokeApiKey(apiKeyId);
}

// ============================================================================
// Hardware ID Utilities
// ============================================================================

/**
 * Validate hardware ID format
 * Hardware ID should be a combination of:
 * - CPU ID
 * - Motherboard serial
 * - MAC address
 * Hashed together
 */
export function isValidHardwareId(hardwareId: string): boolean {
  // Hardware ID should be a 64-char hex string (SHA-256)
  return /^[a-f0-9]{64}$/i.test(hardwareId);
}

/**
 * Generate hardware ID from components
 * (This would be called on the box side, shown here for reference)
 */
export function generateHardwareId(components: {
  cpuId: string;
  motherboardSerial: string;
  macAddress: string;
}): string {
  const combined = [components.cpuId, components.motherboardSerial, components.macAddress].join(
    "|",
  );

  return crypto.createHash("sha256").update(combined).digest("hex");
}
