/**
 * Analytics API Service
 * Handles usage analytics with Operis Backend API
 *
 * User Endpoints:
 * - GET /analytics/usage?period=today|week|month|year
 * - GET /analytics/usage/daily?days=7
 * - GET /analytics/usage/range?start=YYYY-MM-DD&end=YYYY-MM-DD
 * - GET /analytics/usage/history?limit=50&offset=0
 */

import { apiRequest } from "./auth-api";

// Types matching backend response
export interface TokenUsageStats {
  totalTokens: number;
  inputTokens: number;
  outputTokens: number;
  costTokens: number;
  totalRequests: number;
  avgTokensPerRequest: number;
}

export interface TokenUsageByType {
  requestType: string;
  totalTokens: number;
  totalRequests: number;
  percentage: number;
}

export interface TokenUsageByDate {
  date: string;
  totalTokens: number;
  totalRequests: number;
}

// Response types
export interface UsageOverviewResponse {
  period: string;
  current: TokenUsageStats;
  previous: TokenUsageStats;
  byType: TokenUsageByType[];
  daily: TokenUsageByDate[];
}

export interface DailyUsageResponse {
  period: string;
  stats: TokenUsageStats;
  byType: TokenUsageByType[];
  daily: TokenUsageByDate[];
}

export interface RangeUsageResponse {
  period: string;
  startDate: string;
  endDate: string;
  stats: TokenUsageStats;
  byType: TokenUsageByType[];
  daily: TokenUsageByDate[];
}

export interface UsageRecord {
  id: string;
  requestType: string;
  requestId?: string;
  model: string;
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  costTokens: number;
  createdAt: string;
  metadata?: Record<string, unknown>;
}

export interface HistoryResponse {
  records: UsageRecord[];
  total: number;
  limit: number;
  offset: number;
}

// Simplified types for UI
export interface DailyUsage {
  date: string;
  tokensUsed: number;
  requests: number;
}

export interface TypeUsage {
  type: string;
  tokensUsed: number;
  requests: number;
  percentage: number;
}

export interface UsageStats {
  totalTokens: number;
  inputTokens: number;
  outputTokens: number;
  totalRequests: number;
}

// ==============================================================================
// User Analytics API
// ==============================================================================

/**
 * Get user's usage overview
 * @param period - today | week | month | year
 */
export async function getUsageOverview(
  period: "today" | "week" | "month" | "year" = "today",
): Promise<UsageOverviewResponse> {
  return apiRequest<UsageOverviewResponse>(`/analytics/usage?period=${period}`);
}

/**
 * Get user's daily usage stats
 * @param days - Number of days (1-90)
 */
export async function getDailyUsage(days = 7): Promise<DailyUsageResponse> {
  return apiRequest<DailyUsageResponse>(`/analytics/usage/daily?days=${days}`);
}

/**
 * Get user's usage for a custom date range
 * @param start - Start date (YYYY-MM-DD)
 * @param end - End date (YYYY-MM-DD)
 */
export async function getRangeUsage(
  start: string,
  end: string,
): Promise<RangeUsageResponse> {
  return apiRequest<RangeUsageResponse>(
    `/analytics/usage/range?start=${start}&end=${end}`,
  );
}

/**
 * Get user's usage history (individual records)
 */
export async function getUsageHistory(
  limit = 50,
  offset = 0,
): Promise<HistoryResponse> {
  return apiRequest<HistoryResponse>(
    `/analytics/usage/history?limit=${limit}&offset=${offset}`,
  );
}

// ==============================================================================
// Helper Functions - Transform API response to UI-friendly format
// ==============================================================================

export function transformDailyUsage(daily: TokenUsageByDate[]): DailyUsage[] {
  return daily.map((d) => ({
    date: d.date,
    tokensUsed: d.totalTokens,
    requests: d.totalRequests,
  }));
}

export function transformTypeUsage(byType: TokenUsageByType[]): TypeUsage[] {
  return byType.map((t) => ({
    type: t.requestType,
    tokensUsed: t.totalTokens,
    requests: t.totalRequests,
    percentage: t.percentage,
  }));
}

export function transformStats(stats: TokenUsageStats): UsageStats {
  return {
    totalTokens: stats.totalTokens,
    inputTokens: stats.inputTokens,
    outputTokens: stats.outputTokens,
    totalRequests: stats.totalRequests,
  };
}
