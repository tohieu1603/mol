# Phase 02: Express API Setup

**Parent Plan:** [plan.md](plan.md)
**Parallel Group:** A (can run with Phase 01, 03)
**Dependencies:** None (uses schema types from Phase 01 via import)

## Overview

| Field | Value |
|-------|-------|
| Date | 2026-01-29 |
| Priority | High |
| Status | Pending |

Build Express.js TypeScript API with JWT auth, API key auth, and all CRUD endpoints.

## File Ownership (Exclusive)

```
apps/api/
├── src/
│   ├── index.ts                    # App entry
│   ├── app.ts                      # Express app setup
│   ├── config/
│   │   └── index.ts                # Env config
│   ├── middleware/
│   │   ├── auth.ts                 # JWT middleware
│   │   ├── api-key.ts              # API key middleware
│   │   ├── error-handler.ts        # Global error handler
│   │   └── rate-limit.ts           # Rate limiting
│   ├── routes/
│   │   ├── index.ts                # Route aggregator
│   │   ├── auth.routes.ts          # /api/auth/*
│   │   ├── users.routes.ts         # /api/users/*
│   │   ├── keys.routes.ts          # /api/keys/*
│   │   ├── tokens.routes.ts        # /api/tokens/*
│   │   └── stats.routes.ts         # /api/stats/*
│   ├── services/
│   │   ├── auth.service.ts
│   │   ├── user.service.ts
│   │   ├── api-key.service.ts
│   │   └── token.service.ts
│   ├── utils/
│   │   ├── jwt.ts                  # JWT helpers
│   │   ├── hash.ts                 # Password/key hashing
│   │   └── api-key-generator.ts    # Generate sk_live_xxx
│   └── types/
│       └── express.d.ts            # Extend Request type
├── package.json
└── tsconfig.json
```

## API Endpoints

```
Auth:
POST   /api/auth/register
POST   /api/auth/login
POST   /api/auth/logout
POST   /api/auth/refresh
GET    /api/auth/me

Users (Admin):
GET    /api/users
GET    /api/users/:id
PATCH  /api/users/:id
DELETE /api/users/:id

API Keys:
GET    /api/keys
POST   /api/keys
PATCH  /api/keys/:id
DELETE /api/keys/:id

Tokens:
GET    /api/tokens/balance
GET    /api/tokens/history
POST   /api/tokens/topup      (admin)

Stats (Admin):
GET    /api/stats/overview
GET    /api/stats/usage
```

## Implementation Steps

1. [ ] Create package.json with deps (express, cors, helmet, jsonwebtoken, bcrypt, zod)
2. [ ] Create tsconfig.json
3. [ ] Create `src/app.ts` with middleware stack
4. [ ] Create `src/config/index.ts` with env vars
5. [ ] Create JWT utilities (`src/utils/jwt.ts`)
6. [ ] Create password hash utilities (`src/utils/hash.ts`)
7. [ ] Create API key generator (`src/utils/api-key-generator.ts`)
8. [ ] Create auth middleware (`src/middleware/auth.ts`)
9. [ ] Create API key middleware (`src/middleware/api-key.ts`)
10. [ ] Create all services
11. [ ] Create all routes
12. [ ] Create entry point (`src/index.ts`)

## JWT Strategy

```
Access Token: 15min expiry, stored in memory/localStorage
Refresh Token: 7d expiry, HttpOnly cookie
```

## API Key Format

```
sk_live_<32-char-random>
Example: sk_live_YOUR_KEY_HERE
```

## Success Criteria

- [ ] Server starts on port 3001
- [ ] All auth endpoints work
- [ ] JWT auth middleware validates tokens
- [ ] API key middleware validates keys
- [ ] CORS configured for dashboard origin

## Conflict Prevention

- Only touches `apps/api/src/` (except db/)
- Phase 01 owns db/, this phase imports from it
- Phase 04 will add chat.routes.ts (not created here)
