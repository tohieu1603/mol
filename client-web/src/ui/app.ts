import { LitElement, html, nothing } from "lit";
import { customElement, state } from "lit/decorators.js";

<<<<<<< HEAD
import { icons } from "./icons";
import { showToast } from "./components/operis-toast";
import { NAV_ITEMS, pathForTab, tabFromPath, type Tab } from "./navigation";
import { loadSettings, saveSettings, type ClientSettings } from "./storage";
import {
  resolveTheme,
  applyTheme,
  getSystemTheme,
  type ThemeMode,
  type ResolvedTheme,
} from "./theme";
import {
  startThemeTransition,
  type ThemeTransitionContext,
} from "./theme-transition";
import { t } from "./i18n";
=======
import { API_CONFIG } from "../config";
import { icons } from "./icons";
import { NAV_ITEMS, pathForTab, tabFromPath, type Tab } from "./navigation";
import { loadSettings, saveSettings, type ClientSettings } from "./storage";
import { resolveTheme, applyTheme, getSystemTheme, type ThemeMode, type ResolvedTheme } from "./theme";
import { startThemeTransition, type ThemeTransitionContext } from "./theme-transition";
import { t, type Language } from "./i18n";
>>>>>>> origin/main
import { renderChat } from "./views/chat";
import { renderBilling } from "./views/billing";
import { renderLogs } from "./views/logs";
import { renderWorkflow } from "./views/workflow";
import { renderDocs } from "./views/docs";
import { renderLogin } from "./views/login";
<<<<<<< HEAD
import { renderRegister } from "./views/register";
import { renderChannels } from "./views/channels";
import { renderSettings } from "./views/settings";
import { renderAgents } from "./views/agents";
import { renderSkills } from "./views/skills";
import { renderNodes } from "./views/nodes";
import type {
  AgentsListResult,
  AgentFileEntry,
  AgentsFilesListResult,
  AgentIdentityResult,
  SkillStatusReport,
  SkillMessageMap,
  DevicePairingList,
  NodeInfo,
  ChannelsStatusSnapshot,
  CronJob,
  CronStatus,
} from "./agent-types";
import type { Workflow, WorkflowFormState } from "./workflow-types";
import { DEFAULT_WORKFLOW_FORM } from "./workflow-types";
import {
  listWorkflows,
  createWorkflow,
  toggleWorkflow,
  runWorkflow,
  deleteWorkflow,
  getWorkflowRuns,
  getWorkflowStatus,
  type WorkflowStatus,
} from "./workflow-api";
import { subscribeToCronEvents, subscribeToChatStream, type CronEvent, type ChatStreamEvent } from "./gateway-client";
import {
  login as authLogin,
  logout as authLogout,
  register as authRegister,
  restoreSession,
  type AuthUser,
} from "./auth-api";
import {
  sendMessage as sendChatMessage,
  extractTextContent,
  getConversations,
  getConversationHistory,
} from "./chat-api";
import {
  getChannelsStatus,
  connectChannel,
  disconnectChannel,
  CHANNEL_DEFINITIONS,
  type ChannelStatus,
  type ChannelId,
} from "./channels-api";
import {
  getUserProfile,
  updateUserProfile,
  changePassword,
  type UserProfile,
} from "./user-api";
=======
import type { Workflow, WorkflowFormState } from "./workflow-types";
import { DEFAULT_WORKFLOW_FORM } from "./workflow-types";
import { listWorkflows, createWorkflow, toggleWorkflow, runWorkflow, deleteWorkflow } from "./workflow-api";
>>>>>>> origin/main

// Register custom components
import "./components/operis-input";
import "./components/operis-select";
import "./components/operis-modal";
<<<<<<< HEAD
import "./components/operis-datetime-picker";
import "./components/operis-confirm";
import { showConfirm } from "./components/operis-confirm";

// Get page title
function titleForTab(tab: Tab): string {
  const titles: Record<Tab, string> = {
    chat: "Trò Chuyện",
    workflow: "Luồng Công Việc",
    billing: "Thanh Toán",
    logs: "Nhật Ký",
    docs: "Tài Liệu",
    channels: "Kênh Kết Nối",
    settings: "Cài Đặt",
    login: "Đăng Nhập",
    register: "Đăng Ký",
    agents: "Agents",
    skills: "Skills",
    nodes: "Nodes",
  };
  return titles[tab] ?? tab;
}

// Get page subtitle
function subtitleForTab(tab: Tab): string {
  const subtitles: Record<Tab, string> = {
    chat: "Phiên chat trực tiếp với gateway",
    workflow: "Tự động hóa tác vụ với AI theo lịch",
    billing: "Xem sử dụng và quản lý gói",
    logs: "Xem nhật ký hệ thống",
    docs: "Hướng dẫn sử dụng",
    channels: "Kết nối ứng dụng nhắn tin",
    settings: "Cài đặt tài khoản và tùy chọn",
    login: "Truy cập tài khoản của bạn",
    register: "Tạo tài khoản mới",
    agents: "Quản lý agents và workspace",
    skills: "Quản lý skills và cài đặt",
    nodes: "Thiết bị và node kết nối",
  };
  return subtitles[tab] ?? "";
=======

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
>>>>>>> origin/main
}

@customElement("operis-app")
export class OperisApp extends LitElement {
  @state() settings: ClientSettings = loadSettings();
  @state() tab: Tab = "chat";
  @state() theme: ThemeMode = this.settings.theme ?? "system";
<<<<<<< HEAD
  @state() themeResolved: ResolvedTheme = "dark";

  // Chat state
  @state() chatMessages: Array<{
    role: "user" | "assistant";
    content: string;
    timestamp?: Date;
  }> = [];
  @state() chatDraft = "";
  @state() chatSending = false;
  @state() chatConversationId: string | null = null;
  @state() chatError: string | null = null;
  @state() chatHistoryLoaded = false;
  @state() chatInitializing = true;
  // Streaming state
  @state() chatStreamingText = "";
  @state() chatStreamingRunId: string | null = null;
=======
  @state() lang: Language = this.settings.language ?? "en";
  @state() themeResolved: ResolvedTheme = "dark";

  // Chat state
  @state() chatMessages: Array<{ role: "user" | "assistant"; content: string }> = [];
  @state() chatDraft = "";
  @state() chatSending = false;
>>>>>>> origin/main

  // Login state
  @state() loginLoading = false;
  @state() loginError: string | null = null;
<<<<<<< HEAD
  @state() currentUser: AuthUser | null = null;

  // Register state
  @state() registerLoading = false;
  @state() registerError: string | null = null;
=======
>>>>>>> origin/main

  // Workflow state
  @state() workflows: Workflow[] = [];
  @state() workflowLoading = false;
  @state() workflowError: string | null = null;
<<<<<<< HEAD
  @state() workflowForm: WorkflowFormState = { ...DEFAULT_WORKFLOW_FORM };
  @state() workflowSaving = false;
  @state() workflowExpandedId: string | null = null;
  @state() runningWorkflowIds: Set<string> = new Set();
  @state() workflowStatus: WorkflowStatus | null = null;
  // Run history state
  @state() workflowRunsId: string | null = null;
  @state() workflowRuns: Array<{ ts: number; status: string; summary?: string; durationMs?: number; error?: string }> = [];
  @state() workflowRunsLoading = false;
=======
  @state() workflowShowForm = false;
  @state() workflowForm: WorkflowFormState = { ...DEFAULT_WORKFLOW_FORM };
  @state() workflowSaving = false;
>>>>>>> origin/main

  // Billing state
  @state() billingCreditBalance = 80;
  @state() billingSelectedPackage = 1;
  @state() billingAutoTopUp = false;
<<<<<<< HEAD
  @state() billingApiKeys: Array<{
    id: string;
    name: string;
    key: string;
    createdAt: number;
  }> = [
    {
      id: "1",
      name: "Production API",
      key: "sk-...abc123",
      createdAt: Date.now() - 86400000 * 7,
    },
    {
      id: "2",
      name: "Development",
      key: "sk-...xyz789",
      createdAt: Date.now() - 86400000 * 2,
    },
=======
  @state() billingApiKeys: Array<{ id: string; name: string; key: string; createdAt: number }> = [
    { id: "1", name: "Production API", key: "sk-...abc123", createdAt: Date.now() - 86400000 * 7 },
    { id: "2", name: "Development", key: "sk-...xyz789", createdAt: Date.now() - 86400000 * 2 },
>>>>>>> origin/main
  ];
  @state() billingShowCreateKeyModal = false;
  @state() billingNewKeyName = "";
  // QR Payment state
  @state() billingShowQrModal = false;
  @state() billingQrTransactionId = "";
  @state() billingQrImageUrl = "";
  @state() billingQrPaymentStatus: "pending" | "success" | "failed" = "pending";
  @state() billingQrStatusMessage = "";

<<<<<<< HEAD
  // Channels state
  @state() channels: ChannelStatus[] = [];
  @state() channelsLoading = false;
  @state() channelsError: string | null = null;
  @state() channelsConnecting: ChannelId | null = null;

  // Settings state
  @state() userProfile: UserProfile | null = null;
  @state() settingsLoading = false;
  @state() settingsSaving = false;
  @state() settingsError: string | null = null;
  @state() settingsSuccess: string | null = null;
  @state() settingsEditingName = false;
  @state() settingsNameValue = "";
  @state() settingsShowPasswordForm = false;

  // Agents state
  @state() agentsLoading = false;
  @state() agentsError: string | null = null;
  @state() agentsList: AgentsListResult | null = null;
  @state() agentSelectedId: string | null = null;
  @state() agentActivePanel: "overview" | "files" | "tools" | "skills" | "channels" | "cron" = "overview";
  // Agent config state
  @state() agentConfigForm: Record<string, unknown> | null = null;
  @state() agentConfigLoading = false;
  @state() agentConfigSaving = false;
  @state() agentConfigDirty = false;
  // Agent files state
  @state() agentFilesLoading = false;
  @state() agentFilesError: string | null = null;
  @state() agentFilesList: AgentsFilesListResult | null = null;
  @state() agentFileActive: string | null = null;
  @state() agentFileContents: Record<string, string> = {};
  @state() agentFileDrafts: Record<string, string> = {};
  @state() agentFileSaving = false;
  // Agent identity state
  @state() agentIdentityById: Record<string, AgentIdentityResult> = {};
  // Agent channels state
  @state() agentChannelsLoading = false;
  @state() agentChannelsError: string | null = null;
  @state() agentChannelsSnapshot: ChannelsStatusSnapshot | null = null;
  // Agent cron state
  @state() agentCronLoading = false;
  @state() agentCronError: string | null = null;
  @state() agentCronStatus: CronStatus | null = null;
  @state() agentCronJobs: CronJob[] = [];

  // Skills state
  @state() skillsLoading = false;
  @state() skillsError: string | null = null;
  @state() skillsReport: SkillStatusReport | null = null;
  @state() skillsFilter = "";
  @state() skillsEdits: Record<string, string> = {};
  @state() skillsBusyKey: string | null = null;
  @state() skillsMessages: SkillMessageMap = {};

  // Nodes state
  @state() nodesLoading = false;
  @state() nodesList: NodeInfo[] = [];
  @state() devicesLoading = false;
  @state() devicesError: string | null = null;
  @state() devicesList: DevicePairingList | null = null;

  private themeMedia: MediaQueryList | null = null;
  private themeMediaHandler: ((event: MediaQueryListEvent) => void) | null =
    null;
  private popStateHandler = () => this.handlePopState();
  private cronEventUnsubscribe: (() => void) | null = null;
  private chatStreamUnsubscribe: (() => void) | null = null;
=======
  private themeMedia: MediaQueryList | null = null;
  private themeMediaHandler: ((event: MediaQueryListEvent) => void) | null = null;
  private popStateHandler = () => this.handlePopState();
>>>>>>> origin/main

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
<<<<<<< HEAD
    // Redirect to chat if already logged in and on login/register page
    if ((initialTab === "login" || initialTab === "register") && this.settings.isLoggedIn) {
=======
    // Redirect to chat if already logged in and on login page
    if (initialTab === "login" && this.settings.isLoggedIn) {
>>>>>>> origin/main
      initialTab = "chat";
      window.history.replaceState({}, "", pathForTab("chat"));
    }
    if (initialTab) {
      this.tab = initialTab;
      // Load data for initial tab
<<<<<<< HEAD
      if (initialTab === "chat") {
        this.loadChatHistory();
      } else if (initialTab === "workflow") {
        this.loadWorkflows();
      } else if (initialTab === "channels") {
        this.loadChannels();
      } else if (initialTab === "settings") {
        this.loadUserProfile();
        this.loadChannels();
=======
      if (initialTab === "workflow") {
        this.loadWorkflows();
>>>>>>> origin/main
      }
    }

    // Listen for browser navigation
    window.addEventListener("popstate", this.popStateHandler);
<<<<<<< HEAD

    // Subscribe to cron events for real-time workflow updates
    this.cronEventUnsubscribe = subscribeToCronEvents((evt: CronEvent) => {
      this.handleCronEvent(evt);
    });

    // Subscribe to chat stream events for real-time message streaming
    this.chatStreamUnsubscribe = subscribeToChatStream((evt: ChatStreamEvent) => {
      this.handleChatStreamEvent(evt);
    });

    // Try to restore session from stored tokens
    this.tryRestoreSession();
  }

  private handleCronEvent(evt: CronEvent) {
    // Track running workflows
    if (evt.action === "started") {
      this.runningWorkflowIds = new Set([...this.runningWorkflowIds, evt.jobId]);
    } else if (evt.action === "finished") {
      const newSet = new Set(this.runningWorkflowIds);
      newSet.delete(evt.jobId);
      this.runningWorkflowIds = newSet;
    }

    // Auto-refresh workflows when on workflow tab
    if (this.tab === "workflow") {
      // Debounce: only refresh if not already loading
      if (!this.workflowLoading) {
        this.loadWorkflows();
      }
    }
  }

  private handleChatStreamEvent(evt: ChatStreamEvent) {
    // Only process events if we're actively sending a message
    if (!this.chatSending) return;

    if (evt.state === "delta" && evt.message?.content) {
      // Extract text from content blocks
      const text = evt.message.content
        .filter((block) => block.type === "text" && block.text)
        .map((block) => block.text)
        .join("");

      const isFirstDelta = !this.chatStreamingRunId;
      this.chatStreamingText = text;
      this.chatStreamingRunId = evt.runId;
      // Only scroll on first delta to avoid janky continuous scrolling
      if (isFirstDelta) {
        this.scrollChatToBottom();
      }
    } else if (evt.state === "final") {
      // Final message received - add to messages and clear streaming state
      const finalText = evt.message?.content
        ?.filter((block) => block.type === "text" && block.text)
        .map((block) => block.text)
        .join("") || this.chatStreamingText;

      if (finalText) {
        this.chatMessages = [
          ...this.chatMessages,
          { role: "assistant", content: finalText, timestamp: new Date() },
        ];
      }

      this.chatStreamingText = "";
      this.chatStreamingRunId = null;
      this.chatSending = false;
      this.scrollChatToBottom();
    } else if (evt.state === "error") {
      // Error occurred - show error message
      const errorMsg = evt.errorMessage || "Có lỗi xảy ra khi xử lý tin nhắn";
      this.chatMessages = [
        ...this.chatMessages,
        { role: "assistant", content: `⚠️ ${errorMsg}`, timestamp: new Date() },
      ];
      this.chatStreamingText = "";
      this.chatStreamingRunId = null;
      this.chatSending = false;
      this.scrollChatToBottom();
    }
  }

  private async tryRestoreSession() {
    try {
      const user = await restoreSession();
      if (user) {
        this.currentUser = user;
        this.applySettings({
          ...this.settings,
          isLoggedIn: true,
          username: user.name,
        });
        // Redirect from login page if logged in
        if (this.tab === "login") {
          this.chatInitializing = true;
          this.setTab("chat");
        } else if (this.tab === "chat") {
          this.loadChatHistory();
        }
      } else {
        // No session, stop loading on chat page
        this.chatInitializing = false;
      }
    } catch {
      // Session restore failed, user needs to login
      this.chatInitializing = false;
    }
=======
>>>>>>> origin/main
  }

  disconnectedCallback() {
    if (this.themeMedia && this.themeMediaHandler) {
      this.themeMedia.removeEventListener("change", this.themeMediaHandler);
    }
    window.removeEventListener("popstate", this.popStateHandler);
<<<<<<< HEAD
    // Unsubscribe from cron events
    this.cronEventUnsubscribe?.();
    this.cronEventUnsubscribe = null;
    // Unsubscribe from chat stream events
    this.chatStreamUnsubscribe?.();
    this.chatStreamUnsubscribe = null;
=======
>>>>>>> origin/main
    super.disconnectedCallback();
  }

  private handlePopState() {
    let tab = tabFromPath(window.location.pathname);
<<<<<<< HEAD
    // Redirect to chat if already logged in and on login/register page
    if ((tab === "login" || tab === "register") && this.settings.isLoggedIn) {
=======
    // Redirect to chat if already logged in and on login page
    if (tab === "login" && this.settings.isLoggedIn) {
>>>>>>> origin/main
      tab = "chat";
      window.history.replaceState({}, "", pathForTab("chat"));
    }
    if (tab) {
      this.tab = tab;
    }
  }

  private setTab(tab: Tab) {
<<<<<<< HEAD
    // Redirect to chat if already logged in and trying to go to login/register
    if ((tab === "login" || tab === "register") && this.settings.isLoggedIn) {
=======
    // Redirect to chat if already logged in and trying to go to login
    if (tab === "login" && this.settings.isLoggedIn) {
>>>>>>> origin/main
      tab = "chat";
    }
    if (tab === this.tab) return;
    this.tab = tab;
    const path = pathForTab(tab);
    window.history.pushState({}, "", path);

    // Load data for specific tabs
<<<<<<< HEAD
    if (tab === "chat") {
      this.loadChatHistory();
      // Always scroll to last user message when entering chat
      this.scrollChatToBottom();
    } else if (tab === "workflow") {
      this.loadWorkflows();
    } else if (tab === "channels") {
      this.loadChannels();
    } else if (tab === "settings") {
      this.loadUserProfile();
      this.loadChannels();
    } else if (tab === "agents") {
      this.loadAgents();
    } else if (tab === "skills") {
      this.loadSkills();
    } else if (tab === "nodes") {
      this.loadNodes();
      this.loadDevices();
    }
  }

  private async loadChatHistory() {
    // Skip if not logged in or already loaded
    if (!this.settings.isLoggedIn || this.chatHistoryLoaded) {
      this.chatInitializing = false;
      return;
    }

    try {
      // Get latest conversation
      const { conversations } = await getConversations();
      if (conversations.length === 0) {
        this.chatInitializing = false;
        return;
      }

      // Load the most recent conversation
      const latest = conversations[0];
      this.chatConversationId = latest.conversation_id;

      const { messages } = await getConversationHistory(latest.conversation_id);
      this.chatMessages = messages.map((m) => ({
        role: m.role,
        content: m.content,
        timestamp: m.created_at ? new Date(m.created_at) : undefined,
      }));
      this.chatHistoryLoaded = true;
      // Scroll to bottom after loading
      this.scrollChatToBottom();
    } catch (err) {
      console.error("[chat] Failed to load history:", err);
      // Don't show error to user, just start fresh
    } finally {
      this.chatInitializing = false;
    }
  }

  private scrollChatToBottom() {
    // Wait for DOM update then scroll to last user message
    requestAnimationFrame(() => {
      const messagesEl = this.renderRoot.querySelector(
        ".gc-messages",
      ) as HTMLElement;
      if (!messagesEl) return;

      // Find the last user message element
      const userMessages = messagesEl.querySelectorAll(".gc-message--user");
      const lastUserMsg = userMessages[userMessages.length - 1] as HTMLElement;

      if (lastUserMsg) {
        // Calculate scroll position with offset to avoid being hidden by fade/header
        const messageTop = lastUserMsg.offsetTop;
        messagesEl.scrollTop = Math.max(0, messageTop - 40);
      } else {
        // Fallback to bottom if no user messages
        messagesEl.scrollTop = messagesEl.scrollHeight;
      }
    });
  }

=======
    if (tab === "workflow") {
      this.loadWorkflows();
    }
  }

>>>>>>> origin/main
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

<<<<<<< HEAD
=======
  private setLanguage(lang: Language) {
    this.lang = lang;
    this.applySettings({ ...this.settings, language: lang });
  }

>>>>>>> origin/main
  private async handleLogin(email: string, password: string) {
    this.loginLoading = true;
    this.loginError = null;

    try {
<<<<<<< HEAD
      const result = await authLogin(email, password);
      this.currentUser = result.user;
      this.applySettings({
        ...this.settings,
        isLoggedIn: true,
        username: result.user.name,
      });
      // Reset chat state for fresh load
      this.chatInitializing = true;
      this.chatHistoryLoaded = false;
      this.setTab("chat");
    } catch (err) {
      this.loginError =
        err instanceof Error ? err.message : "Đăng nhập thất bại";
=======
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
>>>>>>> origin/main
    } finally {
      this.loginLoading = false;
    }
  }

<<<<<<< HEAD
  private async handleRegister(email: string, password: string, name: string) {
    this.registerLoading = true;
    this.registerError = null;

    try {
      const result = await authRegister(email, password, name);
      this.currentUser = result.user;
      this.applySettings({
        ...this.settings,
        isLoggedIn: true,
        username: result.user.name,
      });
      // Reset chat state for fresh load
      this.chatInitializing = true;
      this.chatHistoryLoaded = false;
      this.setTab("chat");
    } catch (err) {
      this.registerError =
        err instanceof Error ? err.message : "Đăng ký thất bại";
    } finally {
      this.registerLoading = false;
    }
  }

  private async handleLogout() {
    try {
      await authLogout();
    } catch {
      // Ignore logout errors
    }
    this.currentUser = null;
    // Reset chat state
    this.chatMessages = [];
    this.chatConversationId = null;
    this.chatHistoryLoaded = false;
=======
  private handleLogout() {
>>>>>>> origin/main
    this.applySettings({
      ...this.settings,
      isLoggedIn: false,
      username: null,
<<<<<<< HEAD
=======
      authToken: null,
>>>>>>> origin/main
    });
    this.setTab("login");
  }

  private async handleSendMessage() {
    if (!this.chatDraft.trim() || this.chatSending) return;

    const userMessage = this.chatDraft.trim();
    this.chatDraft = "";
    this.chatSending = true;
<<<<<<< HEAD
    this.chatError = null;
    this.chatStreamingText = "";
    this.chatStreamingRunId = null;

    // Add user message
    this.chatMessages = [
      ...this.chatMessages,
      { role: "user", content: userMessage, timestamp: new Date() },
    ];
    this.scrollChatToBottom();

    try {
      // Call real Operis Chat API - response will come through WebSocket streaming
      const result = await sendChatMessage(
        userMessage,
        this.chatConversationId ?? undefined,
      );

      // Store conversation ID for context
      this.chatConversationId = result.conversationId;

      // If no streaming happened (fallback), add the response directly
      if (this.chatSending && !this.chatStreamingRunId) {
        const assistantText = extractTextContent(result.content);
        this.chatMessages = [
          ...this.chatMessages,
          { role: "assistant", content: assistantText, timestamp: new Date() },
        ];
        this.scrollChatToBottom();
        this.chatSending = false;
      }
    } catch (err) {
      const errorMsg =
        err instanceof Error ? err.message : "Không thể gửi tin nhắn";

      // User-friendly error messages
      let displayError: string;
      if (errorMsg.includes("503") || errorMsg.includes("unavailable")) {
        displayError =
          "Dịch vụ chat tạm thời không khả dụng. Vui lòng thử lại sau.";
      } else if (
        errorMsg.includes("401") ||
        errorMsg.includes("Unauthorized")
      ) {
        displayError = "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.";
      } else if (
        errorMsg.includes("insufficient") ||
        errorMsg.includes("balance")
      ) {
        displayError = "Số dư token không đủ. Vui lòng nạp thêm.";
      } else {
        displayError = errorMsg;
      }

      this.chatError = displayError;
      this.chatMessages = [
        ...this.chatMessages,
        { role: "assistant", content: `⚠️ ${displayError}`, timestamp: new Date() },
      ];
      this.chatStreamingText = "";
      this.chatStreamingRunId = null;
      this.chatSending = false;
      this.scrollChatToBottom();
=======

    // Add user message
    this.chatMessages = [...this.chatMessages, { role: "user", content: userMessage }];

    try {
      const token = this.settings.authToken;
      if (!token) {
        throw new Error(this.lang === "vi" ? "Vui lòng đăng nhập" : "Please login first");
      }

      // Use streaming endpoint with SSE
      const response = await fetch(`${API_CONFIG.operisApiUrl}/chat/stream`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ message: userMessage }),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: "Request failed" }));
        throw new Error(error.error || `HTTP ${response.status}`);
      }

      if (!response.body) {
        throw new Error("No response body");
      }

      // Add empty assistant message for streaming
      const assistantIndex = this.chatMessages.length;
      this.chatMessages = [...this.chatMessages, { role: "assistant", content: "" }];

      // Read SSE stream
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (line.startsWith("event: ")) {
            // Event type line - read next data line
            continue;
          }
          if (line.startsWith("data: ")) {
            const data = line.slice(6).trim();
            if (!data) continue;

            try {
              const parsed = JSON.parse(data);

              // Handle content delta
              if (parsed.content !== undefined) {
                const updated = [...this.chatMessages];
                updated[assistantIndex] = {
                  role: "assistant",
                  content: parsed.content,
                };
                this.chatMessages = updated;
              }

              // Handle error
              if (parsed.error) {
                const updated = [...this.chatMessages];
                updated[assistantIndex] = {
                  role: "assistant",
                  content: `❌ ${parsed.error}`,
                };
                this.chatMessages = updated;
              }
            } catch {
              // Skip invalid JSON
            }
          }
        }
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Unknown error";
      this.chatMessages = [
        ...this.chatMessages.filter((m) => m.content !== ""),
        { role: "assistant", content: `❌ Error: ${errorMsg}` },
      ];
    } finally {
      this.chatSending = false;
>>>>>>> origin/main
    }
  }

  // Workflow handlers
  private async loadWorkflows() {
    this.workflowLoading = true;
    this.workflowError = null;
<<<<<<< HEAD
    const startTime = Date.now();
    try {
      // Load both workflows and status in parallel
      const [workflows, status] = await Promise.all([
        listWorkflows(),
        getWorkflowStatus(),
      ]);
      this.workflows = workflows;
      this.workflowStatus = status;
    } catch (err) {
      this.workflowError =
        err instanceof Error ? err.message : "Không thể tải workflows";
    } finally {
      // Ensure minimum 400ms loading time for visible feedback
      const elapsed = Date.now() - startTime;
      const minDelay = 400;
      if (elapsed < minDelay) {
        await new Promise(r => setTimeout(r, minDelay - elapsed));
      }
=======
    try {
      this.workflows = await listWorkflows();
    } catch (err) {
      this.workflowError = err instanceof Error ? err.message : "Failed to load workflows";
    } finally {
>>>>>>> origin/main
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
<<<<<<< HEAD
      showToast(`Đã tạo workflow "${this.workflowForm.name}"`, "success");
      this.workflowForm = { ...DEFAULT_WORKFLOW_FORM };
      await this.loadWorkflows();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Không thể tạo workflow";
      showToast(msg, "error");
      this.workflowError = msg;
=======
      this.workflowForm = { ...DEFAULT_WORKFLOW_FORM };
      this.workflowShowForm = false;
      await this.loadWorkflows();
    } catch (err) {
      this.workflowError = err instanceof Error ? err.message : "Failed to create workflow";
>>>>>>> origin/main
    } finally {
      this.workflowSaving = false;
    }
  }

  private async handleWorkflowToggle(workflow: Workflow) {
    try {
<<<<<<< HEAD
      const newState = !workflow.enabled;
      await toggleWorkflow(workflow.id, newState);
      showToast(
        newState ? `Đã kích hoạt "${workflow.name}"` : `Đã tạm dừng "${workflow.name}"`,
        "success"
      );
      await this.loadWorkflows();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Không thể thay đổi trạng thái";
      showToast(msg, "error");
      this.workflowError = msg;
=======
      await toggleWorkflow(workflow.id, !workflow.enabled);
      await this.loadWorkflows();
    } catch (err) {
      this.workflowError = err instanceof Error ? err.message : "Failed to toggle workflow";
>>>>>>> origin/main
    }
  }

  private async handleWorkflowRun(workflow: Workflow) {
    try {
      await runWorkflow(workflow.id);
<<<<<<< HEAD
      showToast(`Đang chạy "${workflow.name}"...`, "info");
      await this.loadWorkflows();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Không thể chạy workflow";
      showToast(msg, "error");
      this.workflowError = msg;
=======
      await this.loadWorkflows();
    } catch (err) {
      this.workflowError = err instanceof Error ? err.message : "Failed to run workflow";
>>>>>>> origin/main
    }
  }

  private async handleWorkflowDelete(workflow: Workflow) {
<<<<<<< HEAD
    const confirmed = await showConfirm({
      title: "Xóa workflow?",
      message: `Bạn có chắc muốn xóa workflow "${workflow.name}"? Hành động này không thể hoàn tác.`,
      confirmText: "Xóa",
      cancelText: "Hủy",
      variant: "danger",
    });
    if (!confirmed) return;
    try {
      await deleteWorkflow(workflow.id);
      showToast(`Đã xóa "${workflow.name}"`, "success");
      await this.loadWorkflows();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Không thể xóa workflow";
      showToast(msg, "error");
      this.workflowError = msg;
    }
  }

  private async loadWorkflowRuns(workflowId: string | null) {
    // Toggle off - clear runs
    if (!workflowId) {
      this.workflowRunsId = null;
      this.workflowRuns = [];
      return;
    }
    this.workflowRunsId = workflowId;
    this.workflowRunsLoading = true;
    try {
      const runs = await getWorkflowRuns(workflowId);
      this.workflowRuns = runs;
    } catch (err) {
      console.error("Failed to load workflow runs:", err);
      this.workflowRuns = [];
    } finally {
      this.workflowRunsLoading = false;
=======
    if (!confirm(`Delete workflow "${workflow.name}"?`)) return;
    try {
      await deleteWorkflow(workflow.id);
      await this.loadWorkflows();
    } catch (err) {
      this.workflowError = err instanceof Error ? err.message : "Failed to delete workflow";
>>>>>>> origin/main
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
<<<<<<< HEAD
      this.billingQrStatusMessage = "Giao dịch thành công!";
    } else {
      this.billingQrPaymentStatus = "pending";
      this.billingQrStatusMessage =
        "Bạn cần hoàn thành thanh toán của mình trước. Nếu thanh toán không thành công, liên hệ với fanpage hoặc đường dây nóng để được hỗ trợ.";
=======
      this.billingQrStatusMessage = this.lang === "vi"
        ? "Giao dịch thành công!"
        : "Transaction successful!";
    } else {
      this.billingQrPaymentStatus = "pending";
      this.billingQrStatusMessage = this.lang === "vi"
        ? "Bạn cần hoàn thành thanh toán của mình trước. Nếu thanh toán không thành công, liên hệ với fanpage hoặc đường dây nóng để được hỗ trợ."
        : "You need to complete your payment first. If payment is unsuccessful, contact our fanpage or hotline for support.";
>>>>>>> origin/main
    }
  }

  private handleBillingRefreshHistory() {
<<<<<<< HEAD
    alert("Đã làm mới lịch sử giao dịch");
=======
    const msg = this.lang === "vi"
      ? "Đã làm mới lịch sử giao dịch"
      : "Transaction history refreshed";
    alert(msg);
>>>>>>> origin/main
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
<<<<<<< HEAD
    alert("Đã sao chép key!");
  }

  private async handleBillingDeleteKey(id: string) {
    const confirmed = await showConfirm({
      title: "Xóa API key?",
      message: "Bạn có chắc muốn xóa API key này? Hành động này không thể hoàn tác.",
      confirmText: "Xóa",
      cancelText: "Hủy",
      variant: "danger",
    });
    if (confirmed) {
=======
    const msg = this.lang === "vi" ? "Đã sao chép key!" : "Key copied!";
    alert(msg);
  }

  private handleBillingDeleteKey(id: string) {
    const confirmMsg = this.lang === "vi" ? "Xóa API key này?" : "Delete this API key?";
    if (confirm(confirmMsg)) {
>>>>>>> origin/main
      this.billingApiKeys = this.billingApiKeys.filter((k) => k.id !== id);
    }
  }

<<<<<<< HEAD
  // Channels handlers
  private async loadChannels() {
    this.channelsLoading = true;
    this.channelsError = null;
    try {
      this.channels = await getChannelsStatus();
    } catch (err) {
      this.channelsError =
        err instanceof Error ? err.message : "Không thể tải kênh";
      // Fallback to default channels
      this.channels = Object.entries(CHANNEL_DEFINITIONS).map(([id, def]) => ({
        id: id as ChannelId,
        name: def.name,
        icon: def.icon,
        connected: false,
      }));
    } finally {
      this.channelsLoading = false;
    }
  }

  private async handleChannelConnect(channelId: ChannelId) {
    this.channelsConnecting = channelId;
    this.channelsError = null;
    try {
      await connectChannel(channelId);
      await this.loadChannels();
    } catch (err) {
      this.channelsError =
        err instanceof Error ? err.message : "Không thể kết nối kênh";
    } finally {
      this.channelsConnecting = null;
    }
  }

  private async handleChannelDisconnect(channelId: ChannelId) {
    this.channelsConnecting = channelId;
    this.channelsError = null;
    try {
      await disconnectChannel(channelId);
      await this.loadChannels();
    } catch (err) {
      this.channelsError =
        err instanceof Error ? err.message : "Không thể ngắt kết nối kênh";
    } finally {
      this.channelsConnecting = null;
    }
  }

  // Settings handlers
  private async loadUserProfile() {
    this.settingsLoading = true;
    this.settingsError = null;
    try {
      this.userProfile = await getUserProfile();
      this.settingsNameValue = this.userProfile.name;
    } catch (err) {
      this.settingsError =
        err instanceof Error ? err.message : "Không thể tải hồ sơ";
    } finally {
      this.settingsLoading = false;
    }
  }

  private handleEditName() {
    this.settingsEditingName = true;
    this.settingsNameValue = this.userProfile?.name || "";
  }

  private handleCancelEditName() {
    this.settingsEditingName = false;
    this.settingsNameValue = this.userProfile?.name || "";
  }

  private async handleSaveName() {
    if (!this.settingsNameValue.trim()) return;
    this.settingsSaving = true;
    this.settingsError = null;
    this.settingsSuccess = null;
    try {
      this.userProfile = await updateUserProfile({
        name: this.settingsNameValue.trim(),
      });
      this.settingsEditingName = false;
      this.settingsSuccess = "Đã cập nhật thành công";
      setTimeout(() => (this.settingsSuccess = null), 3000);
    } catch (err) {
      this.settingsError =
        err instanceof Error ? err.message : "Không thể cập nhật hồ sơ";
    } finally {
      this.settingsSaving = false;
    }
  }

  private async handleChangePassword(
    currentPassword: string,
    newPassword: string,
  ) {
    this.settingsSaving = true;
    this.settingsError = null;
    this.settingsSuccess = null;
    try {
      await changePassword(currentPassword, newPassword);
      this.settingsShowPasswordForm = false;
      this.settingsSuccess = "Đổi mật khẩu thành công";
      setTimeout(() => (this.settingsSuccess = null), 3000);
    } catch (err) {
      this.settingsError =
        err instanceof Error ? err.message : "Không thể đổi mật khẩu";
    } finally {
      this.settingsSaving = false;
    }
  }

  // Agents handlers
  private async loadAgents() {
    this.agentsLoading = true;
    this.agentsError = null;
    try {
      // TODO: Call actual API when available
      // For now, provide empty data
      this.agentsList = { defaultId: "", mainKey: "", scope: "", agents: [] };
    } catch (err) {
      this.agentsError = err instanceof Error ? err.message : "Không thể tải agents";
    } finally {
      this.agentsLoading = false;
    }
  }

  private handleSelectAgent(agentId: string) {
    this.agentSelectedId = agentId;
    this.agentActivePanel = "overview";
  }

  private async loadAgentFiles(agentId: string) {
    this.agentFilesLoading = true;
    this.agentFilesError = null;
    try {
      // TODO: Call actual API when available
      this.agentFilesList = { agentId, workspace: "", files: [] };
    } catch (err) {
      this.agentFilesError = err instanceof Error ? err.message : "Không thể tải files";
    } finally {
      this.agentFilesLoading = false;
    }
  }

  private handleSelectFile(name: string) {
    this.agentFileActive = name;
  }

  private handleFileDraftChange(name: string, content: string) {
    this.agentFileDrafts = { ...this.agentFileDrafts, [name]: content };
  }

  private handleFileReset(name: string) {
    const base = this.agentFileContents[name] ?? "";
    this.agentFileDrafts = { ...this.agentFileDrafts, [name]: base };
  }

  private async handleFileSave(name: string) {
    this.agentFileSaving = true;
    try {
      // TODO: Call actual API when available
      const content = this.agentFileDrafts[name] ?? "";
      this.agentFileContents = { ...this.agentFileContents, [name]: content };
      showToast("Đã lưu file", "success");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Không thể lưu file", "error");
    } finally {
      this.agentFileSaving = false;
    }
  }

  private async loadAgentConfig() {
    if (!this.agentSelectedId) return;
    this.agentConfigLoading = true;
    try {
      // TODO: Call actual API when available
      this.agentConfigForm = {};
      this.agentConfigDirty = false;
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Không thể tải config", "error");
    } finally {
      this.agentConfigLoading = false;
    }
  }

  private async saveAgentConfig() {
    if (!this.agentSelectedId) return;
    this.agentConfigSaving = true;
    try {
      // TODO: Call actual API when available
      showToast("Đã lưu config", "success");
      this.agentConfigDirty = false;
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Không thể lưu config", "error");
    } finally {
      this.agentConfigSaving = false;
    }
  }

  private handleAgentModelChange(agentId: string, modelId: string | null) {
    this.agentConfigForm = { ...this.agentConfigForm, primaryModel: modelId };
    this.agentConfigDirty = true;
  }

  private handleAgentModelFallbacksChange(agentId: string, fallbacks: string[]) {
    this.agentConfigForm = { ...this.agentConfigForm, modelFallbacks: fallbacks };
    this.agentConfigDirty = true;
  }

  private async loadAgentChannels() {
    this.agentChannelsLoading = true;
    this.agentChannelsError = null;
    try {
      // TODO: Call actual API when available
      this.agentChannelsSnapshot = { channels: [] };
    } catch (err) {
      this.agentChannelsError = err instanceof Error ? err.message : "Không thể tải channels";
    } finally {
      this.agentChannelsLoading = false;
    }
  }

  private async loadAgentCron() {
    this.agentCronLoading = true;
    this.agentCronError = null;
    try {
      // TODO: Call actual API when available
      this.agentCronStatus = { enabled: false, jobs: 0 };
      this.agentCronJobs = [];
    } catch (err) {
      this.agentCronError = err instanceof Error ? err.message : "Không thể tải cron jobs";
    } finally {
      this.agentCronLoading = false;
    }
  }

  // Skills handlers
  private async loadSkills() {
    this.skillsLoading = true;
    this.skillsError = null;
    try {
      // TODO: Call actual API when available
      this.skillsReport = { workspaceDir: "", managedSkillsDir: "", skills: [] };
    } catch (err) {
      this.skillsError = err instanceof Error ? err.message : "Không thể tải skills";
    } finally {
      this.skillsLoading = false;
    }
  }

  private async handleSkillToggle(skillKey: string, currentDisabled: boolean) {
    this.skillsBusyKey = skillKey;
    try {
      // TODO: Call actual API when available
      showToast(currentDisabled ? "Đã bật skill" : "Đã tắt skill", "success");
      await this.loadSkills();
    } catch (err) {
      this.skillsMessages = {
        ...this.skillsMessages,
        [skillKey]: { kind: "error", message: err instanceof Error ? err.message : "Lỗi" },
      };
    } finally {
      this.skillsBusyKey = null;
    }
  }

  private handleSkillEdit(skillKey: string, value: string) {
    this.skillsEdits = { ...this.skillsEdits, [skillKey]: value };
  }

  private async handleSkillSaveKey(skillKey: string) {
    this.skillsBusyKey = skillKey;
    try {
      // TODO: Call actual API when available
      showToast("Đã lưu API key", "success");
      this.skillsMessages = {
        ...this.skillsMessages,
        [skillKey]: { kind: "success", message: "Đã lưu" },
      };
    } catch (err) {
      this.skillsMessages = {
        ...this.skillsMessages,
        [skillKey]: { kind: "error", message: err instanceof Error ? err.message : "Lỗi" },
      };
    } finally {
      this.skillsBusyKey = null;
    }
  }

  private async handleSkillInstall(skillKey: string, name: string, installId: string) {
    this.skillsBusyKey = skillKey;
    try {
      // TODO: Call actual API when available
      showToast(`Đang cài đặt ${name}...`, "info");
      await this.loadSkills();
    } catch (err) {
      this.skillsMessages = {
        ...this.skillsMessages,
        [skillKey]: { kind: "error", message: err instanceof Error ? err.message : "Lỗi cài đặt" },
      };
    } finally {
      this.skillsBusyKey = null;
    }
  }

  // Nodes handlers
  private async loadNodes() {
    this.nodesLoading = true;
    try {
      // TODO: Call actual API when available
      this.nodesList = [];
    } catch (err) {
      console.error("Failed to load nodes:", err);
    } finally {
      this.nodesLoading = false;
    }
  }

  private async loadDevices() {
    this.devicesLoading = true;
    this.devicesError = null;
    try {
      // TODO: Call actual API when available
      this.devicesList = { pending: [], paired: [] };
    } catch (err) {
      this.devicesError = err instanceof Error ? err.message : "Không thể tải thiết bị";
    } finally {
      this.devicesLoading = false;
    }
  }

  private async handleDeviceApprove(requestId: string) {
    try {
      // TODO: Call actual API when available
      showToast("Đã chấp nhận thiết bị", "success");
      await this.loadDevices();
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Lỗi", "error");
    }
  }

  private async handleDeviceReject(requestId: string) {
    try {
      // TODO: Call actual API when available
      showToast("Đã từ chối thiết bị", "success");
      await this.loadDevices();
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Lỗi", "error");
    }
  }

  private async handleDeviceRotate(deviceId: string, role: string, scopes?: string[]) {
    try {
      // TODO: Call actual API when available
      showToast("Đã rotate token", "success");
      await this.loadDevices();
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Lỗi", "error");
    }
  }

  private async handleDeviceRevoke(deviceId: string, role: string) {
    try {
      // TODO: Call actual API when available
      showToast("Đã revoke token", "success");
      await this.loadDevices();
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Lỗi", "error");
    }
  }

=======
>>>>>>> origin/main
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
<<<<<<< HEAD
          title="Tự động"
        >
          <span class="theme-switcher-icon">${icons.monitor}</span>
          <span class="theme-switcher-label">${t("themeAuto")}</span>
=======
          title="System theme"
        >
          <span class="theme-switcher-icon">${icons.monitor}</span>
          <span class="theme-switcher-label">${t(this.lang, "themeAuto")}</span>
>>>>>>> origin/main
        </button>
        <button
          class="theme-switcher-btn ${this.theme === "light" ? "active" : ""}"
          @click=${(e: MouseEvent) => this.handleThemeClick("light", e)}
<<<<<<< HEAD
          title="Sáng"
        >
          <span class="theme-switcher-icon">${icons.sun}</span>
          <span class="theme-switcher-label">${t("themeLight")}</span>
=======
          title="Light mode"
        >
          <span class="theme-switcher-icon">${icons.sun}</span>
          <span class="theme-switcher-label">${t(this.lang, "themeLight")}</span>
>>>>>>> origin/main
        </button>
        <button
          class="theme-switcher-btn ${this.theme === "dark" ? "active" : ""}"
          @click=${(e: MouseEvent) => this.handleThemeClick("dark", e)}
<<<<<<< HEAD
          title="Tối"
        >
          <span class="theme-switcher-icon">${icons.moon}</span>
          <span class="theme-switcher-label">${t("themeDark")}</span>
=======
          title="Dark mode"
        >
          <span class="theme-switcher-icon">${icons.moon}</span>
          <span class="theme-switcher-label">${t(this.lang, "themeDark")}</span>
>>>>>>> origin/main
        </button>
      </div>
    `;
  }

<<<<<<< HEAD
  private getNavLabel(tab: Tab): string {
    const labels: Record<Tab, string> = {
      chat: "Trò chuyện",
      workflow: "Workflows",
      billing: "Thanh toán",
      logs: "Nhật ký",
      docs: "Tài liệu",
      channels: "Kênh",
      settings: "Cài đặt",
      login: "Đăng nhập",
      register: "Đăng ký",
      agents: "Agents",
      skills: "Skills",
      nodes: "Nodes",
    };
    return labels[tab] ?? tab;
=======
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
>>>>>>> origin/main
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
<<<<<<< HEAD
        title=${subtitleForTab(item.tab)}
=======
        title=${subtitleForTab(item.tab, this.lang)}
>>>>>>> origin/main
      >
        <span class="nav-item__icon">${icons[item.icon]}</span>
        <span class="nav-item__text">${this.getNavLabel(item.tab)}</span>
      </button>
    `;
  }

  private renderNavigation() {
    const mainItems = NAV_ITEMS.filter((item) => item.section === "main");
<<<<<<< HEAD
    const agentItems = NAV_ITEMS.filter((item) => item.section === "agent");
=======
    const accountItems = NAV_ITEMS.filter((item) => item.section === "account");
>>>>>>> origin/main

    return html`
      <aside class="nav ${this.settings.navCollapsed ? "nav--collapsed" : ""}">
        <div class="nav-section">
<<<<<<< HEAD
          <div class="nav-section-title">${t("navMenu")}</div>
=======
          <div class="nav-section-title">${t(this.lang, "navMenu")}</div>
>>>>>>> origin/main
          <div class="nav-items">
            ${mainItems.map((item) => this.renderNavItem(item))}
          </div>
        </div>

<<<<<<< HEAD
        ${agentItems.length > 0 ? html`
          <div class="nav-section">
            <div class="nav-section-title">Agent</div>
            <div class="nav-items">
              ${agentItems.map((item) => this.renderNavItem(item))}
            </div>
          </div>
        ` : nothing}

=======
>>>>>>> origin/main
        <div class="nav-footer">
          <div class="nav-section">
            <div class="nav-items">
              ${this.settings.isLoggedIn
                ? html`
<<<<<<< HEAD
                    <button
                      class="nav-item ${this.tab === "settings"
                        ? "active"
                        : ""}"
                      @click=${() => this.setTab("settings")}
                      title="${subtitleForTab("settings")}"
                    >
                      <span class="nav-item__icon">${icons.settings}</span>
                      <span class="nav-item__text"
                        >${this.getNavLabel("settings")}</span
                      >
                    </button>
                    <button
                      class="nav-item"
                      @click=${() => this.handleLogout()}
                      title="${t("navLogout")}"
                    >
                      <span class="nav-item__icon">${icons.logOut}</span>
                      <span class="nav-item__text">${t("navLogout")}</span>
                    </button>
                  `
                : html`
                    <button
                      class="nav-item ${this.tab === "login" ? "active" : ""}"
                      @click=${() => this.setTab("login")}
                      title="${subtitleForTab("login")}"
                    >
                      <span class="nav-item__icon">${icons.logIn}</span>
                      <span class="nav-item__text">${t("navLogin")}</span>
                    </button>
                  `}
=======
                    <button class="nav-item" @click=${() => this.handleLogout()} title="${t(this.lang, "navLogout")}">
                      <span class="nav-item__icon">${icons.logOut}</span>
                      <span class="nav-item__text">${t(this.lang, "navLogout")}</span>
                    </button>
                  `
                : accountItems.map((item) => this.renderNavItem(item))}
>>>>>>> origin/main
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
<<<<<<< HEAD
          messages: this.chatMessages,
          draft: this.chatDraft,
          sending: this.chatSending,
          loading: this.chatInitializing,
          isLoggedIn: this.settings.isLoggedIn,
          username: this.settings.username ?? undefined,
          botName: "Operis",
          streamingText: this.chatStreamingText,
=======
          lang: this.lang,
          messages: this.chatMessages,
          draft: this.chatDraft,
          sending: this.chatSending,
          isLoggedIn: this.settings.isLoggedIn,
          username: this.settings.username ?? undefined,
>>>>>>> origin/main
          onDraftChange: (value) => (this.chatDraft = value),
          onSend: () => this.handleSendMessage(),
          onLoginClick: () => this.setTab("login"),
        });
      case "billing":
        return renderBilling({
<<<<<<< HEAD
=======
          lang: this.lang,
>>>>>>> origin/main
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
<<<<<<< HEAD
          onToggleAutoTopUp: () =>
            (this.billingAutoTopUp = !this.billingAutoTopUp),
=======
          onToggleAutoTopUp: () => (this.billingAutoTopUp = !this.billingAutoTopUp),
>>>>>>> origin/main
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
<<<<<<< HEAD
        return renderLogs({});
      case "workflow":
        return renderWorkflow({
          workflows: this.workflows,
          loading: this.workflowLoading,
          error: this.workflowError,
          form: this.workflowForm,
          saving: this.workflowSaving,
          status: this.workflowStatus,
          onRefresh: () => this.loadWorkflows(),
=======
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
>>>>>>> origin/main
          onFormChange: (patch) => this.handleWorkflowFormChange(patch),
          onSubmit: () => this.handleWorkflowSubmit(),
          onToggle: (w) => this.handleWorkflowToggle(w),
          onRun: (w) => this.handleWorkflowRun(w),
          onDelete: (w) => this.handleWorkflowDelete(w),
<<<<<<< HEAD
          onToggleDetails: (id: string) => {
            this.workflowExpandedId = this.workflowExpandedId === id ? null : id;
          },
          expandedWorkflowId: this.workflowExpandedId,
          runningWorkflowIds: this.runningWorkflowIds,
          // Run history
          runsWorkflowId: this.workflowRunsId,
          runs: this.workflowRuns,
          runsLoading: this.workflowRunsLoading,
          onLoadRuns: (id: string | null) => this.loadWorkflowRuns(id),
        });
      case "docs":
        return renderDocs({});
      case "channels":
        return renderChannels({
          channels: this.channels,
          loading: this.channelsLoading,
          error: this.channelsError ?? undefined,
          connectingChannel: this.channelsConnecting ?? undefined,
          onConnect: (channel) => this.handleChannelConnect(channel),
          onDisconnect: (channel) => this.handleChannelDisconnect(channel),
          onRefresh: () => this.loadChannels(),
        });
      case "settings":
        return renderSettings({
          user: this.userProfile,
          loading: this.settingsLoading,
          saving: this.settingsSaving,
          error: this.settingsError ?? undefined,
          successMessage: this.settingsSuccess ?? undefined,
          // Profile
          editingName: this.settingsEditingName,
          nameValue: this.settingsNameValue,
          onEditName: () => this.handleEditName(),
          onCancelEditName: () => this.handleCancelEditName(),
          onNameChange: (value) => (this.settingsNameValue = value),
          onSaveName: () => this.handleSaveName(),
          // Channels
          channels: this.channels,
          channelsLoading: this.channelsLoading,
          connectingChannel: this.channelsConnecting ?? undefined,
          onConnectChannel: (channel) => this.handleChannelConnect(channel),
          onDisconnectChannel: (channel) =>
            this.handleChannelDisconnect(channel),
          onRefreshChannels: () => this.loadChannels(),
          // Security
          showPasswordForm: this.settingsShowPasswordForm,
          onTogglePasswordForm: () =>
            (this.settingsShowPasswordForm = !this.settingsShowPasswordForm),
          onChangePassword: (current, newPwd) =>
            this.handleChangePassword(current, newPwd),
          // Navigation
          onNavigate: (tab) => this.setTab(tab as Tab),
        });
      case "login":
        return renderLogin({
          loading: this.loginLoading,
          error: this.loginError ?? undefined,
          onLogin: (email, password) => this.handleLogin(email, password),
          onNavigateToRegister: () => this.setTab("register"),
        });
      case "register":
        return renderRegister({
          loading: this.registerLoading,
          error: this.registerError ?? undefined,
          onRegister: (email, password, name) =>
            this.handleRegister(email, password, name),
          onNavigateToLogin: () => this.setTab("login"),
        });
      case "agents":
        return renderAgents({
          loading: this.agentsLoading,
          error: this.agentsError,
          agentsList: this.agentsList,
          selectedAgentId: this.agentSelectedId,
          activePanel: this.agentActivePanel,
          // Config state
          configForm: this.agentConfigForm,
          configLoading: this.agentConfigLoading,
          configSaving: this.agentConfigSaving,
          configDirty: this.agentConfigDirty,
          // Files state
          agentFilesLoading: this.agentFilesLoading,
          agentFilesError: this.agentFilesError,
          agentFilesList: this.agentFilesList,
          agentFileActive: this.agentFileActive,
          agentFileContents: this.agentFileContents,
          agentFileDrafts: this.agentFileDrafts,
          agentFileSaving: this.agentFileSaving,
          // Identity state
          agentIdentityById: this.agentIdentityById,
          // Channels state
          channelsLoading: this.agentChannelsLoading,
          channelsError: this.agentChannelsError,
          channelsSnapshot: this.agentChannelsSnapshot,
          // Cron state
          cronLoading: this.agentCronLoading,
          cronStatus: this.agentCronStatus,
          cronJobs: this.agentCronJobs,
          cronError: this.agentCronError,
          // Callbacks
          onRefresh: () => this.loadAgents(),
          onSelectAgent: (id: string) => this.handleSelectAgent(id),
          onSelectPanel: (panel: "overview" | "files" | "tools" | "skills" | "channels" | "cron") => (this.agentActivePanel = panel),
          onLoadFiles: (id: string) => this.loadAgentFiles(id),
          onSelectFile: (name: string) => this.handleSelectFile(name),
          onFileDraftChange: (name: string, content: string) => this.handleFileDraftChange(name, content),
          onFileReset: (name: string) => this.handleFileReset(name),
          onFileSave: (name: string) => this.handleFileSave(name),
          onConfigReload: () => this.loadAgentConfig(),
          onConfigSave: () => this.saveAgentConfig(),
          onModelChange: (agentId: string, modelId: string | null) => this.handleAgentModelChange(agentId, modelId),
          onModelFallbacksChange: (agentId: string, fallbacks: string[]) => this.handleAgentModelFallbacksChange(agentId, fallbacks),
          onChannelsRefresh: () => this.loadAgentChannels(),
          onCronRefresh: () => this.loadAgentCron(),
        });
      case "skills":
        return renderSkills({
          loading: this.skillsLoading,
          report: this.skillsReport,
          error: this.skillsError,
          filter: this.skillsFilter,
          edits: this.skillsEdits,
          busyKey: this.skillsBusyKey,
          messages: this.skillsMessages,
          onFilterChange: (val: string) => (this.skillsFilter = val),
          onRefresh: () => this.loadSkills(),
          onToggle: (key: string, enabled: boolean) => this.handleSkillToggle(key, enabled),
          onEdit: (key: string, val: string) => this.handleSkillEdit(key, val),
          onSaveKey: (key: string) => this.handleSkillSaveKey(key),
          onInstall: (key: string, name: string, installId: string) => this.handleSkillInstall(key, name, installId),
        });
      case "nodes":
        return renderNodes({
          loading: this.nodesLoading,
          nodes: this.nodesList,
          devicesLoading: this.devicesLoading,
          devicesError: this.devicesError,
          devicesList: this.devicesList,
          onRefresh: () => this.loadNodes(),
          onDevicesRefresh: () => this.loadDevices(),
          onDeviceApprove: (reqId: string) => this.handleDeviceApprove(reqId),
          onDeviceReject: (reqId: string) => this.handleDeviceReject(reqId),
          onDeviceRotate: (deviceId: string, role: string, scopes?: string[]) => this.handleDeviceRotate(deviceId, role, scopes),
          onDeviceRevoke: (deviceId: string, role: string) => this.handleDeviceRevoke(deviceId, role),
=======
        });
      case "docs":
        return renderDocs({ lang: this.lang });
      case "login":
        return renderLogin({
          lang: this.lang,
          loading: this.loginLoading,
          error: this.loginError,
          onLogin: (email, password) => this.handleLogin(email, password),
>>>>>>> origin/main
        });
      default:
        return nothing;
    }
  }

  render() {
    return html`
<<<<<<< HEAD
      <div
        class="shell ${this.settings.navCollapsed || this.tab === "login" || this.tab === "register"
          ? "shell--nav-collapsed"
          : ""}"
      >
        <header class="topbar">
          <div class="topbar-left">
            ${this.tab !== "login" && this.tab !== "register"
              ? html`
                  <button
                    class="nav-collapse-toggle"
                    @click=${() => this.toggleNav()}
                    title="${this.settings.navCollapsed ? "Mở rộng" : "Thu gọn"}"
                  >
                    <span class="nav-collapse-toggle__icon">${icons.menu}</span>
                  </button>
                `
              : nothing}
            <div
              class="brand"
              @click=${() => this.setTab("chat")}
              style="cursor: pointer;"
            >
              <div class="brand-logo">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                >
                  <circle cx="12" cy="12" r="10" />
                  <path d="M12 6v6l4 2" />
                </svg>
              </div>
              <div class="brand-text">
                <div class="brand-title">${t("appName")}</div>
                <div class="brand-sub">${t("appTagline")}</div>
=======
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
>>>>>>> origin/main
              </div>
            </div>
          </div>
          <div class="topbar-right">
            ${this.renderThemeToggle()}
<<<<<<< HEAD
            ${this.settings.isLoggedIn
              ? html`
                  <div
                    class="topbar-user"
                    @click=${() => this.setTab("settings")}
                  >
                    <div class="topbar-avatar">
                      ${this.settings.username?.[0]?.toUpperCase() ?? "U"}
                    </div>
                    <span class="topbar-username"
                      >${this.settings.username}</span
                    >
=======
            ${this.renderLanguageSwitcher()}
            ${this.settings.isLoggedIn
              ? html`
                  <div class="topbar-user" @click=${() => this.setTab("billing")}>
                    <div class="topbar-avatar">${this.settings.username?.[0]?.toUpperCase() ?? "U"}</div>
                    <span class="topbar-username">${this.settings.username}</span>
>>>>>>> origin/main
                  </div>
                `
              : nothing}
          </div>
        </header>

<<<<<<< HEAD
        ${this.tab !== "login" && this.tab !== "register" ? this.renderNavigation() : nothing}

        <main class="content ${this.tab === "login" || this.tab === "register" ? "content--no-scroll" : ""}">
          ${this.tab !== "login" && this.tab !== "register"
            ? html`
                <section class="content-header">
                  <div>
                    <div class="page-title">${titleForTab(this.tab)}</div>
                    <div class="page-sub">${subtitleForTab(this.tab)}</div>
                  </div>
                </section>
              `
            : nothing}

          ${this.renderContent()}
        </main>

=======
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
>>>>>>> origin/main
      </div>
    `;
  }
}
