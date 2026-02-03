import { html, nothing } from "lit";
import { icons } from "../icons";
import { t, type Language } from "../i18n";

interface ChatProps {
  lang: Language;
  messages: Array<{ role: "user" | "assistant"; content: string }>;
  draft: string;
  sending: boolean;
  isLoggedIn: boolean;
  username?: string;
  onDraftChange: (value: string) => void;
  onSend: () => void;
  onLoginClick: () => void;
}

function getSuggestions(lang: Language) {
  return [
    { icon: icons.image, label: t(lang, "chatSuggestionImage"), prompt: lang === "vi" ? "Tạo hình ảnh về" : "Create an image of" },
    { icon: icons.pencil, label: t(lang, "chatSuggestionWrite"), prompt: lang === "vi" ? "Giúp tôi viết" : "Help me write" },
    { icon: icons.graduationCap, label: t(lang, "chatSuggestionLearn"), prompt: lang === "vi" ? "Dạy tôi về" : "Teach me about" },
    { icon: icons.coffee, label: t(lang, "chatSuggestionDay"), prompt: lang === "vi" ? "Giúp tôi lên kế hoạch" : "Help me plan my day" },
  ];
}

export function renderChat(props: ChatProps) {
  const {
    lang,
    messages,
    draft,
    sending,
    isLoggedIn,
    username,
    onDraftChange,
    onSend,
    onLoginClick,
  } = props;
  const isEmpty = messages.length === 0;
  const displayName = username || (lang === "vi" ? "bạn" : "there");
  const suggestions = getSuggestions(lang);

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (!isLoggedIn) {
        onLoginClick();
      } else if (draft.trim()) {
        onSend();
      }
    }
  };

  const handleSendClick = () => {
    if (!isLoggedIn) {
      onLoginClick();
    } else {
      onSend();
    }
  };

  const handleSuggestionClick = (prompt: string) => {
    onDraftChange(prompt + " ");
  };

  return html`
    <style>
      /* Full-width Chat Container - offset parent padding */
      .gc-wrapper {
        margin: -24px -32px;
        height: calc(100% + 48px);
        display: flex;
        flex-direction: column;
        background: var(--bg);
      }

      /* Empty State - Gemini Style */
      .gc-welcome {
        flex: 1;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 24px;
        animation: gc-fade-up 0.5s ease-out;
      }
      @keyframes gc-fade-up {
        from {
          opacity: 0;
          transform: translateY(20px);
        }
      }

      .gc-greeting {
        display: flex;
        align-items: center;
        gap: 12px;
        margin-bottom: 8px;
      }
      .gc-greeting-icon {
        width: 32px;
        height: 32px;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      .gc-greeting-icon svg {
        width: 28px;
        height: 28px;
        stroke: none;
        fill: url(#gc-gradient);
      }
      .gc-greeting-text {
        font-size: 20px;
        font-weight: 500;
        color: var(--text);
      }

      .gc-subtitle {
        font-size: 32px;
        font-weight: 400;
        color: var(--text-strong);
        margin-bottom: 32px;
        letter-spacing: -0.02em;
        text-align: center;
      }

      /* Input Box */
      .gc-input-wrap {
        width: 100%;
        max-width: 680px;
        margin-bottom: 24px;
        padding: 0 16px;
        box-sizing: border-box;
      }

      .gc-input-box {
        display: flex;
        flex-direction: column;
        gap: 8px;
        padding: 16px 16px 12px;
        background: var(--card);
        border: 1px solid var(--border);
        border-radius: 24px;
        transition:
          border-color 0.2s ease,
          box-shadow 0.2s ease;
      }
      .gc-input-box:focus-within {
        border-color: var(--border-strong);
        box-shadow: 0 1px 6px rgba(0, 0, 0, 0.08);
      }

      .gc-input {
        width: 100%;
        height: 24px;
        padding: 0;
        font-size: 16px;
        font-family: inherit;
        background: transparent;
        border: none !important;
        outline: none !important;
        box-shadow: none !important;
        color: var(--text);
        line-height: 1.5;
        -webkit-appearance: none;
        -moz-appearance: none;
        appearance: none;
      }
      .gc-input:focus {
        border: none !important;
        outline: none !important;
        box-shadow: none !important;
      }
      .gc-input::placeholder {
        color: var(--muted);
      }

      .gc-input-actions {
        display: flex;
        align-items: center;
        justify-content: space-between;
      }

      .gc-actions-left {
        display: flex;
        align-items: center;
        gap: 4px;
      }

      .gc-actions-right {
        display: flex;
        align-items: center;
        gap: 4px;
      }

      .gc-action-btn {
        width: 36px;
        height: 36px;
        display: flex;
        align-items: center;
        justify-content: center;
        background: transparent;
        border: none;
        border-radius: 50%;
        color: var(--muted);
        cursor: pointer;
        transition: all 0.15s ease;
      }
      .gc-action-btn:hover {
        background: var(--bg-hover);
        color: var(--text);
      }
      .gc-action-btn svg {
        width: 20px;
        height: 20px;
        stroke: currentColor;
        fill: none;
        stroke-width: 1.5;
      }

      .gc-send-btn {
        width: 36px;
        height: 36px;
        display: flex;
        align-items: center;
        justify-content: center;
        background: var(--accent);
        border: none;
        border-radius: 50%;
        color: var(--accent-foreground);
        cursor: pointer;
        transition: all 0.15s ease;
      }
      .gc-send-btn:hover:not(:disabled) {
        background: var(--accent-hover);
      }
      .gc-send-btn:disabled {
        background: var(--secondary);
        color: var(--muted);
        cursor: not-allowed;
      }
      .gc-send-btn svg {
        width: 18px;
        height: 18px;
        stroke: currentColor;
        fill: none;
        stroke-width: 2;
      }

      /* Suggestions */
      .gc-suggestions {
        display: flex;
        flex-wrap: wrap;
        justify-content: center;
        gap: 12px;
        max-width: 680px;
        padding: 0 16px;
      }

      .gc-suggestion {
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 12px 20px;
        background: var(--card);
        border: 1px solid var(--border);
        border-radius: 24px;
        font-size: 14px;
        font-weight: 500;
        color: var(--text);
        cursor: pointer;
        transition: all 0.15s ease;
      }
      .gc-suggestion:hover {
        background: var(--bg-hover);
        border-color: var(--border-strong);
        transform: translateY(-2px);
      }
      .gc-suggestion-icon {
        width: 20px;
        height: 20px;
        display: flex;
        align-items: center;
        justify-content: center;
        color: var(--muted);
      }
      .gc-suggestion-icon svg {
        width: 18px;
        height: 18px;
        stroke: currentColor;
        fill: none;
        stroke-width: 2;
      }

      /* Messages Area */
      .gc-messages {
        flex: 1;
        overflow-y: auto;
        padding: 24px;
        display: flex;
        flex-direction: column;
        gap: 24px;
      }

      .gc-message {
        display: flex;
        gap: 16px;
        max-width: 800px;
        animation: gc-msg-in 0.3s ease-out;
      }
      @keyframes gc-msg-in {
        from {
          opacity: 0;
          transform: translateY(10px);
        }
      }

      .gc-message--user {
        align-self: flex-end;
        flex-direction: row-reverse;
      }
      .gc-message--assistant {
        align-self: flex-start;
      }

      .gc-avatar {
        width: 36px;
        height: 36px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
      }
      .gc-avatar--user {
        background: var(--accent-subtle);
        color: var(--accent);
      }
      .gc-avatar--assistant {
        background: linear-gradient(
          135deg,
          #4285f4 0%,
          #9b72cb 50%,
          #d96570 100%
        );
      }
      .gc-avatar svg {
        width: 20px;
        height: 20px;
        stroke: currentColor;
        fill: none;
        stroke-width: 2;
      }
      .gc-avatar--assistant svg {
        stroke: white;
      }

      .gc-bubble {
        padding: 14px 18px;
        border-radius: 20px;
        font-size: 15px;
        line-height: 1.6;
      }
      .gc-message--user .gc-bubble {
        background: var(--accent);
        color: var(--accent-foreground);
        border-bottom-right-radius: 6px;
      }
      .gc-message--assistant .gc-bubble {
        background: var(--card);
        color: var(--text);
        border: 1px solid var(--border);
        border-bottom-left-radius: 6px;
      }

      .gc-typing {
        display: flex;
        gap: 4px;
        padding: 8px 0;
      }
      .gc-typing-dot {
        width: 8px;
        height: 8px;
        background: var(--muted);
        border-radius: 50%;
        animation: gc-typing 1.4s infinite;
      }
      .gc-typing-dot:nth-child(2) {
        animation-delay: 0.2s;
      }
      .gc-typing-dot:nth-child(3) {
        animation-delay: 0.4s;
      }
      @keyframes gc-typing {
        0%,
        60%,
        100% {
          transform: translateY(0);
        }
        30% {
          transform: translateY(-8px);
        }
      }

      /* Bottom Input */

      .gc-input-bottom .gc-input-wrap {
        max-width: 800px;
        margin: 0 auto;
        padding: 0;
      }

      .gc-disclaimer {
        text-align: center;
        font-size: 12px;
        color: var(--muted);
        margin-top: 12px;
      }

      /* Responsive */
      @media (max-width: 768px) {
        .gc-wrapper {
          margin: -16px;
          height: calc(100% + 32px);
        }
        .gc-title {
          font-size: 20px;
        }
        .gc-logo {
          width: 48px;
          height: 48px;
          border-radius: 12px;
        }
        .gc-logo svg {
          width: 24px;
          height: 24px;
        }
        .gc-suggestions {
          gap: 8px;
        }
        .gc-suggestion {
          padding: 10px 16px;
          font-size: 13px;
        }
        .gc-input-box {
          padding: 6px 6px 6px 16px;
        }
        .gc-input-bottom {
          padding: 12px 16px;
        }
      }
    </style>

    <div class="gc-wrapper">
      ${isEmpty
        ? html`
            <!-- Empty State -->
            <div class="gc-welcome">
              <div class="gc-greeting">
                <span class="gc-greeting-icon">${icons.sparkles}</span>
                <span class="gc-greeting-text">${t(lang, "chatGreeting")}, ${displayName}!</span>
              </div>
              <h1 class="gc-subtitle">${t(lang, "chatSubtitle")}</h1>

              <div class="gc-input-wrap">
                <div class="gc-input-box">
                  <input
                    type="text"
                    class="gc-input"
                    placeholder="${t(lang, "chatPlaceholder")}"
                    .value=${draft}
                    @input=${(e: InputEvent) =>
                      onDraftChange((e.target as HTMLInputElement).value)}
                    @keydown=${handleKeyDown}
                    ?disabled=${sending}
                  />
                  <div class="gc-input-actions">
                    <div class="gc-actions-left">
                      <button
                        type="button"
                        class="gc-action-btn"
                        title="${lang === "vi" ? "Thêm tệp" : "Add attachment"}"
                      >
                        ${icons.plus}
                      </button>
                      <button
                        type="button"
                        class="gc-action-btn"
                        title="${lang === "vi" ? "Thêm ảnh" : "Add image"}"
                      >
                        ${icons.image}
                      </button>
                    </div>
                    <div class="gc-actions-right">
                      <button
                        type="button"
                        class="gc-action-btn"
                        title="${lang === "vi" ? "Nhập giọng nói" : "Voice input"}"
                      >
                        ${icons.mic}
                      </button>
                      <button
                        type="button"
                        class="gc-send-btn"
                        @click=${handleSendClick}
                        ?disabled=${!draft.trim() || sending}
                        title=${isLoggedIn ? t(lang, "chatSend") : t(lang, "chatSignIn")}
                      >
                        ${icons.arrowUp}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div class="gc-suggestions">
                ${suggestions.map(
                  (s) => html`
                    <button
                      type="button"
                      class="gc-suggestion"
                      @click=${() => handleSuggestionClick(s.prompt)}
                    >
                      <span class="gc-suggestion-icon">${s.icon}</span>
                      ${s.label}
                    </button>
                  `,
                )}
              </div>
            </div>
          `
        : html`
            <!-- Chat Messages -->
            <div class="gc-messages">
              ${messages.map(
                (msg, idx) => html`
                  <div class="gc-message gc-message--${msg.role}">
                    <div class="gc-avatar gc-avatar--${msg.role}">
                      ${msg.role === "user" ? icons.user : icons.sparkles}
                    </div>
                    <div class="gc-bubble">
                      ${msg.role === "assistant" && msg.content === "" && sending && idx === messages.length - 1
                        ? html`
                            <div class="gc-typing">
                              <span class="gc-typing-dot"></span>
                              <span class="gc-typing-dot"></span>
                              <span class="gc-typing-dot"></span>
                            </div>
                          `
                        : msg.content}
                    </div>
                  </div>
                `,
              )}
            </div>

            <!-- Bottom Input -->
            <div class="gc-input-bottom">
              <div class="gc-input-wrap">
                <div class="gc-input-box">
                  <input
                    type="text"
                    class="gc-input"
                    placeholder="${t(lang, "chatPlaceholder")}"
                    .value=${draft}
                    @input=${(e: InputEvent) =>
                      onDraftChange((e.target as HTMLInputElement).value)}
                    @keydown=${handleKeyDown}
                    ?disabled=${sending}
                  />
                  <div class="gc-input-actions">
                    <div class="gc-actions-left">
                      <button
                        type="button"
                        class="gc-action-btn"
                        title="${lang === "vi" ? "Thêm tệp" : "Add attachment"}"
                      >
                        ${icons.plus}
                      </button>
                      <button
                        type="button"
                        class="gc-action-btn"
                        title="${lang === "vi" ? "Thêm ảnh" : "Add image"}"
                      >
                        ${icons.image}
                      </button>
                    </div>
                    <div class="gc-actions-right">
                      <button
                        type="button"
                        class="gc-action-btn"
                        title="${lang === "vi" ? "Nhập giọng nói" : "Voice input"}"
                      >
                        ${icons.mic}
                      </button>
                      <button
                        type="button"
                        class="gc-send-btn"
                        @click=${handleSendClick}
                        ?disabled=${!draft.trim() || sending}
                        title=${isLoggedIn ? t(lang, "chatSend") : t(lang, "chatSignIn")}
                      >
                        ${icons.arrowUp}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
              <p class="gc-disclaimer">
                ${t(lang, "chatDisclaimer")}
              </p>
            </div>
          `}
    </div>
  `;
}
