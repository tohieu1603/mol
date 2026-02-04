import { html, nothing } from "lit";
import { icons } from "../icons";
<<<<<<< HEAD
import type {
  Workflow,
  WorkflowFormState,
  ScheduleKind,
  EveryUnit,
  SessionTarget,
  WakeMode,
  PayloadKind,
  DeliveryMode,
} from "../workflow-types";
import { formatSchedule } from "../workflow-types";
import { t } from "../i18n";
import type { WorkflowRun, WorkflowStatus } from "../workflow-api";

export interface WorkflowProps {
  workflows: Workflow[];
  loading: boolean;
  error: string | null;
  form: WorkflowFormState;
  saving: boolean;
  expandedWorkflowId?: string | null;
  runningWorkflowIds?: Set<string>;
  // Scheduler status
  status?: WorkflowStatus | null;
  // Run history
  runsWorkflowId?: string | null;
  runs?: WorkflowRun[];
  runsLoading?: boolean;
  // Handlers
  onRefresh: () => void;
=======
import type { Workflow, WorkflowFormState, ScheduleKind, EveryUnit, SessionTarget, WakeMode, PayloadKind } from "../workflow-types";
import { formatSchedule } from "../workflow-types";
import { t, type Language } from "../i18n";
import type { SelectOption } from "../components/operis-select";

export interface WorkflowProps {
  lang: Language;
  workflows: Workflow[];
  loading: boolean;
  error: string | null;
  showForm: boolean;
  form: WorkflowFormState;
  saving: boolean;
  onRefresh: () => void;
  onShowForm: () => void;
  onHideForm: () => void;
>>>>>>> origin/main
  onFormChange: (patch: Partial<WorkflowFormState>) => void;
  onSubmit: () => void;
  onToggle: (workflow: Workflow) => void;
  onRun: (workflow: Workflow) => void;
  onDelete: (workflow: Workflow) => void;
<<<<<<< HEAD
  onToggleDetails?: (workflowId: string) => void;
  onLoadRuns?: (workflowId: string | null) => void;
}

// Format timestamp
function formatMs(ts: number): string {
  return new Date(ts).toLocaleString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatRelativeTime(timestamp: number | undefined): string {
  if (!timestamp) return t("wfNever");
  const diffMs = Date.now() - timestamp;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  if (diffMins < 1) return t("wfJustNow");
  if (diffMins < 60) return `${diffMins} phút trước`;
  if (diffHours < 24) return `${diffHours} giờ trước`;
  return `${diffDays} ngày trước`;
}

function formatRelativeTimeFromNow(timestamp: number | undefined): string {
  if (!timestamp) return "—";
  const diffMs = timestamp - Date.now();
  if (diffMs < 0) return t("wfJustNow");
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  if (diffMins < 1) return "< 1 phút";
  if (diffMins < 60) return `${diffMins} phút`;
  if (diffHours < 24) return `${diffHours} giờ`;
  return `${diffDays} ngày`;
}

function formatLastRun(workflow: Workflow): { time: string; status: string } {
  if (!workflow.lastRunAt) return { time: t("wfNever"), status: "never" };
  return {
    time: formatRelativeTime(workflow.lastRunAt),
    status: workflow.lastRunStatus ?? "never",
  };
}

// Format next wake time
function formatNextWake(ms: number | null | undefined): string {
  if (!ms) return "—";
  const diff = ms - Date.now();
  if (diff < 0) return "Ngay bây giờ";
  if (diff < 60000) return "< 1 phút";
  if (diff < 3600000) return `${Math.floor(diff / 60000)} phút`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)} giờ`;
  return `${Math.floor(diff / 86400000)} ngày`;
}

// Select options
const SCHEDULE_OPTIONS = [
  { value: "every", label: "Định kỳ", description: "Lặp lại theo chu kỳ" },
  { value: "at", label: "Một lần", description: "Chạy vào thời điểm cụ thể" },
  { value: "cron", label: "Cron", description: "Biểu thức cron nâng cao" },
];
const EVERY_UNIT_OPTIONS = [
  { value: "minutes", label: "Phút" },
  { value: "hours", label: "Giờ" },
  { value: "days", label: "Ngày" },
];
const SESSION_OPTIONS = [
  { value: "isolated", label: "Riêng biệt", description: "Phiên tách biệt" },
  { value: "main", label: "Phiên chính", description: "Dùng phiên hiện tại" },
];
const WAKE_MODE_OPTIONS = [
  { value: "now", label: "Ngay lập tức", description: "Đánh thức ngay" },
  {
    value: "next-heartbeat",
    label: "Heartbeat tiếp",
    description: "Chờ heartbeat",
  },
];
const PAYLOAD_OPTIONS = [
  { value: "agentTurn", label: "Gửi tin nhắn", description: "Tin nhắn cho AI" },
  {
    value: "systemEvent",
    label: "Sự kiện hệ thống",
    description: "Event nội bộ",
  },
];
const DELIVERY_MODE_OPTIONS = [
  {
    value: "announce",
    label: "Announce summary",
    description: "Gửi kết quả tóm tắt",
  },
  { value: "none", label: "None (internal)", description: "Không thông báo" },
];
const CHANNEL_OPTIONS = [
  { value: "last", label: "last", description: "Kênh cuối cùng tương tác" },
];

// Scheduler status card (left side) - Clean moltbot-style
function renderStatusCard(props: WorkflowProps) {
  const { status, loading, error, onRefresh, workflows } = props;
  const enabledCount = workflows.filter((w) => w.enabled).length;
  const totalCount = workflows.length;

  return html`
    <div class="wf-card-panel">
      <div class="wf-card-title">Scheduler</div>
      <div class="wf-card-sub">Bộ lập lịch tự động của gateway.</div>
      <div class="wf-stat-grid">
        <div class="wf-stat">
          <div class="wf-stat-label">Trạng thái</div>
          <div class="wf-stat-value ${status?.enabled ? "wf-stat-ok" : ""}">
            ${status ? (status.enabled ? "Bật" : "Tắt") : "n/a"}
          </div>
        </div>
        <div class="wf-stat">
          <div class="wf-stat-label">Workflow</div>
          <div class="wf-stat-value">${totalCount}</div>
        </div>
        <div class="wf-stat">
          <div class="wf-stat-label">Đang bật</div>
          <div class="wf-stat-value">${enabledCount}</div>
        </div>
        <div class="wf-stat">
          <div class="wf-stat-label">Chạy tiếp</div>
          <div class="wf-stat-value">
            ${formatNextWake(status?.nextWakeAtMs)}
          </div>
        </div>
      </div>
      <div class="wf-row">
        <button class="wf-btn" ?disabled=${loading} @click=${onRefresh}>
          ${loading ? "Đang tải…" : "Làm mới"}
        </button>
        ${error ? html`<span class="wf-muted">${error}</span>` : nothing}
      </div>
    </div>
  `;
}

// Schedule fields based on kind
function renderScheduleFields(props: WorkflowProps) {
  const { form, onFormChange } = props;
  if (form.scheduleKind === "at") {
    return html`
      <label class="wf-field" style="margin-top: 12px;">
        <span>Thời gian chạy</span>
        <input
          type="datetime-local"
          .value=${form.atDatetime}
          @input=${(e: Event) =>
            onFormChange({ atDatetime: (e.target as HTMLInputElement).value })}
        />
      </label>
    `;
  }
  if (form.scheduleKind === "every") {
    return html`
      <div class="wf-form-grid" style="margin-top: 12px;">
        <label class="wf-field">
          <span>Mỗi</span>
          <input
            type="number"
            min="1"
            .value=${String(form.everyAmount)}
            @input=${(e: Event) =>
              onFormChange({
                everyAmount:
                  parseInt((e.target as HTMLInputElement).value, 10) || 1,
              })}
          />
        </label>
        <label class="wf-field">
          <span>Đơn vị</span>
          <operis-select
            .value=${form.everyUnit}
            .options=${EVERY_UNIT_OPTIONS}
            @change=${(e: CustomEvent) =>
              onFormChange({ everyUnit: e.detail.value as EveryUnit })}
          ></operis-select>
        </label>
      </div>
    `;
  }
  return html`
    <div class="wf-form-grid" style="margin-top: 12px;">
      <label class="wf-field">
        <span>Biểu thức</span>
        <input
          .value=${form.cronExpr}
          placeholder="0 9 * * *"
          @input=${(e: Event) =>
            onFormChange({ cronExpr: (e.target as HTMLInputElement).value })}
        />
      </label>
      <label class="wf-field">
        <span>Múi giờ</span>
        <input
          .value=${form.cronTz}
          placeholder="UTC"
          @input=${(e: Event) =>
            onFormChange({ cronTz: (e.target as HTMLInputElement).value })}
        />
      </label>
    </div>
  `;
}

// New workflow form card (right side) - Clean moltbot-style
function renderFormCard(props: WorkflowProps) {
  const { form, saving, onFormChange, onSubmit } = props;
  const isValid =
    form.name.trim() &&
    form.prompt.trim() &&
    (form.scheduleKind !== "at" || form.atDatetime) &&
    (form.scheduleKind !== "cron" || form.cronExpr.trim()) &&
    (form.scheduleKind !== "every" || form.everyAmount >= 1);

  return html`
    <div class="wf-card-panel">
      <div class="wf-card-title">Tạo Workflow</div>
      <div class="wf-card-sub">Tạo công việc tự động theo lịch.</div>

      <!-- Basic Info -->
      <div class="wf-form-grid">
        <label class="wf-field">
          <span>Tên</span>
          <input
            .value=${form.name}
            placeholder="VD: Báo cáo buổi sáng"
            @input=${(e: Event) =>
              onFormChange({ name: (e.target as HTMLInputElement).value })}
          />
        </label>
        <label class="wf-field">
          <span>Mô tả</span>
          <input
            .value=${form.description}
            placeholder="Mô tả ngắn (tuỳ chọn)"
            @input=${(e: Event) =>
              onFormChange({
                description: (e.target as HTMLInputElement).value,
              })}
          />
        </label>
      </div>

      <!-- Schedule -->
      <div class="wf-form-grid" style="margin-top: 12px;">
        <label class="wf-field">
          <span>Lịch chạy</span>
          <operis-select
            .value=${form.scheduleKind}
            .options=${SCHEDULE_OPTIONS}
            @change=${(e: CustomEvent) =>
              onFormChange({ scheduleKind: e.detail.value as ScheduleKind })}
          ></operis-select>
        </label>
        ${form.scheduleKind === "at"
          ? html`
              <label class="wf-field">
                <span>Thời gian</span>
                <input
                  type="datetime-local"
                  .value=${form.atDatetime}
                  @input=${(e: Event) =>
                    onFormChange({
                      atDatetime: (e.target as HTMLInputElement).value,
                    })}
                />
              </label>
            `
          : form.scheduleKind === "every"
            ? html`
                <label class="wf-field">
                  <span>Mỗi</span>
                  <input
                    type="number"
                    min="1"
                    .value=${String(form.everyAmount)}
                    @input=${(e: Event) =>
                      onFormChange({
                        everyAmount:
                          parseInt((e.target as HTMLInputElement).value, 10) ||
                          1,
                      })}
                  />
                </label>
                <label class="wf-field">
                  <span>Đơn vị</span>
                  <operis-select
                    .value=${form.everyUnit}
                    .options=${EVERY_UNIT_OPTIONS}
                    @change=${(e: CustomEvent) =>
                      onFormChange({ everyUnit: e.detail.value as EveryUnit })}
                  ></operis-select>
                </label>
              `
            : html`
                <label class="wf-field">
                  <span>Biểu thức</span>
                  <input
                    .value=${form.cronExpr}
                    placeholder="0 9 * * *"
                    @input=${(e: Event) =>
                      onFormChange({
                        cronExpr: (e.target as HTMLInputElement).value,
                      })}
                  />
                </label>
                <label class="wf-field">
                  <span>Múi giờ</span>
                  <input
                    .value=${form.cronTz}
                    placeholder="UTC"
                    @input=${(e: Event) =>
                      onFormChange({
                        cronTz: (e.target as HTMLInputElement).value,
                      })}
                  />
                </label>
              `}
      </div>

      <!-- Execution -->
      <div class="wf-form-grid" style="margin-top: 12px;">
        <label class="wf-field">
          <span>Phiên</span>
          <operis-select
            .value=${form.sessionTarget}
            .options=${SESSION_OPTIONS}
            @change=${(e: CustomEvent) =>
              onFormChange({ sessionTarget: e.detail.value as SessionTarget })}
          ></operis-select>
        </label>
        <label class="wf-field">
          <span>Đánh thức</span>
          <operis-select
            .value=${form.wakeMode}
            .options=${WAKE_MODE_OPTIONS}
            @change=${(e: CustomEvent) =>
              onFormChange({ wakeMode: e.detail.value as WakeMode })}
          ></operis-select>
        </label>
        <label class="wf-field">
          <span>Loại payload</span>
          <operis-select
            .value=${form.payloadKind}
            .options=${PAYLOAD_OPTIONS}
            @change=${(e: CustomEvent) =>
              onFormChange({ payloadKind: e.detail.value as PayloadKind })}
          ></operis-select>
        </label>
        <label class="wf-field wf-field-checkbox">
          <span>Bật</span>
          <input
            type="checkbox"
            .checked=${form.enabled}
            @change=${(e: Event) =>
              onFormChange({ enabled: (e.target as HTMLInputElement).checked })}
          />
        </label>
      </div>

      <!-- Delivery (for agentTurn) -->
      ${form.payloadKind === "agentTurn"
        ? html`
            <div class="wf-form-grid" style="margin-top: 12px;">
              <label class="wf-field">
                <span>Delivery</span>
                <operis-select
                  .value=${form.deliveryMode}
                  .options=${DELIVERY_MODE_OPTIONS}
                  @change=${(e: CustomEvent) =>
                    onFormChange({
                      deliveryMode: e.detail.value as DeliveryMode,
                    })}
                ></operis-select>
              </label>
              <label class="wf-field">
                <span>Timeout (giây)</span>
                <input
                  type="number"
                  min="0"
                  .value=${String(form.timeout)}
                  @input=${(e: Event) =>
                    onFormChange({
                      timeout:
                        parseInt((e.target as HTMLInputElement).value, 10) || 0,
                    })}
                />
              </label>
              ${form.deliveryMode === "announce"
                ? html`
                    <label class="wf-field">
                      <span>Channel</span>
                      <operis-select
                        .value=${form.deliveryChannel || "last"}
                        .options=${CHANNEL_OPTIONS}
                        @change=${(e: CustomEvent) =>
                          onFormChange({ deliveryChannel: e.detail.value })}
                      ></operis-select>
                    </label>
                    <label class="wf-field">
                      <span>To</span>
                      <input
                        .value=${form.deliveryTo}
                        placeholder="+1555… hoặc chat id"
                        @input=${(e: Event) =>
                          onFormChange({
                            deliveryTo: (e.target as HTMLInputElement).value,
                          })}
                      />
                    </label>
                  `
                : nothing}
            </div>
          `
        : nothing}

      <!-- Task/Message -->
      <label class="wf-field" style="margin-top: 12px;">
        <span
          >${form.payloadKind === "systemEvent"
            ? "System text"
            : "Tin nhắn cho AI"}</span
        >
        <textarea
          .value=${form.prompt}
          rows="4"
          placeholder="VD: Kiểm tra email mới và tóm tắt những email quan trọng"
          @input=${(e: Event) =>
            onFormChange({ prompt: (e.target as HTMLTextAreaElement).value })}
        ></textarea>
      </label>

      <!-- Submit -->
      <div class="wf-row" style="margin-top: 14px;">
        <button
          class="wf-btn wf-btn-primary"
          ?disabled=${saving || !isValid}
          @click=${onSubmit}
        >
          ${saving ? "Đang tạo…" : "Tạo workflow"}
=======
}

function getEveryUnits(lang: Language): { value: EveryUnit; label: string }[] {
  return [
    { value: "minutes", label: lang === "vi" ? "Phút" : "Minutes" },
    { value: "hours", label: lang === "vi" ? "Giờ" : "Hours" },
    { value: "days", label: lang === "vi" ? "Ngày" : "Days" },
  ];
}

function getScheduleKinds(lang: Language): { value: ScheduleKind; label: string; desc: string }[] {
  return [
    { value: "every", label: t(lang, "wfRecurring"), desc: lang === "vi" ? "Lặp lại theo khoảng thời gian" : "Repeat at regular intervals" },
    { value: "at", label: t(lang, "wfOneTime"), desc: lang === "vi" ? "Chạy một lần vào thời điểm cụ thể" : "Run once at specific date/time" },
    { value: "cron", label: t(lang, "wfCron"), desc: lang === "vi" ? "Lịch nâng cao với biểu thức cron" : "Advanced schedule with cron expression" },
  ];
}

function getSessionTargets(lang: Language): { value: SessionTarget; label: string; desc: string }[] {
  return [
    { value: "main", label: t(lang, "wfSessionMain"), desc: lang === "vi" ? "Chạy trong phiên agent chính" : "Run in the main agent session" },
    { value: "isolated", label: t(lang, "wfSessionIsolated"), desc: lang === "vi" ? "Chạy trong phiên riêng biệt" : "Run in a separate isolated session" },
  ];
}

function getWakeModes(lang: Language): { value: WakeMode; label: string; desc: string }[] {
  return [
    { value: "now", label: t(lang, "wfWakeNow"), desc: lang === "vi" ? "Đánh thức agent ngay lập tức" : "Wake agent right away" },
    { value: "next-heartbeat", label: t(lang, "wfWakeHeartbeat"), desc: lang === "vi" ? "Đợi đến heartbeat tiếp theo" : "Wait for next scheduled heartbeat" },
  ];
}

function getPayloadKinds(lang: Language): { value: PayloadKind; label: string; desc: string }[] {
  return [
    { value: "agentTurn", label: t(lang, "wfTypeAgent"), desc: lang === "vi" ? "Gửi tin nhắn đến agent" : "Send a message to the agent" },
    { value: "systemEvent", label: t(lang, "wfTypeEvent"), desc: lang === "vi" ? "Kích hoạt sự kiện hệ thống" : "Trigger a system event" },
  ];
}

function formatLastRun(workflow: Workflow, lang: Language): { time: string; status: "success" | "error" | "running" | "never" } {
  if (!workflow.lastRunAt) return { time: t(lang, "wfNever"), status: "never" };
  const date = new Date(workflow.lastRunAt);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  let time: string;
  if (diffMins < 1) time = t(lang, "wfJustNow");
  else if (diffMins < 60) time = lang === "vi" ? `${diffMins} phút trước` : `${diffMins}m ago`;
  else if (diffHours < 24) time = lang === "vi" ? `${diffHours} giờ trước` : `${diffHours}h ago`;
  else time = lang === "vi" ? `${diffDays} ngày trước` : `${diffDays}d ago`;

  return { time, status: workflow.lastRunStatus ?? "never" };
}

function renderForm(props: WorkflowProps) {
  const { lang, form, saving, onFormChange, onSubmit, onHideForm } = props;

  const isValid = form.name.trim() && form.prompt.trim() &&
    (form.scheduleKind !== "at" || form.atDatetime) &&
    (form.scheduleKind !== "cron" || form.cronExpr.trim());

  const SCHEDULE_KINDS = getScheduleKinds(lang);
  const EVERY_UNITS = getEveryUnits(lang);
  const SESSION_TARGETS = getSessionTargets(lang);
  const WAKE_MODES = getWakeModes(lang);
  const PAYLOAD_KINDS = getPayloadKinds(lang);

  const txt = {
    formTitle: t(lang, "wfFormTitle"),
    name: t(lang, "wfName"),
    namePlaceholder: t(lang, "wfNamePlaceholder"),
    description: t(lang, "wfDescription"),
    descPlaceholder: t(lang, "wfDescPlaceholder"),
    status: t(lang, "wfStatus"),
    active: t(lang, "wfActive"),
    paused: t(lang, "wfPaused"),
    schedule: t(lang, "wfSchedule"),
    runEvery: t(lang, "wfRunEvery"),
    runAt: t(lang, "wfRunAt"),
    expression: t(lang, "wfExpression"),
    timezone: t(lang, "wfTimezone"),
    execution: t(lang, "wfExecution"),
    session: t(lang, "wfSession"),
    wake: t(lang, "wfWake"),
    type: t(lang, "wfType"),
    timeout: t(lang, "wfTimeout"),
    timeoutSuffix: t(lang, "wfTimeoutSuffix"),
    postPrefix: t(lang, "wfPostPrefix"),
    message: t(lang, "wfMessage"),
    event: t(lang, "wfEvent"),
    messagePlaceholder: t(lang, "wfMessagePlaceholder"),
    eventPlaceholder: t(lang, "wfEventPlaceholder"),
    deliver: t(lang, "wfDeliver"),
    cancel: t(lang, "wfCancel"),
    creating: t(lang, "wfCreating"),
    createWorkflow: lang === "vi" ? "Tạo Workflow" : "Create Workflow",
    required: t(lang, "required"),
  };

  return html`
    <div class="wf-form-panel">
      <!-- Header -->
      <div class="wf-form-top">
        <h3 class="wf-form-heading">${txt.formTitle}</h3>
        <button type="button" class="wf-close-btn" @click=${onHideForm} title="${t(lang, "close")}">
          ${icons.x}
        </button>
      </div>

      <!-- Form Content -->
      <div class="wf-form-content">
        <!-- Basic Info -->
        <div class="wf-form-section">
          <div class="wf-form-row">
            <div class="wf-field wf-field-grow">
              <label class="wf-label">${txt.name} <span class="wf-req">${txt.required}</span></label>
              <operis-input
                type="text"
                placeholder="${txt.namePlaceholder}"
                .value=${form.name}
                @input=${(e: CustomEvent) => onFormChange({ name: e.detail.value })}
              ></operis-input>
            </div>
            <div class="wf-field">
              <label class="wf-label">${txt.status}</label>
              <label class="wf-switch">
                <input type="checkbox" .checked=${form.enabled}
                  @change=${(e: Event) => onFormChange({ enabled: (e.target as HTMLInputElement).checked })} />
                <span class="wf-switch-slider"></span>
                <span class="wf-switch-text">${form.enabled ? txt.active : txt.paused}</span>
              </label>
            </div>
          </div>
          <div class="wf-field">
            <label class="wf-label">${txt.description}</label>
            <operis-input
              type="text"
              placeholder="${txt.descPlaceholder}"
              .value=${form.description}
              @input=${(e: CustomEvent) => onFormChange({ description: e.detail.value })}
            ></operis-input>
          </div>
        </div>

        <!-- Schedule -->
        <div class="wf-form-section">
          <div class="wf-section-label">${txt.schedule}</div>
          <div class="wf-tabs">
            ${SCHEDULE_KINDS.map(k => html`
              <button type="button" class="wf-tab ${form.scheduleKind === k.value ? 'wf-tab-active' : ''}"
                @click=${() => onFormChange({ scheduleKind: k.value })}>
                ${k.label}
              </button>
            `)}
          </div>
          <div class="wf-schedule-fields">
            ${form.scheduleKind === "every" ? html`
              <div class="wf-inline-group">
                <span class="wf-inline-label">${txt.runEvery}</span>
                <operis-input
                  type="number"
                  size="sm"
                  .min=${1}
                  .max=${999}
                  .step=${1}
                  .value=${String(form.everyAmount)}
                  @input=${(e: CustomEvent) => onFormChange({ everyAmount: parseInt(e.detail.value, 10) || 1 })}
                  style="width: 80px;"
                ></operis-input>
                <operis-select
                  size="sm"
                  .value=${form.everyUnit}
                  .options=${EVERY_UNITS.map(u => ({ value: u.value, label: u.label.toLowerCase() })) as SelectOption[]}
                  @change=${(e: CustomEvent) => onFormChange({ everyUnit: e.detail.value as EveryUnit })}
                  style="width: 120px;"
                ></operis-select>
              </div>
            ` : nothing}
            ${form.scheduleKind === "at" ? html`
              <div class="wf-field">
                <label class="wf-label">${txt.runAt}</label>
                <operis-input
                  type="datetime-local"
                  .value=${form.atDatetime}
                  @input=${(e: CustomEvent) => onFormChange({ atDatetime: e.detail.value })}
                ></operis-input>
              </div>
            ` : nothing}
            ${form.scheduleKind === "cron" ? html`
              <div class="wf-form-row">
                <div class="wf-field wf-field-grow">
                  <label class="wf-label">${txt.expression}</label>
                  <operis-input
                    type="text"
                    mono
                    placeholder="0 9 * * *"
                    .value=${form.cronExpr}
                    @input=${(e: CustomEvent) => onFormChange({ cronExpr: e.detail.value })}
                  ></operis-input>
                </div>
                <div class="wf-field">
                  <label class="wf-label">${txt.timezone}</label>
                  <operis-input
                    type="text"
                    placeholder="UTC"
                    .value=${form.cronTz}
                    @input=${(e: CustomEvent) => onFormChange({ cronTz: e.detail.value })}
                  ></operis-input>
                </div>
              </div>
            ` : nothing}
          </div>
        </div>

        <!-- Execution -->
        <div class="wf-form-section">
          <div class="wf-section-label">${txt.execution}</div>
          <div class="wf-form-grid">
            <div class="wf-field">
              <label class="wf-label">${txt.session}</label>
              <operis-select
                .value=${form.sessionTarget}
                .options=${SESSION_TARGETS.map(st => ({ value: st.value, label: st.label, description: st.desc })) as SelectOption[]}
                @change=${(e: CustomEvent) => onFormChange({ sessionTarget: e.detail.value as SessionTarget })}
              ></operis-select>
            </div>
            <div class="wf-field">
              <label class="wf-label">${txt.wake}</label>
              <operis-select
                .value=${form.wakeMode}
                .options=${WAKE_MODES.map(m => ({ value: m.value, label: m.label, description: m.desc })) as SelectOption[]}
                @change=${(e: CustomEvent) => onFormChange({ wakeMode: e.detail.value as WakeMode })}
              ></operis-select>
            </div>
            <div class="wf-field">
              <label class="wf-label">${txt.type}</label>
              <operis-select
                .value=${form.payloadKind}
                .options=${PAYLOAD_KINDS.map(p => ({ value: p.value, label: p.label, description: p.desc })) as SelectOption[]}
                @change=${(e: CustomEvent) => onFormChange({ payloadKind: e.detail.value as PayloadKind })}
              ></operis-select>
            </div>
            <div class="wf-field">
              <label class="wf-label">${txt.timeout}</label>
              <operis-input
                type="number"
                .min=${0}
                .max=${3600}
                .step=${1}
                suffix="${txt.timeoutSuffix}"
                .value=${String(form.timeout)}
                @input=${(e: CustomEvent) => onFormChange({ timeout: parseInt(e.detail.value, 10) || 0 })}
              ></operis-input>
            </div>
          </div>
          ${form.sessionTarget === "isolated" ? html`
            <div class="wf-field" style="margin-top: 12px;">
              <label class="wf-label">${txt.postPrefix}</label>
              <operis-input
                type="text"
                placeholder="[Cron]"
                .value=${form.postToMainPrefix}
                @input=${(e: CustomEvent) => onFormChange({ postToMainPrefix: e.detail.value })}
              ></operis-input>
            </div>
          ` : nothing}
        </div>

        <!-- Task -->
        <div class="wf-form-section">
          <div class="wf-section-label">${form.payloadKind === "agentTurn" ? txt.message : txt.event}</div>
          <operis-input
            type="textarea"
            rows="3"
            placeholder=${form.payloadKind === "agentTurn" ? txt.messagePlaceholder : txt.eventPlaceholder}
            .value=${form.prompt}
            @input=${(e: CustomEvent) => onFormChange({ prompt: e.detail.value })}
          ></operis-input>
          ${form.payloadKind === "agentTurn" ? html`
            <label class="wf-check" style="margin-top: 8px;">
              <input type="checkbox" .checked=${form.notifyMe}
                @change=${(e: Event) => onFormChange({ notifyMe: (e.target as HTMLInputElement).checked })} />
              <span>${txt.deliver}</span>
            </label>
          ` : nothing}
        </div>
      </div>

      <!-- Footer -->
      <div class="wf-form-actions">
        <button type="button" class="wf-btn wf-btn-ghost" @click=${onHideForm} ?disabled=${saving}>${txt.cancel}</button>
        <button type="button" class="wf-btn wf-btn-primary" @click=${onSubmit} ?disabled=${saving || !isValid}>
          ${saving ? html`<span class="wf-spinner"></span> ${txt.creating}` : txt.createWorkflow}
>>>>>>> origin/main
        </button>
      </div>
    </div>
  `;
}

<<<<<<< HEAD
// Beautiful workflow card (original style)
function renderWorkflowCard(
  workflow: Workflow,
  props: WorkflowProps,
  isRunning: boolean,
) {
  const {
    onToggle,
    onRun,
    onDelete,
    onLoadRuns,
    onToggleDetails,
    expandedWorkflowId,
    runsWorkflowId,
    saving,
  } = props;
  const lastRun = formatLastRun(workflow);
  const isSelected = runsWorkflowId === workflow.id;
  const isExpanded = expandedWorkflowId === workflow.id;
  const statusClass = lastRun.status === "ok" ? "success" : lastRun.status;

  return html`
    <div
      class="wf-card ${workflow.enabled ? "" : "wf-card-paused"} ${isRunning
        ? "wf-card-running"
        : ""} ${isSelected ? "wf-card-selected" : ""} ${isExpanded
        ? "wf-card-expanded"
        : ""}"
    >
      <div class="wf-card-main">
        <div
          class="wf-card-icon ${isRunning
            ? "wf-card-icon-running"
            : workflow.enabled
              ? "wf-card-icon-active"
              : ""}"
        >
          ${icons.workflow}
        </div>
        <div class="wf-card-content">
          <div class="wf-card-header">
            <h4 class="wf-card-title">${workflow.name}</h4>
            ${isRunning
              ? html`
                  <span class="wf-status wf-status-running">
                    <span class="wf-status-dot wf-status-dot-pulse"></span>
                    ${t("wfRunning")}
                  </span>
                `
              : html`
                  <span
                    class="wf-status ${workflow.enabled
                      ? "wf-status-active"
                      : "wf-status-paused"}"
                  >
                    <span class="wf-status-dot"></span>
                    ${workflow.enabled ? t("wfActive") : t("wfPaused")}
                  </span>
                `}
          </div>
          ${workflow.description
            ? html`<p class="wf-card-desc">${workflow.description}</p>`
            : nothing}
=======
function renderWorkflowCard(workflow: Workflow, props: WorkflowProps) {
  const { lang, onToggle, onRun, onDelete } = props;
  const lastRun = formatLastRun(workflow, lang);

  const txt = {
    active: t(lang, "wfActive"),
    paused: t(lang, "wfPaused"),
    pause: t(lang, "wfPause"),
    start: t(lang, "wfStart"),
    run: t(lang, "wfRun"),
    delete: t(lang, "wfDelete"),
    last: t(lang, "wfLast"),
  };

  return html`
    <div class="wf-card ${workflow.enabled ? "" : "wf-card-paused"}">
      <div class="wf-card-main">
        <div class="wf-card-icon ${workflow.enabled ? "wf-card-icon-active" : ""}">${icons.workflow}</div>
        <div class="wf-card-content">
          <div class="wf-card-header">
            <h4 class="wf-card-title">${workflow.name}</h4>
            <span class="wf-status ${workflow.enabled ? "wf-status-active" : "wf-status-paused"}">
              <span class="wf-status-dot"></span>
              ${workflow.enabled ? txt.active : txt.paused}
            </span>
          </div>
          ${workflow.description ? html`<p class="wf-card-desc">${workflow.description}</p>` : nothing}
>>>>>>> origin/main
          <div class="wf-card-meta">
            <span class="wf-meta-item">
              <span class="wf-meta-icon">${icons.clock}</span>
              ${formatSchedule(workflow.schedule)}
            </span>
<<<<<<< HEAD
            <span class="wf-meta-item wf-meta-tag"
              >${workflow.sessionTarget === "main" ? "chính" : "riêng"}</span
            >
            <span class="wf-meta-item wf-meta-${statusClass}">
              <span class="wf-run-dot"></span>
              ${t("wfLast")}: ${lastRun.time}
            </span>
            ${workflow.nextRunAt
              ? html`
                  <span class="wf-meta-item wf-meta-next">
                    <span class="wf-meta-icon">${icons.arrowRight}</span>
                    ${t("wfNext")}:
                    ${formatRelativeTimeFromNow(workflow.nextRunAt)}
                  </span>
                `
              : nothing}
          </div>
          ${!isExpanded && workflow.prompt
            ? html`<div class="wf-card-prompt">
                "${workflow.prompt.length > 100
                  ? workflow.prompt.slice(0, 100) + "..."
                  : workflow.prompt}"
              </div>`
            : nothing}
        </div>
      </div>
      ${isExpanded
        ? html`
            <div class="wf-card-details">
              <div class="wf-details-grid">
                <div class="wf-detail-item">
                  <span class="wf-detail-label">Phiên</span>
                  <span class="wf-detail-value"
                    >${workflow.sessionTarget === "main"
                      ? "Phiên chính"
                      : "Riêng biệt"}</span
                  >
                </div>
                <div class="wf-detail-item">
                  <span class="wf-detail-label">Cách đánh thức</span>
                  <span class="wf-detail-value"
                    >${workflow.wakeMode === "now"
                      ? "Ngay lập tức"
                      : "Heartbeat tiếp"}</span
                  >
                </div>
                <div class="wf-detail-item">
                  <span class="wf-detail-label">Loại payload</span>
                  <span class="wf-detail-value"
                    >${workflow.payloadKind === "agentTurn"
                      ? "Gửi tin nhắn"
                      : "Sự kiện hệ thống"}</span
                  >
                </div>
                ${workflow.lastRunAt
                  ? html`
                      <div class="wf-detail-item">
                        <span class="wf-detail-label">Chạy lần cuối</span>
                        <span class="wf-detail-value"
                          >${formatMs(workflow.lastRunAt)}</span
                        >
                      </div>
                    `
                  : nothing}
                ${workflow.nextRunAt
                  ? html`
                      <div class="wf-detail-item">
                        <span class="wf-detail-label">Chạy tiếp theo</span>
                        <span class="wf-detail-value"
                          >${formatMs(workflow.nextRunAt)}</span
                        >
                      </div>
                    `
                  : nothing}
              </div>
              ${workflow.prompt
                ? html`
                    <div class="wf-detail-prompt">
                      <span class="wf-detail-label">Nội dung</span>
                      <div class="wf-detail-prompt-text">
                        ${workflow.prompt}
                      </div>
                    </div>
                  `
                : nothing}
            </div>
          `
        : nothing}
      <div class="wf-card-actions">
        <button
          class="wf-action ${isExpanded ? "wf-action-active" : ""}"
          @click=${() => onToggleDetails?.(workflow.id)}
        >
          ${icons.chevronDown}
          <span>${isExpanded ? "Thu gọn" : "Chi tiết"}</span>
        </button>
        <button
          class="wf-action"
          @click=${() => onToggle(workflow)}
          ?disabled=${saving}
        >
          ${workflow.enabled ? icons.pause : icons.play}
          <span>${workflow.enabled ? t("wfPause") : t("wfStart")}</span>
        </button>
        <button
          class="wf-action wf-action-run"
          @click=${() => onRun(workflow)}
          ?disabled=${saving}
        >
          ${icons.zap}
          <span>${t("wfRun")}</span>
        </button>
        <button
          class="wf-action ${isSelected ? "wf-action-active" : ""}"
          @click=${() => onLoadRuns?.(isSelected ? null : workflow.id)}
          ?disabled=${saving}
        >
          ${icons.clock}
          <span>Lịch sử</span>
        </button>
        <button
          class="wf-action wf-action-delete"
          @click=${() => onDelete(workflow)}
          ?disabled=${saving}
        >
=======
            ${workflow.sessionTarget
              ? html`<span class="wf-meta-item wf-meta-tag">${workflow.sessionTarget}</span>`
              : nothing}
            ${workflow.payloadKind
              ? html`<span class="wf-meta-item wf-meta-tag">${workflow.payloadKind === "agentTurn" ? "Agent" : "Event"}</span>`
              : nothing}
            <span class="wf-meta-item wf-meta-${lastRun.status}">
              <span class="wf-run-dot"></span>
              ${txt.last}: ${lastRun.time}
            </span>
          </div>
          ${workflow.prompt
            ? html`<div class="wf-card-prompt">"${workflow.prompt.length > 100 ? workflow.prompt.slice(0, 100) + "..." : workflow.prompt}"</div>`
            : nothing}
        </div>
      </div>
      <div class="wf-card-actions">
        <button class="wf-action" title=${workflow.enabled ? txt.pause : txt.start} @click=${() => onToggle(workflow)}>
          ${workflow.enabled ? icons.pause : icons.play}
          <span>${workflow.enabled ? txt.pause : txt.start}</span>
        </button>
        <button class="wf-action wf-action-run" title="${txt.run}" @click=${() => onRun(workflow)}>
          ${icons.zap}
          <span>${txt.run}</span>
        </button>
        <button class="wf-action wf-action-delete" title="${txt.delete}" @click=${() => onDelete(workflow)}>
>>>>>>> origin/main
          ${icons.trash}
        </button>
      </div>
    </div>
  `;
}

<<<<<<< HEAD
// Run history item
function renderRunItem(entry: WorkflowRun) {
  return html`
    <div class="wf-run-item">
      <div class="wf-run-main">
        <div class="wf-run-status wf-run-status-${entry.status}">
          ${entry.status}
        </div>
        <div class="wf-run-summary">${entry.summary ?? ""}</div>
        ${entry.error
          ? html`<div class="wf-run-error">${entry.error}</div>`
          : nothing}
      </div>
      <div class="wf-run-meta">
        <div>${formatMs(entry.ts)}</div>
        <div class="wf-run-duration">${entry.durationMs ?? 0}ms</div>
      </div>
    </div>
  `;
}

export function renderWorkflow(props: WorkflowProps) {
  const {
    workflows,
    loading,
    runningWorkflowIds = new Set(),
    runsWorkflowId,
    runs = [],
    runsLoading = false,
  } = props;

  const sortedWorkflows = [...workflows].sort((a, b) => {
    const aRunning = runningWorkflowIds.has(a.id) ? 1 : 0;
    const bRunning = runningWorkflowIds.has(b.id) ? 1 : 0;
    if (aRunning !== bRunning) return bRunning - aRunning;
    if (a.enabled !== b.enabled) return a.enabled ? -1 : 1;
    return a.name.localeCompare(b.name);
  });

  const runningCount = runningWorkflowIds.size;
  const selectedWorkflow = runsWorkflowId
    ? workflows.find((w) => w.id === runsWorkflowId)
    : null;

  return html`
    <style>
      /* Two-column grid (moltbot-style) */
      .wf-top-grid {
        display: grid;
        grid-template-columns: 1fr 1.2fr;
        gap: 16px;
        margin-bottom: 24px;
      }
      @media (max-width: 900px) {
        .wf-top-grid {
          grid-template-columns: 1fr;
        }
      }

      /* === Card Panel (moltbot-style) === */
      .wf-card-panel {
        background: var(--card);
        border: 1px solid var(--border);
        border-radius: var(--radius-lg);
        padding: 20px;
        transition:
          border-color 0.15s ease,
          box-shadow 0.15s ease;
      }
      .wf-card-panel:hover {
        border-color: var(--border-strong);
        box-shadow: var(--shadow-md);
      }
      .wf-card-title {
        font-size: 15px;
        font-weight: 600;
        letter-spacing: -0.02em;
        color: var(--text-strong, var(--text));
      }
      .wf-card-sub {
        color: var(--muted);
        font-size: 13px;
        margin-top: 6px;
        line-height: 1.5;
      }

      /* === Stats Grid (moltbot-style) === */
      .wf-stat-grid {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 12px;
        margin-top: 16px;
      }
      @media (min-width: 600px) {
        .wf-stat-grid {
          grid-template-columns: repeat(4, 1fr);
        }
      }
      .wf-stat {
        background: var(--card);
        border: 1px solid var(--border);
        border-radius: var(--radius-md);
        padding: 14px 16px;
        transition:
          border-color 0.15s ease,
          box-shadow 0.15s ease;
      }
      .wf-stat:hover {
        border-color: var(--border-strong);
        box-shadow: var(--shadow-sm);
      }
      .wf-stat-label {
        color: var(--muted);
        font-size: 11px;
        font-weight: 500;
        text-transform: uppercase;
        letter-spacing: 0.04em;
      }
      .wf-stat-value {
        font-size: 24px;
        font-weight: 700;
        margin-top: 6px;
        letter-spacing: -0.03em;
        line-height: 1.1;
      }
      .wf-stat-ok {
        color: var(--ok);
      }

      /* === Row & Button (moltbot-style) === */
      .wf-row {
        display: flex;
        align-items: center;
        gap: 12px;
        margin-top: 12px;
      }
      .wf-muted {
        color: var(--muted);
        font-size: 13px;
      }
      .wf-btn {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        border: 1px solid var(--border);
        background: var(--card);
        padding: 9px 16px;
        border-radius: var(--radius-md);
        font-size: 13px;
        font-weight: 500;
        letter-spacing: -0.01em;
        cursor: pointer;
        transition: all 0.15s ease;
      }
      .wf-btn:hover {
        background: var(--bg-hover);
        border-color: var(--border-strong);
        transform: translateY(-1px);
        box-shadow: var(--shadow-sm);
      }
      .wf-btn:active {
        background: var(--secondary);
        transform: translateY(0);
        box-shadow: none;
      }
      .wf-btn:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }
      .wf-btn-primary {
        border-color: var(--accent);
        background: var(--accent);
        color: var(--accent-foreground, #fff);
      }
      .wf-btn-primary:hover {
        background: var(--accent-hover, var(--accent));
        border-color: var(--accent-hover, var(--accent));
      }

      /* === Form Grid (moltbot-style) === */
      .wf-form-grid {
        display: grid;
        gap: 12px;
        grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
        margin-top: 16px;
      }
      .wf-field {
        display: grid;
        gap: 6px;
      }
      .wf-field.full {
        grid-column: 1 / -1;
      }
      .wf-field span {
        color: var(--muted);
        font-size: 13px;
        font-weight: 500;
      }
      .wf-field input,
      .wf-field textarea,
      .wf-field select {
        border: 1px solid var(--border);
        background: var(--card);
        border-radius: var(--radius-md);
        padding: 8px 12px;
        outline: none;
        font-size: 14px;
        font-family: inherit;
        color: var(--text);
        transition:
          border-color 0.15s ease,
          box-shadow 0.15s ease;
      }
      .wf-field input:focus,
      .wf-field textarea:focus,
      .wf-field select:focus {
        border-color: var(--accent);
        box-shadow: 0 0 0 2px var(--accent-subtle);
      }
      .wf-field input::placeholder,
      .wf-field textarea::placeholder {
        color: var(--muted);
      }
      .wf-field textarea {
        min-height: 100px;
        resize: vertical;
        font-family: var(--mono, monospace);
        line-height: 1.5;
      }
      .wf-field-checkbox {
        grid-template-columns: auto 1fr;
        align-items: center;
      }
      .wf-field-checkbox input[type="checkbox"] {
        width: 18px;
        height: 18px;
        accent-color: var(--accent);
        cursor: pointer;
      }

      /* Section header with running badge */
      .wf-section-header {
        display: flex;
        align-items: center;
        gap: 12px;
        margin-bottom: 16px;
      }
      .wf-section-title {
        margin: 0;
        font-size: 16px;
        font-weight: 600;
        color: var(--text-strong, var(--text));
      }
      .wf-running-badge {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        padding: 6px 12px;
        background: var(--accent-subtle);
        border: 1px solid var(--accent);
        border-radius: var(--radius-full);
        font-size: 13px;
        font-weight: 500;
        color: var(--accent);
      }
      .wf-running-badge-dot {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background: var(--accent);
        animation: wf-pulse 1.5s ease-in-out infinite;
      }
      @keyframes wf-pulse {
        0%,
        100% {
          opacity: 1;
          transform: scale(1);
        }
        50% {
          opacity: 0.5;
          transform: scale(1.3);
        }
      }
      @keyframes wf-spin {
        to {
          transform: rotate(360deg);
        }
      }

      /* Workflow cards (beautiful original style) */
      .wf-list {
        display: flex;
        flex-direction: column;
        gap: 16px;
      }
      .wf-card {
        background: var(--card);
        border: 1px solid var(--border);
        border-radius: var(--radius-lg);
        overflow: hidden;
        transition: all 0.15s ease;
      }
      .wf-card:hover {
        border-color: var(--border-strong);
        box-shadow: var(--shadow-md);
      }
      .wf-card-paused {
        opacity: 0.7;
      }
      .wf-card-running {
        border-color: var(--accent);
        box-shadow: 0 0 0 1px var(--accent-subtle);
      }
      .wf-card-selected {
        border-color: var(--accent);
        background: var(--accent-subtle);
      }
      .wf-card-main {
        display: flex;
        gap: 16px;
        padding: 20px;
      }
      .wf-card-icon {
        width: 48px;
        height: 48px;
        display: flex;
        align-items: center;
        justify-content: center;
        background: var(--secondary);
        border-radius: var(--radius-md);
        color: var(--muted);
        flex-shrink: 0;
        transition: all 0.15s ease;
      }
      .wf-card-icon-active {
        background: var(--accent-subtle);
        color: var(--accent);
      }
      .wf-card-icon-running {
        background: var(--accent);
        color: var(--accent-foreground);
        animation: wf-icon-pulse 2s ease-in-out infinite;
      }
      @keyframes wf-icon-pulse {
        0%,
        100% {
          opacity: 1;
        }
        50% {
          opacity: 0.7;
        }
      }
      .wf-card-icon svg {
        width: 24px;
        height: 24px;
        stroke: currentColor;
        fill: none;
        stroke-width: 1.5;
      }
      .wf-card-content {
        flex: 1;
        min-width: 0;
      }
      .wf-card-header {
        display: flex;
        align-items: center;
        gap: 12px;
        flex-wrap: wrap;
      }
      .wf-card-title {
        margin: 0;
        font-size: 16px;
        font-weight: 600;
        color: var(--text-strong, var(--text));
      }
      .wf-card-desc {
        margin: 4px 0 0;
        font-size: 13px;
        color: var(--text-secondary, var(--text));
        opacity: 0.85;
      }
      .wf-status {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        padding: 4px 10px;
        font-size: 12px;
        font-weight: 500;
        border-radius: var(--radius-full);
      }
      .wf-status-active {
        background: var(--ok-subtle);
        color: var(--ok);
      }
      .wf-status-paused {
        background: var(--warn-subtle);
        color: var(--warn);
      }
      .wf-status-running {
        background: var(--accent-subtle);
        color: var(--accent);
      }
      .wf-status-dot {
        width: 6px;
        height: 6px;
        border-radius: 50%;
        background: currentColor;
      }
      .wf-status-dot-pulse {
        animation: wf-pulse 1.5s ease-in-out infinite;
      }
      .wf-card-meta {
        display: flex;
        gap: 16px;
        margin-top: 12px;
        flex-wrap: wrap;
      }
      .wf-meta-item {
        display: flex;
        align-items: center;
        gap: 6px;
        font-size: 13px;
        color: var(--text);
        font-weight: 500;
      }
      .wf-meta-icon {
        width: 14px;
        height: 14px;
      }
      .wf-meta-icon svg {
        width: 14px;
        height: 14px;
        stroke: currentColor;
        fill: none;
        stroke-width: 2;
      }
      .wf-run-dot {
        width: 6px;
        height: 6px;
        border-radius: 50%;
        background: var(--muted);
      }
      .wf-meta-success .wf-run-dot {
        background: var(--ok);
      }
      .wf-meta-ok .wf-run-dot {
        background: var(--ok);
      }
      .wf-meta-error .wf-run-dot {
        background: var(--danger);
      }
      .wf-meta-tag {
        padding: 2px 8px;
        background: var(--secondary);
        border-radius: var(--radius-sm);
        font-size: 11px;
        font-weight: 500;
        text-transform: uppercase;
        letter-spacing: 0.03em;
      }
      .wf-meta-next {
        color: var(--accent);
        background: var(--accent-subtle);
        padding: 4px 10px;
        border-radius: var(--radius-sm);
      }
      .wf-card-prompt {
        margin-top: 12px;
        padding: 12px 16px;
        background: var(--bg);
        border-radius: var(--radius-md);
        font-size: 13px;
        color: var(--text-strong, var(--text));
        line-height: 1.5;
        font-style: italic;
        border: 1px solid var(--border);
      }
      .wf-card-actions {
        display: flex;
        gap: 8px;
        padding: 12px 20px;
        background: var(--bg-muted);
        border-top: 1px solid var(--border);
      }
      .wf-action {
        display: flex;
        align-items: center;
        gap: 6px;
        padding: 8px 14px;
        font-size: 13px;
        font-weight: 500;
        background: var(--card);
        border: 1px solid var(--border);
        border-radius: var(--radius-md);
        color: var(--text);
        cursor: pointer;
        transition: all 0.15s ease;
      }
      .wf-action:hover {
        background: var(--bg-hover);
        border-color: var(--border-strong);
      }
      .wf-action svg {
        width: 14px;
        height: 14px;
        stroke: currentColor;
        fill: none;
        stroke-width: 2;
      }
      .wf-action-run:hover {
        border-color: var(--accent);
        color: var(--accent);
      }
      .wf-action-delete {
        margin-left: auto;
        padding: 8px;
      }
      .wf-action-delete span {
        display: none;
      }
      .wf-action-delete:hover {
        border-color: var(--danger);
        color: var(--danger);
        background: var(--danger-subtle);
      }
      .wf-action-active {
        border-color: var(--accent);
        color: var(--accent);
        background: var(--accent-subtle);
      }
      .wf-action-active svg {
        transform: rotate(180deg);
      }

      /* Expanded details */
      .wf-card-expanded {
        border-color: var(--accent);
      }
      .wf-card-details {
        padding: 16px 20px;
        padding-left: 84px;
        background: var(--card);
        border-top: 1px solid var(--border);
      }
      .wf-details-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
        gap: 12px;
      }
      .wf-detail-item {
        display: flex;
        flex-direction: column;
        gap: 4px;
      }
      .wf-detail-label {
        font-size: 13px;
        font-weight: 600;
        color: var(--muted);
        text-transform: uppercase;
        letter-spacing: 0.03em;
      }
      .wf-detail-value {
        font-size: 15px;
        color: var(--text);
      }
      .wf-detail-prompt {
        margin-top: 16px;
      }
      .wf-detail-prompt-text {
        margin-top: 8px;
        padding: 14px 18px;
        background: var(--bg);
        border: 1px solid var(--border);
        border-radius: var(--radius-md);
        font-size: 15px;
        color: var(--text);
        line-height: 1.6;
        white-space: pre-wrap;
      }

      /* Run history */
      .wf-runs-section {
        margin-top: 24px;
        background: var(--card);
        border: 1px solid var(--border);
        border-radius: var(--radius-lg);
      }
      .wf-runs-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        padding: 16px 20px;
        border-bottom: 1px solid var(--border);
      }
      .wf-runs-header-left {
        flex: 1;
      }
      .wf-runs-title {
        margin: 0 0 4px;
        font-size: 16px;
        font-weight: 600;
        color: var(--text-strong, var(--text));
      }
      .wf-runs-sub {
        margin: 0;
        font-size: 13px;
        color: var(--muted);
      }
      .wf-runs-close {
        width: 32px;
        height: 32px;
        display: flex;
        align-items: center;
        justify-content: center;
        background: transparent;
        border: none;
        border-radius: var(--radius-sm);
        color: var(--muted);
        cursor: pointer;
      }
      .wf-runs-close:hover {
        background: var(--bg-hover);
        color: var(--text);
      }
      .wf-runs-close svg {
        width: 18px;
        height: 18px;
        stroke: currentColor;
        fill: none;
        stroke-width: 2;
      }
      .wf-runs-list {
        display: flex;
        flex-direction: column;
      }
      .wf-run-item {
        display: flex;
        padding: 14px 20px;
        border-bottom: 1px solid var(--border);
      }
      .wf-run-item:last-child {
        border-bottom: none;
      }
      .wf-run-main {
        flex: 1;
      }
      .wf-run-status {
        font-size: 14px;
        font-weight: 600;
      }
      .wf-run-status-ok,
      .wf-run-status-success {
        color: var(--ok);
      }
      .wf-run-status-error {
        color: var(--danger);
      }
      .wf-run-summary {
        font-size: 13px;
        color: var(--text);
        margin-top: 2px;
      }
      .wf-run-error {
        font-size: 12px;
        color: var(--danger);
        margin-top: 4px;
      }
      .wf-run-meta {
        text-align: right;
        font-size: 12px;
        color: var(--muted);
      }
      .wf-run-duration {
        margin-top: 2px;
      }
      .wf-runs-empty {
        padding: 24px 20px;
        text-align: center;
        font-size: 13px;
        color: var(--muted);
      }
      .wf-runs-loading {
        padding: 24px 20px;
        text-align: center;
      }

      /* Empty state */
      .wf-empty {
        display: flex;
        flex-direction: column;
        align-items: center;
        padding: 48px 24px;
        text-align: center;
        background: var(--card);
        border: 2px dashed var(--border);
        border-radius: var(--radius-xl);
      }
      .wf-empty-icon {
        width: 56px;
        height: 56px;
        display: flex;
        align-items: center;
        justify-content: center;
        background: var(--accent-subtle);
        border-radius: var(--radius-lg);
        color: var(--accent);
        margin-bottom: 16px;
      }
      .wf-empty-icon svg {
        width: 28px;
        height: 28px;
        stroke: currentColor;
        fill: none;
        stroke-width: 1.5;
      }
      .wf-empty-title {
        margin: 0 0 8px;
        font-size: 16px;
        font-weight: 600;
        color: var(--text-strong, var(--text));
      }
      .wf-empty-desc {
        margin: 0 0 20px;
        font-size: 13px;
        color: var(--muted);
        max-width: 280px;
      }

      /* Loading */
      .wf-loading {
        display: flex;
        flex-direction: column;
        align-items: center;
        padding: 48px 24px;
      }
      .wf-loading-spinner {
        width: 40px;
        height: 40px;
        border: 3px solid var(--border);
        border-top-color: var(--accent);
        border-radius: 50%;
        animation: wf-spin 0.8s linear infinite;
        margin-bottom: 16px;
      }
      .wf-loading-text {
        font-size: 14px;
        color: var(--muted);
      }
    </style>

    <!-- Top section: Status + Form (two columns like admin UI) -->
    <div class="wf-top-grid">
      ${renderStatusCard(props)} ${renderFormCard(props)}
    </div>

    <!-- Workflow list section -->
    <div class="wf-section-header">
      <h3 class="wf-section-title">Workflows</h3>
      ${runningCount > 0
        ? html`
            <span class="wf-running-badge">
              <span class="wf-running-badge-dot"></span>
              ${runningCount} ${t("wfRunning")}
            </span>
          `
        : nothing}
    </div>

    ${loading
      ? html`
          <div class="wf-loading">
            <div class="wf-loading-spinner"></div>
            <span class="wf-loading-text">${t("workflowLoading")}</span>
=======
export function renderWorkflow(props: WorkflowProps) {
  const { lang, workflows, loading, error, showForm, onShowForm, onRefresh } = props;

  const txt = {
    refresh: t(lang, "workflowRefresh"),
    newWorkflow: t(lang, "workflowNew"),
    loading: t(lang, "workflowLoading"),
    empty: t(lang, "workflowEmpty"),
    emptyDesc: t(lang, "workflowEmptyDesc"),
    create: t(lang, "workflowCreate"),
  };

  return html`
    <style>
      .wf-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
      .wf-header-left { display: flex; align-items: center; gap: 12px; }
      .wf-refresh { width: 40px; height: 40px; display: flex; align-items: center; justify-content: center; background: var(--secondary); border: 1px solid var(--border); border-radius: var(--radius-md); color: var(--muted); cursor: pointer; transition: all 0.15s ease; }
      .wf-refresh:hover { background: var(--bg-hover); color: var(--text); border-color: var(--border-strong); }
      .wf-refresh:disabled { opacity: 0.5; cursor: not-allowed; }
      .wf-refresh svg { width: 18px; height: 18px; stroke: currentColor; fill: none; stroke-width: 2; }
      .wf-error { padding: 8px 12px; background: var(--danger-subtle); border-radius: var(--radius-md); color: var(--danger); font-size: 13px; }

      /* Buttons */
      .wf-btn { display: inline-flex; align-items: center; gap: 8px; padding: 10px 20px; font-size: 14px; font-weight: 500; border-radius: var(--radius-md); border: none; cursor: pointer; transition: all 0.15s ease; }
      .wf-btn svg { width: 16px; height: 16px; stroke: currentColor; fill: none; stroke-width: 2; }
      .wf-btn-primary { background: var(--accent); color: var(--accent-foreground); }
      .wf-btn-primary:hover { background: var(--accent-hover); transform: translateY(-1px); }
      .wf-btn-primary:disabled { opacity: 0.6; cursor: not-allowed; transform: none; }
      .wf-btn-ghost { background: transparent; color: var(--text); border: 1px solid var(--border); }
      .wf-btn-ghost:hover { background: var(--bg-hover); border-color: var(--border-strong); }
      .wf-spinner { width: 14px; height: 14px; border: 2px solid transparent; border-top-color: currentColor; border-radius: 50%; animation: wf-spin 0.8s linear infinite; }
      @keyframes wf-spin { to { transform: rotate(360deg); } }

      /* Form Panel - Compact Design */
      .wf-form-panel { background: var(--card); border: 1px solid var(--border); border-radius: var(--radius-lg); margin-bottom: 20px; animation: wf-rise 0.2s ease-out; }
      @keyframes wf-rise { from { opacity: 0; transform: translateY(6px); } }
      .wf-form-top { display: flex; justify-content: space-between; align-items: center; padding: 16px 20px; border-bottom: 1px solid var(--border); }
      .wf-form-heading { margin: 0; font-size: 16px; font-weight: 600; color: var(--text-strong); }
      .wf-close-btn { width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; background: transparent; border: none; border-radius: var(--radius-sm); color: var(--muted); cursor: pointer; transition: all 0.15s; }
      .wf-close-btn:hover { background: var(--bg-hover); color: var(--text); }
      .wf-close-btn svg { width: 18px; height: 18px; stroke: currentColor; fill: none; stroke-width: 2; }
      .wf-form-content { padding: 20px; display: flex; flex-direction: column; gap: 20px; }
      .wf-form-section { display: flex; flex-direction: column; gap: 12px; }
      .wf-section-label { font-size: 12px; font-weight: 600; color: var(--muted); text-transform: uppercase; letter-spacing: 0.05em; }
      .wf-form-row { display: flex; gap: 12px; align-items: flex-start; }
      .wf-form-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; }
      @media (max-width: 800px) { .wf-form-grid { grid-template-columns: repeat(2, 1fr); } }
      .wf-form-actions { display: flex; justify-content: flex-end; gap: 10px; padding: 14px 20px; background: var(--bg-muted); border-top: 1px solid var(--border); }

      /* Tabs */
      .wf-tabs { display: flex; gap: 4px; padding: 4px; background: var(--bg); border-radius: var(--radius-md); }
      .wf-tab { flex: 1; padding: 8px 12px; font-size: 13px; font-weight: 500; text-align: center; background: transparent; border: none; border-radius: var(--radius-sm); color: var(--muted); cursor: pointer; transition: all 0.15s; }
      .wf-tab:hover { color: var(--text); }
      .wf-tab-active { background: var(--card); color: var(--text-strong); box-shadow: var(--shadow-sm); }
      .wf-schedule-fields { padding-top: 12px; }
      .wf-inline-group { display: flex; align-items: center; gap: 10px; }
      .wf-inline-label { font-size: 14px; color: var(--text); white-space: nowrap; }

      /* Fields */
      .wf-field { display: flex; flex-direction: column; gap: 6px; }
      .wf-field-grow { flex: 1; }
      .wf-label { font-size: 12px; font-weight: 500; color: var(--muted); }
      .wf-req { color: var(--accent); }
      .wf-input, .wf-select, .wf-textarea { width: 100%; padding: 10px 12px; font-size: 14px; background: var(--bg); border: 1px solid var(--border); border-radius: var(--radius-md); color: var(--text); transition: all 0.15s; }
      .wf-input:hover, .wf-select:hover, .wf-textarea:hover { border-color: var(--border-strong); }
      .wf-input:focus, .wf-select:focus, .wf-textarea:focus { outline: none; border-color: var(--accent); box-shadow: 0 0 0 2px var(--accent-subtle); }
      .wf-input::placeholder, .wf-textarea::placeholder { color: var(--muted); }
      .wf-input-sm { width: 80px; padding: 8px 10px; }
      .wf-select-sm { width: auto; padding: 8px 10px; }
      .wf-mono { font-family: var(--mono); font-size: 13px; }
      .wf-textarea { min-height: 80px; resize: vertical; line-height: 1.5; }
      .wf-input-suffix { display: flex; align-items: center; gap: 8px; }
      .wf-input-suffix span { font-size: 13px; color: var(--muted); }
      .wf-input-suffix .wf-input { flex: 1; }

      /* Switch */
      .wf-switch { display: flex; align-items: center; gap: 10px; cursor: pointer; padding: 8px 0; }
      .wf-switch input { display: none; }
      .wf-switch-slider { width: 36px; height: 20px; background: var(--border); border-radius: 10px; position: relative; transition: background 0.2s; }
      .wf-switch-slider::after { content: ""; position: absolute; top: 2px; left: 2px; width: 16px; height: 16px; background: var(--text); border-radius: 50%; transition: all 0.2s; }
      .wf-switch input:checked + .wf-switch-slider { background: var(--accent); }
      .wf-switch input:checked + .wf-switch-slider::after { left: 18px; background: var(--accent-foreground); }
      .wf-switch-text { font-size: 13px; color: var(--text); min-width: 50px; }

      /* Checkbox */
      .wf-check { display: flex; align-items: center; gap: 8px; cursor: pointer; font-size: 13px; color: var(--text); }
      .wf-check input { width: 16px; height: 16px; accent-color: var(--accent); }

      /* Workflow Card */
      .wf-list { display: flex; flex-direction: column; gap: 16px; }
      .wf-card { background: var(--card); border: 1px solid var(--border); border-radius: var(--radius-lg); overflow: hidden; transition: all 0.15s ease; }
      .wf-card:hover { border-color: var(--border-strong); box-shadow: var(--shadow-md); }
      .wf-card-paused { opacity: 0.7; }
      .wf-card-main { display: flex; gap: 16px; padding: 20px; }
      .wf-card-icon { width: 48px; height: 48px; display: flex; align-items: center; justify-content: center; background: var(--secondary); border-radius: var(--radius-md); color: var(--muted); flex-shrink: 0; transition: all 0.15s ease; }
      .wf-card-icon-active { background: var(--accent-subtle); color: var(--accent); }
      .wf-card-icon svg { width: 24px; height: 24px; stroke: currentColor; fill: none; stroke-width: 1.5; }
      .wf-card-content { flex: 1; min-width: 0; }
      .wf-card-header { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }
      .wf-card-title { margin: 0; font-size: 16px; font-weight: 600; color: var(--text-strong); }
      .wf-card-desc { margin: 4px 0 0; font-size: 13px; color: var(--muted); }
      .wf-status { display: inline-flex; align-items: center; gap: 6px; padding: 4px 10px; font-size: 12px; font-weight: 500; border-radius: var(--radius-full); }
      .wf-status-active { background: var(--ok-subtle); color: var(--ok); }
      .wf-status-paused { background: var(--warn-subtle); color: var(--warn); }
      .wf-status-dot { width: 6px; height: 6px; border-radius: 50%; background: currentColor; }
      .wf-card-meta { display: flex; gap: 20px; margin-top: 12px; flex-wrap: wrap; }
      .wf-meta-item { display: flex; align-items: center; gap: 6px; font-size: 13px; color: var(--muted); }
      .wf-meta-icon { width: 14px; height: 14px; }
      .wf-meta-icon svg { width: 14px; height: 14px; stroke: currentColor; fill: none; stroke-width: 2; }
      .wf-run-dot { width: 6px; height: 6px; border-radius: 50%; background: var(--muted); }
      .wf-meta-success .wf-run-dot { background: var(--ok); }
      .wf-meta-error .wf-run-dot { background: var(--danger); }
      .wf-meta-tag { padding: 2px 8px; background: var(--secondary); border-radius: var(--radius-sm); font-size: 11px; font-weight: 500; text-transform: uppercase; letter-spacing: 0.03em; }
      .wf-card-prompt { margin-top: 12px; padding: 12px 16px; background: var(--bg); border-radius: var(--radius-md); font-size: 13px; color: var(--text); line-height: 1.5; font-style: italic; }
      .wf-card-actions { display: flex; gap: 8px; padding: 12px 20px; background: var(--bg-muted); border-top: 1px solid var(--border); }
      .wf-action { display: flex; align-items: center; gap: 6px; padding: 8px 14px; font-size: 13px; font-weight: 500; background: var(--card); border: 1px solid var(--border); border-radius: var(--radius-md); color: var(--text); cursor: pointer; transition: all 0.15s ease; }
      .wf-action:hover { background: var(--bg-hover); border-color: var(--border-strong); }
      .wf-action svg { width: 14px; height: 14px; stroke: currentColor; fill: none; stroke-width: 2; }
      .wf-action-run:hover { border-color: var(--accent); color: var(--accent); }
      .wf-action-delete { margin-left: auto; padding: 8px; }
      .wf-action-delete span { display: none; }
      .wf-action-delete:hover { border-color: var(--danger); color: var(--danger); background: var(--danger-subtle); }

      /* Empty & Loading */
      .wf-empty { display: flex; flex-direction: column; align-items: center; padding: 48px 24px; text-align: center; background: var(--card); border: 2px dashed var(--border); border-radius: var(--radius-xl); }
      .wf-empty-icon { width: 56px; height: 56px; display: flex; align-items: center; justify-content: center; background: var(--accent-subtle); border-radius: var(--radius-lg); color: var(--accent); margin-bottom: 16px; }
      .wf-empty-icon svg { width: 28px; height: 28px; stroke: currentColor; fill: none; stroke-width: 1.5; }
      .wf-empty-title { margin: 0 0 8px; font-size: 16px; font-weight: 600; color: var(--text-strong); }
      .wf-empty-desc { margin: 0 0 16px; font-size: 13px; color: var(--muted); max-width: 280px; }
      .wf-loading { display: flex; flex-direction: column; align-items: center; padding: 48px 24px; }
      .wf-loading-spinner { width: 40px; height: 40px; border: 3px solid var(--border); border-top-color: var(--accent); border-radius: 50%; animation: wf-spin 0.8s linear infinite; margin-bottom: 16px; }
      .wf-loading-text { font-size: 14px; color: var(--muted); }

      @media (max-width: 640px) {
        .wf-schedule-kinds { grid-template-columns: 1fr; }
        .wf-schedule-kind { flex-direction: row; text-align: left; padding: 16px; }
        .wf-schedule-kind-icon { width: 36px; height: 36px; }
      }
    </style>

    <div class="wf-header">
      <div class="wf-header-left">
        <button class="wf-refresh" title="${txt.refresh}" @click=${onRefresh} ?disabled=${loading}>
          ${icons.refresh}
        </button>
        ${error ? html`<span class="wf-error">${error}</span>` : nothing}
      </div>
      ${!showForm
        ? html`<button class="wf-btn wf-btn-primary" @click=${onShowForm}>${icons.plus} ${txt.newWorkflow}</button>`
        : nothing}
    </div>

    ${showForm ? renderForm(props) : nothing}

    ${loading && workflows.length === 0
      ? html`
          <div class="wf-loading">
            <div class="wf-loading-spinner"></div>
            <span class="wf-loading-text">${txt.loading}</span>
>>>>>>> origin/main
          </div>
        `
      : workflows.length === 0
        ? html`
            <div class="wf-empty">
              <div class="wf-empty-icon">${icons.workflow}</div>
<<<<<<< HEAD
              <h3 class="wf-empty-title">${t("workflowEmpty")}</h3>
              <p class="wf-empty-desc">${t("workflowEmptyDesc")}</p>
            </div>
          `
        : html`
            <div class="wf-list">
              ${sortedWorkflows.map((w) =>
                renderWorkflowCard(w, props, runningWorkflowIds.has(w.id)),
              )}
            </div>
          `}
    ${runsWorkflowId
      ? html`
          <div class="wf-runs-section">
            <div class="wf-runs-header">
              <div class="wf-runs-header-left">
                <h3 class="wf-runs-title">Lịch sử chạy</h3>
                <p class="wf-runs-sub">
                  ${selectedWorkflow?.name ?? runsWorkflowId}
                </p>
              </div>
              <button
                class="wf-runs-close"
                @click=${() => props.onLoadRuns?.(null)}
              >
                ${icons.x}
              </button>
            </div>
            ${runsLoading
              ? html`
                  <div class="wf-runs-loading">
                    <div class="wf-loading-spinner"></div>
                  </div>
                `
              : runs.length === 0
                ? html` <div class="wf-runs-empty">Chưa có lần chạy nào.</div> `
                : html`
                    <div class="wf-runs-list">
                      ${runs.map((entry) => renderRunItem(entry))}
                    </div>
                  `}
          </div>
        `
      : nothing}
=======
              <h3 class="wf-empty-title">${txt.empty}</h3>
              <p class="wf-empty-desc">${txt.emptyDesc}</p>
              ${!showForm ? html`<button class="wf-btn wf-btn-primary" @click=${onShowForm}>${icons.plus} ${txt.create}</button>` : nothing}
            </div>
          `
        : html`<div class="wf-list">${workflows.map((w) => renderWorkflowCard(w, props))}</div>`}
>>>>>>> origin/main
  `;
}
