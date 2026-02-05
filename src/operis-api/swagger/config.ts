/**
 * Swagger/OpenAPI Configuration
 * =============================
 * Cấu hình OpenAPI 3.0 cho Operis REST API
 *
 * File này định nghĩa:
 * - Thông tin API (title, version, description)
 * - Servers (development, production)
 * - Security schemes (JWT, API Key)
 * - Tags để nhóm endpoints
 */

import type { Options } from "swagger-jsdoc";

export const swaggerOptions: Options = {
  definition: {
    openapi: "3.0.0",

    // ==========================================================================
    // API Information
    // Thông tin mô tả API
    // ==========================================================================
    info: {
      title: "Operis API",
      version: "1.0.0",
      description: `
# Operis REST API Documentation

## Tổng quan

Operis API cung cấp đầy đủ endpoints để quản lý hệ thống AI Gateway:

| Module | Mô tả |
|--------|-------|
| **Auth** | Đăng ký, đăng nhập, refresh token, logout |
| **Users** | Quản lý người dùng (Admin only) |
| **API Keys** | Tạo và quản lý API keys cho truy cập programmatic |
| **Tokens** | Quản lý số dư token và lịch sử giao dịch |
| **Chat** | Chat với AI models, quản lý conversations |
| **Deposits** | Nạp tiền, mua token qua bank transfer |
| **Settings** | Cấu hình hệ thống (Admin only) |
| **Cron** | Lên lịch và quản lý scheduled tasks |

---

## Authentication

API hỗ trợ 2 phương thức xác thực:

### 1. JWT Bearer Token (Khuyến nghị)

Dùng cho hầu hết endpoints. Lấy token từ \`POST /api/auth/login\`.

\`\`\`bash
curl -X GET /api/users \\
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..."
\`\`\`

**Token lifecycle:**
- Access token: hết hạn sau 24 giờ
- Refresh token: hết hạn sau 7 ngày
- Dùng \`POST /api/auth/refresh\` để gia hạn

### 2. API Key

Dùng cho programmatic access (scripts, integrations).

\`\`\`bash
curl -X POST /api/chat \\
  -H "Authorization: Bearer opk_abc123..."
\`\`\`

**Tạo API Key:**
1. Đăng nhập và gọi \`POST /api/keys\`
2. Lưu key ngay (chỉ hiển thị 1 lần)
3. API key có prefix \`opk_\`

---

## Error Handling

Tất cả errors trả về format chuẩn:

\`\`\`json
{
  "error": "Mô tả lỗi cho user",
  "code": "ERROR_CODE",
  "details": { "field": "email" }
}
\`\`\`

### HTTP Status Codes

| Code | Ý nghĩa |
|------|---------|
| 200 | Thành công |
| 201 | Tạo mới thành công |
| 204 | Xóa thành công (no content) |
| 400 | Request không hợp lệ |
| 401 | Chưa đăng nhập |
| 403 | Không có quyền |
| 404 | Không tìm thấy |
| 422 | Validation error |
| 429 | Rate limit exceeded |
| 500 | Server error |

---

## Rate Limiting

- Default: 100 requests/minute per user
- Chat API: 20 requests/minute per user
- Vượt limit nhận HTTP 429

---

## Pagination

Endpoints trả về list hỗ trợ pagination:

\`\`\`
GET /api/users?page=1&limit=20
\`\`\`

Response format:
\`\`\`json
{
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "totalPages": 8
  }
}
\`\`\`
      `,
      contact: {
        name: "Operis Support",
        email: "support@operis.io",
        url: "https://operis.io",
      },
      license: {
        name: "MIT",
        url: "https://opensource.org/licenses/MIT",
      },
    },

    // ==========================================================================
    // Servers
    // Các môi trường API
    // ==========================================================================
    servers: [
      {
        url: "/api",
        description: "Current Server (relative path)",
      },
      {
        url: "http://localhost:3025/api",
        description: "Local Development",
      },
      {
        url: "https://api.operis.io/api",
        description: "Production",
      },
    ],

    // ==========================================================================
    // Tags
    // Nhóm endpoints theo chức năng
    // ==========================================================================
    tags: [
      {
        name: "Health",
        description: "Health check endpoints để monitor system status",
      },
      {
        name: "Auth",
        description: `
**Authentication Module**

Xử lý đăng ký, đăng nhập và quản lý phiên làm việc.

| Endpoint | Mô tả |
|----------|-------|
| POST /auth/register | Đăng ký tài khoản mới |
| POST /auth/login | Đăng nhập lấy JWT token |
| POST /auth/refresh | Gia hạn access token |
| POST /auth/logout | Đăng xuất |
| GET /auth/me | Lấy thông tin user hiện tại |
        `,
      },
      {
        name: "Users",
        description: `
**User Management (Admin Only)**

Quản lý người dùng trong hệ thống. Yêu cầu quyền admin.

| Endpoint | Mô tả |
|----------|-------|
| GET /users | Danh sách users |
| GET /users/:id | Chi tiết user |
| PATCH /users/:id | Cập nhật user |
| DELETE /users/:id | Xóa user |
| POST /users/:id/topup | Nạp token cho user |
        `,
      },
      {
        name: "API Keys",
        description: `
**API Key Management**

Tạo và quản lý API keys cho programmatic access.

⚠️ **Lưu ý quan trọng:**
- API key chỉ hiển thị đầy đủ 1 lần khi tạo
- Prefix \`opk_\` để phân biệt với JWT token
- Có thể set expiration date

| Endpoint | Mô tả |
|----------|-------|
| GET /keys | Danh sách API keys |
| POST /keys | Tạo key mới |
| PATCH /keys/:id | Cập nhật key |
| DELETE /keys/:id | Xóa/revoke key |
        `,
      },
      {
        name: "Tokens",
        description: `
**Token Balance & Transactions**

Quản lý số dư token và xem lịch sử giao dịch.

Token được sử dụng để trả phí khi gọi AI models.

| Endpoint | Mô tả |
|----------|-------|
| GET /tokens/balance | Số dư hiện tại |
| GET /tokens/transactions | Lịch sử giao dịch |
| POST /tokens/admin/credit | Admin: cộng token |
| POST /tokens/admin/debit | Admin: trừ token |
        `,
      },
      {
        name: "Chat",
        description: `
**AI Chat API**

Gửi tin nhắn và chat với AI models.

**Hỗ trợ cả JWT và API Key authentication.**

| Endpoint | Mô tả |
|----------|-------|
| POST /chat | Gửi tin nhắn |
| GET /chat/balance | Check số dư |
| GET /chat/conversations | Danh sách conversations |
| POST /chat/conversations/new | Tạo conversation mới |
| GET /chat/conversations/:id | Lịch sử chat |
| DELETE /chat/conversations/:id | Xóa conversation |
        `,
      },
      {
        name: "Deposits",
        description: `
**Deposit & Payment**

Nạp tiền và mua token qua chuyển khoản ngân hàng.

**Flow nạp tiền:**
1. Gọi \`GET /deposits/pricing\` xem bảng giá
2. Gọi \`POST /deposits\` tạo đơn nạp
3. Chuyển khoản theo thông tin trả về
4. Hệ thống tự động cộng token khi nhận được tiền

| Endpoint | Mô tả |
|----------|-------|
| GET /deposits/pricing | Bảng giá token |
| POST /deposits | Tạo đơn nạp tiền |
| GET /deposits/pending | Đơn đang chờ thanh toán |
| GET /deposits/history | Lịch sử nạp tiền |
        `,
      },
      {
        name: "Settings",
        description: `
**System Settings (Admin Only)**

Cấu hình hệ thống: LLM providers, pricing, features.

| Endpoint | Mô tả |
|----------|-------|
| GET /settings | Lấy cấu hình hiện tại |
| POST /settings | Lưu cấu hình |
        `,
      },
      {
        name: "Cron",
        description: `
**Cron Job Management**

Lên lịch và quản lý scheduled tasks.

**Schedule format:** Standard cron expression (5-field)
- \`* * * * *\` = mỗi phút
- \`0 9 * * *\` = 9h sáng mỗi ngày
- \`0 0 * * 0\` = 0h đêm Chủ nhật

| Endpoint | Mô tả |
|----------|-------|
| GET /cron | Danh sách cronjobs |
| POST /cron | Tạo cronjob mới |
| POST /cron/validate | Validate schedule |
| GET /cron/:id | Chi tiết cronjob |
| PATCH /cron/:id | Cập nhật cronjob |
| DELETE /cron/:id | Xóa cronjob |
| POST /cron/:id/toggle | Enable/disable |
| POST /cron/:id/run | Chạy ngay |
| GET /cron/:id/executions | Lịch sử chạy |
        `,
      },
    ],

    // ==========================================================================
    // Security Schemes
    // Định nghĩa các phương thức xác thực
    // ==========================================================================
    components: {
      securitySchemes: {
        BearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
          description: `
**JWT Bearer Token**

Token nhận được từ \`POST /api/auth/login\`.

**Cách sử dụng:**
1. Đăng nhập: \`POST /api/auth/login\` với email + password
2. Lấy \`accessToken\` từ response
3. Thêm header: \`Authorization: Bearer <accessToken>\`

**Token expiry:**
- Access token: 24 giờ
- Refresh token: 7 ngày
          `,
        },
        ApiKeyAuth: {
          type: "http",
          scheme: "bearer",
          description: `
**API Key Authentication**

Dùng cho programmatic access.

**Cách sử dụng:**
1. Tạo key: \`POST /api/keys\`
2. Lưu key (chỉ hiển thị 1 lần!)
3. Thêm header: \`Authorization: Bearer opk_...\`

**Lưu ý:** API key có prefix \`opk_\`
          `,
        },
      },
    },

    // Default security cho tất cả endpoints
    security: [{ BearerAuth: [] }],
  },

  // Files chứa JSDoc annotations
  apis: ["./src/operis-api/swagger/schemas.ts", "./src/operis-api/routes/*.ts"],
};

export default swaggerOptions;
