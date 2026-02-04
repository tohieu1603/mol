# UI Tabs Guide

Hệ thống có 2 giao diện web riêng biệt:

---

## 1. Admin UI (Dashboard)

**URL:** `http://127.0.0.1:18789?token=xxx`
**Chạy:** `pnpm start gateway` hoặc `pnpm ui:dev`

### Tab Groups

#### Chat
| Tab | Icon | Mô tả |
|-----|------|-------|
| **Chat** | 💬 | Direct gateway chat session - giao tiếp trực tiếp với gateway |

#### Control
| Tab | Icon | Mô tả |
|-----|------|-------|
| **Overview** | 📊 | Gateway status, entry points, health check |
| **Channels** | 🔗 | Quản lý các kênh (WhatsApp, Telegram, Discord...) và cài đặt |
| **Instances** | 📡 | Presence beacons từ các clients và nodes đã kết nối |
| **Sessions** | 📄 | Kiểm tra sessions đang hoạt động, điều chỉnh defaults |
| **Cron** | ⏰ | Lên lịch wakeups và agent runs định kỳ |

#### Agent
| Tab | Icon | Mô tả |
|-----|------|-------|
| **Skills** | ⚡ | Quản lý skills availability và API key injection |
| **Nodes** | 🖥️ | Thiết bị đã pair, capabilities, command exposure |

#### Settings
| Tab | Icon | Mô tả |
|-----|------|-------|
| **Config** | ⚙️ | Chỉnh sửa `~/.clawdbot/moltbot.json` |
| **Debug** | 🐛 | Gateway snapshots, events, manual RPC calls |
| **Logs** | 📜 | Live tail của gateway file logs |

---

## 2. Client Web (Portal)

**URL:** `http://localhost:5174`
**Chạy:** `pnpm client:dev` hoặc `pnpm dev:all`

### Tabs

| Tab | Icon | Route | Mô tả |
|-----|------|-------|-------|
| **Chat** | 💬 | `/chat` | Chat với AI assistant |
| **Billing** | 💳 | `/billing` | Quản lý subscription và payments |
| **Logs** | 📜 | `/logs` | Xem lịch sử conversation |
| **Workflow** | 🔄 | `/workflow` | Tự động hóa tasks với workflows |
| **Docs** | 📚 | `/docs` | Tài liệu và hướng dẫn |
| **Login** | 🔐 | `/login` | Đăng nhập (ẩn khi đã login) |

---

## Sự khác biệt

| Tiêu chí | Admin UI | Client Web |
|----------|----------|------------|
| **Đối tượng** | Admin/Developer | End user |
| **Mục đích** | Quản lý hệ thống | Sử dụng dịch vụ |
| **Kết nối** | Cần gateway token | Cần user login |
| **Port** | 18789 (bundled với gateway) | 5174 (Vite dev server) |
| **Chạy độc lập** | Không | Có (demo mode) |

---

## Quick Start

```powershell
# Chạy tất cả (gateway + client-web)
pnpm dev:all

# Chỉ gateway + admin UI
pnpm start gateway

# Chỉ client-web (demo mode)
pnpm client:dev
```

**URLs:**
- Admin: http://127.0.0.1:18789?token=dev123
- Client: http://localhost:5174

---

## Chi tiết: Workflow / Cron Tab

Admin UI có tab **Cron** - đây là nguồn tham khảo để thiết kế Workflow cho Client Web.

### Admin UI - Cron Tab Structure

#### 1. Scheduler Status Card
```
┌─────────────────────────────────┐
│ Scheduler                       │
│ Gateway-owned cron scheduler    │
├─────────────────────────────────┤
│ Enabled: Yes                    │
│ Jobs: 5                         │
│ Next wake: in 2h 30m            │
│                     [Refresh]   │
└─────────────────────────────────┘
```

#### 2. New Job Form

| Field | Type | Options/Values |
|-------|------|----------------|
| Name | Text | Required |
| Description | Text | Optional |
| Agent ID | Text | default |
| Enabled | Checkbox | true/false |
| Schedule | Select | `Every` / `At` / `Cron` |
| Session | Select | `Main` / `Isolated` |
| Wake mode | Select | `Next heartbeat` / `Now` |
| Payload | Select | `System event` / `Agent turn` |

**Schedule Types:**
- `Every`: Định kỳ (mỗi X phút/giờ/ngày)
- `At`: Một lần vào datetime cụ thể
- `Cron`: Expression (VD: `0 9 * * *` = 9h sáng hàng ngày)

**Payload Types:**
- `System event`: Gửi system message text
- `Agent turn`: Agent tự động chạy
  - `Deliver`: Gửi kết quả đi không
  - `Channel`: WhatsApp/Telegram/...
  - `To`: Số điện thoại/chat ID
  - `Timeout`: Seconds

#### 3. Jobs List
Mỗi job hiển thị:
- Name, schedule description
- Payload preview
- Agent ID
- Chips: enabled/disabled, session target, wake mode
- Actions: Enable/Disable, Run, View Runs, Remove

#### 4. Run History
- Job ID đang xem
- List các lần chạy: status, summary, timestamp, duration, error (nếu có)

---

### Client Web - Workflow Tab (Đề xuất)

Phiên bản đơn giản hơn, tập trung vào use case của end user:

```
┌─────────────────────────────────────────────────────────┐
│ Workflow                                                │
│ Automate your tasks with scheduled AI runs              │
├─────────────────────────────────────────────────────────┤
│                                                         │
│ [+ Create Workflow]                                     │
│                                                         │
│ ┌───────────────────────────────────────────────────┐  │
│ │ 📅 Daily Report                         ● Active  │  │
│ │ Every day at 9:00 AM                              │  │
│ │ "Summarize my tasks and email me"                 │  │
│ │ Last run: Today 9:00 AM ✓                         │  │
│ │                          [Edit] [Run] [Delete]    │  │
│ └───────────────────────────────────────────────────┘  │
│                                                         │
│ ┌───────────────────────────────────────────────────┐  │
│ │ 📧 Weekly Summary                       ○ Paused  │  │
│ │ Every Monday at 8:00 AM                           │  │
│ │ "Generate weekly progress report"                 │  │
│ │ Last run: Mon 8:00 AM ✓                           │  │
│ │                          [Edit] [Run] [Delete]    │  │
│ └───────────────────────────────────────────────────┘  │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

#### Client Workflow Form (Simplified)

| Field | Type | Options |
|-------|------|---------|
| **Name** | Text | Required |
| **Description** | Text | Optional |
| **Schedule** | Select | `Daily` / `Weekly` / `Monthly` / `Custom` |
| **Time** | Time picker | HH:MM |
| **Day** | Select | (for Weekly: Mon-Sun, Monthly: 1-31) |
| **Prompt** | Textarea | AI sẽ làm gì |
| **Notify me** | Checkbox | Gửi kết quả qua email/notification |
| **Active** | Toggle | Bật/tắt workflow |

#### Mapping Admin → Client

| Admin (Cron) | Client (Workflow) |
|--------------|-------------------|
| Schedule: Every/At/Cron | Schedule: Daily/Weekly/Monthly/Custom |
| Payload: System event | (hidden - always Agent turn) |
| Payload: Agent turn | Prompt field |
| Deliver + Channel + To | Notify me (simplified) |
| Session: Main/Isolated | (hidden - always Main) |
| Wake mode | (hidden - always Now) |

---

### API Endpoints (Gateway RPC)

```typescript
// List jobs
client.request("cron.list", { includeDisabled: true })

// Add job
client.request("cron.add", {
  name: "Daily Report",
  enabled: true,
  schedule: { kind: "every", everyMs: 86400000 },
  sessionTarget: "main",
  wakeMode: "now",
  payload: { kind: "agentTurn", message: "..." }
})

// Toggle enable/disable
client.request("cron.update", { id: "xxx", patch: { enabled: false } })

// Run manually
client.request("cron.run", { id: "xxx", mode: "force" })

// Remove
client.request("cron.remove", { id: "xxx" })

// Get run history
client.request("cron.runs", { id: "xxx", limit: 50 })

// Get scheduler status
client.request("cron.status", {})
```
