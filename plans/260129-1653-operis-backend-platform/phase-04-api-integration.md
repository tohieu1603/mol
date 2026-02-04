# Phase 04: API Integration

**Parent Plan:** [plan.md](plan.md)
**Parallel Group:** B (sequential)
**Dependencies:** Phase 01, 02, 03 must complete first

## Overview

| Field | Value |
|-------|-------|
| Date | 2026-01-29 |
| Priority | High |
| Status | Pending |

Connect Next.js dashboard to Express API, add chat endpoint that deducts tokens.

## File Ownership (Exclusive)

```
apps/dashboard/lib/
└── api.ts                          # API client

apps/api/src/routes/
└── chat.routes.ts                  # Chat endpoint (new file)
```

## Implementation Steps

### Dashboard API Client

1. [ ] Create `apps/dashboard/lib/api.ts`:
   - Base URL config
   - Fetch wrapper with auth headers
   - Type-safe API functions

```typescript
// api.ts structure
export const api = {
  auth: {
    login: (email, password) => POST('/auth/login', { email, password }),
    register: (data) => POST('/auth/register', data),
    me: () => GET('/auth/me'),
    refresh: () => POST('/auth/refresh'),
  },
  keys: {
    list: () => GET('/keys'),
    create: (name) => POST('/keys', { name }),
    revoke: (id) => DELETE(`/keys/${id}`),
  },
  tokens: {
    balance: () => GET('/tokens/balance'),
    history: () => GET('/tokens/history'),
  },
  // ...
}
```

### Chat API Endpoint

2. [ ] Create `apps/api/src/routes/chat.routes.ts`:

```typescript
POST /api/chat
Headers: x-api-key: sk_live_xxx
Body: { message: string, session_id?: string }

Flow:
1. Validate API key
2. Check user token balance
3. Forward to Operis gateway
4. Calculate tokens used
5. Deduct from balance
6. Save to chat_messages
7. Return response
```

### Integration Tasks

3. [ ] Update dashboard forms to use real API
4. [ ] Add error handling and loading states
5. [ ] Implement token refresh logic
6. [ ] Add logout functionality
7. [ ] Connect API keys page to backend
8. [ ] Connect usage page to backend
9. [ ] Test full flow: register → login → create key → chat

## Success Criteria

- [ ] Dashboard authenticates against Express API
- [ ] API keys created/listed/revoked via dashboard
- [ ] Token balance shown correctly
- [ ] Chat endpoint deducts tokens
- [ ] Session persists across page refreshes

## Conflict Prevention

- Only adds new files, no modifications to Phase 01-03 files
- chat.routes.ts is a new file not created in Phase 02
