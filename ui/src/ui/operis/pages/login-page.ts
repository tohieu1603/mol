import { LitElement, html, css } from "lit";
import { customElement, state } from "lit/decorators.js";
import { operisApi } from "../api.js";

/**
 * Login Page Component
 */
@customElement("login-page")
export class LoginPage extends LitElement {
  static styles = css`
    :host {
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      background: #0f172a;
    }

    .login-card {
      width: 100%;
      max-width: 400px;
      background: #1e293b;
      border: 1px solid #334155;
      border-radius: 12px;
      padding: 40px;
    }

    .logo {
      text-align: center;
      margin-bottom: 32px;
    }

    .logo h1 {
      font-size: 28px;
      font-weight: 700;
      color: #f1f5f9;
      margin: 0 0 8px;
    }

    .logo p {
      color: #64748b;
      font-size: 14px;
      margin: 0;
    }

    .form-group {
      margin-bottom: 20px;
    }

    .form-label {
      display: block;
      margin-bottom: 8px;
      font-size: 14px;
      font-weight: 500;
      color: #94a3b8;
    }

    .form-input {
      width: 100%;
      padding: 12px 16px;
      background: #0f172a;
      border: 1px solid #334155;
      border-radius: 8px;
      color: #f1f5f9;
      font-size: 14px;
      transition: border-color 0.2s;
      box-sizing: border-box;
    }

    .form-input:focus {
      outline: none;
      border-color: #3b82f6;
    }

    .form-input::placeholder {
      color: #475569;
    }

    .error-message {
      padding: 12px 16px;
      background: rgba(239, 68, 68, 0.1);
      border: 1px solid #ef4444;
      border-radius: 8px;
      color: #ef4444;
      font-size: 14px;
      margin-bottom: 20px;
    }

    .submit-btn {
      width: 100%;
      padding: 12px;
      background: #3b82f6;
      border: none;
      border-radius: 8px;
      color: white;
      font-size: 14px;
      font-weight: 500;
      cursor: pointer;
      transition: background 0.2s;
    }

    .submit-btn:hover {
      background: #2563eb;
    }

    .submit-btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .spinner {
      display: inline-block;
      width: 16px;
      height: 16px;
      border: 2px solid rgba(255, 255, 255, 0.3);
      border-top-color: white;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
      margin-right: 8px;
    }

    @keyframes spin {
      to {
        transform: rotate(360deg);
      }
    }
  `;

  @state() email = "";
  @state() password = "";
  @state() loading = false;
  @state() error = "";

  async handleSubmit(e: Event) {
    e.preventDefault();
    this.error = "";
    this.loading = true;

    try {
      const result = await operisApi.login(this.email, this.password);
      this.dispatchEvent(
        new CustomEvent("login-success", {
          detail: { user: result.user },
          bubbles: true,
          composed: true,
        })
      );
    } catch (err) {
      this.error = err instanceof Error ? err.message : "Login failed";
    } finally {
      this.loading = false;
    }
  }

  render() {
    return html`
      <div class="login-card">
        <div class="logo">
          <h1>Operis</h1>
          <p>Sign in to admin dashboard</p>
        </div>

        ${this.error
          ? html`<div class="error-message">${this.error}</div>`
          : ""}

        <form @submit=${this.handleSubmit}>
          <div class="form-group">
            <label class="form-label">Email</label>
            <input
              type="email"
              class="form-input"
              placeholder="admin@example.com"
              .value=${this.email}
              @input=${(e: InputEvent) =>
                (this.email = (e.target as HTMLInputElement).value)}
              required
            />
          </div>

          <div class="form-group">
            <label class="form-label">Password</label>
            <input
              type="password"
              class="form-input"
              placeholder="••••••••"
              .value=${this.password}
              @input=${(e: InputEvent) =>
                (this.password = (e.target as HTMLInputElement).value)}
              required
            />
          </div>

          <button type="submit" class="submit-btn" ?disabled=${this.loading}>
            ${this.loading
              ? html`<span class="spinner"></span>Signing in...`
              : "Sign In"}
          </button>
        </form>
      </div>
    `;
  }
}
