<<<<<<< HEAD
import { html, nothing } from "lit";

export interface LoginProps {
  loading?: boolean;
  error?: string;
  onLogin: (email: string, password: string) => void;
  onNavigateToRegister?: () => void;
}

export function renderLogin(props: LoginProps) {
  const { loading = false, error } = props;

  const handleSubmit = (e: Event) => {
    e.preventDefault();
    if (loading) return;

    const form = e.target as HTMLFormElement;
    const emailInput = form.querySelector('operis-input[type="email"]') as HTMLElement & { value?: string };
    const passwordInput = form.querySelector('operis-input[type="password"]') as HTMLElement & { value?: string };

    const email = emailInput?.value?.trim() ?? "";
    const password = passwordInput?.value?.trim() ?? "";

    if (email && password) {
      props.onLogin(email, password);
    }
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === "Enter" && !loading) {
      const form = (e.target as HTMLElement).closest("form");
      if (form) {
        form.dispatchEvent(new Event("submit", { cancelable: true }));
      }
    }
  };

  return html`
    <style>
      .login-error {
        background: rgba(239, 68, 68, 0.1);
        border: 1px solid rgba(239, 68, 68, 0.3);
        color: #ef4444;
        padding: 12px 16px;
        border-radius: var(--radius-md);
        font-size: 14px;
        margin-bottom: 16px;
      }

      .login-form button[type="submit"]:disabled {
        opacity: 0.7;
        cursor: not-allowed;
      }
    </style>

=======
import { html } from "lit";
import { t, type Language } from "../i18n";

interface LoginProps {
  lang: Language;
  loading?: boolean;
  error?: string | null;
  onLogin: (email: string, password: string) => void;
}

export function renderLogin(props: LoginProps) {
  const { lang, loading, error, onLogin } = props;

  let emailValue = "";
  let passwordValue = "";

  const handleSubmit = (e: Event) => {
    e.preventDefault();
    if (emailValue.trim() && passwordValue.trim()) {
      onLogin(emailValue.trim(), passwordValue.trim());
    }
  };

  const handleEmailInput = (e: CustomEvent) => {
    emailValue = e.detail.value;
  };

  const handlePasswordInput = (e: CustomEvent) => {
    passwordValue = e.detail.value;
  };

  const txt = {
    welcome: lang === "vi" ? "Chào mừng trở lại" : "Welcome back",
    signInAccount: lang === "vi" ? "Đăng nhập vào tài khoản Operis" : "Sign in to your Operis account",
    email: lang === "vi" ? "Email" : "Email",
    password: lang === "vi" ? "Mật khẩu" : "Password",
    emailPlaceholder: "you@example.com",
    passwordPlaceholder: lang === "vi" ? "Nhập mật khẩu" : "Enter your password",
    forgotPassword: lang === "vi" ? "Quên mật khẩu?" : "Forgot password?",
    signIn: lang === "vi" ? "Đăng nhập" : "Sign in",
    orContinue: lang === "vi" ? "hoặc tiếp tục với" : "or continue with",
    demoLogin: lang === "vi" ? "Đăng nhập Demo (Tài khoản thử)" : "Demo Login (Test Account)",
    noAccount: lang === "vi" ? "Chưa có tài khoản?" : "Don't have an account?",
    signUp: lang === "vi" ? "Đăng ký" : "Sign up",
  };

  return html`
>>>>>>> origin/main
    <div class="login-container" style="position: absolute; inset: 0; background: var(--bg);">
      <div class="login-card">
        <div class="login-header">
          <div class="login-logo">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"/>
              <path d="M12 6v6l4 2"/>
            </svg>
          </div>
<<<<<<< HEAD
          <div class="login-title">Chào mừng trở lại</div>
          <div class="login-subtitle">Đăng nhập vào tài khoản Operis</div>
        </div>

        ${error ? html`<div class="login-error">${error}</div>` : nothing}

        <form class="login-form" @submit=${handleSubmit}>
          <div class="form-group">
            <label class="form-label">Email</label>
            <operis-input
              type="email"
              placeholder="you@example.com"
              required
              autocomplete="email"
              ?disabled=${loading}
              @keydown=${handleKeyDown}
=======
          <div class="login-title">${txt.welcome}</div>
          <div class="login-subtitle">${txt.signInAccount}</div>
        </div>

        <form class="login-form" @submit=${handleSubmit}>
          <div class="form-group">
            <label class="form-label">${txt.email}</label>
            <operis-input
              type="email"
              placeholder="${txt.emailPlaceholder}"
              required
              autocomplete="email"
              @input=${handleEmailInput}
>>>>>>> origin/main
            ></operis-input>
          </div>

          <div class="form-group">
<<<<<<< HEAD
            <label class="form-label">Mật khẩu</label>
            <operis-input
              type="password"
              placeholder="Nhập mật khẩu"
              required
              autocomplete="current-password"
              ?disabled=${loading}
              @keydown=${handleKeyDown}
            ></operis-input>
            <div class="form-hint" style="text-align: right;">
              <a href="#" @click=${(e: Event) => e.preventDefault()}>Quên mật khẩu?</a>
            </div>
          </div>

          <button type="submit" class="btn btn-primary" style="width: 100%;" ?disabled=${loading}>
            ${loading ? "Đang đăng nhập..." : "Đăng nhập"}
          </button>
        </form>

        <div class="login-footer">
          Chưa có tài khoản?
          <a href="#" @click=${(e: Event) => { e.preventDefault(); props.onNavigateToRegister?.(); }}>Đăng ký</a>
=======
            <label class="form-label">${txt.password}</label>
            <operis-input
              type="password"
              placeholder="${txt.passwordPlaceholder}"
              required
              autocomplete="current-password"
              @input=${handlePasswordInput}
            ></operis-input>
            <div class="form-hint" style="text-align: right;">
              <a href="#" @click=${(e: Event) => e.preventDefault()}>${txt.forgotPassword}</a>
            </div>
          </div>

          <button type="submit" class="btn btn-primary" style="width: 100%;">
            ${txt.signIn}
          </button>
        </form>

        <div class="login-divider">
          <span>${txt.orContinue}</span>
        </div>

        <button
          type="button"
          class="btn btn-ghost"
          style="width: 100%; margin-top: 12px;"
          ?disabled=${loading}
          @click=${() => onLogin("admin@operis.vn", "admin123")}
        >
          ${txt.demoLogin}
        </button>

        ${error ? html`<div class="login-error" style="color: var(--danger); text-align: center; margin-top: 12px;">${error}</div>` : ""}

        <div class="login-footer">
          ${txt.noAccount}
          <a href="#" @click=${(e: Event) => e.preventDefault()}>${txt.signUp}</a>
>>>>>>> origin/main
        </div>
      </div>
    </div>
  `;
}
