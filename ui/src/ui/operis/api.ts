/**
 * Operis API Service - handles all HTTP requests to Operis backend
 */

// Use relative path for same-origin requests
const API_BASE = "/api";

interface ApiError {
  error: string;
}

class OperisApi {
  private accessToken: string | null = null;
  private refreshToken: string | null = null;

  constructor() {
    this.accessToken = localStorage.getItem("operis_accessToken");
    this.refreshToken = localStorage.getItem("operis_refreshToken");
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...((options.headers as Record<string, string>) || {}),
    };

    if (this.accessToken) {
      headers["Authorization"] = `Bearer ${this.accessToken}`;
    }

    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers,
    });

    if (response.status === 401 && this.refreshToken) {
      const refreshed = await this.refreshAccessToken();
      if (refreshed) {
        headers["Authorization"] = `Bearer ${this.accessToken}`;
        const retryResponse = await fetch(`${API_BASE}${endpoint}`, {
          ...options,
          headers,
        });
        return this.handleResponse<T>(retryResponse);
      }
    }

    return this.handleResponse<T>(response);
  }

  private async handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      const error: ApiError = await response.json().catch(() => ({
        error: "Request failed",
      }));
      throw new Error(error.error || "Request failed");
    }
    return response.json();
  }

  private async refreshAccessToken(): Promise<boolean> {
    try {
      const response = await fetch(`${API_BASE}/auth/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken: this.refreshToken }),
      });

      if (!response.ok) {
        this.logout();
        return false;
      }

      const data = await response.json();
      this.setTokens(data.accessToken, data.refreshToken);
      return true;
    } catch {
      this.logout();
      return false;
    }
  }

  setTokens(accessToken: string, refreshToken: string): void {
    this.accessToken = accessToken;
    this.refreshToken = refreshToken;
    localStorage.setItem("operis_accessToken", accessToken);
    localStorage.setItem("operis_refreshToken", refreshToken);
  }

  logout(): void {
    this.accessToken = null;
    this.refreshToken = null;
    localStorage.removeItem("operis_accessToken");
    localStorage.removeItem("operis_refreshToken");
    localStorage.removeItem("operis_user");
  }

  isAuthenticated(): boolean {
    return !!this.accessToken;
  }

  getStoredUser(): OperisUser | null {
    const stored = localStorage.getItem("operis_user");
    return stored ? JSON.parse(stored) : null;
  }

  setStoredUser(user: OperisUser): void {
    localStorage.setItem("operis_user", JSON.stringify(user));
  }

  // ============================================================================
  // Auth
  // ============================================================================

  async login(email: string, password: string) {
    const data = await this.request<{
      accessToken: string;
      refreshToken: string;
      user: OperisUser;
    }>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
    this.setTokens(data.accessToken, data.refreshToken);
    this.setStoredUser(data.user);
    return data;
  }

  async register(email: string, password: string, name: string) {
    return this.request<{
      accessToken: string;
      refreshToken: string;
      user: OperisUser;
    }>("/auth/register", {
      method: "POST",
      body: JSON.stringify({ email, password, name }),
    });
  }

  async getProfile(): Promise<OperisUser> {
    return this.request<OperisUser>("/auth/me");
  }

  // ============================================================================
  // Users (admin)
  // ============================================================================

  async getUsers(page = 1, limit = 10, search?: string, role?: string, status?: string) {
    const params = new URLSearchParams({
      page: String(page),
      limit: String(limit),
    });
    if (search) params.set("search", search);
    if (role) params.set("role", role);
    if (status) params.set("status", status);
    const result = await this.request<{
      users: OperisUser[];
      pagination: { total: number; page: number; limit: number; totalPages: number };
    }>(`/users?${params}`);
    return { data: result.users, total: result.pagination.total, totalPages: result.pagination.totalPages };
  }

  async getUserById(id: string): Promise<OperisUser> {
    return this.request<OperisUser>(`/users/${id}`);
  }

  async updateUser(id: string, data: Partial<OperisUserUpdate>) {
    return this.request<OperisUser>(`/users/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  }

  async deleteUser(id: string) {
    return this.request<{ success: boolean }>(`/users/${id}`, {
      method: "DELETE",
    });
  }

  // ============================================================================
  // Tokens
  // ============================================================================

  async getTokenBalance() {
    return this.request<{ balance: number }>("/tokens/balance");
  }

  async getTokenTransactions(page = 1, limit = 20) {
    const result = await this.request<{
      transactions: TokenTransaction[];
      pagination: { total: number; page: number; limit: number; totalPages: number };
    }>(`/tokens/transactions?page=${page}&limit=${limit}`);
    return { data: result.transactions, total: result.pagination.total };
  }

  // Admin: get user's transactions
  async getUserTransactions(userId: string, page = 1, limit = 20) {
    const result = await this.request<{
      transactions: TokenTransaction[];
      pagination: { total: number };
    }>(`/tokens/admin/user/${userId}?page=${page}&limit=${limit}`);
    return { data: result.transactions, total: result.pagination.total };
  }

  // Admin: get all transactions across all users
  async getAllTransactions(page = 1, limit = 20, type?: string, userId?: string) {
    const params = new URLSearchParams({ page: String(page), limit: String(limit) });
    if (type) params.set("type", type);
    if (userId) params.set("userId", userId);
    const result = await this.request<{
      transactions: TokenTransactionWithUser[];
      pagination: { total: number; page: number; limit: number; totalPages: number };
    }>(`/tokens/admin/all?${params}`);
    return { data: result.transactions, total: result.pagination.total };
  }

  // Admin: credit tokens to user
  async creditTokens(userId: string, amount: number, description?: string) {
    return this.request<{ user: OperisUser; transaction: TokenTransaction }>(
      "/tokens/admin/credit",
      {
        method: "POST",
        body: JSON.stringify({ userId, amount, description }),
      }
    );
  }

  // Admin: debit tokens from user
  async debitTokens(userId: string, amount: number, description?: string) {
    return this.request<{ user: OperisUser; transaction: TokenTransaction }>(
      "/tokens/admin/debit",
      {
        method: "POST",
        body: JSON.stringify({ userId, amount, description }),
      }
    );
  }

  // ============================================================================
  // API Keys
  // ============================================================================

  // User: list own keys
  async getMyApiKeys() {
    const keys = await this.request<OperisApiKey[]>("/keys");
    return { data: keys, total: keys.length };
  }

  // Alias for pages that use getApiKeys
  async getApiKeys() {
    return this.getMyApiKeys();
  }

  // User: create new key - returns { ...apiKey, key: "sk_..." }
  async createApiKey(name: string, permissions?: string[], expiresAt?: string) {
    return this.request<OperisApiKey & { key: string }>("/keys", {
      method: "POST",
      body: JSON.stringify({ name, permissions, expires_at: expiresAt }),
    });
  }

  // User: delete own key
  async revokeApiKey(id: string) {
    return this.request<{ success: boolean }>(`/keys/${id}`, {
      method: "DELETE",
    });
  }

  // Admin: list all keys
  async getAllApiKeys(_page = 1, _limit = 20) {
    const keys = await this.request<OperisApiKeyWithUser[]>("/keys/admin/all");
    return { data: keys, total: keys.length };
  }

  // Admin: update key
  async updateApiKey(id: string, data: Partial<OperisApiKeyUpdate>) {
    return this.request<OperisApiKey>(`/keys/admin/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  }

  // Admin: delete key
  async deleteApiKey(id: string) {
    return this.request<{ success: boolean }>(`/keys/admin/${id}`, {
      method: "DELETE",
    });
  }

  // ============================================================================
  // Chat
  // ============================================================================

  async sendChat(message: string, conversationId?: string) {
    return this.request<ChatResponse>("/chat", {
      method: "POST",
      body: JSON.stringify({ message, conversationId }),
    });
  }

  async getChatBalance() {
    return this.request<{ balance: number; costPerMessage: number }>("/chat/balance");
  }

  // ============================================================================
  // Deposits
  // ============================================================================

  async getDepositPricing() {
    return this.request<DepositPricing>("/deposits/pricing");
  }

  async createDeposit(tokenAmount: number) {
    return this.request<DepositOrder>("/deposits", {
      method: "POST",
      body: JSON.stringify({ tokenAmount }),
    });
  }

  async getPendingDeposit() {
    return this.request<{ hasPending: boolean; order: DepositOrder | null }>("/deposits/pending");
  }

  async cancelDeposit(id: string) {
    return this.request<{ success: boolean }>(`/deposits/${id}`, {
      method: "DELETE",
    });
  }

  async getDepositHistory(limit = 20, offset = 0) {
    return this.request<{ orders: DepositOrder[]; total: number }>(
      `/deposits/history?limit=${limit}&offset=${offset}`
    );
  }

  async getTokenHistory(limit = 50, offset = 0) {
    return this.request<{ transactions: TokenHistoryItem[]; total: number }>(
      `/deposits/tokens/history?limit=${limit}&offset=${offset}`
    );
  }

  // Admin: update user tokens
  async adminUpdateTokens(userId: string, amount: number, reason: string) {
    return this.request<{ newBalance: number }>("/deposits/admin/tokens", {
      method: "POST",
      body: JSON.stringify({ userId, amount, reason }),
    });
  }

  // Admin: get all deposits across all users
  async getAllDeposits(page = 1, limit = 10, status?: string, userId?: string) {
    const params = new URLSearchParams({ page: String(page), limit: String(limit) });
    if (status) params.set("status", status);
    if (userId) params.set("userId", userId);
    const result = await this.request<{
      deposits: DepositOrderWithUser[];
      pagination: { total: number; page: number; limit: number; totalPages: number };
    }>(`/deposits/admin/all?${params}`);
    return { data: result.deposits, total: result.pagination.total, totalPages: result.pagination.totalPages };
  }

  // ============================================================================
  // Dashboard Stats (computed from other endpoints)
  // ============================================================================

  async getStats(): Promise<DashboardStats> {
    // Compute stats from available data
    const [usersResult, keysResult] = await Promise.all([
      this.getUsers(1, 1).catch(() => ({ data: [], total: 0 })),
      this.getAllApiKeys().catch(() => ({ data: [], total: 0 })),
    ]);

    const activeKeys = keysResult.data.filter((k) => k.is_active).length;

    return {
      totalUsers: usersResult.total,
      totalKeys: keysResult.total,
      activeKeys,
      totalUsage: 0, // Would need backend endpoint
      totalSessions: 0, // Would need backend endpoint
    };
  }

  // ============================================================================
  // Settings
  // ============================================================================

  async getSettings(): Promise<SystemSettings> {
    return this.request<SystemSettings>("/settings");
  }

  async saveSettings(settings: SystemSettingsInput): Promise<{ success: boolean }> {
    return this.request<{ success: boolean }>("/settings", {
      method: "POST",
      body: JSON.stringify(settings),
    });
  }
}

// ============================================================================
// Types - match backend snake_case field names
// ============================================================================

export interface OperisUser {
  id: string;
  email: string;
  name: string;
  role: "admin" | "user";
  is_active: boolean;
  token_balance: number;
  last_active_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface OperisUserUpdate {
  name?: string;
  email?: string;
  role?: "admin" | "user";
  is_active?: boolean;
  token_balance?: number;
}

export interface TokenTransaction {
  id: string;
  user_id: string;
  type: "credit" | "debit" | "adjustment";
  amount: number;
  balance_after: number;
  description: string | null;
  reference_id: string | null;
  created_at: string;
}

export interface TokenTransactionWithUser extends TokenTransaction {
  user_email: string;
  user_name: string;
}

export interface OperisApiKey {
  id: string;
  user_id: string;
  name: string;
  key_prefix: string;
  permissions: string[];
  is_active: boolean;
  last_used_at: string | null;
  expires_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface OperisApiKeyWithUser extends OperisApiKey {
  user: {
    id: string;
    email: string;
    name: string;
  };
}

export interface OperisApiKeyUpdate {
  name?: string;
  permissions?: string[];
  is_active?: boolean;
  expires_at?: string | null;
}

export interface ChatResponse {
  message: string;
  conversationId: string;
  tokenBalance: number;
  tokenUsed: number;
}

export interface DashboardStats {
  totalUsers: number;
  totalKeys: number;
  activeKeys: number;
  totalUsage: number;
  totalSessions: number;
}

export interface DepositPricing {
  pricePerMillion: number;
  currency: string;
  minimumTokens: number;
  minimumVnd: number;
}

export interface DepositOrder {
  id: string;
  orderCode: string;
  tokenAmount: number;
  amountVnd: number;
  status: "pending" | "completed" | "failed" | "expired";
  paymentInfo: {
    bankName: string;
    accountNumber: string;
    accountName: string;
    transferContent: string;
    qrCodeUrl: string;
  };
  expiresAt: string;
  createdAt: string;
}

export interface DepositOrderWithUser extends DepositOrder {
  user_email: string;
  user_name: string;
}

export interface TokenHistoryItem {
  id: string;
  type: "credit" | "debit" | "adjustment";
  amount: number;
  balanceAfter: number;
  description: string | null;
  createdAt: string;
}

export interface ProviderSettings {
  id: string;
  apiKey: string;
}

export interface SystemSettings {
  defaultProvider: string;
  defaultModel: string;
  providers: ProviderSettings[];
}

export interface SystemSettingsInput {
  defaultProvider: string;
  defaultModel: string;
  providers: ProviderSettings[];
}

export const operisApi = new OperisApi();
