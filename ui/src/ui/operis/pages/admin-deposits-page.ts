import { LitElement, html, css } from "lit";
import { customElement, state } from "lit/decorators.js";
import { operisApi, type DepositOrderWithUser, type OperisUser } from "../api.js";

/**
 * Admin Deposits Page - View all deposits across all users
 */
@customElement("admin-deposits-page")
export class AdminDepositsPage extends LitElement {
  static styles = css`
    :host {
      display: block;
    }

    .header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 24px;
    }

    .header-left h1 {
      font-size: 24px;
      font-weight: 600;
      color: #f1f5f9;
      margin: 0 0 8px;
    }

    .header-left p {
      color: #64748b;
      font-size: 14px;
      margin: 0;
    }

    .filters {
      display: flex;
      gap: 12px;
      margin-bottom: 20px;
    }

    .filter-select {
      padding: 8px 12px;
      background: #1e293b;
      border: 1px solid #334155;
      border-radius: 6px;
      color: #f1f5f9;
      font-size: 14px;
      min-width: 140px;
    }

    .filter-select:focus {
      outline: none;
      border-color: #3b82f6;
    }

    .card {
      background: #1e293b;
      border: 1px solid #334155;
      border-radius: 12px;
      overflow: hidden;
    }

    .table {
      width: 100%;
      border-collapse: collapse;
    }

    .table th,
    .table td {
      padding: 16px;
      text-align: left;
      border-bottom: 1px solid #334155;
    }

    .table th {
      font-weight: 500;
      color: #64748b;
      font-size: 12px;
      text-transform: uppercase;
      background: #0f172a;
    }

    .table td {
      color: #f1f5f9;
      font-size: 14px;
    }

    .table tr:last-child td {
      border-bottom: none;
    }

    .table tr:hover td {
      background: rgba(59, 130, 246, 0.05);
    }

    .user-cell {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .user-name {
      font-weight: 500;
      color: #f1f5f9;
    }

    .user-email {
      font-size: 12px;
      color: #64748b;
    }

    .badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 4px 10px;
      border-radius: 9999px;
      font-size: 12px;
      font-weight: 500;
    }

    .badge-pending {
      background: rgba(245, 158, 11, 0.2);
      color: #f59e0b;
    }

    .badge-completed {
      background: rgba(34, 197, 94, 0.2);
      color: #22c55e;
    }

    .badge-failed,
    .badge-expired {
      background: rgba(239, 68, 68, 0.2);
      color: #ef4444;
    }

    .status-dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: currentColor;
    }

    .order-code {
      font-family: monospace;
      font-size: 12px;
      color: #94a3b8;
    }

    .amount {
      font-weight: 600;
      color: #f1f5f9;
    }

    .tokens {
      color: #22c55e;
      font-weight: 600;
    }

    .loading {
      text-align: center;
      padding: 60px;
      color: #64748b;
    }

    .empty-state {
      text-align: center;
      padding: 60px 20px;
      color: #64748b;
    }

    .empty-state h3 {
      color: #f1f5f9;
      margin: 0 0 8px;
    }

    .pagination {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 16px;
      border-top: 1px solid #334155;
    }

    .pagination-info {
      color: #64748b;
      font-size: 14px;
    }

    .pagination-buttons {
      display: flex;
      gap: 8px;
    }

    .pagination-btn {
      padding: 8px 16px;
      background: #334155;
      border: none;
      border-radius: 6px;
      color: #f1f5f9;
      font-size: 14px;
      cursor: pointer;
    }

    .pagination-btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .pagination-btn:not(:disabled):hover {
      background: #475569;
    }
  `;

  @state() loading = true;
  @state() deposits: DepositOrderWithUser[] = [];
  @state() total = 0;
  @state() page = 1;
  @state() limit = 10;
  @state() filterStatus = "";
  @state() filterUserId = "";
  @state() users: OperisUser[] = [];

  connectedCallback() {
    super.connectedCallback();
    this.loadUsers();
    this.loadData();
  }

  async loadUsers() {
    try {
      const result = await operisApi.getUsers(1, 1000);
      this.users = result.data;
    } catch (err) {
      console.error("Failed to load users:", err);
    }
  }

  async loadData() {
    this.loading = true;
    try {
      const result = await operisApi.getAllDeposits(
        this.page,
        this.limit,
        this.filterStatus || undefined,
        this.filterUserId || undefined
      );
      this.deposits = result.data;
      this.total = result.total;
    } catch (err) {
      console.error("Failed to load deposits:", err);
    } finally {
      this.loading = false;
    }
  }

  handleFilterChange(e: Event) {
    const select = e.target as HTMLSelectElement;
    this.filterStatus = select.value;
    this.page = 1;
    this.loadData();
  }

  handleUserFilterChange(e: Event) {
    const select = e.target as HTMLSelectElement;
    this.filterUserId = select.value;
    this.page = 1;
    this.loadData();
  }

  prevPage() {
    if (this.page > 1) {
      this.page--;
      this.loadData();
    }
  }

  nextPage() {
    if (this.page * this.limit < this.total) {
      this.page++;
      this.loadData();
    }
  }

  formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  formatVnd(amount: number) {
    return amount.toLocaleString("vi-VN") + " VND";
  }

  render() {
    return html`
      <div class="header">
        <div class="header-left">
          <h1>Deposits</h1>
          <p>View all deposit orders across all users.</p>
        </div>
      </div>

      <div class="filters">
        <select class="filter-select" @change=${this.handleFilterChange}>
          <option value="">All Status</option>
          <option value="pending">Pending</option>
          <option value="completed">Completed</option>
          <option value="expired">Expired</option>
          <option value="failed">Failed</option>
        </select>
        <select class="filter-select" @change=${this.handleUserFilterChange}>
          <option value="">All Users</option>
          ${this.users.map(
            (user) => html`<option value="${user.id}">${user.name} (${user.email})</option>`
          )}
        </select>
      </div>

      <div class="card">
        ${this.loading
          ? html`<div class="loading">Loading deposits...</div>`
          : this.deposits.length === 0
            ? html`
                <div class="empty-state">
                  <h3>No Deposits</h3>
                  <p>No deposit orders found.</p>
                </div>
              `
            : html`
                <table class="table">
                  <thead>
                    <tr>
                      <th>User</th>
                      <th>Order Code</th>
                      <th>Amount</th>
                      <th>Tokens</th>
                      <th>Status</th>
                      <th>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${this.deposits.map(
                      (deposit) => html`
                        <tr>
                          <td>
                            <div class="user-cell">
                              <span class="user-name">${deposit.user_name}</span>
                              <span class="user-email">${deposit.user_email}</span>
                            </div>
                          </td>
                          <td class="order-code">${deposit.orderCode}</td>
                          <td class="amount">${this.formatVnd(deposit.amountVnd)}</td>
                          <td class="tokens">+${deposit.tokenAmount.toLocaleString()}</td>
                          <td>
                            <span class="badge badge-${deposit.status}">
                              <span class="status-dot"></span>
                              ${deposit.status}
                            </span>
                          </td>
                          <td>${this.formatDate(deposit.createdAt)}</td>
                        </tr>
                      `
                    )}
                  </tbody>
                </table>

                <div class="pagination">
                  <div class="pagination-info">
                    Showing ${(this.page - 1) * this.limit + 1} -
                    ${Math.min(this.page * this.limit, this.total)} of ${this.total}
                  </div>
                  <div class="pagination-buttons">
                    <button
                      class="pagination-btn"
                      ?disabled=${this.page === 1}
                      @click=${this.prevPage}
                    >
                      Previous
                    </button>
                    <button
                      class="pagination-btn"
                      ?disabled=${this.page * this.limit >= this.total}
                      @click=${this.nextPage}
                    >
                      Next
                    </button>
                  </div>
                </div>
              `}
      </div>
    `;
  }
}
