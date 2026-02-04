# Phase 01: Database Schema

**Parent Plan:** [plan.md](plan.md)
**Parallel Group:** A (can run with Phase 02, 03)
**Dependencies:** None

## Overview

| Field | Value |
|-------|-------|
| Date | 2026-01-29 |
| Priority | High |
| Status | Pending |

Setup PostgreSQL database with Drizzle ORM schema for users, API keys, tokens, and chat.

## File Ownership (Exclusive)

```
apps/api/
├── src/db/
│   ├── index.ts           # DB connection
│   ├── schema.ts          # All tables
│   └── migrate.ts         # Migration runner
├── drizzle.config.ts
└── .env.example
```

## Schema Design

```typescript
// users
users: {
  id: uuid (PK)
  email: varchar(255) unique
  password_hash: varchar(255)
  name: varchar(100)
  role: enum('admin', 'user')
  token_balance: integer default 100
  created_at: timestamp
  updated_at: timestamp
}

// api_keys
api_keys: {
  id: uuid (PK)
  user_id: uuid (FK → users)
  key_hash: varchar(255) unique
  key_prefix: varchar(20)  // "sk_live_abc..."
  name: varchar(100)
  permissions: jsonb
  is_active: boolean default true
  last_used_at: timestamp
  expires_at: timestamp nullable
  created_at: timestamp
}

// token_transactions
token_transactions: {
  id: uuid (PK)
  user_id: uuid (FK → users)
  amount: integer  // + or -
  type: enum('topup', 'usage', 'refund', 'bonus')
  description: text
  reference_id: uuid nullable
  created_at: timestamp
}

// chat_sessions
chat_sessions: {
  id: uuid (PK)
  user_id: uuid (FK → users)
  api_key_id: uuid (FK → api_keys)
  tokens_used: integer default 0
  model: varchar(50)
  created_at: timestamp
  ended_at: timestamp nullable
}

// chat_messages
chat_messages: {
  id: uuid (PK)
  session_id: uuid (FK → chat_sessions)
  role: enum('user', 'assistant', 'system')
  content: text
  tokens: integer
  created_at: timestamp
}
```

## Implementation Steps

1. [ ] Create `apps/api/` directory structure
2. [ ] Init package.json with dependencies (drizzle-orm, pg, dotenv)
3. [ ] Create `src/db/schema.ts` with all tables
4. [ ] Create `src/db/index.ts` for DB connection
5. [ ] Create `drizzle.config.ts`
6. [ ] Create `.env.example` with DATABASE_URL
7. [ ] Run `drizzle-kit generate` and `drizzle-kit migrate`

## Success Criteria

- [ ] All 5 tables created in PostgreSQL
- [ ] Drizzle schema exports types
- [ ] Migrations run without error
- [ ] Foreign keys properly set

## Conflict Prevention

- Only touches `apps/api/src/db/*` and `drizzle.config.ts`
- Other phases must not modify DB schema files
