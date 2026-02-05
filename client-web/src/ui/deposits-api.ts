/**
 * Deposits API Service
 * Handles payment and deposit operations with Operis API
 */

import { apiRequest } from "./auth-api";

// Types
export interface PricingTier {
  id: string;
  name: string;
  tokens: number;
  priceVnd: number;
  bonusPercent: number;
  popular?: boolean;
}

export interface PricingResponse {
  tiers: PricingTier[];
  minDeposit: number;
  maxDeposit: number;
}

export interface DepositOrder {
  id: string;
  userId: string;
  tierId: string;
  tokens: number;
  amountVnd: number;
  status: "pending" | "completed" | "failed" | "expired";
  paymentMethod: "sepay" | "bank_transfer" | "momo";
  paymentUrl?: string;
  qrCodeUrl?: string;
  transactionRef?: string;
  createdAt: string;
  expiresAt: string;
  completedAt?: string;
}

export interface CreateDepositRequest {
  tierId: string;
  paymentMethod?: "sepay" | "bank_transfer" | "momo";
}

export interface CreateDepositResponse {
  order: DepositOrder;
  paymentUrl?: string;
  qrCodeUrl?: string;
  bankInfo?: {
    bankName: string;
    accountNumber: string;
    accountName: string;
    transferContent: string;
  };
}

// Get pricing tiers (public)
export async function getPricing(): Promise<PricingResponse> {
  return apiRequest<PricingResponse>("/deposits/pricing");
}

// Create deposit order
export async function createDeposit(
  request: CreateDepositRequest,
): Promise<CreateDepositResponse> {
  return apiRequest<CreateDepositResponse>("/deposits", {
    method: "POST",
    body: JSON.stringify(request),
  });
}

// Get deposit order status
export async function getDepositStatus(orderId: string): Promise<DepositOrder> {
  return apiRequest<DepositOrder>(`/deposits/${orderId}`);
}

// List user's deposit history
export async function getDepositHistory(
  page = 1,
  limit = 20,
): Promise<{ orders: DepositOrder[]; total: number }> {
  return apiRequest<{ orders: DepositOrder[]; total: number }>(
    `/deposits?page=${page}&limit=${limit}`,
  );
}

// Poll deposit status until completed or timeout
export async function pollDepositStatus(
  orderId: string,
  intervalMs = 3000,
  timeoutMs = 300000,
): Promise<DepositOrder> {
  const startTime = Date.now();

  while (Date.now() - startTime < timeoutMs) {
    const order = await getDepositStatus(orderId);

    if (order.status === "completed" || order.status === "failed") {
      return order;
    }

    await new Promise((resolve) => setTimeout(resolve, intervalMs));
  }

  throw new Error("Deposit status polling timed out");
}
