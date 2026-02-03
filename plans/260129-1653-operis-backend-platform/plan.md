# Operis Backend Platform - Implementation Plan

**Date:** 2026-01-29
**Status:** Planning
**Directory:** `plans/260129-1653-operis-backend-platform/`

## Overview

Build SaaS backend for Operis with user management, API keys, token billing, and admin dashboard.

## Tech Stack

| Component | Technology |
|-----------|------------|
| Backend API | Express.js + TypeScript |
| Dashboard UI | Next.js 15 (App Router) |
| Database | PostgreSQL + Drizzle ORM |
| Auth | Custom JWT (access + refresh) |
| UI Components | shadcn/ui |

## Architecture

```
apps/
├── api/              # Express.js backend (port 3001)
└── dashboard/        # Next.js frontend (port 3000)
```

## Dependency Graph

```
Phase 01 ─────┐
              ├──► Phase 04 ──► Phase 05
Phase 02 ─────┤
              │
Phase 03 ─────┘
```

**Execution Strategy:** Phases 01-03 parallel → Phase 04 → Phase 05

## Phases Overview

| Phase | Name | Status | Parallel Group | File |
|-------|------|--------|----------------|------|
| 01 | Database Schema | Pending | A (parallel) | [phase-01](phase-01-database-schema.md) |
| 02 | Express API Setup | Pending | A (parallel) | [phase-02](phase-02-express-api.md) |
| 03 | Next.js Dashboard Setup | Pending | A (parallel) | [phase-03](phase-03-nextjs-dashboard.md) |
| 04 | API Integration | Pending | B (sequential) | [phase-04](phase-04-api-integration.md) |
| 05 | Testing & Polish | Pending | C (sequential) | [phase-05](phase-05-testing.md) |

## File Ownership Matrix

| Phase | Owns Files |
|-------|------------|
| 01 | `apps/api/src/db/*`, `drizzle.config.ts` |
| 02 | `apps/api/src/routes/*`, `apps/api/src/middleware/*`, `apps/api/src/services/*`, `apps/api/package.json` |
| 03 | `apps/dashboard/*` (all) |
| 04 | `apps/dashboard/lib/api.ts`, `apps/api/src/routes/chat.ts` |
| 05 | `apps/api/src/**/*.test.ts`, `apps/dashboard/**/*.test.ts` |

## Research

- [Express + JWT Research](research/researcher-01-express-jwt.md)
- [Next.js Dashboard Research](research/researcher-260129-nextjs-dashboard.md)
