# Phase 03: Next.js Dashboard Setup

**Parent Plan:** [plan.md](plan.md)
**Parallel Group:** A (can run with Phase 01, 02)
**Dependencies:** None

## Overview

| Field | Value |
|-------|-------|
| Date | 2026-01-29 |
| Priority | High |
| Status | Pending |

Create Next.js 15 admin dashboard with shadcn/ui for user management and billing.

## File Ownership (Exclusive)

```
apps/dashboard/
├── app/
│   ├── layout.tsx
│   ├── page.tsx                    # Landing/Login
│   ├── (auth)/
│   │   ├── login/page.tsx
│   │   ├── register/page.tsx
│   │   └── layout.tsx
│   ├── (dashboard)/
│   │   ├── layout.tsx              # Sidebar layout
│   │   ├── page.tsx                # Overview
│   │   ├── api-keys/page.tsx       # Manage API keys
│   │   ├── usage/page.tsx          # Token usage
│   │   ├── billing/page.tsx        # Top up tokens
│   │   ├── settings/page.tsx       # Profile
│   │   └── admin/
│   │       ├── users/page.tsx      # Admin: user list
│   │       └── stats/page.tsx      # Admin: stats
├── components/
│   ├── ui/                         # shadcn components
│   ├── layout/
│   │   ├── sidebar.tsx
│   │   ├── header.tsx
│   │   └── user-nav.tsx
│   ├── forms/
│   │   ├── login-form.tsx
│   │   ├── register-form.tsx
│   │   └── api-key-form.tsx
│   └── tables/
│       ├── api-keys-table.tsx
│       ├── users-table.tsx
│       └── transactions-table.tsx
├── lib/
│   ├── utils.ts                    # shadcn utils
│   └── auth-context.tsx            # Auth state
├── hooks/
│   └── use-auth.ts
├── package.json
├── tsconfig.json
├── tailwind.config.ts
├── components.json                 # shadcn config
└── next.config.ts
```

## Pages

| Route | Description | Access |
|-------|-------------|--------|
| `/` | Landing → redirect to login/dashboard | Public |
| `/login` | Login form | Public |
| `/register` | Register form | Public |
| `/dashboard` | Overview (token balance, usage chart) | User |
| `/dashboard/api-keys` | Create/manage API keys | User |
| `/dashboard/usage` | Token usage history | User |
| `/dashboard/billing` | Top up tokens | User |
| `/dashboard/settings` | Profile settings | User |
| `/dashboard/admin/users` | User management | Admin |
| `/dashboard/admin/stats` | Platform stats | Admin |

## Implementation Steps

1. [ ] Run `npx create-next-app@latest apps/dashboard`
2. [ ] Run `npx shadcn@latest init`
3. [ ] Add shadcn components (button, card, table, form, input, dialog)
4. [ ] Create layout structure (sidebar, header)
5. [ ] Create auth pages (login, register)
6. [ ] Create auth context and hooks
7. [ ] Create dashboard overview page
8. [ ] Create API keys management page
9. [ ] Create usage/billing pages
10. [ ] Create admin pages
11. [ ] Style with Tailwind

## Auth Flow

```
1. User logs in → receives JWT → stored in cookie
2. Middleware checks cookie on protected routes
3. If expired → redirect to login
4. Auth context provides user state to components
```

## Success Criteria

- [ ] Dashboard runs on port 3000
- [ ] Login/register forms work (mock API)
- [ ] Protected routes redirect unauthenticated users
- [ ] Sidebar navigation works
- [ ] Responsive design

## Conflict Prevention

- Only touches `apps/dashboard/*`
- Phase 04 will add `lib/api.ts` for real API calls
