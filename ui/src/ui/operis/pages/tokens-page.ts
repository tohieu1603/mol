import { LitElement, html, css } from "lit";
import { customElement, state } from "lit/decorators.js";
import { operisApi, type TokenTransactionWithUser, type OperisUser } from "../api.js";

/**
 * Token Transactions Page - Admin view of all users' transactions
 */
@customElement("tokens-page")
export class TokensPage extends LitElement {
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
      display: inline-block;
      padding: 4px 10px;
      border-radius: 9999px;
      font-size: 12px;
      font-weight: 500;
    }

    .badge-credit {
      background: rgba(34, 197, 94, 0.2);
      color: #22c55e;
    }

    .badge-debit {
      background: rgba(239, 68, 68, 0.2);
      color: #ef4444;
    }

    .badge-adjustment {
      background: rgba(59, 130, 246, 0.2);
      color: #3b82f6;
    }

    .amount-positive {
      color: #22c55e;
      font-weight: 600;
    }

    .amount-negative {
      color: #ef4444;
      font-weight: 600;
    }

    .balance-cell {
      color: #94a3b8;
      font-family: monospace;
    }

    .description-cell {
      max-width: 300px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      color: #94a3b8;
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
  @state() transactions: TokenTransactionWithUser[] = [];
  @state() total = 0;
  @state() page = 1;
  @state() limit = 10;
  @state() filterType = "";
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
      const result = await operisApi.getAllTransactions(
        this.page,
        this.limit,
        this.filterType || undefined,
        this.filterUserId || undefined
      );
      this.transactions = result.data;
      this.total = result.total;
    } catch (err) {
      console.error("Failed to load transactions:", err);
    } finally {
      this.loading = false;
    }
  }

  handleFilterChange(e: Event) {
    const select = e.target as HTMLSelectElement;
    this.filterType = select.value;
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
    return new Date(dateStr).toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  formatAmount(amount: number, type: string) {
    const isPositive = type === "credit" || (type === "adjustment" && amount > 0);
    const prefix = isPositive ? "+" : "-";
    const displayAmount = Math.abs(amount);
    return { text: `${prefix}${displayAmount.toLocaleString()}`, isPositive };
  }

  render() {
    return html`
      <div class="header">
        <div class="header-left">
          <h1>Token Transactions</h1>
          <p>View all token transactions across all users.</p>
        </div>
      </div>

      <div class="filters">
        <select class="filter-select" @change=${this.handleFilterChange}>
          <option value="">All Types</option>
          <option value="credit">Credit</option>
          <option value="debit">Debit</option>
          <option value="adjustment">Adjustment</option>
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
          ? html`<div class="loading">Loading transactions...</div>`
          : this.transactions.length === 0
            ? html`
                <div class="empty-state">
                  <h3>No Transactions</h3>
                  <p>No token transactions found.</p>
                </div>
              `
            : html`
                <table class="table">
                  <thead>
                    <tr>
                      <th>User</th>
                      <th>Type</th>
                      <th>Amount</th>
                      <th>Balance After</th>
                      <th>Description</th>
                      <th>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${this.transactions.map((tx) => {
                      const formatted = this.formatAmount(tx.amount, tx.type);
                      return html`
                        <tr>
                          <td>
                            <div class="user-cell">
                              <span class="user-name">${tx.user_name}</span>
                              <span class="user-email">${tx.user_email}</span>
                            </div>
                          </td>
                          <td>
                            <span class="badge badge-${tx.type}">${tx.type}</span>
                          </td>
                          <td class="${formatted.isPositive ? "amount-positive" : "amount-negative"}">
                            ${formatted.text}
                          </td>
                          <td class="balance-cell">
                            ${tx.balance_after.toLocaleString()}
                          </td>
                          <td class="description-cell" title="${tx.description || ""}">
                            ${tx.description || "-"}
                          </td>
                          <td>${this.formatDate(tx.created_at)}</td>
                        </tr>
                      `;
                    })}
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
