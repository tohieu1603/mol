import { LitElement, html, css } from "lit";
import { customElement, state } from "lit/decorators.js";
import { operisApi, type DashboardStats, type OperisUser } from "../api.js";

/**
 * Dashboard Overview Page
 */
@customElement("dashboard-page")
export class DashboardPage extends LitElement {
  static styles = css`
    :host {
      display: block;
    }

    .header {
      margin-bottom: 32px;
    }

    .header h1 {
      font-size: 24px;
      font-weight: 600;
      color: #f1f5f9;
      margin: 0 0 8px;
    }

    .header p {
      color: #64748b;
      font-size: 14px;
      margin: 0;
    }

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 20px;
      margin-bottom: 32px;
    }

    .stat-card {
      background: #1e293b;
      border: 1px solid #334155;
      border-radius: 12px;
      padding: 24px;
    }

    .stat-label {
      font-size: 14px;
      color: #64748b;
      margin-bottom: 8px;
    }

    .stat-value {
      font-size: 32px;
      font-weight: 700;
      color: #f1f5f9;
    }

    .stat-value.accent {
      color: #3b82f6;
    }

    .stat-value.success {
      color: #22c55e;
    }

    .stat-value.warning {
      color: #f59e0b;
    }

    .section {
      background: #1e293b;
      border: 1px solid #334155;
      border-radius: 12px;
      padding: 24px;
      margin-bottom: 24px;
    }

    .section-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 20px;
    }

    .section-title {
      font-size: 18px;
      font-weight: 600;
      color: #f1f5f9;
    }

    .table {
      width: 100%;
      border-collapse: collapse;
    }

    .table th,
    .table td {
      padding: 12px 16px;
      text-align: left;
      border-bottom: 1px solid #334155;
    }

    .table th {
      font-weight: 500;
      color: #64748b;
      font-size: 12px;
      text-transform: uppercase;
    }

    .table td {
      color: #f1f5f9;
      font-size: 14px;
    }

    .table tr:last-child td {
      border-bottom: none;
    }

    .badge {
      display: inline-block;
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 12px;
      font-weight: 500;
    }

    .badge-admin {
      background: rgba(59, 130, 246, 0.2);
      color: #3b82f6;
    }

    .badge-user {
      background: rgba(34, 197, 94, 0.2);
      color: #22c55e;
    }

    .loading {
      text-align: center;
      padding: 40px;
      color: #64748b;
    }

    .error {
      padding: 16px;
      background: rgba(239, 68, 68, 0.1);
      border: 1px solid #ef4444;
      border-radius: 8px;
      color: #ef4444;
    }
  `;

  @state() loading = true;
  @state() error = "";
  @state() stats: DashboardStats | null = null;
  @state() recentUsers: OperisUser[] = [];
  @state() user: OperisUser | null = null;

  connectedCallback() {
    super.connectedCallback();
    this.loadData();
  }

  async loadData() {
    this.loading = true;
    this.error = "";

    try {
      const [statsResult, usersResult, profile] = await Promise.all([
        operisApi.getStats().catch(() => null),
        operisApi.getUsers(1, 5).catch(() => ({ data: [], total: 0 })),
        operisApi.getProfile().catch(() => null),
      ]);

      this.stats = statsResult;
      this.recentUsers = usersResult.data;
      this.user = profile;
    } catch (err) {
      this.error = err instanceof Error ? err.message : "Failed to load data";
    } finally {
      this.loading = false;
    }
  }

  formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  }

  render() {
    if (this.loading) {
      return html`<div class="loading">Loading dashboard...</div>`;
    }

    if (this.error) {
      return html`<div class="error">${this.error}</div>`;
    }

    return html`
      <div class="header">
        <h1>Welcome back, ${this.user?.name || "Admin"}</h1>
        <p>Here's what's happening with your platform today.</p>
      </div>

      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-label">Total Users</div>
          <div class="stat-value">${this.stats?.totalUsers || 0}</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Active API Keys</div>
          <div class="stat-value accent">${this.stats?.activeKeys || 0}</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Tokens Used</div>
          <div class="stat-value success">
            ${(this.stats?.totalUsage || 0).toLocaleString()}
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Chat Sessions</div>
          <div class="stat-value warning">${this.stats?.totalSessions || 0}</div>
        </div>
      </div>

      <div class="section">
        <div class="section-header">
          <h2 class="section-title">Recent Users</h2>
        </div>

        <table class="table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Balance</th>
              <th>Joined</th>
            </tr>
          </thead>
          <tbody>
            ${this.recentUsers.map(
              (user) => html`
                <tr>
                  <td>${user.name}</td>
                  <td>${user.email}</td>
                  <td>
                    <span
                      class="badge ${user.role === "admin"
                        ? "badge-admin"
                        : "badge-user"}"
                    >
                      ${user.role}
                    </span>
                  </td>
                  <td>${user.token_balance.toLocaleString()}</td>
                  <td>${this.formatDate(user.created_at)}</td>
                </tr>
              `
            )}
          </tbody>
        </table>
      </div>
    `;
  }
}
