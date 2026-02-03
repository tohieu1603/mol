import { LitElement, html, nothing } from "lit";
import { customElement, state } from "lit/decorators.js";

import { API_CONFIG } from "../config";
import { icons } from "./icons";
import { NAV_ITEMS, pathForTab, tabFromPath, type Tab } from "./navigation";
import { loadSettings, saveSettings, type ClientSettings } from "./storage";
import { resolveTheme, applyTheme, getSystemTheme, type ThemeMode, type ResolvedTheme } from "./theme";
import { startThemeTransition, type ThemeTransitionContext } from "./theme-transition";
import { t, type Language } from "./i18n";
import { renderChat } from "./views/chat";
import { renderBilling } from "./views/billing";
import { renderLogs } from "./views/logs";
import { renderWorkflow } from "./views/workflow";
import { renderDocs } from "./views/docs";
import { renderLogin } from "./views/login";
import type { Workflow, WorkflowFormState } from "./workflow-types";
import { DEFAULT_WORKFLOW_FORM } from "./workflow-types";
import { listWorkflows, createWorkflow, toggleWorkflow, runWorkflow, deleteWorkflow } from "./workflow-api";

// Register custom components
import "./components/operis-input";
import "./components/operis-select";
import "./components/operis-modal";

// Get page title based on tab and language
function titleForTab(tab: Tab, lang: Language): string {
  const titles: Record<Tab, { en: string; vi: string }> = {
    chat: { en: "Chat", vi: "Trò Chuyện" },
    workflow: { en: "Workflows", vi: "Luồng Công Việc" },
    billing: { en: "Billing", vi: "Thanh Toán" },
    logs: { en: "Logs", vi: "Nhật Ký" },
    docs: { en: "Documentation", vi: "Tài Liệu" },
    login: { en: "Sign In", vi: "Đăng Nhập" },
  };
  return titles[tab]?.[lang] ?? titles[tab]?.en ?? tab;
}

// Get page subtitle based on tab and language
function subtitleForTab(tab: Tab, lang: Language): string {
  const subtitles: Record<Tab, { en: string; vi: string }> = {
    chat: { en: "Direct gateway chat session", vi: "Phiên chat trực tiếp với gateway" },
    workflow: { en: "Automate tasks with scheduled AI runs", vi: "Tự động hóa tác vụ với AI theo lịch" },
    billing: { en: "View usage and manage subscription", vi: "Xem sử dụng và quản lý gói" },
    logs: { en: "View system logs and activity", vi: "Xem nhật ký hệ thống" },
    docs: { en: "Guides and references", vi: "Hướng dẫn sử dụng" },
    login: { en: "Access your account", vi: "Truy cập tài khoản của bạn" },
  };
  return subtitles[tab]?.[lang] ?? subtitles[tab]?.en ?? "";
}

@customElement("operis-app")
export class OperisApp extends LitElement {
  @state() settings: ClientSettings = loadSettings();
  @state() tab: Tab = "chat";
  @state() theme: ThemeMode = this.settings.theme ?? "system";
  @state() lang: Language = this.settings.language ?? "en";
  @state() themeResolved: ResolvedTheme = "dark";

  // Chat state
  @state() chatMessages: Array<{ role: "user" | "assistant"; content: string }> = [];
  @state() chatDraft = "";
  @state() chatSending = false;

  // Login state
  @state() loginLoading = false;
  @state() loginError: string | null = null;

  // Workflow state
  @state() workflows: Workflow[] = [];
  @state() workflowLoading = false;
  @state() workflowError: string | null = null;
  @state() workflowShowForm = false;
  @state() workflowForm: WorkflowFormState = { ...DEFAULT_WORKFLOW_FORM };
  @state() workflowSaving = false;

  // Billing state
  @state() billingCreditBalance = 80;
  @state() billingSelectedPackage = 1;
  @state() billingAutoTopUp = false;
  @state() billingApiKeys: Array<{ id: string; name: string; key: string; createdAt: number }> = [
    { id: "1", name: "Production API", key: "sk-...abc123", createdAt: Date.now() - 86400000 * 7 },
    { id: "2", name: "Development", key: "sk-...xyz789", createdAt: Date.now() - 86400000 * 2 },
  ];
  @state() billingShowCreateKeyModal = false;
  @state() billingNewKeyName = "";
  // QR Payment state
  @state() billingShowQrModal = false;
  @state() billingQrTransactionId = "";
  @state() billingQrImageUrl = "";
  @state() billingQrPaymentStatus: "pending" | "success" | "failed" = "pending";
  @state() billingQrStatusMessage = "";

  private themeMedia: MediaQueryList | null = null;
  private themeMediaHandler: ((event: MediaQueryListEvent) => void) | null = null;
  private popStateHandler = () => this.handlePopState();

  createRenderRoot() {
    return this;
  }

  connectedCallback() {
    super.connectedCallback();
    // Initialize theme
    this.themeResolved = resolveTheme(this.theme);
    applyTheme(this.themeResolved);

    // Listen for system theme changes
    if (this.theme === "system" && typeof window !== "undefined") {
      this.themeMedia = window.matchMedia("(prefers-color-scheme: dark)");
      this.themeMediaHandler = () => {
        if (this.theme === "system") {
          this.themeResolved = getSystemTheme();
          applyTheme(this.themeResolved);
        }
      };
      this.themeMedia.addEventListener("change", this.themeMediaHandler);
    }

    // Initialize tab from URL
    let initialTab = tabFromPath(window.location.pathname);
    // Redirect to chat if already logged in and on login page
    if (initialTab === "login" && this.settings.isLoggedIn) {
      initialTab = "chat";
      window.history.replaceState({}, "", pathForTab("chat"));
    }
    if (initialTab) {
      this.tab = initialTab;
      // Load data for initial tab
      if (initialTab === "workflow") {
        this.loadWorkflows();
      }
    }

    // Listen for browser navigation
    window.addEventListener("popstate", this.popStateHandler);
  }

  disconnectedCallback() {
    if (this.themeMedia && this.themeMediaHandler) {
      this.themeMedia.removeEventListener("change", this.themeMediaHandler);
    }
    window.removeEventListener("popstate", this.popStateHandler);
    super.disconnectedCallback();
  }

  private handlePopState() {
    let tab = tabFromPath(window.location.pathname);
    // Redirect to chat if already logged in and on login page
    if (tab === "login" && this.settings.isLoggedIn) {
      tab = "chat";
      window.history.replaceState({}, "", pathForTab("chat"));
    }
    if (tab) {
      this.tab = tab;
    }
  }

  private setTab(tab: Tab) {
    // Redirect to chat if already logged in and trying to go to login
    if (tab === "login" && this.settings.isLoggedIn) {
      tab = "chat";
    }
    if (tab === this.tab) return;
    this.tab = tab;
    const path = pathForTab(tab);
    window.history.pushState({}, "", path);

    // Load data for specific tabs
    if (tab === "workflow") {
      this.loadWorkflows();
    }
  }

  private setTheme(mode: ThemeMode, context?: ThemeTransitionContext) {
    const currentTheme = this.theme;
    startThemeTransition({
      nextTheme: mode,
      currentTheme,
      context,
      applyTheme: () => {
        this.theme = mode;
        this.themeResolved = resolveTheme(mode);
        applyTheme(this.themeResolved);
        this.applySettings({ ...this.settings, theme: mode });
      },
    });
  }

  private applySettings(next: ClientSettings) {
    this.settings = next;
    saveSettings(next);
  }

  private toggleNav() {
    this.applySettings({
      ...this.settings,
      navCollapsed: !this.settings.navCollapsed,
    });
  }

  private setLanguage(lang: Language) {
    this.lang = lang;
    this.applySettings({ ...this.settings, language: lang });
  }

  private async handleLogin(email: string, password: string) {
    this.loginLoading = true;
    this.loginError = null;

    try {
      // Call remote Operis API for authentication
      const response = await fetch(`${API_CONFIG.operisApiUrl}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: "Login failed" }));
        throw new Error(error.error || `HTTP ${response.status}`);
      }

      const data = await response.json();
      const token = data.token || data.accessToken;
      const username = data.user?.name || data.user?.email?.split("@")[0] || email.split("@")[0];

      this.applySettings({
        ...this.settings,
        isLoggedIn: true,
        username,
        authToken: token,
      });
      this.setTab("chat");
    } catch (err) {
      this.loginError = err instanceof Error ? err.message : "Login failed";
    } finally {
      this.loginLoading = false;
    }
  }

  private handleLogout() {
    this.applySettings({
      ...this.settings,
      isLoggedIn: false,
      username: null,
      authToken: null,
    });
    this.setTab("login");
  }

  private async handleSendMessage() {
    if (!this.chatDraft.trim() || this.chatSending) return;

    const userMessage = this.chatDraft.trim();
    this.chatDraft = "";
    this.chatSending = true;

    // Add user message
    this.chatMessages = [...this.chatMessages, { role: "user", content: userMessage }];

    try {
      // Call Operis API for chat (Operis routes to user's gateway)
      const token = this.settings.authToken;
      if (!token) {
        throw new Error(this.lang === "vi" ? "Vui lòng đăng nhập" : "Please login first");
      }

      const response = await fetch(`${API_CONFIG.operisApiUrl}/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({ message: userMessage }),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: "Request failed" }));
        throw new Error(error.error || `HTTP ${response.status}`);
      }

      const data = await response.json();
      const assistantContent = data.content?.[0]?.text || data.content || "No response";

      this.chatMessages = [
        ...this.chatMessages,
        { role: "assistant", content: assistantContent },
      ];
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Unknown error";
      this.chatMessages = [
        ...this.chatMessages,
        { role: "assistant", content: `❌ Error: ${errorMsg}` },
      ];
    } finally {
      this.chatSending = false;
    }
  }

  // Workflow handlers
  private async loadWorkflows() {
    this.workflowLoading = true;
    this.workflowError = null;
    try {
      this.workflows = await listWorkflows();
    } catch (err) {
      this.workflowError = err instanceof Error ? err.message : "Failed to load workflows";
    } finally {
      this.workflowLoading = false;
    }
  }

  private handleWorkflowFormChange(patch: Partial<WorkflowFormState>) {
    this.workflowForm = { ...this.workflowForm, ...patch };
  }

  private async handleWorkflowSubmit() {
    if (this.workflowSaving) return;
    this.workflowSaving = true;
    try {
      await createWorkflow(this.workflowForm);
      this.workflowForm = { ...DEFAULT_WORKFLOW_FORM };
      this.workflowShowForm = false;
      await this.loadWorkflows();
    } catch (err) {
      this.workflowError = err instanceof Error ? err.message : "Failed to create workflow";
    } finally {
      this.workflowSaving = false;
    }
  }

  private async handleWorkflowToggle(workflow: Workflow) {
    try {
      await toggleWorkflow(workflow.id, !workflow.enabled);
      await this.loadWorkflows();
    } catch (err) {
      this.workflowError = err instanceof Error ? err.message : "Failed to toggle workflow";
    }
  }

  private async handleWorkflowRun(workflow: Workflow) {
    try {
      await runWorkflow(workflow.id);
      await this.loadWorkflows();
    } catch (err) {
      this.workflowError = err instanceof Error ? err.message : "Failed to run workflow";
    }
  }

  private async handleWorkflowDelete(workflow: Workflow) {
    if (!confirm(`Delete workflow "${workflow.name}"?`)) return;
    try {
      await deleteWorkflow(workflow.id);
      await this.loadWorkflows();
    } catch (err) {
      this.workflowError = err instanceof Error ? err.message : "Failed to delete workflow";
    }
  }

  // Billing handlers
  private handleBillingBuyCredits() {
    const packages = [
      { price: 5, credits: 1000 },
      { price: 50, credits: 10000 },
      { price: 500, credits: 105000 },
      { price: 1250, credits: 275000 },
    ];
    const pkg = packages[this.billingSelectedPackage];
    if (!pkg) return;

    // Generate transaction ID and QR code
    const txId = `TX${Date.now().toString(36).toUpperCase()}`;
    this.billingQrTransactionId = txId;
    // Placeholder QR image - in production this would be from payment API
    this.billingQrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(`BANK_TRANSFER:${txId}:${pkg.price}`)}`;
    this.billingQrPaymentStatus = "pending";
    this.billingQrStatusMessage = "";
    this.billingShowQrModal = true;
  }

  private handleBillingCloseQrModal() {
    this.billingShowQrModal = false;
    this.billingQrTransactionId = "";
    this.billingQrImageUrl = "";
    this.billingQrPaymentStatus = "pending";
    this.billingQrStatusMessage = "";
  }

  private handleBillingCheckTransaction() {
    // Simulate checking transaction status - in production this would call payment API
    const isSuccess = Math.random() > 0.5; // 50% chance for demo

    if (isSuccess) {
      this.billingQrPaymentStatus = "success";
      const packages = [
        { price: 5, credits: 1000 },
        { price: 50, credits: 10000 },
        { price: 500, credits: 105000 },
        { price: 1250, credits: 275000 },
      ];
      const pkg = packages[this.billingSelectedPackage];
      if (pkg) {
        this.billingCreditBalance += pkg.credits;
      }
      this.billingQrStatusMessage = this.lang === "vi"
        ? "Giao dịch thành công!"
        : "Transaction successful!";
    } else {
      this.billingQrPaymentStatus = "pending";
      this.billingQrStatusMessage = this.lang === "vi"
        ? "Bạn cần hoàn thành thanh toán của mình trước. Nếu thanh toán không thành công, liên hệ với fanpage hoặc đường dây nóng để được hỗ trợ."
        : "You need to complete your payment first. If payment is unsuccessful, contact our fanpage or hotline for support.";
    }
  }

  private handleBillingRefreshHistory() {
    const msg = this.lang === "vi"
      ? "Đã làm mới lịch sử giao dịch"
      : "Transaction history refreshed";
    alert(msg);
  }

  private handleBillingCreateKey() {
    if (!this.billingNewKeyName.trim()) return;
    const newKey = {
      id: Date.now().toString(),
      name: this.billingNewKeyName.trim(),
      key: `sk-...${Math.random().toString(36).substring(2, 8)}`,
      createdAt: Date.now(),
    };
    this.billingApiKeys = [...this.billingApiKeys, newKey];
    this.billingNewKeyName = "";
    this.billingShowCreateKeyModal = false;
  }

  private handleBillingCopyKey(key: string) {
    navigator.clipboard.writeText(key);
    const msg = this.lang === "vi" ? "Đã sao chép key!" : "Key copied!";
    alert(msg);
  }

  private handleBillingDeleteKey(id: string) {
    const confirmMsg = this.lang === "vi" ? "Xóa API key này?" : "Delete this API key?";
    if (confirm(confirmMsg)) {
      this.billingApiKeys = this.billingApiKeys.filter((k) => k.id !== id);
    }
  }

  private handleThemeClick(mode: ThemeMode, event: MouseEvent) {
    this.setTheme(mode, {
      pointerClientX: event.clientX,
      pointerClientY: event.clientY,
    });
  }

  private renderThemeToggle() {
    return html`
      <div class="theme-switcher">
        <button
          class="theme-switcher-btn ${this.theme === "system" ? "active" : ""}"
          @click=${(e: MouseEvent) => this.handleThemeClick("system", e)}
          title="System theme"
        >
          <span class="theme-switcher-icon">${icons.monitor}</span>
          <span class="theme-switcher-label">${t(this.lang, "themeAuto")}</span>
        </button>
        <button
          class="theme-switcher-btn ${this.theme === "light" ? "active" : ""}"
          @click=${(e: MouseEvent) => this.handleThemeClick("light", e)}
          title="Light mode"
        >
          <span class="theme-switcher-icon">${icons.sun}</span>
          <span class="theme-switcher-label">${t(this.lang, "themeLight")}</span>
        </button>
        <button
          class="theme-switcher-btn ${this.theme === "dark" ? "active" : ""}"
          @click=${(e: MouseEvent) => this.handleThemeClick("dark", e)}
          title="Dark mode"
        >
          <span class="theme-switcher-icon">${icons.moon}</span>
          <span class="theme-switcher-label">${t(this.lang, "themeDark")}</span>
        </button>
      </div>
    `;
  }

  private renderLanguageSwitcher() {
    return html`
      <div class="lang-switcher">
        <button
          class="lang-btn ${this.lang === "en" ? "active" : ""}"
          @click=${() => this.setLanguage("en")}
          title="English"
        >EN</button>
        <button
          class="lang-btn ${this.lang === "vi" ? "active" : ""}"
          @click=${() => this.setLanguage("vi")}
          title="Tiếng Việt"
        >VI</button>
      </div>
    `;
  }

  private getNavLabel(tab: Tab): string {
    const labels: Record<Tab, { en: string; vi: string }> = {
      chat: { en: "Chat", vi: "Trò chuyện" },
      workflow: { en: "Workflows", vi: "Workflows" },
      billing: { en: "Billing", vi: "Thanh toán" },
      logs: { en: "Logs", vi: "Nhật ký" },
      docs: { en: "Docs", vi: "Tài liệu" },
      login: { en: "Login", vi: "Đăng nhập" },
    };
    return labels[tab]?.[this.lang] ?? labels[tab]?.en ?? tab;
  }

  private renderNavItem(item: (typeof NAV_ITEMS)[number]) {
    const isActive = this.tab === item.tab;

    // Don't show login in nav if already logged in
    if (item.tab === "login" && this.settings.isLoggedIn) {
      return nothing;
    }

    return html`
      <button
        class="nav-item ${isActive ? "active" : ""}"
        @click=${() => this.setTab(item.tab)}
        title=${subtitleForTab(item.tab, this.lang)}
      >
        <span class="nav-item__icon">${icons[item.icon]}</span>
        <span class="nav-item__text">${this.getNavLabel(item.tab)}</span>
      </button>
    `;
  }

  private renderNavigation() {
    const mainItems = NAV_ITEMS.filter((item) => item.section === "main");
    const accountItems = NAV_ITEMS.filter((item) => item.section === "account");

    return html`
      <aside class="nav ${this.settings.navCollapsed ? "nav--collapsed" : ""}">
        <div class="nav-section">
          <div class="nav-section-title">${t(this.lang, "navMenu")}</div>
          <div class="nav-items">
            ${mainItems.map((item) => this.renderNavItem(item))}
          </div>
        </div>

        <div class="nav-footer">
          <div class="nav-section">
            <div class="nav-items">
              ${this.settings.isLoggedIn
                ? html`
                    <button class="nav-item" @click=${() => this.handleLogout()} title="${t(this.lang, "navLogout")}">
                      <span class="nav-item__icon">${icons.logOut}</span>
                      <span class="nav-item__text">${t(this.lang, "navLogout")}</span>
                    </button>
                  `
                : accountItems.map((item) => this.renderNavItem(item))}
            </div>
          </div>
        </div>
      </aside>
    `;
  }

  private renderContent() {
    switch (this.tab) {
      case "chat":
        return renderChat({
          lang: this.lang,
          messages: this.chatMessages,
          draft: this.chatDraft,
          sending: this.chatSending,
          isLoggedIn: this.settings.isLoggedIn,
          username: this.settings.username ?? undefined,
          onDraftChange: (value) => (this.chatDraft = value),
          onSend: () => this.handleSendMessage(),
          onLoginClick: () => this.setTab("login"),
        });
      case "billing":
        return renderBilling({
          lang: this.lang,
          creditBalance: this.billingCreditBalance,
          selectedPackage: this.billingSelectedPackage,
          onSelectPackage: (i) => (this.billingSelectedPackage = i),
          onBuyCredits: () => this.handleBillingBuyCredits(),
          // QR Payment modal props
          showQrModal: this.billingShowQrModal,
          qrTransactionId: this.billingQrTransactionId,
          qrImageUrl: this.billingQrImageUrl,
          qrPaymentStatus: this.billingQrPaymentStatus,
          qrStatusMessage: this.billingQrStatusMessage,
          onCloseQrModal: () => this.handleBillingCloseQrModal(),
          onCheckTransaction: () => this.handleBillingCheckTransaction(),
          // Auto top-up
          autoTopUp: this.billingAutoTopUp,
          onToggleAutoTopUp: () => (this.billingAutoTopUp = !this.billingAutoTopUp),
          onRefreshHistory: () => this.handleBillingRefreshHistory(),
          // API Keys
          apiKeys: this.billingApiKeys,
          showCreateKeyModal: this.billingShowCreateKeyModal,
          newKeyName: this.billingNewKeyName,
          onOpenCreateKeyModal: () => (this.billingShowCreateKeyModal = true),
          onCloseCreateKeyModal: () => {
            this.billingShowCreateKeyModal = false;
            this.billingNewKeyName = "";
          },
          onNewKeyNameChange: (n) => (this.billingNewKeyName = n),
          onCreateKey: () => this.handleBillingCreateKey(),
          onCopyKey: (k) => this.handleBillingCopyKey(k),
          onDeleteKey: (id) => this.handleBillingDeleteKey(id),
        });
      case "logs":
        return renderLogs({ lang: this.lang });
      case "workflow":
        return renderWorkflow({
          lang: this.lang,
          workflows: this.workflows,
          loading: this.workflowLoading,
          error: this.workflowError,
          showForm: this.workflowShowForm,
          form: this.workflowForm,
          saving: this.workflowSaving,
          onRefresh: () => this.loadWorkflows(),
          onShowForm: () => (this.workflowShowForm = true),
          onHideForm: () => (this.workflowShowForm = false),
          onFormChange: (patch) => this.handleWorkflowFormChange(patch),
          onSubmit: () => this.handleWorkflowSubmit(),
          onToggle: (w) => this.handleWorkflowToggle(w),
          onRun: (w) => this.handleWorkflowRun(w),
          onDelete: (w) => this.handleWorkflowDelete(w),
        });
      case "docs":
        return renderDocs({ lang: this.lang });
      case "login":
        return renderLogin({
          lang: this.lang,
          loading: this.loginLoading,
          error: this.loginError,
          onLogin: (email, password) => this.handleLogin(email, password),
        });
      default:
        return nothing;
    }
  }

  render() {
    return html`
      <div class="shell ${this.settings.navCollapsed ? "shell--nav-collapsed" : ""}">
        <header class="topbar">
          <div class="topbar-left">
            <button
              class="nav-collapse-toggle"
              @click=${() => this.toggleNav()}
              title="${this.settings.navCollapsed ? "Expand sidebar" : "Collapse sidebar"}"
            >
              <span class="nav-collapse-toggle__icon">${icons.menu}</span>
            </button>
            <div class="brand" @click=${() => this.setTab("chat")} style="cursor: pointer;">
              <div class="brand-logo">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="12" cy="12" r="10"/>
                  <path d="M12 6v6l4 2"/>
                </svg>
              </div>
              <div class="brand-text">
                <div class="brand-title">${t(this.lang, "appName")}</div>
                <div class="brand-sub">${t(this.lang, "appTagline")}</div>
              </div>
            </div>
          </div>
          <div class="topbar-right">
            ${this.renderThemeToggle()}
            ${this.renderLanguageSwitcher()}
            ${this.settings.isLoggedIn
              ? html`
                  <div class="topbar-user" @click=${() => this.setTab("billing")}>
                    <div class="topbar-avatar">${this.settings.username?.[0]?.toUpperCase() ?? "U"}</div>
                    <span class="topbar-username">${this.settings.username}</span>
                  </div>
                `
              : nothing}
          </div>
        </header>

        ${this.renderNavigation()}

        <main class="content">
          <section class="content-header">
            <div>
              <div class="page-title">${titleForTab(this.tab, this.lang)}</div>
              <div class="page-sub">${subtitleForTab(this.tab, this.lang)}</div>
            </div>
          </section>

          ${this.renderContent()}
        </main>
      </div>
    `;
  }
}
