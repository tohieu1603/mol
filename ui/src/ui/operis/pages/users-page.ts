import { LitElement, html, css } from "lit";
import { customElement, state } from "lit/decorators.js";
import {
  operisApi,
  type OperisUser,
  type OperisApiKeyWithUser,
  type TokenTransaction,
  type DepositOrderWithUser,
} from "../api.js";

/**
 * Users Management Page with Enhanced User Detail Drawer
 * Features: User list, activate/deactivate users, block/unblock API keys
 */
@customElement("users-page")
export class UsersPage extends LitElement {
  static styles = css`
    :host {
      display: block;
      --bg: #12141a;
      --bg-elevated: #1a1d25;
      --card: #181b22;
      --text: #e4e4e7;
      --text-strong: #fafafa;
      --muted: #71717a;
      --border: #27272a;
      --border-strong: #3f3f46;
      --accent: #ff5c5c;
      --accent-hover: #ff7070;
      --accent-subtle: rgba(255, 92, 92, 0.15);
      --ok: #22c55e;
      --ok-subtle: rgba(34, 197, 94, 0.12);
      --warn: #f59e0b;
      --warn-subtle: rgba(245, 158, 11, 0.12);
      --danger: #ef4444;
      --danger-subtle: rgba(239, 68, 68, 0.12);
      --info: #3b82f6;
      --info-subtle: rgba(59, 130, 246, 0.12);
      --radius-sm: 6px;
      --radius-md: 8px;
      --radius-lg: 12px;
    }

    .header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 24px;
    }

    .header h1 {
      font-size: 20px;
      font-weight: 600;
      color: var(--text-strong);
      margin: 0;
      letter-spacing: -0.02em;
    }

    .search-box input {
      padding: 8px 14px;
      background: var(--card);
      border: 1px solid var(--border);
      border-radius: var(--radius-md);
      color: var(--text);
      font-size: 13px;
      width: 240px;
      transition: border-color 0.15s ease;
    }

    .search-box input:focus {
      outline: none;
      border-color: var(--accent);
    }

    .card {
      background: var(--card);
      border: 1px solid var(--border);
      border-radius: var(--radius-lg);
      overflow: hidden;
    }

    .table {
      width: 100%;
      border-collapse: collapse;
    }

    .table th,
    .table td {
      padding: 12px 16px;
      text-align: left;
      border-bottom: 1px solid var(--border);
    }

    .table th {
      font-weight: 500;
      color: var(--muted);
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      background: var(--bg);
    }

    .table td {
      color: var(--text);
      font-size: 13px;
    }

    .table tr:last-child td {
      border-bottom: none;
    }

    .table tr:hover td {
      background: var(--bg-elevated);
    }

    .table tr.inactive td {
      opacity: 0.5;
    }

    .badge {
      display: inline-block;
      padding: 3px 8px;
      border-radius: 9999px;
      font-size: 11px;
      font-weight: 500;
    }

    .badge-admin {
      background: var(--accent-subtle);
      color: var(--accent);
    }

    .badge-user {
      background: var(--info-subtle);
      color: var(--info);
    }

    .badge-active {
      background: var(--ok-subtle);
      color: var(--ok);
    }

    .badge-inactive {
      background: var(--danger-subtle);
      color: var(--danger);
    }

    .btn {
      padding: 6px 12px;
      border: 1px solid var(--border);
      border-radius: var(--radius-md);
      background: var(--bg-elevated);
      color: var(--text);
      font-size: 12px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.15s ease;
    }

    .btn:hover {
      background: var(--border);
      border-color: var(--border-strong);
    }

    .btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .btn-primary {
      background: var(--accent);
      border-color: var(--accent);
      color: white;
    }

    .btn-primary:hover {
      background: var(--accent-hover);
      border-color: var(--accent-hover);
    }

    .btn-success {
      background: var(--ok-subtle);
      border-color: transparent;
      color: var(--ok);
    }

    .btn-success:hover {
      background: rgba(34, 197, 94, 0.2);
    }

    .btn-danger {
      background: var(--danger-subtle);
      border-color: transparent;
      color: var(--danger);
    }

    .btn-danger:hover {
      background: rgba(239, 68, 68, 0.2);
    }

    .btn-warning {
      background: var(--warn-subtle);
      border-color: transparent;
      color: var(--warn);
    }

    .btn-warning:hover {
      background: rgba(245, 158, 11, 0.2);
    }

    .btn-sm {
      padding: 4px 8px;
      font-size: 11px;
    }

    .actions {
      display: flex;
      gap: 6px;
    }

    .loading,
    .empty {
      text-align: center;
      padding: 48px;
      color: var(--muted);
      font-size: 13px;
    }

    /* Filters toolbar */
    .toolbar {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 16px;
      flex-wrap: wrap;
    }

    .filter-select {
      padding: 8px 12px;
      background: var(--card);
      border: 1px solid var(--border);
      border-radius: var(--radius-md);
      color: var(--text);
      font-size: 13px;
      min-width: 120px;
      cursor: pointer;
      transition: border-color 0.15s ease;
    }

    .filter-select:focus {
      outline: none;
      border-color: var(--accent);
    }

    .filter-select option {
      background: var(--card);
      color: var(--text);
    }

    /* Pagination */
    .pagination {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 16px;
      border-top: 1px solid var(--border);
      background: var(--bg);
    }

    .pagination-info {
      font-size: 13px;
      color: var(--muted);
    }

    .pagination-controls {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .pagination-btn {
      padding: 6px 12px;
      background: var(--card);
      border: 1px solid var(--border);
      border-radius: var(--radius-md);
      color: var(--text);
      font-size: 12px;
      cursor: pointer;
      transition: all 0.15s ease;
    }

    .pagination-btn:hover:not(:disabled) {
      background: var(--border);
      border-color: var(--border-strong);
    }

    .pagination-btn:disabled {
      opacity: 0.4;
      cursor: not-allowed;
    }

    .page-indicator {
      font-size: 13px;
      color: var(--text);
      padding: 0 8px;
    }

    /* User Detail Drawer */
    .drawer-overlay {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.6);
      z-index: 1000;
      opacity: 0;
      animation: fadeIn 0.2s ease forwards;
    }

    @keyframes fadeIn {
      to {
        opacity: 1;
      }
    }

    .drawer {
      position: fixed;
      top: 0;
      right: 0;
      bottom: 0;
      width: 520px;
      max-width: 100%;
      background: var(--card);
      border-left: 1px solid var(--border);
      z-index: 1001;
      display: flex;
      flex-direction: column;
      transform: translateX(100%);
      animation: slideIn 0.25s ease forwards;
    }

    @keyframes slideIn {
      to {
        transform: translateX(0);
      }
    }

    .drawer-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 16px 20px;
      border-bottom: 1px solid var(--border);
    }

    .drawer-title {
      font-size: 15px;
      font-weight: 600;
      color: var(--text-strong);
    }

    .drawer-close {
      background: none;
      border: none;
      color: var(--muted);
      font-size: 20px;
      cursor: pointer;
      padding: 4px;
    }

    .drawer-close:hover {
      color: var(--text);
    }

    .drawer-body {
      flex: 1;
      overflow-y: auto;
      padding: 20px;
    }

    .user-profile {
      display: flex;
      align-items: flex-start;
      gap: 16px;
      margin-bottom: 20px;
      padding-bottom: 20px;
      border-bottom: 1px solid var(--border);
    }

    .user-avatar {
      width: 64px;
      height: 64px;
      border-radius: 50%;
      background: var(--accent-subtle);
      color: var(--accent);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 22px;
      font-weight: 600;
      flex-shrink: 0;
    }

    .user-avatar.inactive {
      background: var(--danger-subtle);
      color: var(--danger);
    }

    .user-profile-info {
      flex: 1;
    }

    .user-profile-info h3 {
      font-size: 18px;
      font-weight: 600;
      color: var(--text-strong);
      margin: 0 0 4px;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .user-profile-info .email {
      font-size: 13px;
      color: var(--muted);
      margin: 0 0 8px;
    }

    .user-meta {
      display: flex;
      align-items: center;
      gap: 8px;
      flex-wrap: wrap;
    }

    .user-status-toggle {
      margin-left: auto;
    }

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 10px;
      margin-bottom: 24px;
    }

    .stat-card {
      background: var(--bg);
      border: 1px solid var(--border);
      border-radius: var(--radius-md);
      padding: 14px;
      text-align: center;
    }

    .stat-label {
      font-size: 10px;
      color: var(--muted);
      text-transform: uppercase;
      letter-spacing: 0.04em;
      margin-bottom: 6px;
    }

    .stat-value {
      font-size: 22px;
      font-weight: 700;
      color: var(--text-strong);
    }

    .stat-value.ok {
      color: var(--ok);
    }

    .stat-value.warn {
      color: var(--warn);
    }

    .stat-value.danger {
      color: var(--danger);
    }

    .section {
      margin-bottom: 24px;
    }

    .section-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 12px;
    }

    .section-title {
      font-size: 12px;
      font-weight: 600;
      color: var(--muted);
      text-transform: uppercase;
      letter-spacing: 0.04em;
      margin: 0;
    }

    .list-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 12px 14px;
      background: var(--bg);
      border: 1px solid var(--border);
      border-radius: var(--radius-md);
      margin-bottom: 8px;
      font-size: 12px;
      transition: border-color 0.15s ease;
    }

    .list-item:hover {
      border-color: var(--border-strong);
    }

    .list-item.inactive {
      opacity: 0.6;
    }

    .list-item-content {
      flex: 1;
      min-width: 0;
    }

    .list-item-name {
      color: var(--text);
      font-weight: 500;
      margin-bottom: 2px;
    }

    .list-item-meta {
      color: var(--muted);
      font-size: 11px;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .list-item-actions {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-left: 12px;
    }

    .amount-positive {
      color: var(--ok);
      font-weight: 600;
    }

    .amount-negative {
      color: var(--danger);
      font-weight: 600;
    }

    .drawer-footer {
      padding: 16px 20px;
      border-top: 1px solid var(--border);
      display: flex;
      gap: 12px;
      justify-content: space-between;
    }

    .drawer-footer-left,
    .drawer-footer-right {
      display: flex;
      gap: 8px;
    }

    /* Tabs */
    .tabs {
      display: flex;
      gap: 4px;
      margin-bottom: 16px;
      padding: 4px;
      background: var(--bg);
      border-radius: var(--radius-md);
    }

    .tab {
      flex: 1;
      padding: 8px 12px;
      background: transparent;
      border: none;
      border-radius: var(--radius-sm);
      color: var(--muted);
      font-size: 12px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.15s ease;
    }

    .tab:hover {
      color: var(--text);
    }

    .tab.active {
      background: var(--card);
      color: var(--text-strong);
    }

    /* Modal */
    .modal-overlay {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.7);
      z-index: 1010;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .modal {
      background: var(--card);
      border: 1px solid var(--border);
      border-radius: var(--radius-lg);
      padding: 24px;
      width: 360px;
      max-width: 90%;
    }

    .modal h3 {
      margin: 0 0 16px;
      font-size: 16px;
      color: var(--text-strong);
    }

    .modal-input {
      width: 100%;
      padding: 10px 12px;
      background: var(--bg);
      border: 1px solid var(--border);
      border-radius: var(--radius-md);
      color: var(--text);
      font-size: 13px;
      margin-bottom: 16px;
      box-sizing: border-box;
    }

    .modal-input:focus {
      outline: none;
      border-color: var(--accent);
    }

    .modal-footer {
      display: flex;
      gap: 12px;
      justify-content: flex-end;
    }

    .info-row {
      display: flex;
      justify-content: space-between;
      padding: 8px 0;
      border-bottom: 1px solid var(--border);
      font-size: 13px;
    }

    .info-row:last-child {
      border-bottom: none;
    }

    .info-label {
      color: var(--muted);
    }

    .info-value {
      color: var(--text);
      font-weight: 500;
    }
  `;

  @state() loading = true;
  @state() users: OperisUser[] = [];
  @state() total = 0;
  @state() totalPages = 0;
  @state() page = 1;
  @state() limit = 10;
  @state() search = "";
  @state() filterRole = "";
  @state() filterStatus = "";

  // User detail drawer
  @state() selectedUser: OperisUser | null = null;
  @state() userTokens: TokenTransaction[] = [];
  @state() userApiKeys: OperisApiKeyWithUser[] = [];
  @state() userDeposits: DepositOrderWithUser[] = [];
  @state() loadingDetail = false;
  @state() activeTab: "info" | "keys" | "transactions" | "deposits" = "info";

  // Topup modal
  @state() showTopupModal = false;
  @state() topupAmount = "";
  @state() topupDescription = "";

  // Edit modal
  @state() showEditModal = false;
  @state() editName = "";
  @state() editRole: "admin" | "user" = "user";

  connectedCallback() {
    super.connectedCallback();
    this.loadUsers();
  }

  async loadUsers() {
    this.loading = true;
    try {
      const result = await operisApi.getUsers(
        this.page,
        this.limit,
        this.search || undefined,
        this.filterRole || undefined,
        this.filterStatus || undefined
      );
      this.users = result.data;
      this.total = result.total;
      this.totalPages = result.totalPages ?? Math.ceil(result.total / this.limit);
    } catch (err) {
      console.error("Failed to load users:", err);
    } finally {
      this.loading = false;
    }
  }

  handleSearch(e: InputEvent) {
    this.search = (e.target as HTMLInputElement).value;
    this.page = 1;
    clearTimeout((this as any)._searchTimeout);
    (this as any)._searchTimeout = setTimeout(() => this.loadUsers(), 300);
  }

  handleRoleFilter(e: Event) {
    this.filterRole = (e.target as HTMLSelectElement).value;
    this.page = 1;
    this.loadUsers();
  }

  handleStatusFilter(e: Event) {
    this.filterStatus = (e.target as HTMLSelectElement).value;
    this.page = 1;
    this.loadUsers();
  }

  prevPage() {
    if (this.page > 1) {
      this.page--;
      this.loadUsers();
    }
  }

  nextPage() {
    if (this.page < this.totalPages) {
      this.page++;
      this.loadUsers();
    }
  }

  async openUserDetail(user: OperisUser) {
    this.selectedUser = user;
    this.loadingDetail = true;
    this.userTokens = [];
    this.userApiKeys = [];
    this.userDeposits = [];
    this.activeTab = "info";

    try {
      const [tokensResult, keysResult, depositsResult] = await Promise.all([
        operisApi.getUserTransactions(user.id, 1, 50).catch(() => ({ data: [], total: 0 })),
        operisApi.getAllApiKeys(1, 100).catch(() => ({ data: [], total: 0 })),
        operisApi.getAllDeposits(1, 50, undefined, user.id).catch(() => ({ data: [], total: 0 })),
      ]);
      this.userTokens = tokensResult.data;
      // Filter keys by user ID
      this.userApiKeys = keysResult.data.filter((k) => k.user_id === user.id);
      this.userDeposits = depositsResult.data;
    } catch (err) {
      console.error("Failed to load user details:", err);
    } finally {
      this.loadingDetail = false;
    }
  }

  async refreshUserDetail() {
    if (!this.selectedUser) return;
    // Reload user from list
    const updatedUser = this.users.find((u) => u.id === this.selectedUser?.id);
    if (updatedUser) {
      this.selectedUser = updatedUser;
    }
    await this.openUserDetail(this.selectedUser);
  }

  closeUserDetail() {
    this.selectedUser = null;
    this.userTokens = [];
    this.userApiKeys = [];
    this.userDeposits = [];
    this.activeTab = "info";
  }

  async toggleUserStatus(user: OperisUser) {
    const action = user.is_active ? "deactivate" : "activate";
    if (!confirm(`${action.charAt(0).toUpperCase() + action.slice(1)} ${user.name}?`)) return;

    try {
      await operisApi.updateUser(user.id, { is_active: !user.is_active });
      this.loadUsers();
      if (this.selectedUser?.id === user.id) {
        this.selectedUser = { ...this.selectedUser, is_active: !user.is_active };
      }
    } catch (err) {
      console.error(`Failed to ${action} user:`, err);
      alert(`Failed to ${action} user`);
    }
  }

  async toggleApiKeyStatus(key: OperisApiKeyWithUser) {
    try {
      await operisApi.updateApiKey(key.id, { is_active: !key.is_active });
      // Refresh API keys list
      const keysResult = await operisApi.getAllApiKeys(1, 100).catch(() => ({ data: [], total: 0 }));
      this.userApiKeys = keysResult.data.filter((k) => k.user_id === this.selectedUser?.id);
    } catch (err) {
      console.error("Failed to update API key:", err);
      alert("Failed to update API key status");
    }
  }

  async deleteApiKey(key: OperisApiKeyWithUser) {
    if (!confirm(`Delete API key "${key.name}"?`)) return;
    try {
      await operisApi.deleteApiKey(key.id);
      this.userApiKeys = this.userApiKeys.filter((k) => k.id !== key.id);
    } catch (err) {
      console.error("Failed to delete API key:", err);
      alert("Failed to delete API key");
    }
  }

  openEditModal() {
    if (!this.selectedUser) return;
    this.editName = this.selectedUser.name;
    this.editRole = this.selectedUser.role;
    this.showEditModal = true;
  }

  async handleEditSave() {
    if (!this.selectedUser || !this.editName.trim()) return;
    try {
      const updated = await operisApi.updateUser(this.selectedUser.id, {
        name: this.editName.trim(),
        role: this.editRole,
      });
      this.selectedUser = updated;
      this.showEditModal = false;
      this.loadUsers();
    } catch (err) {
      console.error("Failed to update user:", err);
      alert("Failed to update user");
    }
  }

  async handleTopup() {
    if (!this.selectedUser || !this.topupAmount) return;
    try {
      await operisApi.creditTokens(
        this.selectedUser.id,
        parseInt(this.topupAmount, 10),
        this.topupDescription || undefined
      );
      this.topupAmount = "";
      this.topupDescription = "";
      this.showTopupModal = false;
      this.loadUsers();
      await this.refreshUserDetail();
    } catch (err) {
      console.error("Topup failed:", err);
      alert("Topup failed");
    }
  }

  async handleDelete(user: OperisUser) {
    if (!confirm(`Delete ${user.name}? This action cannot be undone.`)) return;
    try {
      await operisApi.deleteUser(user.id);
      this.loadUsers();
      if (this.selectedUser?.id === user.id) {
        this.closeUserDetail();
      }
    } catch (err) {
      console.error("Delete failed:", err);
      alert("Failed to delete user");
    }
  }

  formatDate(dateStr: string | null) {
    if (!dateStr) return "Never";
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }

  formatDateTime(dateStr: string | null) {
    if (!dateStr) return "Never";
    return new Date(dateStr).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  getInitials(name: string) {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  }

  render() {
    const startItem = (this.page - 1) * this.limit + 1;
    const endItem = Math.min(this.page * this.limit, this.total);

    return html`
      <div class="header">
        <h1>Users</h1>
        <div class="search-box">
          <input
            type="text"
            placeholder="Search users..."
            .value=${this.search}
            @input=${this.handleSearch}
          />
        </div>
      </div>

      <div class="toolbar">
        <select class="filter-select" .value=${this.filterRole} @change=${this.handleRoleFilter}>
          <option value="">All Roles</option>
          <option value="admin">Admin</option>
          <option value="user">User</option>
        </select>
        <select class="filter-select" .value=${this.filterStatus} @change=${this.handleStatusFilter}>
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>

      <div class="card">
        ${this.loading
          ? html`<div class="loading">Loading...</div>`
          : this.users.length === 0
            ? html`<div class="empty">No users found</div>`
            : html`
                <table class="table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Role</th>
                      <th>Status</th>
                      <th>Balance</th>
                      <th>Joined</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    ${this.users.map(
                      (user) => html`
                        <tr class="${!user.is_active ? "inactive" : ""}">
                          <td>${user.name}</td>
                          <td>${user.email}</td>
                          <td>
                            <span class="badge badge-${user.role}">${user.role}</span>
                          </td>
                          <td>
                            <span class="badge badge-${user.is_active ? "active" : "inactive"}">
                              ${user.is_active ? "Active" : "Inactive"}
                            </span>
                          </td>
                          <td>${user.token_balance.toLocaleString()}</td>
                          <td>${this.formatDate(user.created_at)}</td>
                          <td>
                            <div class="actions">
                              <button class="btn" @click=${() => this.openUserDetail(user)}>
                                View
                              </button>
                              <button
                                class="btn ${user.is_active ? "btn-warning" : "btn-success"}"
                                @click=${() => this.toggleUserStatus(user)}
                              >
                                ${user.is_active ? "Deactivate" : "Activate"}
                              </button>
                            </div>
                          </td>
                        </tr>
                      `
                    )}
                  </tbody>
                </table>
                <div class="pagination">
                  <div class="pagination-info">
                    ${this.total > 0
                      ? `Showing ${startItem}-${endItem} of ${this.total} users`
                      : "No users"}
                  </div>
                  <div class="pagination-controls">
                    <button
                      class="pagination-btn"
                      ?disabled=${this.page <= 1}
                      @click=${this.prevPage}
                    >
                      Previous
                    </button>
                    <span class="page-indicator">
                      Page ${this.page} of ${this.totalPages || 1}
                    </span>
                    <button
                      class="pagination-btn"
                      ?disabled=${this.page >= this.totalPages}
                      @click=${this.nextPage}
                    >
                      Next
                    </button>
                  </div>
                </div>
              `}
      </div>

      ${this.selectedUser ? this.renderUserDrawer() : ""}
      ${this.showTopupModal ? this.renderTopupModal() : ""}
      ${this.showEditModal ? this.renderEditModal() : ""}
    `;
  }

  renderUserDrawer() {
    const user = this.selectedUser!;
    const activeKeysCount = this.userApiKeys.filter((k) => k.is_active).length;
    const totalUsage = this.userTokens
      .filter((t) => t.type === "debit")
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);

    return html`
      <div class="drawer-overlay" @click=${this.closeUserDetail}></div>
      <div class="drawer">
        <div class="drawer-header">
          <span class="drawer-title">User Details</span>
          <button class="drawer-close" @click=${this.closeUserDetail}>×</button>
        </div>

        <div class="drawer-body">
          <div class="user-profile">
            <div class="user-avatar ${!user.is_active ? "inactive" : ""}">
              ${this.getInitials(user.name)}
            </div>
            <div class="user-profile-info">
              <h3>
                ${user.name}
                <span class="badge badge-${user.is_active ? "active" : "inactive"}">
                  ${user.is_active ? "Active" : "Inactive"}
                </span>
              </h3>
              <p class="email">${user.email}</p>
              <div class="user-meta">
                <span class="badge badge-${user.role}">${user.role}</span>
                <span style="color: var(--muted); font-size: 11px;">
                  Joined ${this.formatDate(user.created_at)}
                </span>
              </div>
            </div>
            <div class="user-status-toggle">
              <button
                class="btn btn-sm ${user.is_active ? "btn-warning" : "btn-success"}"
                @click=${() => this.toggleUserStatus(user)}
              >
                ${user.is_active ? "Deactivate" : "Activate"}
              </button>
            </div>
          </div>

          <div class="stats-grid">
            <div class="stat-card">
              <div class="stat-label">Balance</div>
              <div class="stat-value ok">${user.token_balance.toLocaleString()}</div>
            </div>
            <div class="stat-card">
              <div class="stat-label">Total Used</div>
              <div class="stat-value warn">${totalUsage.toLocaleString()}</div>
            </div>
            <div class="stat-card">
              <div class="stat-label">API Keys</div>
              <div class="stat-value">${this.userApiKeys.length}</div>
            </div>
            <div class="stat-card">
              <div class="stat-label">Active Keys</div>
              <div class="stat-value ${activeKeysCount > 0 ? "ok" : ""}">${activeKeysCount}</div>
            </div>
          </div>

          <div class="tabs">
            <button
              class="tab ${this.activeTab === "info" ? "active" : ""}"
              @click=${() => (this.activeTab = "info")}
            >
              Info
            </button>
            <button
              class="tab ${this.activeTab === "keys" ? "active" : ""}"
              @click=${() => (this.activeTab = "keys")}
            >
              Keys (${this.userApiKeys.length})
            </button>
            <button
              class="tab ${this.activeTab === "transactions" ? "active" : ""}"
              @click=${() => (this.activeTab = "transactions")}
            >
              Transactions (${this.userTokens.length})
            </button>
            <button
              class="tab ${this.activeTab === "deposits" ? "active" : ""}"
              @click=${() => (this.activeTab = "deposits")}
            >
              Deposits (${this.userDeposits.length})
            </button>
          </div>

          ${this.loadingDetail
            ? html`<div class="loading">Loading details...</div>`
            : this.renderTabContent()}
        </div>

        <div class="drawer-footer">
          <div class="drawer-footer-left">
            <button class="btn btn-danger" @click=${() => this.handleDelete(user)}>
              Delete User
            </button>
          </div>
          <div class="drawer-footer-right">
            <button class="btn" @click=${this.openEditModal}>Edit</button>
            <button class="btn btn-primary" @click=${() => (this.showTopupModal = true)}>
              Topup Tokens
            </button>
          </div>
        </div>
      </div>
    `;
  }

  renderTabContent() {
    switch (this.activeTab) {
      case "info":
        return this.renderInfoTab();
      case "keys":
        return this.renderKeysTab();
      case "transactions":
        return this.renderTransactionsTab();
      case "deposits":
        return this.renderDepositsTab();
    }
  }

  renderInfoTab() {
    const user = this.selectedUser!;
    return html`
      <div class="section">
        <div class="section-title">Account Information</div>
        <div style="background: var(--bg); border: 1px solid var(--border); border-radius: var(--radius-md); padding: 12px 16px;">
          <div class="info-row">
            <span class="info-label">User ID</span>
            <span class="info-value" style="font-family: monospace; font-size: 11px;">${user.id}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Email</span>
            <span class="info-value">${user.email}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Name</span>
            <span class="info-value">${user.name}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Role</span>
            <span class="info-value">
              <span class="badge badge-${user.role}">${user.role}</span>
            </span>
          </div>
          <div class="info-row">
            <span class="info-label">Status</span>
            <span class="info-value">
              <span class="badge badge-${user.is_active ? "active" : "inactive"}">
                ${user.is_active ? "Active" : "Inactive"}
              </span>
            </span>
          </div>
          <div class="info-row">
            <span class="info-label">Token Balance</span>
            <span class="info-value" style="color: var(--ok);">
              ${user.token_balance.toLocaleString()}
            </span>
          </div>
          <div class="info-row">
            <span class="info-label">Last Active</span>
            <span class="info-value">${this.formatDateTime(user.last_active_at)}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Created</span>
            <span class="info-value">${this.formatDateTime(user.created_at)}</span>
          </div>
        </div>
      </div>
    `;
  }

  renderKeysTab() {
    return html`
      <div class="section">
        <div class="section-header">
          <div class="section-title">API Keys</div>
        </div>
        ${this.userApiKeys.length === 0
          ? html`<div class="list-item">
              <span class="list-item-meta">No API keys</span>
            </div>`
          : this.userApiKeys.map(
              (key) => html`
                <div class="list-item ${key.is_active ? "" : "inactive"}">
                  <div class="list-item-content">
                    <div class="list-item-name">${key.name}</div>
                    <div class="list-item-meta">
                      <span style="font-family: monospace;">${key.key_prefix}...****</span>
                      <span>•</span>
                      <span>Created ${this.formatDate(key.created_at)}</span>
                      ${key.last_used_at
                        ? html`<span>•</span><span>Used ${this.formatDateTime(key.last_used_at)}</span>`
                        : ""}
                    </div>
                  </div>
                  <div class="list-item-actions">
                    <span class="badge ${key.is_active ? "badge-active" : "badge-inactive"}">
                      ${key.is_active ? "Active" : "Blocked"}
                    </span>
                    <button
                      class="btn btn-sm ${key.is_active ? "btn-warning" : "btn-success"}"
                      @click=${() => this.toggleApiKeyStatus(key)}
                      title="${key.is_active ? "Block this key" : "Unblock this key"}"
                    >
                      ${key.is_active ? "Block" : "Unblock"}
                    </button>
                    <button
                      class="btn btn-sm btn-danger"
                      @click=${() => this.deleteApiKey(key)}
                      title="Delete this key"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              `
            )}
      </div>
    `;
  }

  renderTransactionsTab() {
    return html`
      <div class="section">
        <div class="section-header">
          <div class="section-title">Token Transactions</div>
        </div>
        ${this.userTokens.length === 0
          ? html`<div class="list-item">
              <span class="list-item-meta">No transactions</span>
            </div>`
          : this.userTokens.map(
              (tx) => html`
                <div class="list-item">
                  <div class="list-item-content">
                    <div class="list-item-name">
                      ${tx.description || this.getTransactionLabel(tx.type)}
                    </div>
                    <div class="list-item-meta">
                      <span class="badge badge-${this.getTransactionBadgeClass(tx.type)}">
                        ${tx.type}
                      </span>
                      <span>•</span>
                      <span>${this.formatDateTime(tx.created_at)}</span>
                      <span>•</span>
                      <span>Balance: ${tx.balance_after.toLocaleString()}</span>
                    </div>
                  </div>
                  <span class="${tx.type === "credit" ? "amount-positive" : "amount-negative"}">
                    ${tx.type === "credit" ? "+" : "-"}${Math.abs(tx.amount).toLocaleString()}
                  </span>
                </div>
              `
            )}
      </div>
    `;
  }

  renderDepositsTab() {
    return html`
      <div class="section">
        <div class="section-header">
          <div class="section-title">Deposit History</div>
        </div>
        ${this.userDeposits.length === 0
          ? html`<div class="list-item">
              <span class="list-item-meta">No deposits</span>
            </div>`
          : this.userDeposits.map(
              (deposit) => html`
                <div class="list-item">
                  <div class="list-item-content">
                    <div class="list-item-name" style="font-family: monospace; font-size: 12px;">
                      ${deposit.orderCode}
                    </div>
                    <div class="list-item-meta">
                      <span class="badge badge-${this.getDepositBadgeClass(deposit.status)}">
                        ${deposit.status}
                      </span>
                      <span>•</span>
                      <span>${this.formatDateTime(deposit.createdAt)}</span>
                      <span>•</span>
                      <span>${deposit.amountVnd.toLocaleString()} VND</span>
                    </div>
                  </div>
                  <span class="amount-positive">
                    +${deposit.tokenAmount.toLocaleString()}
                  </span>
                </div>
              `
            )}
      </div>
    `;
  }

  getDepositBadgeClass(status: string) {
    const classes: Record<string, string> = {
      pending: "user",
      completed: "active",
      expired: "inactive",
      failed: "inactive",
    };
    return classes[status] || "user";
  }

  getTransactionLabel(type: string) {
    const labels: Record<string, string> = {
      credit: "Token Credit",
      debit: "Token Usage",
      adjustment: "Balance Adjustment",
    };
    return labels[type] || type;
  }

  getTransactionBadgeClass(type: string) {
    const classes: Record<string, string> = {
      credit: "active",
      debit: "inactive",
      adjustment: "user",
    };
    return classes[type] || "user";
  }

  renderTopupModal() {
    return html`
      <div class="modal-overlay" @click=${() => (this.showTopupModal = false)}>
        <div class="modal" @click=${(e: Event) => e.stopPropagation()}>
          <h3>Topup Tokens</h3>
          <p style="font-size: 12px; color: var(--muted); margin: 0 0 16px;">
            Add tokens to ${this.selectedUser?.name}'s account
          </p>
          <input
            type="number"
            class="modal-input"
            placeholder="Amount"
            .value=${this.topupAmount}
            @input=${(e: InputEvent) => (this.topupAmount = (e.target as HTMLInputElement).value)}
          />
          <input
            type="text"
            class="modal-input"
            placeholder="Description (optional)"
            .value=${this.topupDescription}
            @input=${(e: InputEvent) =>
              (this.topupDescription = (e.target as HTMLInputElement).value)}
          />
          <div class="modal-footer">
            <button class="btn" @click=${() => (this.showTopupModal = false)}>Cancel</button>
            <button
              class="btn btn-primary"
              ?disabled=${!this.topupAmount}
              @click=${this.handleTopup}
            >
              Topup
            </button>
          </div>
        </div>
      </div>
    `;
  }

  renderEditModal() {
    return html`
      <div class="modal-overlay" @click=${() => (this.showEditModal = false)}>
        <div class="modal" @click=${(e: Event) => e.stopPropagation()}>
          <h3>Edit User</h3>
          <label style="display: block; margin-bottom: 6px; font-size: 12px; color: var(--muted);">
            Name
          </label>
          <input
            type="text"
            class="modal-input"
            placeholder="Name"
            .value=${this.editName}
            @input=${(e: InputEvent) => (this.editName = (e.target as HTMLInputElement).value)}
          />
          <label style="display: block; margin-bottom: 6px; font-size: 12px; color: var(--muted);">
            Role
          </label>
          <select
            class="modal-input"
            .value=${this.editRole}
            @change=${(e: Event) => (this.editRole = (e.target as HTMLSelectElement).value as "admin" | "user")}
          >
            <option value="user">User</option>
            <option value="admin">Admin</option>
          </select>
          <div class="modal-footer">
            <button class="btn" @click=${() => (this.showEditModal = false)}>Cancel</button>
            <button
              class="btn btn-primary"
              ?disabled=${!this.editName.trim()}
              @click=${this.handleEditSave}
            >
              Save
            </button>
          </div>
        </div>
      </div>
    `;
  }
}
