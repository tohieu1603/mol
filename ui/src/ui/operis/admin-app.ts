import { LitElement, html, css } from "lit";
import { customElement, state } from "lit/decorators.js";
import { operisApi, type OperisUser } from "./api.js";

// Import pages
import "./pages/login-page.js";
import "./pages/dashboard-page.js";
import "./pages/users-page.js";
import "./pages/admin-deposits-page.js";
import "./pages/api-keys-page.js";
import "./pages/tokens-page.js";
import "./pages/settings-page.js";

type AdminPage = "login" | "dashboard" | "users" | "api-keys" | "transactions" | "deposits" | "settings";

/**
 * Operis Admin Dashboard App
 * Using design system from /ui/src/styles
 */
@customElement("operis-admin")
export class OperisAdmin extends LitElement {
  static styles = css`
    :host {
      display: block;
      min-height: 100vh;
      /* Design system colors */
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
      --radius-md: 8px;
      background: var(--bg);
      color: var(--text);
      font-family: "Space Grotesk", -apple-system, BlinkMacSystemFont, sans-serif;
    }

    .layout {
      display: flex;
      min-height: 100vh;
    }

    .sidebar {
      width: 220px;
      background: var(--card);
      border-right: 1px solid var(--border);
      padding: 20px 0;
      display: flex;
      flex-direction: column;
    }

    .logo {
      padding: 0 20px 20px;
      border-bottom: 1px solid var(--border);
      margin-bottom: 16px;
    }

    .logo h1 {
      font-size: 18px;
      font-weight: 700;
      color: var(--text-strong);
      margin: 0;
      letter-spacing: -0.02em;
    }

    .logo span {
      font-size: 11px;
      color: var(--muted);
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }

    .nav {
      flex: 1;
      padding: 0 8px;
    }

    .nav-item {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 10px 12px;
      color: var(--muted);
      text-decoration: none;
      font-size: 13px;
      font-weight: 500;
      cursor: pointer;
      border-radius: var(--radius-md);
      margin-bottom: 4px;
      transition: all 0.15s ease;
    }

    .nav-item:hover {
      background: var(--bg-elevated);
      color: var(--text);
    }

    .nav-item.active {
      background: var(--accent);
      color: white;
    }

    .nav-item svg {
      width: 16px;
      height: 16px;
      stroke-width: 1.5;
    }

    .user-info {
      padding: 16px 20px;
      border-top: 1px solid var(--border);
    }

    .user-name {
      font-size: 13px;
      font-weight: 600;
      color: var(--text-strong);
    }

    .user-email {
      font-size: 11px;
      color: var(--muted);
      margin-top: 2px;
    }

    .logout-btn {
      margin-top: 12px;
      padding: 8px 12px;
      background: var(--bg-elevated);
      border: 1px solid var(--border);
      border-radius: var(--radius-md);
      color: var(--text);
      font-size: 12px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.15s ease;
    }

    .logout-btn:hover {
      background: var(--border);
      border-color: var(--border-strong);
    }

    .main {
      flex: 1;
      padding: 24px 32px;
      overflow-y: auto;
      background: var(--bg);
    }
  `;

  @state() currentPage: AdminPage = "login";
  @state() user: OperisUser | null = null;

  connectedCallback() {
    super.connectedCallback();
    // Store gateway token and clean URL
    this.storeGatewayToken();
    this.checkAuth();
    window.addEventListener("popstate", this.handlePopState);
  }

  private storeGatewayToken() {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");
    if (token) {
      sessionStorage.setItem("gateway_token", token);
      // Clean URL - remove token param but keep hash
      const cleanUrl = window.location.pathname + window.location.hash;
      window.history.replaceState({}, "", cleanUrl);
    }
  }

  disconnectedCallback() {
    window.removeEventListener("popstate", this.handlePopState);
    super.disconnectedCallback();
  }

  private handlePopState = () => {
    this.updatePageFromHash();
  };

  private checkAuth() {
    if (operisApi.isAuthenticated()) {
      this.user = operisApi.getStoredUser();
      this.updatePageFromHash();
    } else {
      this.currentPage = "login";
    }
  }

  private updatePageFromHash() {
    const hash = window.location.hash.slice(1) || "dashboard";
    const validPages: AdminPage[] = ["dashboard", "users", "api-keys", "transactions", "deposits"];
    if (validPages.includes(hash as AdminPage)) {
      this.currentPage = hash as AdminPage;
    } else {
      this.currentPage = "dashboard";
    }
  }

  handleLogin(e: CustomEvent<{ user: OperisUser }>) {
    this.user = e.detail.user;
    this.currentPage = "dashboard";
    window.location.hash = "dashboard";
  }

  handleLogout() {
    operisApi.logout();
    this.user = null;
    this.currentPage = "login";
    window.location.hash = "";
  }

  navigateTo(page: AdminPage) {
    this.currentPage = page;
    window.location.hash = page;
  }

  renderSidebar() {
    const navItems: { page: AdminPage; label: string; icon: string }[] = [
      { page: "dashboard", label: "Dashboard", icon: "home" },
      { page: "users", label: "Users", icon: "users" },
      { page: "api-keys", label: "API Keys", icon: "key" },
      { page: "transactions", label: "Transactions", icon: "history" },
      { page: "deposits", label: "Deposits", icon: "wallet" },
      { page: "settings", label: "Settings", icon: "settings" },
    ];

    return html`
      <aside class="sidebar">
        <div class="logo">
          <h1>Operis</h1>
          <span>Admin</span>
        </div>

        <nav class="nav">
          ${navItems.map(
            (item) => html`
              <div
                class="nav-item ${this.currentPage === item.page ? "active" : ""}"
                @click=${() => this.navigateTo(item.page)}
              >
                ${this.renderIcon(item.icon)}
                <span>${item.label}</span>
              </div>
            `
          )}
        </nav>

        <div class="user-info">
          <div class="user-name">${this.user?.name}</div>
          <div class="user-email">${this.user?.email}</div>
          <button class="logout-btn" @click=${this.handleLogout}>Logout</button>
        </div>
      </aside>
    `;
  }

  renderIcon(name: string) {
    const icons: Record<string, string> = {
      home: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>`,
      users: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>`,
      key: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/></svg>`,
      history: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>`,
      wallet: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M21 4H3a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h18a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2z"/><path d="M16 12h.01"/><path d="M1 10h22"/></svg>`,
      settings: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>`,
    };
    const wrapper = document.createElement("span");
    wrapper.innerHTML = icons[name] || "";
    return html`${wrapper.firstChild}`;
  }

  renderPage() {
    switch (this.currentPage) {
      case "login":
        return html`<login-page @login-success=${this.handleLogin}></login-page>`;
      case "dashboard":
        return html`<dashboard-page></dashboard-page>`;
      case "users":
        return html`<users-page></users-page>`;
      case "api-keys":
        return html`<api-keys-page></api-keys-page>`;
      case "transactions":
        return html`<tokens-page></tokens-page>`;
      case "deposits":
        return html`<admin-deposits-page></admin-deposits-page>`;
      case "settings":
        return html`<settings-page></settings-page>`;
      default:
        return html`<dashboard-page></dashboard-page>`;
    }
  }

  render() {
    if (this.currentPage === "login") {
      return this.renderPage();
    }

    return html`
      <div class="layout">
        ${this.renderSidebar()}
        <main class="main">${this.renderPage()}</main>
      </div>
    `;
  }
}
