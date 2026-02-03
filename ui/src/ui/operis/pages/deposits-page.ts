import { LitElement, html, css } from "lit";
import { customElement, state } from "lit/decorators.js";
import {
  operisApi,
  type DepositOrder,
  type DepositPricing,
  type TokenHistoryItem,
} from "../api.js";

/**
 * Deposits Management Page
 * Features: Create deposit, view QR, deposit history, token history
 */
@customElement("deposits-page")
export class DepositsPage extends LitElement {
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

    .grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 24px;
      margin-bottom: 24px;
    }

    @media (max-width: 1024px) {
      .grid {
        grid-template-columns: 1fr;
      }
    }

    .card {
      background: var(--card);
      border: 1px solid var(--border);
      border-radius: var(--radius-lg);
      overflow: hidden;
    }

    .card-header {
      padding: 16px 20px;
      border-bottom: 1px solid var(--border);
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .card-title {
      font-size: 14px;
      font-weight: 600;
      color: var(--text-strong);
      margin: 0;
    }

    .card-body {
      padding: 20px;
    }

    /* Pricing Card */
    .pricing-info {
      text-align: center;
      padding: 20px 0;
    }

    .pricing-value {
      font-size: 32px;
      font-weight: 700;
      color: var(--accent);
      margin-bottom: 4px;
    }

    .pricing-label {
      font-size: 13px;
      color: var(--muted);
    }

    .pricing-details {
      margin-top: 20px;
      padding-top: 20px;
      border-top: 1px solid var(--border);
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
    }

    .pricing-detail {
      text-align: center;
    }

    .pricing-detail-value {
      font-size: 16px;
      font-weight: 600;
      color: var(--text-strong);
    }

    .pricing-detail-label {
      font-size: 11px;
      color: var(--muted);
      text-transform: uppercase;
    }

    /* Create Deposit Form */
    .form-group {
      margin-bottom: 16px;
    }

    .form-label {
      display: block;
      font-size: 12px;
      font-weight: 500;
      color: var(--muted);
      margin-bottom: 6px;
    }

    .form-input {
      width: 100%;
      padding: 10px 14px;
      background: var(--bg);
      border: 1px solid var(--border);
      border-radius: var(--radius-md);
      color: var(--text);
      font-size: 14px;
      box-sizing: border-box;
      transition: border-color 0.15s ease;
    }

    .form-input:focus {
      outline: none;
      border-color: var(--accent);
    }

    .form-hint {
      font-size: 11px;
      color: var(--muted);
      margin-top: 6px;
    }

    .form-row {
      display: flex;
      gap: 12px;
      align-items: flex-end;
    }

    .form-row .form-group {
      flex: 1;
      margin-bottom: 0;
    }

    .conversion {
      padding: 12px 16px;
      background: var(--bg);
      border: 1px solid var(--border);
      border-radius: var(--radius-md);
      margin-bottom: 16px;
    }

    .conversion-row {
      display: flex;
      justify-content: space-between;
      font-size: 13px;
    }

    .conversion-label {
      color: var(--muted);
    }

    .conversion-value {
      color: var(--text-strong);
      font-weight: 600;
    }

    .conversion-value.highlight {
      color: var(--accent);
      font-size: 16px;
    }

    /* QR Code Display */
    .qr-container {
      text-align: center;
      padding: 20px;
    }

    .qr-image {
      width: 200px;
      height: 200px;
      background: white;
      border-radius: var(--radius-md);
      margin: 0 auto 16px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .qr-image img {
      width: 100%;
      height: 100%;
      object-fit: contain;
    }

    .qr-info {
      text-align: left;
      background: var(--bg);
      border: 1px solid var(--border);
      border-radius: var(--radius-md);
      padding: 14px 16px;
      margin-top: 16px;
    }

    .qr-info-row {
      display: flex;
      justify-content: space-between;
      padding: 6px 0;
      font-size: 12px;
      border-bottom: 1px solid var(--border);
    }

    .qr-info-row:last-child {
      border-bottom: none;
    }

    .qr-info-label {
      color: var(--muted);
    }

    .qr-info-value {
      color: var(--text);
      font-weight: 500;
      font-family: monospace;
    }

    .qr-countdown {
      text-align: center;
      margin-top: 16px;
      font-size: 13px;
      color: var(--warn);
    }

    /* Buttons */
    .btn {
      padding: 10px 16px;
      border: 1px solid var(--border);
      border-radius: var(--radius-md);
      background: var(--bg-elevated);
      color: var(--text);
      font-size: 13px;
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

    .btn-danger {
      background: var(--danger-subtle);
      border-color: transparent;
      color: var(--danger);
    }

    .btn-danger:hover {
      background: rgba(239, 68, 68, 0.2);
    }

    .btn-block {
      width: 100%;
    }

    .btn-group {
      display: flex;
      gap: 8px;
      margin-top: 12px;
    }

    /* Table */
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

    /* Badges */
    .badge {
      display: inline-block;
      padding: 3px 8px;
      border-radius: 9999px;
      font-size: 11px;
      font-weight: 500;
    }

    .badge-pending {
      background: var(--warn-subtle);
      color: var(--warn);
    }

    .badge-completed {
      background: var(--ok-subtle);
      color: var(--ok);
    }

    .badge-failed,
    .badge-expired {
      background: var(--danger-subtle);
      color: var(--danger);
    }

    .badge-credit {
      background: var(--ok-subtle);
      color: var(--ok);
    }

    .badge-debit {
      background: var(--danger-subtle);
      color: var(--danger);
    }

    .badge-adjustment {
      background: var(--info-subtle);
      color: var(--info);
    }

    /* Amounts */
    .amount-positive {
      color: var(--ok);
      font-weight: 600;
    }

    .amount-negative {
      color: var(--danger);
      font-weight: 600;
    }

    /* Tabs */
    .tabs {
      display: flex;
      gap: 4px;
      margin-bottom: 20px;
      padding: 4px;
      background: var(--bg);
      border-radius: var(--radius-md);
    }

    .tab {
      flex: 1;
      padding: 10px 16px;
      background: transparent;
      border: none;
      border-radius: var(--radius-sm);
      color: var(--muted);
      font-size: 13px;
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

    /* Empty state */
    .empty {
      text-align: center;
      padding: 48px 24px;
      color: var(--muted);
      font-size: 13px;
    }

    .loading {
      text-align: center;
      padding: 48px;
      color: var(--muted);
    }

    /* Packages Grid */
    .packages-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 8px;
      margin-bottom: 8px;
    }

    .package-btn {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 12px 8px;
      background: var(--bg);
      border: 2px solid var(--border);
      border-radius: var(--radius-md);
      cursor: pointer;
      transition: all 0.15s ease;
    }

    .package-btn:hover {
      border-color: var(--border-strong);
      background: var(--bg-elevated);
    }

    .package-btn.selected {
      border-color: var(--accent);
      background: var(--accent-subtle);
    }

    .package-vnd {
      font-size: 16px;
      font-weight: 700;
      color: var(--text-strong);
    }

    .package-tokens {
      font-size: 11px;
      color: var(--muted);
      margin-top: 2px;
    }

    .package-btn.selected .package-vnd {
      color: var(--accent);
    }

    .package-btn.selected .package-tokens {
      color: var(--accent);
    }

    /* Status indicator */
    .status-dot {
      display: inline-block;
      width: 8px;
      height: 8px;
      border-radius: 50%;
      margin-right: 6px;
    }

    .status-dot.pending {
      background: var(--warn);
    }

    .status-dot.completed {
      background: var(--ok);
    }

    .status-dot.expired,
    .status-dot.failed {
      background: var(--danger);
    }
  `;

  @state() loading = true;
  @state() pricing: DepositPricing | null = null;
  @state() pendingOrder: DepositOrder | null = null;
  @state() depositHistory: DepositOrder[] = [];
  @state() tokenHistory: TokenHistoryItem[] = [];
  @state() activeTab: "deposits" | "tokens" = "deposits";

  // Create deposit form
  @state() vndAmount = "";
  @state() calculatedTokens = 0;
  @state() creating = false;

  // Preset packages (VND amounts)
  private packages = [
    { vnd: 50000, label: "50K" },
    { vnd: 100000, label: "100K" },
    { vnd: 200000, label: "200K" },
    { vnd: 500000, label: "500K" },
    { vnd: 1000000, label: "1M" },
    { vnd: 2000000, label: "2M" },
  ];

  // Countdown
  @state() countdown = "";
  private countdownInterval?: number;

  connectedCallback() {
    super.connectedCallback();
    this.loadData();
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    if (this.countdownInterval) {
      clearInterval(this.countdownInterval);
    }
  }

  async loadData() {
    this.loading = true;
    try {
      const [pricingRes, pendingRes, historyRes, tokenRes] = await Promise.all([
        operisApi.getDepositPricing().catch(() => null),
        operisApi.getPendingDeposit().catch(() => ({ hasPending: false, order: null })),
        operisApi.getDepositHistory(20, 0).catch(() => ({ orders: [], total: 0 })),
        operisApi.getTokenHistory(50, 0).catch(() => ({ transactions: [], total: 0 })),
      ]);

      this.pricing = pricingRes;
      this.pendingOrder = pendingRes.order;
      this.depositHistory = historyRes.orders;
      this.tokenHistory = tokenRes.transactions;

      if (this.pendingOrder) {
        this.startCountdown();
      }
    } catch (err) {
      console.error("Failed to load data:", err);
    } finally {
      this.loading = false;
    }
  }

  startCountdown() {
    if (this.countdownInterval) {
      clearInterval(this.countdownInterval);
    }

    this.updateCountdown();
    this.countdownInterval = window.setInterval(() => {
      this.updateCountdown();
    }, 1000);
  }

  updateCountdown() {
    if (!this.pendingOrder) return;

    const expiresAt = new Date(this.pendingOrder.expiresAt);
    const now = new Date();
    const diff = expiresAt.getTime() - now.getTime();

    if (diff <= 0) {
      this.countdown = "Expired";
      this.pendingOrder = { ...this.pendingOrder, status: "expired" };
      if (this.countdownInterval) {
        clearInterval(this.countdownInterval);
      }
      return;
    }

    const minutes = Math.floor(diff / 60000);
    const seconds = Math.floor((diff % 60000) / 1000);
    this.countdown = `${minutes}:${seconds.toString().padStart(2, "0")}`;
  }

  handleVndAmountChange(e: InputEvent) {
    const value = (e.target as HTMLInputElement).value;
    this.vndAmount = value;
    this.updateCalculatedTokens(parseInt(value, 10));
  }

  selectPackage(vnd: number) {
    this.vndAmount = vnd.toString();
    this.updateCalculatedTokens(vnd);
  }

  updateCalculatedTokens(vnd: number) {
    if (!isNaN(vnd) && vnd > 0 && this.pricing) {
      // Calculate tokens: vnd / pricePerMillion * 1M
      this.calculatedTokens = Math.floor((vnd / this.pricing.pricePerMillion) * 1000000);
    } else {
      this.calculatedTokens = 0;
    }
  }

  async handleCreateDeposit() {
    if (this.calculatedTokens < (this.pricing?.minimumTokens || 100000)) {
      alert(`Minimum deposit is ${(this.pricing?.minimumTokens || 100000).toLocaleString()} tokens (${this.formatVnd(this.pricing?.minimumVnd || 50000)})`);
      return;
    }

    this.creating = true;
    try {
      const order = await operisApi.createDeposit(this.calculatedTokens);
      this.pendingOrder = order;
      this.vndAmount = "";
      this.calculatedTokens = 0;
      this.startCountdown();
      // Refresh history
      const historyRes = await operisApi.getDepositHistory(20, 0);
      this.depositHistory = historyRes.orders;
    } catch (err: any) {
      alert(err.message || "Failed to create deposit");
    } finally {
      this.creating = false;
    }
  }

  async handleCancelDeposit() {
    if (!this.pendingOrder) return;
    if (!confirm("Cancel this deposit order?")) return;

    try {
      await operisApi.cancelDeposit(this.pendingOrder.id);
      this.pendingOrder = null;
      if (this.countdownInterval) {
        clearInterval(this.countdownInterval);
      }
      // Refresh history
      const historyRes = await operisApi.getDepositHistory(20, 0);
      this.depositHistory = historyRes.orders;
    } catch (err: any) {
      alert(err.message || "Failed to cancel deposit");
    }
  }

  formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  }

  formatDateTime(dateStr: string) {
    return new Date(dateStr).toLocaleString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  formatVnd(amount: number) {
    return amount.toLocaleString("vi-VN") + " VND";
  }

  render() {
    if (this.loading) {
      return html`<div class="loading">Loading...</div>`;
    }

    return html`
      <div class="header">
        <h1>Deposits & Tokens</h1>
      </div>

      <div class="grid">
        ${this.renderPricingCard()}
        ${this.pendingOrder && this.pendingOrder.status === "pending"
          ? this.renderPendingOrderCard()
          : this.renderCreateDepositCard()}
      </div>

      <div class="card">
        <div class="card-header">
          <div class="tabs" style="margin: 0; background: transparent; padding: 0;">
            <button
              class="tab ${this.activeTab === "deposits" ? "active" : ""}"
              @click=${() => (this.activeTab = "deposits")}
            >
              Deposit History
            </button>
            <button
              class="tab ${this.activeTab === "tokens" ? "active" : ""}"
              @click=${() => (this.activeTab = "tokens")}
            >
              Token History
            </button>
          </div>
        </div>
        ${this.activeTab === "deposits"
          ? this.renderDepositHistory()
          : this.renderTokenHistory()}
      </div>
    `;
  }

  renderPricingCard() {
    if (!this.pricing) return html``;

    return html`
      <div class="card">
        <div class="card-header">
          <h3 class="card-title">Pricing</h3>
        </div>
        <div class="card-body">
          <div class="pricing-info">
            <div class="pricing-value">${this.formatVnd(this.pricing.pricePerMillion)}</div>
            <div class="pricing-label">per 1,000,000 tokens</div>
            <div class="pricing-details">
              <div class="pricing-detail">
                <div class="pricing-detail-value">
                  ${this.pricing.minimumTokens.toLocaleString()}
                </div>
                <div class="pricing-detail-label">Min Tokens</div>
              </div>
              <div class="pricing-detail">
                <div class="pricing-detail-value">${this.formatVnd(this.pricing.minimumVnd)}</div>
                <div class="pricing-detail-label">Min Amount</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  renderCreateDepositCard() {
    return html`
      <div class="card">
        <div class="card-header">
          <h3 class="card-title">Nạp tiền</h3>
        </div>
        <div class="card-body">
          <!-- Preset Packages -->
          <div class="form-group">
            <label class="form-label">Chọn gói nạp</label>
            <div class="packages-grid">
              ${this.packages.map(
                (pkg) => html`
                  <button
                    class="package-btn ${this.vndAmount === pkg.vnd.toString() ? "selected" : ""}"
                    @click=${() => this.selectPackage(pkg.vnd)}
                  >
                    <span class="package-vnd">${pkg.label}</span>
                    <span class="package-tokens">${this.formatPackageTokens(pkg.vnd)} tokens</span>
                  </button>
                `
              )}
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">Hoặc nhập số tiền (VND)</label>
            <input
              type="number"
              class="form-input"
              placeholder="VD: 100000"
              .value=${this.vndAmount}
              @input=${this.handleVndAmountChange}
              min="${this.pricing?.minimumVnd || 50000}"
              step="1000"
            />
            <div class="form-hint">
              Tối thiểu: ${this.formatVnd(this.pricing?.minimumVnd || 50000)}
            </div>
          </div>

          ${this.calculatedTokens > 0
            ? html`
                <div class="conversion">
                  <div class="conversion-row">
                    <span class="conversion-label">Số tiền</span>
                    <span class="conversion-value">${this.formatVnd(parseInt(this.vndAmount, 10))}</span>
                  </div>
                  <div class="conversion-row" style="margin-top: 8px;">
                    <span class="conversion-label">Nhận được</span>
                    <span class="conversion-value highlight">
                      +${this.calculatedTokens.toLocaleString()} tokens
                    </span>
                  </div>
                </div>
              `
            : ""}

          <button
            class="btn btn-primary btn-block"
            ?disabled=${this.creating || this.calculatedTokens < (this.pricing?.minimumTokens || 100000)}
            @click=${this.handleCreateDeposit}
          >
            ${this.creating ? "Đang tạo..." : "Tạo đơn nạp tiền"}
          </button>
        </div>
      </div>
    `;
  }

  formatPackageTokens(vnd: number): string {
    if (!this.pricing) return "0";
    const tokens = Math.floor((vnd / this.pricing.pricePerMillion) * 1000000);
    if (tokens >= 1000000) {
      return (tokens / 1000000).toFixed(1) + "M";
    }
    return (tokens / 1000).toFixed(0) + "K";
  }

  renderPendingOrderCard() {
    const order = this.pendingOrder!;

    return html`
      <div class="card">
        <div class="card-header">
          <h3 class="card-title">Pending Payment</h3>
          <span class="badge badge-pending">
            <span class="status-dot pending"></span>
            Waiting for payment
          </span>
        </div>
        <div class="card-body">
          <div class="qr-container">
            <div class="qr-image">
              <img src="${order.paymentInfo.qrCodeUrl}" alt="QR Code" />
            </div>

            <div class="qr-info">
              <div class="qr-info-row">
                <span class="qr-info-label">Bank</span>
                <span class="qr-info-value">${order.paymentInfo.bankName}</span>
              </div>
              <div class="qr-info-row">
                <span class="qr-info-label">Account</span>
                <span class="qr-info-value">${order.paymentInfo.accountNumber}</span>
              </div>
              <div class="qr-info-row">
                <span class="qr-info-label">Name</span>
                <span class="qr-info-value">${order.paymentInfo.accountName}</span>
              </div>
              <div class="qr-info-row">
                <span class="qr-info-label">Amount</span>
                <span class="qr-info-value" style="color: var(--accent);">
                  ${this.formatVnd(order.amountVnd)}
                </span>
              </div>
              <div class="qr-info-row">
                <span class="qr-info-label">Content</span>
                <span class="qr-info-value">${order.paymentInfo.transferContent}</span>
              </div>
              <div class="qr-info-row">
                <span class="qr-info-label">Tokens</span>
                <span class="qr-info-value" style="color: var(--ok);">
                  +${order.tokenAmount.toLocaleString()}
                </span>
              </div>
            </div>

            <div class="qr-countdown">Time remaining: ${this.countdown}</div>

            <div class="btn-group">
              <button class="btn btn-danger" style="flex: 1;" @click=${this.handleCancelDeposit}>
                Cancel
              </button>
              <button class="btn" style="flex: 1;" @click=${() => this.loadData()}>
                Refresh
              </button>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  renderDepositHistory() {
    if (this.depositHistory.length === 0) {
      return html`<div class="empty">No deposit history</div>`;
    }

    return html`
      <table class="table">
        <thead>
          <tr>
            <th>Order Code</th>
            <th>Tokens</th>
            <th>Amount</th>
            <th>Status</th>
            <th>Created</th>
          </tr>
        </thead>
        <tbody>
          ${this.depositHistory.map(
            (order) => html`
              <tr>
                <td style="font-family: monospace; font-size: 12px;">${order.orderCode}</td>
                <td>${order.tokenAmount.toLocaleString()}</td>
                <td>${this.formatVnd(order.amountVnd)}</td>
                <td>
                  <span class="badge badge-${order.status}">
                    <span class="status-dot ${order.status}"></span>
                    ${order.status}
                  </span>
                </td>
                <td>${this.formatDateTime(order.createdAt)}</td>
              </tr>
            `
          )}
        </tbody>
      </table>
    `;
  }

  renderTokenHistory() {
    if (this.tokenHistory.length === 0) {
      return html`<div class="empty">No token transactions</div>`;
    }

    return html`
      <table class="table">
        <thead>
          <tr>
            <th>Description</th>
            <th>Type</th>
            <th>Amount</th>
            <th>Balance</th>
            <th>Date</th>
          </tr>
        </thead>
        <tbody>
          ${this.tokenHistory.map(
            (tx) => html`
              <tr>
                <td>${tx.description || this.getTransactionLabel(tx.type)}</td>
                <td>
                  <span class="badge badge-${tx.type}">${tx.type}</span>
                </td>
                <td>
                  <span class="${tx.type === "credit" ? "amount-positive" : "amount-negative"}">
                    ${tx.type === "credit" ? "+" : "-"}${Math.abs(tx.amount).toLocaleString()}
                  </span>
                </td>
                <td>${tx.balanceAfter.toLocaleString()}</td>
                <td>${this.formatDateTime(tx.createdAt)}</td>
              </tr>
            `
          )}
        </tbody>
      </table>
    `;
  }

  getTransactionLabel(type: string) {
    const labels: Record<string, string> = {
      credit: "Token Credit",
      debit: "Token Usage",
      adjustment: "Balance Adjustment",
    };
    return labels[type] || type;
  }
}
