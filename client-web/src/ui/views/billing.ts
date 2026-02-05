import { html, nothing } from "lit";
import { icons } from "../icons";
import type { PricingTier, DepositOrder } from "../deposits-api";

export interface BillingProps {
  // Balance
  creditBalance?: number;
  // Pricing tiers from API
  pricingTiers?: PricingTier[];
  pricingLoading?: boolean;
  // Package selection
  selectedPackage?: number;
  onSelectPackage?: (index: number) => void;
  // Buy Tokens / QR Payment
  onBuyTokens?: () => void;
  buyLoading?: boolean;
  // Pending order (from API)
  pendingOrder?: DepositOrder | null;
  onCancelPending?: () => void;
  // QR Modal
  showQrModal?: boolean;
  onCloseQrModal?: () => void;
  onCheckTransaction?: () => void;
  checkingTransaction?: boolean;
  // Auto top-up
  autoTopUp?: boolean;
  onToggleAutoTopUp?: () => void;
  // Transaction history
  depositHistory?: DepositOrder[];
  historyLoading?: boolean;
  onRefreshHistory?: () => void;
  // API Keys
  apiKeys?: Array<{ id: string; name: string; key: string; createdAt: number }>;
  showCreateKeyModal?: boolean;
  newKeyName?: string;
  onOpenCreateKeyModal?: () => void;
  onCloseCreateKeyModal?: () => void;
  onNewKeyNameChange?: (name: string) => void;
  onCreateKey?: () => void;
  onCopyKey?: (key: string) => void;
  onDeleteKey?: (id: string) => void;
}

function formatNumber(num: number): string {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
  if (num >= 1000) return num.toLocaleString();
  return num.toString();
}

function formatVND(amount: number): string {
  return amount.toLocaleString("vi-VN") + "đ";
}

function formatDate(ts: number | string): string {
  const date = typeof ts === "string" ? new Date(ts) : new Date(ts);
  return date.toLocaleDateString("vi-VN", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getStatusLabel(status: string): string {
  switch (status) {
    case "pending":
      return "Chờ thanh toán";
    case "completed":
      return "Hoàn thành";
    case "cancelled":
      return "Đã hủy";
    case "expired":
      return "Hết hạn";
    default:
      return status;
  }
}

function getStatusClass(status: string): string {
  switch (status) {
    case "pending":
      return "status-pending";
    case "completed":
      return "status-success";
    case "cancelled":
    case "expired":
      return "status-error";
    default:
      return "";
  }
}

export function renderBilling(props: BillingProps) {
  console.log("[billing] renderBilling called with props:", props);
  const creditBalance = props.creditBalance ?? 0;
  const pricingTiers = props.pricingTiers ?? [];
  const pricingLoading = props.pricingLoading ?? false;
  const selectedPackage = props.selectedPackage ?? 0;
  const autoTopUp = props.autoTopUp ?? false;
  const apiKeys = props.apiKeys ?? [];
  const showCreateKeyModal = props.showCreateKeyModal ?? false;
  const newKeyName = props.newKeyName ?? "";
  const showQrModal = props.showQrModal ?? false;
  const pendingOrder = props.pendingOrder ?? null;
  const depositHistory = props.depositHistory ?? [];
  const historyLoading = props.historyLoading ?? false;
  const buyLoading = props.buyLoading ?? false;
  const checkingTransaction = props.checkingTransaction ?? false;

  const selectedTier = pricingTiers[selectedPackage];

  return html`
    <style>
      .billing-layout { display: grid; gap: 24px; }
      .billing-row { display: grid; grid-template-columns: 1fr 1.5fr; gap: 24px; }
      @media (max-width: 900px) { .billing-row { grid-template-columns: 1fr; } }
      .b-card { background: var(--card); border: 1px solid var(--border); border-radius: var(--radius-lg); overflow: hidden; }
      .b-card-header { display: flex; justify-content: space-between; align-items: center; padding: 20px 24px; border-bottom: 1px solid var(--border); }
      .b-card-title { font-size: 16px; font-weight: 600; color: var(--text-strong); }
      .b-card-header-icon { width: 20px; height: 20px; color: var(--muted); }
      .b-card-header-icon svg { width: 100%; height: 100%; stroke: currentColor; fill: none; stroke-width: 2; }
      .b-card-body { padding: 24px; }
      .balance-amount { display: flex; align-items: baseline; gap: 8px; margin-bottom: 4px; }
      .balance-value { font-size: 32px; font-weight: 700; color: var(--text-strong); }
      .balance-label { font-size: 14px; color: var(--muted); }
      .balance-note { display: flex; align-items: center; gap: 8px; font-size: 13px; color: var(--muted); margin-top: 16px; padding-top: 16px; border-top: 1px solid var(--border); }
      .balance-note svg { width: 16px; height: 16px; stroke: currentColor; fill: none; stroke-width: 2; flex-shrink: 0; }
      .rate-limit { margin-top: 24px; padding-top: 24px; border-top: 1px solid var(--border); }
      .rate-limit-title { font-size: 14px; font-weight: 600; color: var(--text-strong); margin-bottom: 12px; }
      .rate-limit-desc { font-size: 13px; color: var(--text); line-height: 1.5; margin-bottom: 12px; }
      .rate-limit-item { display: flex; align-items: flex-start; gap: 8px; font-size: 13px; color: var(--muted); margin-bottom: 8px; }
      .rate-limit-item svg { width: 14px; height: 14px; stroke: currentColor; fill: none; stroke-width: 2; margin-top: 2px; flex-shrink: 0; }
      .rate-limit-note { font-size: 12px; color: var(--muted); line-height: 1.5; margin-top: 16px; }
      .packages-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 12px; margin-bottom: 20px; }
      .package-card { position: relative; padding: 16px; background: var(--bg); border: 2px solid var(--border); border-radius: var(--radius-md); cursor: pointer; transition: all 0.15s ease; user-select: none; }
      .package-card:hover { border-color: var(--border-strong); }
      .package-card.selected { border-color: var(--accent); background: var(--accent-subtle); }
      .package-card.popular { border-color: var(--accent); }
      .package-name { font-size: 12px; font-weight: 600; color: var(--muted); text-transform: uppercase; margin-bottom: 4px; }
      .package-price { font-size: 20px; font-weight: 700; color: var(--text-strong); }
      .package-tokens { font-size: 13px; color: var(--muted); margin-top: 4px; }
      .package-bonus { font-size: 11px; color: var(--accent); margin-top: 2px; }
      .package-badge { position: absolute; top: -8px; right: -8px; padding: 4px 8px; font-size: 10px; font-weight: 700; text-transform: uppercase; background: var(--accent); color: var(--accent-foreground); border-radius: var(--radius-sm); }
      .toggle-row { display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px; }
      .toggle-label { font-size: 14px; color: var(--text); }
      .toggle-switch { position: relative; width: 44px; height: 24px; background: var(--border); border-radius: 12px; cursor: pointer; transition: background 0.2s; }
      .toggle-switch.active { background: var(--accent); }
      .toggle-switch::after { content: ""; position: absolute; top: 2px; left: 2px; width: 20px; height: 20px; background: white; border-radius: 50%; transition: transform 0.2s; }
      .toggle-switch.active::after { transform: translateX(20px); }
      .form-label { font-size: 12px; font-weight: 500; color: var(--muted); }
      .order-summary { margin-top: 20px; padding: 16px; background: var(--bg); border-radius: var(--radius-md); border: 1px solid var(--border); }
      .order-summary-title { font-size: 13px; font-weight: 600; color: var(--text); margin-bottom: 12px; text-transform: uppercase; letter-spacing: 0.5px; }
      .order-summary-row { display: flex; justify-content: space-between; align-items: center; padding: 8px 0; }
      .order-summary-row:not(:last-child) { border-bottom: 1px solid var(--border); }
      .order-summary-label { font-size: 13px; color: var(--muted); }
      .order-summary-tokens { font-size: 18px; font-weight: 700; color: var(--accent); }
      .payment-method-badge { display: flex; align-items: center; gap: 8px; padding: 8px 12px; background: var(--secondary); border-radius: var(--radius-sm); }
      .payment-method-badge svg { width: 18px; height: 18px; color: var(--accent); }
      .payment-method-info { display: flex; flex-direction: column; }
      .payment-method-name { font-size: 13px; font-weight: 600; color: var(--text); }
      .payment-method-desc { font-size: 11px; color: var(--muted); }
      .buy-btn { width: 100%; margin-top: 16px; padding: 16px; font-size: 16px; font-weight: 600; background: var(--accent); color: var(--accent-foreground); border: none; border-radius: var(--radius-md); cursor: pointer; transition: all 0.15s ease; display: flex; align-items: center; justify-content: center; gap: 8px; }
      .buy-btn svg { width: 20px; height: 20px; flex-shrink: 0; stroke: currentColor; fill: none; stroke-width: 2; }
      .buy-btn:hover:not(:disabled) { background: var(--accent-hover); transform: translateY(-1px); }
      .buy-btn:disabled { opacity: 0.6; cursor: not-allowed; }
      .auto-payments-desc { font-size: 13px; color: var(--muted); line-height: 1.6; margin-bottom: 20px; }
      .history-empty { text-align: center; padding: 32px; color: var(--muted); font-size: 14px; }
      .history-list { display: flex; flex-direction: column; gap: 12px; }
      .history-item { display: flex; justify-content: space-between; align-items: center; padding: 12px 16px; background: var(--bg); border-radius: var(--radius-md); border: 1px solid var(--border); }
      .history-info { display: flex; flex-direction: column; gap: 4px; }
      .history-amount { font-size: 14px; font-weight: 600; color: var(--text-strong); }
      .history-date { font-size: 12px; color: var(--muted); }
      .history-tokens { font-size: 14px; font-weight: 600; color: var(--accent); }
      .history-status { font-size: 12px; padding: 4px 8px; border-radius: var(--radius-sm); }
      .status-pending { background: var(--warning-subtle, #fef3c7); color: var(--warning, #d97706); }
      .status-success { background: var(--success-subtle, #dcfce7); color: var(--success, #16a34a); }
      .status-error { background: var(--danger-subtle, #fee2e2); color: var(--danger, #dc2626); }
      .refresh-btn { display: flex; align-items: center; gap: 6px; padding: 8px 16px; font-size: 13px; font-weight: 500; background: var(--secondary); border: 1px solid var(--border); border-radius: var(--radius-md); color: var(--text); cursor: pointer; transition: all 0.15s ease; }
      .refresh-btn:hover { background: var(--bg-hover); border-color: var(--border-strong); }
      .refresh-btn svg { width: 14px; height: 14px; stroke: currentColor; fill: none; stroke-width: 2; }
      .api-key-list { display: flex; flex-direction: column; }
      .api-key-item { display: flex; align-items: center; gap: 16px; padding: 16px 0; border-bottom: 1px solid var(--border); }
      .api-key-item:last-child { border-bottom: none; }
      .api-key-icon { width: 40px; height: 40px; display: flex; align-items: center; justify-content: center; background: var(--secondary); border-radius: var(--radius-md); color: var(--muted); }
      .api-key-icon svg { width: 20px; height: 20px; stroke: currentColor; fill: none; stroke-width: 1.5; }
      .api-key-info { flex: 1; min-width: 0; }
      .api-key-name { font-size: 14px; font-weight: 500; color: var(--text-strong); }
      .api-key-value { font-size: 13px; font-family: var(--mono); color: var(--muted); margin-top: 2px; }
      .api-key-date { font-size: 12px; color: var(--muted); margin-top: 4px; }
      .api-key-actions { display: flex; gap: 8px; }
      .api-key-btn { width: 36px; height: 36px; display: flex; align-items: center; justify-content: center; background: transparent; border: 1px solid var(--border); border-radius: var(--radius-md); color: var(--muted); cursor: pointer; transition: all 0.15s ease; }
      .api-key-btn:hover { background: var(--bg-hover); color: var(--text); border-color: var(--border-strong); }
      .api-key-btn.danger:hover { background: var(--danger-subtle); color: var(--danger); border-color: var(--danger); }
      .api-key-btn svg { width: 16px; height: 16px; stroke: currentColor; fill: none; stroke-width: 2; }
      .api-empty { text-align: center; padding: 32px; }
      .api-empty-icon { width: 48px; height: 48px; margin: 0 auto 12px; display: flex; align-items: center; justify-content: center; background: var(--secondary); border-radius: var(--radius-lg); color: var(--muted); }
      .api-empty-icon svg { width: 24px; height: 24px; stroke: currentColor; fill: none; stroke-width: 1.5; }
      .api-empty-title { font-size: 14px; font-weight: 500; color: var(--text-strong); margin-bottom: 4px; }
      .api-empty-desc { font-size: 13px; color: var(--muted); }
      .create-key-btn { display: flex; align-items: center; gap: 6px; padding: 10px 16px; font-size: 13px; font-weight: 500; background: var(--accent); color: var(--accent-foreground); border: none; border-radius: var(--radius-md); cursor: pointer; transition: all 0.15s ease; }
      .create-key-btn:hover { background: var(--accent-hover); }
      .create-key-btn svg { width: 14px; height: 14px; stroke: currentColor; fill: none; stroke-width: 2; }
      .modal-btn { padding: 12px 24px; font-size: 14px; font-weight: 500; border-radius: var(--radius-md); cursor: pointer; transition: all 0.15s ease; }
      .modal-btn-secondary { background: var(--secondary); border: 1px solid var(--border); color: var(--text); }
      .modal-btn-secondary:hover { background: var(--bg-hover); }
      .modal-btn-primary { background: var(--accent); border: none; color: var(--accent-foreground); }
      .modal-btn-primary:hover { background: var(--accent-hover); }
      .modal-btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }
      .qr-payment { text-align: center; }
      .qr-payment-title { font-size: 18px; font-weight: 600; color: var(--text-strong); margin-bottom: 16px; line-height: 1.4; }
      .qr-bank-info { background: var(--bg); border: 1px solid var(--border); border-radius: var(--radius-md); padding: 16px; margin-bottom: 20px; text-align: left; }
      .qr-bank-row { display: flex; justify-content: space-between; align-items: center; padding: 8px 0; border-bottom: 1px solid var(--border); }
      .qr-bank-row:last-child { border-bottom: none; }
      .qr-bank-label { font-size: 13px; color: var(--muted); }
      .qr-bank-value { font-size: 14px; font-weight: 600; color: var(--text-strong); font-family: var(--mono); }
      .qr-bank-value.highlight { color: var(--accent); font-size: 16px; }
      .qr-image-container { background: white; border-radius: var(--radius-lg); padding: 16px; display: inline-block; margin-bottom: 24px; }
      .qr-image { width: 240px; height: 240px; display: block; }
      .qr-check-btn { width: 100%; padding: 16px 24px; font-size: 16px; font-weight: 600; background: #ff6b35; color: white; border: none; border-radius: var(--radius-md); cursor: pointer; transition: all 0.15s ease; display: flex; align-items: center; justify-content: center; gap: 8px; }
      .qr-check-btn:hover:not(:disabled) { background: #e55a2b; }
      .qr-check-btn:disabled { opacity: 0.6; cursor: not-allowed; }
      .qr-cancel-btn { width: 100%; margin-top: 12px; padding: 12px 24px; font-size: 14px; font-weight: 500; background: transparent; color: var(--muted); border: 1px solid var(--border); border-radius: var(--radius-md); cursor: pointer; }
      .qr-cancel-btn:hover { background: var(--bg-hover); color: var(--text); }
      .qr-note { margin-top: 16px; padding: 12px 16px; background: var(--warning-subtle, #fef3c7); color: var(--warning, #d97706); border-radius: var(--radius-md); font-size: 13px; line-height: 1.5; }
      .loading-skeleton { background: linear-gradient(90deg, var(--bg) 25%, var(--border) 50%, var(--bg) 75%); background-size: 200% 100%; animation: skeleton 1.5s infinite; border-radius: var(--radius-md); }
      @keyframes skeleton { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }
      .pending-alert { background: var(--warning-subtle, #fef3c7); border: 1px solid var(--warning, #d97706); border-radius: var(--radius-md); padding: 16px; margin-bottom: 20px; }
      .pending-alert-title { font-size: 14px; font-weight: 600; color: var(--warning, #d97706); margin-bottom: 8px; display: flex; align-items: center; gap: 8px; }
      .pending-alert-title svg { width: 16px; height: 16px; }
      .pending-alert-text { font-size: 13px; color: var(--text); line-height: 1.5; }
      .pending-alert-btn { margin-top: 12px; padding: 8px 16px; font-size: 13px; font-weight: 500; background: var(--warning, #d97706); color: white; border: none; border-radius: var(--radius-sm); cursor: pointer; }
      .pending-alert-btn:hover { opacity: 0.9; }
    </style>

    <div class="billing-layout">
      <div class="billing-row">
        <div class="b-card">
          <div class="b-card-header">
            <span class="b-card-title">Thông Tin Số Dư</span>
            <span class="b-card-header-icon">${icons.creditCard}</span>
          </div>
          <div class="b-card-body">
            <div class="balance-amount">
              <span class="balance-value">${formatNumber(creditBalance)}</span>
              <span class="balance-label">tokens</span>
            </div>
            <div class="balance-label">Số dư hiện tại</div>
            <div class="balance-note">
              ${icons.clock}
              <span>Tokens không hết hạn và có thể dùng bất cứ lúc nào</span>
            </div>
            <div class="rate-limit">
              <div class="rate-limit-title">Giới Hạn Tốc Độ</div>
              <div class="rate-limit-desc">Mỗi tài khoản giới hạn 20 yêu cầu mới mỗi 10 giây (≈ 100+ tác vụ đồng thời).</div>
              <div class="rate-limit-item">${icons.clock}<span>Áp dụng cho mỗi tài khoản</span></div>
              <div class="rate-limit-item">${icons.clock}<span>Yêu cầu vượt quá trả về HTTP 429 và không được xếp hàng</span></div>
              <div class="rate-limit-note">Giới hạn này phù hợp với hầu hết người dùng. Nếu thường xuyên gặp lỗi 429, liên hệ hỗ trợ để yêu cầu tăng.</div>
            </div>
          </div>
        </div>

        <div class="b-card">
          <div class="b-card-header">
            <span class="b-card-title">Thêm Tokens</span>
          </div>
          <div class="b-card-body">
            ${pendingOrder ? html`
              <div class="pending-alert">
                <div class="pending-alert-title">${icons.clock} Bạn có đơn nạp đang chờ</div>
                <div class="pending-alert-text">
                  Số tiền: ${formatVND(pendingOrder.amount ?? 0)}<br>
                  Tokens: ${formatNumber(pendingOrder.tokens ?? 0)}
                </div>
                <button class="pending-alert-btn" @click=${() => props.onCheckTransaction?.()}>
                  Xem thông tin thanh toán
                </button>
              </div>
            ` : nothing}

            <div class="form-label" style="margin-bottom: 12px;">Chọn Gói</div>
            ${pricingLoading ? html`
              <div class="packages-grid">
                ${[1, 2, 3].map(() => html`
                  <div class="loading-skeleton" style="height: 100px;"></div>
                `)}
              </div>
            ` : pricingTiers.length === 0 ? html`
              <div class="history-empty">Không có gói nào</div>
            ` : html`
              <div class="packages-grid">
                ${pricingTiers.map((tier, i) => html`
                  <div class="package-card ${selectedPackage === i ? "selected" : ""} ${tier.popular ? "popular" : ""}" @click=${() => props.onSelectPackage?.(i)}>
                    ${tier.popular ? html`<div class="package-badge">PHỔ BIẾN</div>` : nothing}
                    <div class="package-name">${tier.name}</div>
                    <div class="package-price">${formatVND(tier.price)}</div>
                    <div class="package-tokens">${formatNumber(tier.tokens)} tokens</div>
                    ${tier.bonus > 0 ? html`<div class="package-bonus">+${formatNumber(tier.bonus)} bonus</div>` : nothing}
                  </div>
                `)}
              </div>
            `}
            ${selectedTier ? html`
              <div class="order-summary">
                <div class="order-summary-title">Tóm tắt đơn hàng</div>
                <div class="order-summary-row">
                  <span class="order-summary-label">Bạn sẽ nhận được</span>
                  <span class="order-summary-tokens">${formatNumber(selectedTier.tokens + selectedTier.bonus)} tokens</span>
                </div>
                <div class="order-summary-row">
                  <span class="order-summary-label">Phương thức thanh toán</span>
                  <div class="payment-method-badge">
                    ${icons.qrCode}
                    <div class="payment-method-info">
                      <span class="payment-method-name">QR Ngân hàng</span>
                      <span class="payment-method-desc">Quét mã QR để chuyển khoản</span>
                    </div>
                  </div>
                </div>
              </div>
              <button class="buy-btn" ?disabled=${buyLoading || !!pendingOrder} @click=${() => props.onBuyTokens?.()}>
                ${buyLoading ? html`<span>Đang xử lý...</span>` : html`${icons.qrCode} Mua Tokens`}
              </button>
            ` : nothing}
          </div>
        </div>
      </div>

      <div class="b-card">
        <div class="b-card-header">
          <span class="b-card-title">Thanh Toán Tự Động</span>
        </div>
        <div class="b-card-body">
          <div class="auto-payments-desc">Cấu hình thanh toán tự động bằng cách thêm thẻ vào tài khoản. Khi số dư gần ngưỡng Auto-Pay, chúng tôi sẽ nạp thêm tokens bằng thẻ đã lưu tối đa 10 phút một lần.</div>
          <div class="toggle-row" style="margin-bottom: 0;">
            <span class="toggle-label">Bật tự động nạp tiền</span>
            <div class="toggle-switch ${autoTopUp ? "active" : ""}" @click=${() => props.onToggleAutoTopUp?.()}></div>
          </div>
        </div>
      </div>

      <div class="b-card">
        <div class="b-card-header">
          <span class="b-card-title">Lịch Sử Giao Dịch</span>
          <button class="refresh-btn" @click=${() => props.onRefreshHistory?.()}>${icons.refresh} Làm mới</button>
        </div>
        <div class="b-card-body">
          ${historyLoading ? html`
            <div class="loading-skeleton" style="height: 60px; margin-bottom: 12px;"></div>
            <div class="loading-skeleton" style="height: 60px; margin-bottom: 12px;"></div>
            <div class="loading-skeleton" style="height: 60px;"></div>
          ` : depositHistory.length === 0 ? html`
            <div class="history-empty">Chưa có giao dịch nào</div>
          ` : html`
            <div class="history-list">
              ${depositHistory.map((deposit) => html`
                <div class="history-item">
                  <div class="history-info">
                    <div class="history-amount">${formatVND(deposit.amount)}</div>
                    <div class="history-date">${formatDate(deposit.createdAt)}</div>
                  </div>
                  <div class="history-tokens">${formatNumber(deposit.tokens)} tokens</div>
                  <span class="history-status ${getStatusClass(deposit.status)}">${getStatusLabel(deposit.status)}</span>
                </div>
              `)}
            </div>
          `}
        </div>
      </div>

      <div class="b-card">
        <div class="b-card-header">
          <div>
            <span class="b-card-title">API Keys</span>
            <div style="font-size: 13px; color: var(--muted); margin-top: 2px;">Quản lý khóa truy cập API của bạn</div>
          </div>
          <button class="create-key-btn" @click=${() => props.onOpenCreateKeyModal?.()}>${icons.plus} Tạo Key Mới</button>
        </div>
        <div class="b-card-body">
          ${apiKeys.length === 0 ? html`
            <div class="api-empty">
              <div class="api-empty-icon">${icons.key}</div>
              <div class="api-empty-title">Chưa có API key</div>
              <div class="api-empty-desc">Tạo API key để bắt đầu tích hợp</div>
            </div>
          ` : html`
            <div class="api-key-list">
              ${apiKeys.map((key) => html`
                <div class="api-key-item">
                  <div class="api-key-icon">${icons.key}</div>
                  <div class="api-key-info">
                    <div class="api-key-name">${key.name}</div>
                    <div class="api-key-value">${key.key}</div>
                    <div class="api-key-date">Tạo lúc ${formatDate(key.createdAt)}</div>
                  </div>
                  <div class="api-key-actions">
                    <button class="api-key-btn" title="Sao chép" @click=${() => props.onCopyKey?.(key.key)}>${icons.copy}</button>
                    <button class="api-key-btn danger" title="Xóa" @click=${() => props.onDeleteKey?.(key.id)}>${icons.trash}</button>
                  </div>
                </div>
              `)}
            </div>
          `}
        </div>
      </div>
    </div>

    <operis-modal ?open=${showCreateKeyModal} title="Tạo API Key" @close=${() => props.onCloseCreateKeyModal?.()}>
      <div class="modal-field">
        <label class="modal-label">Tên Key</label>
        <operis-input type="text" placeholder="VD: Production, Development..." .value=${newKeyName} @input=${(e: CustomEvent) => props.onNewKeyNameChange?.(e.detail.value)}></operis-input>
      </div>
      <div slot="footer">
        <button class="modal-btn modal-btn-secondary" @click=${() => props.onCloseCreateKeyModal?.()}>Hủy</button>
        <button class="modal-btn modal-btn-primary" ?disabled=${!newKeyName.trim()} @click=${() => props.onCreateKey?.()}>Tạo</button>
      </div>
    </operis-modal>

    <operis-modal ?open=${showQrModal} @close=${() => props.onCloseQrModal?.()}>
      <div class="qr-payment">
        <div class="qr-payment-title">Chuyển khoản ngân hàng</div>
        ${pendingOrder?.paymentInfo ? html`
          ${pendingOrder.paymentInfo.qrCodeUrl ? html`
            <div class="qr-image-container">
              <img class="qr-image" src="${pendingOrder.paymentInfo.qrCodeUrl}" alt="QR Code" />
            </div>
          ` : nothing}
          <div class="qr-bank-info">
            <div class="qr-bank-row">
              <span class="qr-bank-label">Ngân hàng</span>
              <span class="qr-bank-value">${pendingOrder.paymentInfo.bankName}</span>
            </div>
            <div class="qr-bank-row">
              <span class="qr-bank-label">Số tài khoản</span>
              <span class="qr-bank-value">${pendingOrder.paymentInfo.accountNumber}</span>
            </div>
            <div class="qr-bank-row">
              <span class="qr-bank-label">Tên tài khoản</span>
              <span class="qr-bank-value">${pendingOrder.paymentInfo.accountName}</span>
            </div>
            <div class="qr-bank-row">
              <span class="qr-bank-label">Số tiền</span>
              <span class="qr-bank-value highlight">${formatVND(pendingOrder.amount)}</span>
            </div>
            <div class="qr-bank-row">
              <span class="qr-bank-label">Nội dung CK</span>
              <span class="qr-bank-value highlight">${pendingOrder.paymentInfo.transferContent}</span>
            </div>
          </div>
          <div class="qr-note">
            Chuyển khoản ĐÚNG số tiền và nội dung. Token sẽ được cộng tự động trong 1-5 phút sau khi thanh toán thành công.
          </div>
        ` : html`
          <div class="history-empty">Không có thông tin thanh toán</div>
        `}
        <button class="qr-check-btn" ?disabled=${checkingTransaction} @click=${() => props.onCheckTransaction?.()}>
          ${checkingTransaction ? "Đang kiểm tra..." : "Kiểm tra kết quả giao dịch"}
        </button>
        <button class="qr-cancel-btn" @click=${() => props.onCancelPending?.()}>
          Hủy đơn nạp
        </button>
      </div>
    </operis-modal>
  `;
}
