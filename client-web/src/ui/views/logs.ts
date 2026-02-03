import { html } from "lit";
import { icons } from "../icons";
import { t, type Language } from "../i18n";

export interface LogsProps {
  lang: Language;
}

export function renderLogs(props: LogsProps) {
  const { lang } = props;

  // Sample log entries
  const logs = [
    { id: "1", date: "2026-01-30 11:15", type: "chat", preview: lang === "vi" ? "Hãy nói về điện toán lượng tử..." : "Tell me about quantum computing...", tokens: 1234 },
    { id: "2", date: "2026-01-30 10:45", type: "chat", preview: lang === "vi" ? "Làm thế nào để triển khai binary tree?" : "How do I implement a binary tree?", tokens: 892 },
    { id: "3", date: "2026-01-29 16:30", type: "workflow", preview: lang === "vi" ? "Tạo tóm tắt hàng ngày" : "Daily summary generation", tokens: 2156 },
    { id: "4", date: "2026-01-29 14:20", type: "chat", preview: lang === "vi" ? "Giải thích về machine learning..." : "Explain machine learning basics...", tokens: 1567 },
    { id: "5", date: "2026-01-29 09:00", type: "workflow", preview: lang === "vi" ? "Tự động gửi báo cáo buổi sáng" : "Morning briefing automation", tokens: 1890 },
  ];

  const txt = {
    title: lang === "vi" ? "Lịch Sử Hội Thoại" : "Conversation History",
    subtitle: lang === "vi" ? "Xem các tương tác trước đó" : "View your past interactions",
    search: lang === "vi" ? "Tìm kiếm logs..." : "Search logs...",
    export: lang === "vi" ? "Xuất" : "Export",
    loadMore: lang === "vi" ? "Tải thêm" : "Load more",
    chat: lang === "vi" ? "chat" : "chat",
    workflow: lang === "vi" ? "workflow" : "workflow",
  };

  return html`
    <div class="card">
      <div class="card-header">
        <div>
          <div class="card-title">${txt.title}</div>
          <div class="card-description">${txt.subtitle}</div>
        </div>
        <div style="display: flex; gap: 8px; align-items: center;">
          <operis-input
            type="text"
            size="sm"
            placeholder="${txt.search}"
            has-icon
            style="width: 200px;"
          >
            <span slot="icon">${icons.search}</span>
          </operis-input>
          <button class="btn btn-secondary btn-sm">${txt.export}</button>
        </div>
      </div>

      <div class="list" style="margin-top: 8px;">
        ${logs.map(
          (log) => html`
            <div class="list-item" style="cursor: pointer;">
              <div class="list-item-icon">
                ${log.type === "chat" ? icons.messageSquare : icons.workflow}
              </div>
              <div class="list-item-content">
                <div class="list-item-title">${log.preview}</div>
                <div class="list-item-description">
                  ${log.date} &middot; ${log.tokens.toLocaleString()} tokens
                </div>
              </div>
              <span class="pill ${log.type === "chat" ? "" : "accent"}">${log.type === "chat" ? txt.chat : txt.workflow}</span>
            </div>
          `
        )}
      </div>

      <div style="margin-top: 16px; text-align: center;">
        <button class="btn btn-ghost btn-sm">${txt.loadMore}</button>
      </div>
    </div>
  `;
}
