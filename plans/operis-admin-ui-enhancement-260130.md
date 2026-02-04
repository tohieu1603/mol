# Operis Admin UI Enhancement Plan

**Created:** 2026-01-30
**Status:** Draft

## Overview

Fix API mismatches in Operis Admin UI and enhance with Ant Design inspired styling. Add full CRUD for users with detailed statistics view.

## Current Issues Analysis

### API Response Mismatches

| Page | Expected | Actual API Response | Status |
|------|----------|---------------------|--------|
| Tokens | `{ data: [], total }` | `{ transactions: [], pagination: { total } }` | ❌ |
| API Keys | `{ data: [], total }` | `[...]` (array directly) | ❌ |
| API Keys | `ApiKey` type | Type is `OperisApiKey` | ❌ |
| API Keys | `updateApiKey()` method | Method missing | ❌ |

### Missing Features

- Users: No create/edit modal
- Users: No detail view with stats
- Users: No usage history per user
- Global: Inconsistent styling

---

## Phase 1: Fix Critical API Mismatches

**Priority:** Critical | **Files:** 3

### 1.1 Fix `api.ts` - Token History
```typescript
// Current (broken)
async getTokenHistory(page = 1, limit = 20) {
  return this.request<{ data: TokenTransaction[]; total: number }>(...)
}

// Fixed - transform response
async getTokenHistory(page = 1, limit = 20) {
  const result = await this.request<{
    transactions: TokenTransaction[];
    pagination: { total: number };
  }>(`/tokens/history?page=${page}&limit=${limit}`);
  return { data: result.transactions, total: result.pagination.total };
}
```

### 1.2 Fix `api.ts` - API Keys
```typescript
// Add pagination support (API returns array, client handles pagination)
async getApiKeys() {
  const keys = await this.request<OperisApiKey[]>("/keys");
  return { data: keys, total: keys.length };
}

// Add missing updateApiKey method
async updateApiKey(id: string, data: Partial<OperisApiKey>) {
  return this.request<OperisApiKey>(`/keys/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}
```

### 1.3 Fix `api-keys-page.ts` - Import
```typescript
// Change line 3
- import { operisApi, type ApiKey } from "../api.js";
+ import { operisApi, type OperisApiKey } from "../api.js";

// Change type usage
- @state() apiKeys: ApiKey[] = [];
+ @state() apiKeys: OperisApiKey[] = [];
```

---

## Phase 2: Enhance Users Page with CRUD

**Priority:** High | **Files:** 2

### 2.1 Add User API Methods (`api.ts`)

```typescript
// Create user (admin only)
async createUser(data: { email: string; password: string; name: string; role?: string }) {
  return this.request<OperisUser>("/users", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

// Get user details with stats
async getUserDetails(id: string) {
  return this.request<UserDetails>(`/users/${id}`);
}

// Get user's token history
async getUserTokenHistory(userId: string, page = 1, limit = 20) {
  const result = await this.request<{
    transactions: TokenTransaction[];
    pagination: { total: number };
  }>(`/users/${userId}/tokens?page=${page}&limit=${limit}`);
  return { data: result.transactions, total: result.pagination.total };
}

// Get user's API keys
async getUserApiKeys(userId: string) {
  return this.request<OperisApiKey[]>(`/users/${userId}/keys`);
}

// Get user's chat sessions
async getUserSessions(userId: string, page = 1, limit = 20) {
  return this.request<{ sessions: ChatSession[]; pagination: { total: number } }>(
    `/users/${userId}/sessions?page=${page}&limit=${limit}`
  );
}
```

### 2.2 Enhance Users Page (`users-page.ts`)

Add components:
- **Create User Modal**: Email, password, name, role select
- **Edit User Modal**: Name, role, token balance adjustment
- **User Detail Drawer**:
  - Profile info card
  - Token balance & usage chart
  - API keys list
  - Recent chat sessions
  - Activity timeline

### 2.3 New Types (`api.ts`)

```typescript
export interface UserDetails extends OperisUser {
  displayTokenBalance: number;
  totalTokensUsed: number;
  totalSessions: number;
  totalApiKeys: number;
  lastActiveAt: string | null;
}

export interface ChatSession {
  id: string;
  title: string;
  messageCount: number;
  tokensUsed: number;
  createdAt: string;
  updatedAt: string;
}
```

---

## Phase 3: UI/UX Enhancement (Ant Design Style)

**Priority:** Medium | **Files:** 5

### 3.1 Design Tokens (shared styles)

Create `ui/src/ui/operis/styles/design-tokens.ts`:
```typescript
export const colors = {
  primary: '#1677ff',      // Ant blue
  success: '#52c41a',
  warning: '#faad14',
  error: '#ff4d4f',
  bgBase: '#0f172a',       // Keep dark theme
  bgCard: '#1e293b',
  border: '#334155',
  textPrimary: '#f1f5f9',
  textSecondary: '#94a3b8',
};

export const spacing = {
  xs: '4px', sm: '8px', md: '16px', lg: '24px', xl: '32px'
};

export const borderRadius = {
  sm: '4px', md: '8px', lg: '12px'
};
```

### 3.2 Component Enhancements

| Component | Enhancement |
|-----------|-------------|
| Tables | Zebra striping, hover states, sortable headers |
| Cards | Subtle shadows, consistent padding |
| Buttons | Primary/secondary/danger variants, loading states |
| Modals | Smooth transitions, backdrop blur |
| Forms | Better validation states, helper text |
| Badges | Consistent pill style |
| Pagination | Page number buttons, size selector |

### 3.3 User Detail Drawer Layout

```
┌────────────────────────────────────────┐
│ [←] User Details                    [×]│
├────────────────────────────────────────┤
│ ┌──────────┐                           │
│ │  Avatar  │  John Doe                 │
│ │   (JD)   │  john@example.com         │
│ └──────────┘  Admin • Joined Jan 2026  │
├────────────────────────────────────────┤
│ Token Balance                          │
│ ┌──────────────────────────────────┐   │
│ │  Display: 1,200    Actual: 600   │   │
│ │  [━━━━━━━━━░░░░░] 60% used       │   │
│ └──────────────────────────────────┘   │
├────────────────────────────────────────┤
│ Quick Stats                            │
│ ┌────────┐ ┌────────┐ ┌────────┐       │
│ │Sessions│ │API Keys│ │  Usage │       │
│ │   12   │ │    3   │ │ 5,432  │       │
│ └────────┘ └────────┘ └────────┘       │
├────────────────────────────────────────┤
│ [Tabs: Sessions | API Keys | History]  │
│ ┌──────────────────────────────────┐   │
│ │ Recent activity list...          │   │
│ └──────────────────────────────────┘   │
├────────────────────────────────────────┤
│              [Edit User] [Topup]       │
└────────────────────────────────────────┘
```

---

## Implementation Order

```
Phase 1 (Critical - Fix Errors)
├── 1.1 Fix api.ts getTokenHistory()
├── 1.2 Fix api.ts getApiKeys() + add updateApiKey()
└── 1.3 Fix api-keys-page.ts imports

Phase 2 (Features - User CRUD)
├── 2.1 Add user API methods
├── 2.2 Create user modal
├── 2.3 Edit user modal
└── 2.4 User detail drawer

Phase 3 (Polish - UI Enhancement)
├── 3.1 Create design tokens
├── 3.2 Update component styles
└── 3.3 Add animations & transitions
```

---

## Files to Modify

| File | Phase | Changes |
|------|-------|---------|
| `ui/src/ui/operis/api.ts` | 1, 2 | Fix methods, add new endpoints |
| `ui/src/ui/operis/pages/api-keys-page.ts` | 1 | Fix import |
| `ui/src/ui/operis/pages/users-page.ts` | 2, 3 | Add modals, drawer, styles |
| `ui/src/ui/operis/pages/tokens-page.ts` | 3 | Style updates |
| `ui/src/ui/operis/pages/dashboard-page.ts` | 3 | Style updates |
| `ui/src/ui/operis/admin-app.ts` | 3 | Global styles |

---

## API Endpoints Required

Check if these backend endpoints exist:

| Endpoint | Method | Status |
|----------|--------|--------|
| `/api/users` | POST | ⚠️ Check |
| `/api/users/:id` | GET | ⚠️ Check |
| `/api/users/:id/tokens` | GET | ⚠️ Check |
| `/api/users/:id/keys` | GET | ⚠️ Check |
| `/api/users/:id/sessions` | GET | ⚠️ Check |
| `/api/keys/:id` | PATCH | ⚠️ Check |

---

## Notes

- Keep dark theme (matches Moltbot branding)
- Use Ant Design as style reference, not dependency
- All changes in Lit Element web components
- API at `http://localhost:3001`
- Rebuild UI with `pnpm ui:build` after changes
