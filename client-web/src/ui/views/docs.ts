import { html } from "lit";
import { icons } from "../icons";
import { t, type Language } from "../i18n";

export interface DocsProps {
  lang: Language;
}

export function renderDocs(props: DocsProps) {
  const { lang } = props;

  const categories = lang === "vi" ? [
    {
      title: "Bắt Đầu",
      items: [
        { title: "Giới Thiệu", description: "Tìm hiểu cơ bản về Operis" },
        { title: "Hướng Dẫn Nhanh", description: "Bắt đầu sử dụng trong vài phút" },
        { title: "Xác Thực", description: "Cách xác thực với API" },
      ],
    },
    {
      title: "Tính Năng",
      items: [
        { title: "Chat API", description: "Gửi tin nhắn và nhận phản hồi" },
        { title: "Workflows", description: "Tự động hóa tác vụ với workflows" },
        { title: "Tích Hợp", description: "Kết nối với dịch vụ bên thứ ba" },
      ],
    },
    {
      title: "Tài Liệu API",
      items: [
        { title: "Endpoints", description: "Danh sách đầy đủ các API endpoints" },
        { title: "Xác Thực", description: "Khóa API và tokens" },
        { title: "Giới Hạn", description: "Hiểu về giới hạn sử dụng" },
      ],
    },
  ] : [
    {
      title: "Getting Started",
      items: [
        { title: "Introduction", description: "Learn the basics of Operis" },
        { title: "Quick Start", description: "Get up and running in minutes" },
        { title: "Authentication", description: "How to authenticate with the API" },
      ],
    },
    {
      title: "Features",
      items: [
        { title: "Chat API", description: "Send messages and receive responses" },
        { title: "Workflows", description: "Automate tasks with workflows" },
        { title: "Integrations", description: "Connect with third-party services" },
      ],
    },
    {
      title: "API Reference",
      items: [
        { title: "Endpoints", description: "Complete list of API endpoints" },
        { title: "Authentication", description: "API keys and tokens" },
        { title: "Rate Limits", description: "Understanding usage limits" },
      ],
    },
  ];

  const txt = {
    needHelp: lang === "vi" ? "Cần Hỗ Trợ?" : "Need Help?",
    cantFind: lang === "vi" ? "Không tìm thấy điều bạn cần?" : "Can't find what you're looking for?",
    contactSupport: lang === "vi" ? "Liên Hệ Hỗ Trợ" : "Contact Support",
    viewFullDocs: lang === "vi" ? "Xem Tài Liệu Đầy Đủ" : "View Full Docs",
  };

  return html`
    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 24px;">
      ${categories.map(
        (category) => html`
          <div class="card">
            <div class="card-title" style="margin-bottom: 16px;">${category.title}</div>
            <div class="list">
              ${category.items.map(
                (item) => html`
                  <a
                    href="#"
                    class="list-item"
                    style="text-decoration: none; color: inherit;"
                    @click=${(e: Event) => e.preventDefault()}
                  >
                    <div class="list-item-icon">${icons.book}</div>
                    <div class="list-item-content">
                      <div class="list-item-title">${item.title}</div>
                      <div class="list-item-description">${item.description}</div>
                    </div>
                  </a>
                `
              )}
            </div>
          </div>
        `
      )}
    </div>

    <div class="card" style="margin-top: 24px;">
      <div class="card-header">
        <div>
          <div class="card-title">${txt.needHelp}</div>
          <div class="card-description">${txt.cantFind}</div>
        </div>
      </div>
      <div style="display: flex; gap: 12px; flex-wrap: wrap;">
        <button class="btn btn-secondary">
          <span style="display: flex; align-items: center; gap: 6px;">
            ${icons.messageSquare}
            ${txt.contactSupport}
          </span>
        </button>
        <button class="btn btn-ghost">
          <span style="display: flex; align-items: center; gap: 6px;">
            ${icons.book}
            ${txt.viewFullDocs}
          </span>
        </button>
      </div>
    </div>
  `;
}
