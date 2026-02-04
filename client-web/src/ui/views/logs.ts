import { html } from "lit";
import { icons } from "../icons";

export interface LogsProps {}

export function renderLogs(_props: LogsProps) {
  const logs = [
    { id: "1", date: "2026-01-30 11:15", type: "chat", preview: "Hãy nói về điện toán lượng tử...", tokens: 1234 },
    { id: "2", date: "2026-01-30 10:45", type: "chat", preview: "Làm thế nào để triển khai binary tree?", tokens: 892 },
    { id: "3", date: "2026-01-29 16:30", type: "workflow", preview: "Tạo tóm tắt hàng ngày", tokens: 2156 },
    { id: "4", date: "2026-01-29 14:20", type: "chat", preview: "Giải thích về machine learning...", tokens: 1567 },
    { id: "5", date: "2026-01-29 09:00", type: "workflow", preview: "Tự động gửi báo cáo buổi sáng", tokens: 1890 },
  ];

  return html`
    <div class="card">
      <div class="card-header">
        <div>
          <div class="card-title">Lịch Sử Hội Thoại</div>
          <div class="card-description">Xem các tương tác trước đó</div>
        </div>
        <div style="display: flex; gap: 8px; align-items: center;">
          <operis-input type="text" size="sm" placeholder="Tìm kiếm logs..." has-icon style="width: 200px;">
            <span slot="icon">${icons.search}</span>
          </operis-input>
          <button class="btn btn-secondary btn-sm">Xuất</button>
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
              <span class="pill ${log.type === "chat" ? "" : "accent"}">${log.type === "chat" ? "chat" : "workflow"}</span>
            </div>
          `
        )}
      </div>

      <div style="margin-top: 16px; text-align: center;">
        <button class="btn btn-ghost btn-sm">Tải thêm</button>
      </div>
    </div>
  `;
}
