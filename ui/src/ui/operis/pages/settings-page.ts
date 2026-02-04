import { LitElement, html, css } from "lit";
import { customElement, state } from "lit/decorators.js";
import { operisApi } from "../api.js";

interface ProviderConfig {
  id: string;
  name: string;
  apiKey: string;
  isActive: boolean;
  models: string[];
}

interface SystemSettings {
  defaultProvider: string;
  defaultModel: string;
  providers: ProviderConfig[];
}

/**
 * Settings Page - Configure AI providers and models
 */
@customElement("settings-page")
export class SettingsPage extends LitElement {
  static styles = css`
    :host {
      display: block;
    }

    .header {
      margin-bottom: 24px;
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

    .section {
      margin-bottom: 32px;
    }

    .section-title {
      font-size: 16px;
      font-weight: 600;
      color: #f1f5f9;
      margin: 0 0 16px;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .card {
      background: #1e293b;
      border: 1px solid #334155;
      border-radius: 12px;
      overflow: hidden;
    }

    .card-body {
      padding: 20px;
    }

    .form-group {
      margin-bottom: 20px;
    }

    .form-group:last-child {
      margin-bottom: 0;
    }

    .form-label {
      display: block;
      font-size: 13px;
      font-weight: 500;
      color: #94a3b8;
      margin-bottom: 8px;
    }

    .form-input,
    .form-select {
      width: 100%;
      padding: 10px 14px;
      background: #0f172a;
      border: 1px solid #334155;
      border-radius: 8px;
      color: #f1f5f9;
      font-size: 14px;
      box-sizing: border-box;
      transition: border-color 0.15s ease;
    }

    .form-input:focus,
    .form-select:focus {
      outline: none;
      border-color: #3b82f6;
    }

    .form-input::placeholder {
      color: #475569;
    }

    .form-hint {
      font-size: 12px;
      color: #64748b;
      margin-top: 6px;
    }

    .provider-list {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .provider-card {
      display: flex;
      align-items: center;
      gap: 16px;
      padding: 16px;
      background: #0f172a;
      border: 1px solid #334155;
      border-radius: 8px;
      transition: border-color 0.15s ease;
    }

    .provider-card:hover {
      border-color: #475569;
    }

    .provider-card.active {
      border-color: #22c55e;
      background: rgba(34, 197, 94, 0.05);
    }

    .provider-icon {
      width: 40px;
      height: 40px;
      border-radius: 8px;
      background: #1e293b;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 18px;
      font-weight: 700;
      color: #94a3b8;
      flex-shrink: 0;
    }

    .provider-info {
      flex: 1;
      min-width: 0;
    }

    .provider-name {
      font-weight: 600;
      color: #f1f5f9;
      margin-bottom: 2px;
    }

    .provider-status {
      font-size: 12px;
      color: #64748b;
    }

    .provider-status.configured {
      color: #22c55e;
    }

    .provider-actions {
      display: flex;
      gap: 8px;
    }

    .btn {
      padding: 8px 16px;
      border: 1px solid #334155;
      border-radius: 6px;
      background: #1e293b;
      color: #f1f5f9;
      font-size: 13px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.15s ease;
    }

    .btn:hover {
      background: #334155;
      border-color: #475569;
    }

    .btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .btn-primary {
      background: #3b82f6;
      border-color: #3b82f6;
    }

    .btn-primary:hover {
      background: #2563eb;
      border-color: #2563eb;
    }

    .btn-success {
      background: rgba(34, 197, 94, 0.2);
      border-color: transparent;
      color: #22c55e;
    }

    .btn-success:hover {
      background: rgba(34, 197, 94, 0.3);
    }

    .btn-danger {
      background: rgba(239, 68, 68, 0.2);
      border-color: transparent;
      color: #ef4444;
    }

    .btn-danger:hover {
      background: rgba(239, 68, 68, 0.3);
    }

    .btn-sm {
      padding: 6px 12px;
      font-size: 12px;
    }

    /* Modal */
    .modal-overlay {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.7);
      z-index: 1000;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .modal {
      background: #1e293b;
      border: 1px solid #334155;
      border-radius: 12px;
      padding: 24px;
      width: 420px;
      max-width: 90%;
    }

    .modal h3 {
      margin: 0 0 20px;
      font-size: 18px;
      color: #f1f5f9;
    }

    .modal-footer {
      display: flex;
      gap: 12px;
      justify-content: flex-end;
      margin-top: 24px;
    }

    .badge {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 11px;
      font-weight: 500;
    }

    .badge-success {
      background: rgba(34, 197, 94, 0.2);
      color: #22c55e;
    }

    .badge-warning {
      background: rgba(245, 158, 11, 0.2);
      color: #f59e0b;
    }

    .loading {
      text-align: center;
      padding: 60px;
      color: #64748b;
    }

    .save-bar {
      position: fixed;
      bottom: 0;
      left: 240px;
      right: 0;
      padding: 16px 24px;
      background: #0f172a;
      border-top: 1px solid #334155;
      display: flex;
      align-items: center;
      justify-content: flex-end;
      gap: 12px;
      z-index: 100;
    }

    .save-bar.hidden {
      display: none;
    }
  `;

  @state() loading = true;
  @state() saving = false;
  @state() hasChanges = false;

  // Settings
  @state() defaultProvider = "anthropic";
  @state() defaultModel = "claude-sonnet-4-20250514";
  @state() providers: ProviderConfig[] = [
    { id: "anthropic", name: "Anthropic", apiKey: "", isActive: false, models: ["claude-sonnet-4-20250514", "claude-3-5-sonnet-20241022", "claude-3-opus-20240229", "claude-3-haiku-20240307"] },
    { id: "openai", name: "OpenAI", apiKey: "", isActive: false, models: ["gpt-4o", "gpt-4o-mini", "gpt-4-turbo", "gpt-3.5-turbo"] },
    { id: "deepseek", name: "DeepSeek", apiKey: "", isActive: false, models: ["deepseek-chat", "deepseek-coder", "deepseek-reasoner"] },
    { id: "mimo", name: "Mimo", apiKey: "", isActive: false, models: ["mimo-7b", "mimo-13b", "mimo-70b"] },
    { id: "google", name: "Google AI", apiKey: "", isActive: false, models: ["gemini-2.0-flash", "gemini-1.5-pro", "gemini-1.5-flash"] },
    { id: "groq", name: "Groq", apiKey: "", isActive: false, models: ["llama-3.3-70b-versatile", "llama-3.1-8b-instant", "mixtral-8x7b-32768"] },
  ];

  // Modal
  @state() showApiKeyModal = false;
  @state() editingProvider: ProviderConfig | null = null;
  @state() tempApiKey = "";

  connectedCallback() {
    super.connectedCallback();
    this.loadSettings();
  }

  async loadSettings() {
    this.loading = true;
    try {
      const settings = await operisApi.getSettings().catch(() => null);
      if (settings) {
        this.defaultProvider = settings.defaultProvider || "openai";
        this.defaultModel = settings.defaultModel || "gpt-4o";
        // Merge saved providers with defaults
        for (const savedProvider of settings.providers || []) {
          const provider = this.providers.find((p) => p.id === savedProvider.id);
          if (provider) {
            provider.apiKey = savedProvider.apiKey || "";
            provider.isActive = !!savedProvider.apiKey;
          }
        }
      }
    } catch (err) {
      console.error("Failed to load settings:", err);
    } finally {
      this.loading = false;
    }
  }

  openApiKeyModal(provider: ProviderConfig) {
    this.editingProvider = provider;
    this.tempApiKey = provider.apiKey;
    this.showApiKeyModal = true;
  }

  closeApiKeyModal() {
    this.showApiKeyModal = false;
    this.editingProvider = null;
    this.tempApiKey = "";
  }

  saveApiKey() {
    if (!this.editingProvider) return;
    const provider = this.providers.find((p) => p.id === this.editingProvider!.id);
    if (provider) {
      provider.apiKey = this.tempApiKey;
      provider.isActive = !!this.tempApiKey;
      this.providers = [...this.providers];
      this.hasChanges = true;
    }
    this.closeApiKeyModal();
  }

  removeApiKey(provider: ProviderConfig) {
    if (!confirm(`Remove API key for ${provider.name}?`)) return;
    const p = this.providers.find((pr) => pr.id === provider.id);
    if (p) {
      p.apiKey = "";
      p.isActive = false;
      this.providers = [...this.providers];
      this.hasChanges = true;
    }
  }

  handleDefaultProviderChange(e: Event) {
    this.defaultProvider = (e.target as HTMLSelectElement).value;
    // Set default model for provider
    const provider = this.providers.find((p) => p.id === this.defaultProvider);
    if (provider && provider.models.length > 0) {
      this.defaultModel = provider.models[0];
    }
    this.hasChanges = true;
  }

  handleDefaultModelChange(e: Event) {
    this.defaultModel = (e.target as HTMLSelectElement).value;
    this.hasChanges = true;
  }

  async saveSettings() {
    this.saving = true;
    try {
      await operisApi.saveSettings({
        defaultProvider: this.defaultProvider,
        defaultModel: this.defaultModel,
        providers: this.providers.map((p) => ({
          id: p.id,
          apiKey: p.apiKey,
        })),
      });
      this.hasChanges = false;
    } catch (err) {
      console.error("Failed to save settings:", err);
      alert("Failed to save settings");
    } finally {
      this.saving = false;
    }
  }

  get activeProviders() {
    return this.providers.filter((p) => p.isActive);
  }

  get currentProviderModels() {
    const provider = this.providers.find((p) => p.id === this.defaultProvider);
    return provider?.models || [];
  }

  render() {
    if (this.loading) {
      return html`<div class="loading">Loading settings...</div>`;
    }

    return html`
      <div class="header">
        <h1>Settings</h1>
        <p>Configure AI providers and models for your project.</p>
      </div>

      <div class="section">
        <h2 class="section-title">Default Model</h2>
        <div class="card">
          <div class="card-body">
            <div class="form-group">
              <label class="form-label">Provider</label>
              <select
                class="form-select"
                .value=${this.defaultProvider}
                @change=${this.handleDefaultProviderChange}
              >
                ${this.providers.map(
                  (p) => html`
                    <option value="${p.id}" ?disabled=${!p.isActive}>
                      ${p.name} ${p.isActive ? "" : "(Not configured)"}
                    </option>
                  `
                )}
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Model</label>
              <select
                class="form-select"
                .value=${this.defaultModel}
                @change=${this.handleDefaultModelChange}
              >
                ${this.currentProviderModels.map(
                  (model) => html`<option value="${model}">${model}</option>`
                )}
              </select>
              <p class="form-hint">This model will be used for API requests.</p>
            </div>
          </div>
        </div>
      </div>

      <div class="section">
        <h2 class="section-title">AI Providers</h2>
        <div class="card">
          <div class="card-body">
            <div class="provider-list">
              ${this.providers.map((provider) => this.renderProviderCard(provider))}
            </div>
          </div>
        </div>
      </div>

      <div class="save-bar ${this.hasChanges ? "" : "hidden"}">
        <span style="color: #f59e0b; font-size: 14px;">You have unsaved changes</span>
        <button class="btn" @click=${() => this.loadSettings()}>Discard</button>
        <button
          class="btn btn-primary"
          ?disabled=${this.saving}
          @click=${this.saveSettings}
        >
          ${this.saving ? "Saving..." : "Save Changes"}
        </button>
      </div>

      ${this.showApiKeyModal ? this.renderApiKeyModal() : ""}
    `;
  }

  renderProviderCard(provider: ProviderConfig) {
    const initial = provider.name.charAt(0);
    return html`
      <div class="provider-card ${provider.isActive ? "active" : ""}">
        <div class="provider-icon">${initial}</div>
        <div class="provider-info">
          <div class="provider-name">${provider.name}</div>
          <div class="provider-status ${provider.isActive ? "configured" : ""}">
            ${provider.isActive
              ? html`<span class="badge badge-success">Configured</span>`
              : "Not configured"}
          </div>
        </div>
        <div class="provider-actions">
          ${provider.isActive
            ? html`
                <button class="btn btn-sm" @click=${() => this.openApiKeyModal(provider)}>
                  Edit Key
                </button>
                <button class="btn btn-sm btn-danger" @click=${() => this.removeApiKey(provider)}>
                  Remove
                </button>
              `
            : html`
                <button class="btn btn-sm btn-success" @click=${() => this.openApiKeyModal(provider)}>
                  Add API Key
                </button>
              `}
        </div>
      </div>
    `;
  }

  renderApiKeyModal() {
    const provider = this.editingProvider;
    if (!provider) return "";

    return html`
      <div class="modal-overlay" @click=${this.closeApiKeyModal}>
        <div class="modal" @click=${(e: Event) => e.stopPropagation()}>
          <h3>${provider.isActive ? "Edit" : "Add"} ${provider.name} API Key</h3>
          <div class="form-group">
            <label class="form-label">API Key</label>
            <input
              type="password"
              class="form-input"
              placeholder="sk-..."
              .value=${this.tempApiKey}
              @input=${(e: InputEvent) => (this.tempApiKey = (e.target as HTMLInputElement).value)}
            />
            <p class="form-hint">Your API key will be encrypted and stored securely.</p>
          </div>
          <div class="modal-footer">
            <button class="btn" @click=${this.closeApiKeyModal}>Cancel</button>
            <button
              class="btn btn-primary"
              ?disabled=${!this.tempApiKey.trim()}
              @click=${this.saveApiKey}
            >
              Save
            </button>
          </div>
        </div>
      </div>
    `;
  }
}
