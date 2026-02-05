import { html, nothing } from "lit";
import { icons } from "../icons";
import type { DailyUsage, TypeUsage, UsageStats } from "../analytics-api";

export interface AnalyticsProps {
  loading?: boolean;
  error?: string | null;
  // Token balance
  tokenBalance?: number;
  // Usage stats
  stats?: UsageStats | null;
  // Daily usage data
  dailyUsage?: DailyUsage[];
  // Type breakdown (chat, cronjob, api)
  typeUsage?: TypeUsage[];
  // Period selection
  selectedPeriod?: "7d" | "30d" | "90d";
  onPeriodChange?: (period: "7d" | "30d" | "90d") => void;
  // Refresh
  onRefresh?: () => void;
}

function formatNumber(num: number): string {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
  if (num >= 1000) return (num / 1000).toFixed(1) + "K";
  return num.toLocaleString();
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" });
}

// Type labels in Vietnamese
const TYPE_LABELS: Record<string, string> = {
  chat: "Chat",
  cronjob: "Workflow",
  api: "API",
};

// Simple bar chart using CSS
function renderBarChart(data: DailyUsage[], maxTokens: number) {
  if (!data || data.length === 0) {
    return html`<div class="chart-empty">Chưa có dữ liệu</div>`;
  }

  const barWidth = Math.max(20, Math.floor(100 / data.length) - 1);

  return html`
    <div class="bar-chart">
      <div class="bar-chart-bars">
        ${data.map(
          (day) => html`
            <div class="bar-wrapper" style="width: ${barWidth}%">
              <div
                class="bar"
                style="height: ${maxTokens > 0 ? (day.tokensUsed / maxTokens) * 100 : 0}%"
                title="${formatNumber(day.tokensUsed)} tokens vào ${formatDate(day.date)}"
              ></div>
              <span class="bar-label">${formatDate(day.date)}</span>
            </div>
          `,
        )}
      </div>
    </div>
  `;
}

// Type breakdown (chat, cronjob, api)
function renderTypeBreakdown(types: TypeUsage[]) {
  if (!types || types.length === 0) {
    return html`<div class="chart-empty">Chưa có dữ liệu</div>`;
  }

  const colors: Record<string, string> = {
    chat: "#3b82f6",
    cronjob: "#10b981",
    api: "#f59e0b",
  };

  return html`
    <div class="type-breakdown">
      ${types.map(
        (t) => html`
          <div class="type-item">
            <div class="type-info">
              <div class="type-color" style="background: ${colors[t.type] || "#8b5cf6"}"></div>
              <span class="type-name">${TYPE_LABELS[t.type] || t.type}</span>
            </div>
            <div class="type-stats">
              <span class="type-tokens">${formatNumber(t.tokensUsed)} tokens</span>
              <span class="type-percent">${t.percentage.toFixed(1)}%</span>
            </div>
            <div class="type-bar-track">
              <div
                class="type-bar-fill"
                style="width: ${t.percentage}%; background: ${colors[t.type] || "#8b5cf6"}"
              ></div>
            </div>
          </div>
        `,
      )}
    </div>
  `;
}

export function renderAnalytics(props: AnalyticsProps) {
  const loading = props.loading ?? false;
  const error = props.error ?? null;
  const tokenBalance = props.tokenBalance ?? 0;
  const stats = props.stats ?? null;
  const dailyUsage = props.dailyUsage ?? [];
  const typeUsage = props.typeUsage ?? [];
  const selectedPeriod = props.selectedPeriod ?? "30d";

  const maxTokens = Math.max(...dailyUsage.map((d) => d.tokensUsed), 1);

  return html`
    <style>
      .analytics-layout {
        display: flex;
        flex-direction: column;
        gap: 24px;
      }
      .analytics-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        flex-wrap: wrap;
        gap: 16px;
      }
      .period-selector {
        display: flex;
        gap: 8px;
      }
      .period-btn {
        padding: 8px 16px;
        font-size: 13px;
        font-weight: 500;
        background: var(--secondary);
        border: 1px solid var(--border);
        border-radius: var(--radius-md);
        color: var(--text);
        cursor: pointer;
        transition: all 0.15s ease;
      }
      .period-btn:hover {
        background: var(--bg-hover);
        border-color: var(--border-strong);
      }
      .period-btn.active {
        background: var(--accent);
        border-color: var(--accent);
        color: var(--accent-foreground);
      }
      .refresh-btn {
        display: flex;
        align-items: center;
        gap: 6px;
        padding: 8px 16px;
        font-size: 13px;
        font-weight: 500;
        background: var(--secondary);
        border: 1px solid var(--border);
        border-radius: var(--radius-md);
        color: var(--text);
        cursor: pointer;
        transition: all 0.15s ease;
      }
      .refresh-btn:hover {
        background: var(--bg-hover);
        border-color: var(--border-strong);
      }
      .refresh-btn svg {
        width: 14px;
        height: 14px;
        stroke: currentColor;
        fill: none;
        stroke-width: 2;
      }
      .stats-grid {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 16px;
      }
      @media (max-width: 900px) {
        .stats-grid {
          grid-template-columns: repeat(2, 1fr);
        }
      }
      @media (max-width: 500px) {
        .stats-grid {
          grid-template-columns: 1fr;
        }
      }
      .stat-card {
        background: var(--card);
        border: 1px solid var(--border);
        border-radius: var(--radius-lg);
        padding: 20px;
      }
      .stat-label {
        font-size: 13px;
        color: var(--muted);
        margin-bottom: 8px;
        display: flex;
        align-items: center;
        gap: 8px;
      }
      .stat-label svg {
        width: 16px;
        height: 16px;
        stroke: currentColor;
        fill: none;
        stroke-width: 2;
      }
      .stat-value {
        font-size: 28px;
        font-weight: 700;
        color: var(--text-strong);
      }
      .stat-value.balance {
        color: var(--accent);
      }
      .stat-sub {
        font-size: 12px;
        color: var(--muted);
        margin-top: 4px;
      }
      .a-card {
        background: var(--card);
        border: 1px solid var(--border);
        border-radius: var(--radius-lg);
        overflow: hidden;
      }
      .a-card-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 16px 20px;
        border-bottom: 1px solid var(--border);
      }
      .a-card-title {
        font-size: 16px;
        font-weight: 600;
        color: var(--text-strong);
      }
      .a-card-body {
        padding: 20px;
      }
      .bar-chart {
        height: 200px;
        display: flex;
        flex-direction: column;
      }
      .bar-chart-bars {
        flex: 1;
        display: flex;
        align-items: flex-end;
        gap: 2px;
        padding-bottom: 24px;
      }
      .bar-wrapper {
        display: flex;
        flex-direction: column;
        align-items: center;
        height: 100%;
        justify-content: flex-end;
      }
      .bar {
        width: 100%;
        max-width: 40px;
        background: var(--accent);
        border-radius: 4px 4px 0 0;
        min-height: 4px;
        transition: height 0.3s ease;
      }
      .bar:hover {
        background: var(--accent-hover);
      }
      .bar-label {
        font-size: 10px;
        color: var(--muted);
        margin-top: 8px;
        white-space: nowrap;
        transform: rotate(-45deg);
        transform-origin: center;
      }
      .chart-empty {
        height: 200px;
        display: flex;
        align-items: center;
        justify-content: center;
        color: var(--muted);
        font-size: 14px;
      }
      .type-breakdown {
        display: flex;
        flex-direction: column;
        gap: 16px;
      }
      .type-item {
        display: flex;
        flex-direction: column;
        gap: 8px;
      }
      .type-info {
        display: flex;
        align-items: center;
        gap: 8px;
      }
      .type-color {
        width: 12px;
        height: 12px;
        border-radius: 3px;
      }
      .type-name {
        font-size: 14px;
        font-weight: 500;
        color: var(--text);
      }
      .type-stats {
        display: flex;
        justify-content: space-between;
        align-items: center;
      }
      .type-tokens {
        font-size: 13px;
        color: var(--muted);
      }
      .type-percent {
        font-size: 14px;
        font-weight: 600;
        color: var(--text-strong);
      }
      .type-bar-track {
        height: 8px;
        background: var(--secondary);
        border-radius: 4px;
        overflow: hidden;
      }
      .type-bar-fill {
        height: 100%;
        border-radius: 4px;
        transition: width 0.3s ease;
      }
      .charts-row {
        display: grid;
        grid-template-columns: 2fr 1fr;
        gap: 24px;
      }
      @media (max-width: 900px) {
        .charts-row {
          grid-template-columns: 1fr;
        }
      }
      .error-message {
        padding: 16px;
        background: var(--danger-subtle);
        color: var(--danger);
        border-radius: var(--radius-md);
        font-size: 14px;
        display: flex;
        align-items: center;
        gap: 8px;
      }
      .error-message svg {
        width: 20px;
        height: 20px;
        stroke: currentColor;
        fill: none;
        stroke-width: 2;
        flex-shrink: 0;
      }
    </style>

    <div class="analytics-layout">
      ${error
        ? html`
            <div class="error-message">${icons.alertCircle} ${error}</div>
          `
        : nothing}

      <div class="analytics-header">
        <div class="period-selector">
          <button
            class="period-btn ${selectedPeriod === "7d" ? "active" : ""}"
            @click=${() => props.onPeriodChange?.("7d")}
          >
            7 ngày
          </button>
          <button
            class="period-btn ${selectedPeriod === "30d" ? "active" : ""}"
            @click=${() => props.onPeriodChange?.("30d")}
          >
            30 ngày
          </button>
          <button
            class="period-btn ${selectedPeriod === "90d" ? "active" : ""}"
            @click=${() => props.onPeriodChange?.("90d")}
          >
            90 ngày
          </button>
        </div>
        <button class="refresh-btn" @click=${() => props.onRefresh?.()}>
          ${icons.refresh} Làm mới
        </button>
      </div>

      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-label">${icons.creditCard} Số dư</div>
          <div class="stat-value balance">${formatNumber(tokenBalance)}</div>
          <div class="stat-sub">tokens còn lại</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">${icons.zap} Tokens đã dùng</div>
          <div class="stat-value">${formatNumber(stats?.totalTokens ?? 0)}</div>
          <div class="stat-sub">trong kỳ</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">${icons.messageSquare} Yêu cầu</div>
          <div class="stat-value">${formatNumber(stats?.totalRequests ?? 0)}</div>
          <div class="stat-sub">lượt gọi API</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">${icons.arrowUp} Input</div>
          <div class="stat-value">${formatNumber(stats?.inputTokens ?? 0)}</div>
          <div class="stat-sub">output: ${formatNumber(stats?.outputTokens ?? 0)}</div>
        </div>
      </div>

      <div class="charts-row">
        <div class="a-card">
          <div class="a-card-header">
            <span class="a-card-title">Sử dụng theo ngày</span>
          </div>
          <div class="a-card-body">${renderBarChart(dailyUsage, maxTokens)}</div>
        </div>

        <div class="a-card">
          <div class="a-card-header">
            <span class="a-card-title">Theo loại</span>
          </div>
          <div class="a-card-body">${renderTypeBreakdown(typeUsage)}</div>
        </div>
      </div>
    </div>
  `;
}
