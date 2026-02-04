import { LitElement, html, css } from "lit";
import { customElement, state } from "lit/decorators.js";
import { operisApi, type OperisApiKey } from "../api.js";

/**
 * API Keys Management Page
 */
@customElement("api-keys-page")
export class OperisApiKeysPage extends LitElement {
  static styles = css`
    :host {
      display: block;
    }

    .header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 24px;
    }

    .header-left h1 {
      font-size: 24px;
      font-weight: 600;
      color: #f1f5f9;
      margin: 0 0 8px;
    }

    .header-left p {
      color: #64748b;
      font-size: 14px;
      margin: 0;
    }

    .btn-primary {
      padding: 10px 20px;
      background: #3b82f6;
      border: none;
      border-radius: 8px;
      color: white;
      font-size: 14px;
      font-weight: 500;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .btn-primary:hover {
      background: #2563eb;
    }

    .card {
      background: #1e293b;
      border: 1px solid #334155;
      border-radius: 12px;
      overflow: hidden;
    }

    .table {
      width: 100%;
      border-collapse: collapse;
    }

    .table th,
    .table td {
      padding: 16px;
      text-align: left;
      border-bottom: 1px solid #334155;
    }

    .table th {
      font-weight: 500;
      color: #64748b;
      font-size: 12px;
      text-transform: uppercase;
      background: #0f172a;
    }

    .table td {
      color: #f1f5f9;
      font-size: 14px;
    }

    .table tr:last-child td {
      border-bottom: none;
    }

    .table tr:hover td {
      background: rgba(59, 130, 246, 0.05);
    }

    .key-prefix {
      font-family: monospace;
      background: #334155;
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 13px;
    }

    .badge {
      display: inline-block;
      padding: 4px 10px;
      border-radius: 9999px;
      font-size: 12px;
      font-weight: 500;
    }

    .badge-active {
      background: rgba(34, 197, 94, 0.2);
      color: #22c55e;
    }

    .badge-inactive {
      background: rgba(239, 68, 68, 0.2);
      color: #ef4444;
    }

    .actions {
      display: flex;
      gap: 8px;
    }

    .btn-icon {
      padding: 8px;
      background: transparent;
      border: 1px solid #334155;
      border-radius: 6px;
      color: #94a3b8;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .btn-icon:hover {
      background: #334155;
      color: #f1f5f9;
    }

    .btn-icon.danger:hover {
      background: rgba(239, 68, 68, 0.2);
      border-color: #ef4444;
      color: #ef4444;
    }

    .loading {
      text-align: center;
      padding: 40px;
      color: #64748b;
    }

    .empty-state {
      text-align: center;
      padding: 60px 20px;
      color: #64748b;
    }

    .empty-state h3 {
      color: #f1f5f9;
      margin: 0 0 8px;
    }

    .pagination {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 16px;
      border-top: 1px solid #334155;
    }

    .pagination-info {
      color: #64748b;
      font-size: 14px;
    }

    .pagination-buttons {
      display: flex;
      gap: 8px;
    }

    .pagination-btn {
      padding: 8px 16px;
      background: #334155;
      border: none;
      border-radius: 6px;
      color: #f1f5f9;
      font-size: 14px;
      cursor: pointer;
    }

    .pagination-btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .pagination-btn:not(:disabled):hover {
      background: #475569;
    }

    /* Modal Styles */
    .modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.7);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
    }

    .modal {
      background: #1e293b;
      border: 1px solid #334155;
      border-radius: 12px;
      width: 100%;
      max-width: 500px;
      max-height: 90vh;
      overflow-y: auto;
    }

    .modal-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 20px;
      border-bottom: 1px solid #334155;
    }

    .modal-title {
      font-size: 18px;
      font-weight: 600;
      color: #f1f5f9;
      margin: 0;
    }

    .modal-close {
      background: none;
      border: none;
      color: #64748b;
      cursor: pointer;
      font-size: 24px;
      line-height: 1;
    }

    .modal-close:hover {
      color: #f1f5f9;
    }

    .modal-body {
      padding: 20px;
    }

    .form-group {
      margin-bottom: 16px;
    }

    .form-group label {
      display: block;
      font-size: 14px;
      font-weight: 500;
      color: #f1f5f9;
      margin-bottom: 8px;
    }

    .form-group input {
      width: 100%;
      padding: 10px 12px;
      background: #0f172a;
      border: 1px solid #334155;
      border-radius: 6px;
      color: #f1f5f9;
      font-size: 14px;
      box-sizing: border-box;
    }

    .form-group input:focus {
      outline: none;
      border-color: #3b82f6;
    }

    .modal-footer {
      display: flex;
      justify-content: flex-end;
      gap: 12px;
      padding: 20px;
      border-top: 1px solid #334155;
    }

    .btn-secondary {
      padding: 10px 20px;
      background: #334155;
      border: none;
      border-radius: 8px;
      color: #f1f5f9;
      font-size: 14px;
      cursor: pointer;
    }

    .btn-secondary:hover {
      background: #475569;
    }

    /* New Key Display */
    .new-key-display {
      background: #0f172a;
      border: 1px solid #22c55e;
      border-radius: 8px;
      padding: 16px;
      margin-bottom: 16px;
    }

    .new-key-label {
      font-size: 12px;
      color: #22c55e;
      margin-bottom: 8px;
      font-weight: 500;
    }

    .new-key-value {
      font-family: monospace;
      font-size: 14px;
      color: #f1f5f9;
      word-break: break-all;
      background: #1e293b;
      padding: 12px;
      border-radius: 6px;
      margin-bottom: 12px;
    }

    .new-key-warning {
      font-size: 12px;
      color: #f59e0b;
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .btn-copy {
      width: 100%;
      padding: 10px;
      background: #22c55e;
      border: none;
      border-radius: 6px;
      color: white;
      font-size: 14px;
      font-weight: 500;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
    }

    .btn-copy:hover {
      background: #16a34a;
    }
  `;

  @state() loading = true;
  @state() apiKeys: OperisApiKey[] = [];
  @state() total = 0;
  @state() page = 1;
  @state() limit = 10;
  @state() showCreateModal = false;
  @state() showNewKeyModal = false;
  @state() newKeyName = "";
  @state() newKeyValue = "";
  @state() creating = false;
  @state() copied = false;

  connectedCallback() {
    super.connectedCallback();
    this.loadData();
  }

  async loadData() {
    this.loading = true;
    try {
      const result = await operisApi.getApiKeys();
      this.apiKeys = result.data;
      this.total = result.total;
    } catch (err) {
      console.error("Failed to load API keys:", err);
    } finally {
      this.loading = false;
    }
  }

  prevPage() {
    if (this.page > 1) {
      this.page--;
      this.loadData();
    }
  }

  nextPage() {
    if (this.page * this.limit < this.total) {
      this.page++;
      this.loadData();
    }
  }

  formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  }

  openCreateModal() {
    this.newKeyName = "";
    this.showCreateModal = true;
  }

  closeCreateModal() {
    this.showCreateModal = false;
  }

  closeNewKeyModal() {
    this.showNewKeyModal = false;
    this.newKeyValue = "";
    this.copied = false;
    this.loadData();
  }

  async createApiKeyHandler() {
    if (!this.newKeyName.trim()) return;

    this.creating = true;
    try {
      const result = await operisApi.createApiKey(this.newKeyName);
      this.newKeyValue = result.key;
      this.showCreateModal = false;
      this.showNewKeyModal = true;
    } catch (err) {
      console.error("Failed to create API key:", err);
      alert("Failed to create API key");
    } finally {
      this.creating = false;
    }
  }

  async copyKey() {
    try {
      await navigator.clipboard.writeText(this.newKeyValue);
      this.copied = true;
      setTimeout(() => {
        this.copied = false;
      }, 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  }

  async toggleKeyStatus(key: OperisApiKey) {
    try {
      await operisApi.updateApiKey(key.id, { is_active: !key.is_active });
      this.loadData();
    } catch (err) {
      console.error("Failed to update API key:", err);
    }
  }

  async deleteApiKeyHandler(key: OperisApiKey) {
    if (!confirm(`Are you sure you want to delete "${key.name}"?`)) return;

    try {
      await operisApi.deleteApiKey(key.id);
      this.loadData();
    } catch (err) {
      console.error("Failed to delete API key:", err);
    }
  }

  render() {
    return html`
      <div class="header">
        <div class="header-left">
          <h1>API Keys</h1>
          <p>Manage API keys for accessing the Operis platform.</p>
        </div>
        <button class="btn-primary" @click=${this.openCreateModal}>
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
          Create API Key
        </button>
      </div>

      <div class="card">
        ${this.loading
          ? html`<div class="loading">Loading API keys...</div>`
          : this.apiKeys.length === 0
            ? html`
                <div class="empty-state">
                  <h3>No API Keys</h3>
                  <p>Create your first API key to get started.</p>
                </div>
              `
            : html`
                <table class="table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Key Prefix</th>
                      <th>Status</th>
                      <th>Last Used</th>
                      <th>Created</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${this.apiKeys.map(
                      (key) => html`
                        <tr>
                          <td>${key.name}</td>
                          <td>
                            <code class="key-prefix"
                              >${key.key_prefix}...****</code
                            >
                          </td>
                          <td>
                            <span
                              class="badge ${key.is_active
                                ? "badge-active"
                                : "badge-inactive"}"
                            >
                              ${key.is_active ? "Active" : "Inactive"}
                            </span>
                          </td>
                          <td>
                            ${key.last_used_at
                              ? this.formatDate(key.last_used_at)
                              : "Never"}
                          </td>
                          <td>${this.formatDate(key.created_at)}</td>
                          <td>
                            <div class="actions">
                              <button
                                class="btn-icon"
                                title="${key.is_active
                                  ? "Deactivate"
                                  : "Activate"}"
                                @click=${() => this.toggleKeyStatus(key)}
                              >
                                ${key.is_active
                                  ? html`<svg
                                      width="16"
                                      height="16"
                                      viewBox="0 0 24 24"
                                      fill="none"
                                      stroke="currentColor"
                                      stroke-width="2"
                                    >
                                      <path
                                        d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"
                                      ></path>
                                      <line
                                        x1="1"
                                        y1="1"
                                        x2="23"
                                        y2="23"
                                      ></line>
                                    </svg>`
                                  : html`<svg
                                      width="16"
                                      height="16"
                                      viewBox="0 0 24 24"
                                      fill="none"
                                      stroke="currentColor"
                                      stroke-width="2"
                                    >
                                      <path
                                        d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"
                                      ></path>
                                      <circle cx="12" cy="12" r="3"></circle>
                                    </svg>`}
                              </button>
                              <button
                                class="btn-icon danger"
                                title="Delete"
                                @click=${() => this.deleteApiKeyHandler(key)}
                              >
                                <svg
                                  width="16"
                                  height="16"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  stroke-width="2"
                                >
                                  <polyline points="3 6 5 6 21 6"></polyline>
                                  <path
                                    d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"
                                  ></path>
                                </svg>
                              </button>
                            </div>
                          </td>
                        </tr>
                      `
                    )}
                  </tbody>
                </table>

                <div class="pagination">
                  <div class="pagination-info">
                    Showing ${(this.page - 1) * this.limit + 1} -
                    ${Math.min(this.page * this.limit, this.total)} of
                    ${this.total}
                  </div>
                  <div class="pagination-buttons">
                    <button
                      class="pagination-btn"
                      ?disabled=${this.page === 1}
                      @click=${this.prevPage}
                    >
                      Previous
                    </button>
                    <button
                      class="pagination-btn"
                      ?disabled=${this.page * this.limit >= this.total}
                      @click=${this.nextPage}
                    >
                      Next
                    </button>
                  </div>
                </div>
              `}
      </div>

      ${this.showCreateModal
        ? html`
            <div class="modal-overlay" @click=${this.closeCreateModal}>
              <div class="modal" @click=${(e: Event) => e.stopPropagation()}>
                <div class="modal-header">
                  <h3 class="modal-title">Create API Key</h3>
                  <button class="modal-close" @click=${this.closeCreateModal}>
                    ×
                  </button>
                </div>
                <div class="modal-body">
                  <div class="form-group">
                    <label>Name</label>
                    <input
                      type="text"
                      placeholder="e.g., Production API Key"
                      .value=${this.newKeyName}
                      @input=${(e: Event) =>
                        (this.newKeyName = (e.target as HTMLInputElement).value)}
                    />
                  </div>
                </div>
                <div class="modal-footer">
                  <button class="btn-secondary" @click=${this.closeCreateModal}>
                    Cancel
                  </button>
                  <button
                    class="btn-primary"
                    ?disabled=${this.creating || !this.newKeyName.trim()}
                    @click=${this.createApiKeyHandler}
                  >
                    ${this.creating ? "Creating..." : "Create"}
                  </button>
                </div>
              </div>
            </div>
          `
        : ""}
      ${this.showNewKeyModal
        ? html`
            <div class="modal-overlay">
              <div class="modal">
                <div class="modal-header">
                  <h3 class="modal-title">API Key Created</h3>
                </div>
                <div class="modal-body">
                  <div class="new-key-display">
                    <div class="new-key-label">Your new API key</div>
                    <div class="new-key-value">${this.newKeyValue}</div>
                    <div class="new-key-warning">
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="2"
                      >
                        <path
                          d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"
                        ></path>
                        <line x1="12" y1="9" x2="12" y2="13"></line>
                        <line x1="12" y1="17" x2="12.01" y2="17"></line>
                      </svg>
                      This key will only be shown once. Please save it securely.
                    </div>
                  </div>
                  <button class="btn-copy" @click=${this.copyKey}>
                    ${this.copied
                      ? html`<svg
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            stroke-width="2"
                          >
                            <polyline points="20 6 9 17 4 12"></polyline>
                          </svg>
                          Copied!`
                      : html`<svg
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            stroke-width="2"
                          >
                            <rect
                              x="9"
                              y="9"
                              width="13"
                              height="13"
                              rx="2"
                              ry="2"
                            ></rect>
                            <path
                              d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"
                            ></path>
                          </svg>
                          Copy to Clipboard`}
                  </button>
                </div>
                <div class="modal-footer">
                  <button class="btn-primary" @click=${this.closeNewKeyModal}>
                    Done
                  </button>
                </div>
              </div>
            </div>
          `
        : ""}
    `;
  }
}
