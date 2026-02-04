# Phase 05: Testing & Polish

**Parent Plan:** [plan.md](plan.md)
**Parallel Group:** C (final)
**Dependencies:** Phase 04 must complete first

## Overview

| Field | Value |
|-------|-------|
| Date | 2026-01-29 |
| Priority | Medium |
| Status | Pending |

Add tests, error handling, documentation, and production readiness.

## File Ownership (Exclusive)

```
apps/api/src/**/*.test.ts           # All test files
apps/dashboard/**/*.test.ts         # All test files
apps/api/README.md
apps/dashboard/README.md
docker-compose.yml                  # Dev environment
```

## Implementation Steps

### API Tests

1. [ ] Setup Vitest for `apps/api`
2. [ ] Test auth endpoints:
   - Register with valid/invalid data
   - Login with correct/wrong credentials
   - Token refresh
3. [ ] Test API key endpoints:
   - Create key
   - List keys
   - Revoke key
4. [ ] Test token endpoints:
   - Check balance
   - Topup (admin)
5. [ ] Test chat endpoint:
   - Valid request deducts tokens
   - Insufficient balance returns 402
   - Invalid API key returns 401

### Dashboard Tests

6. [ ] Setup testing for Next.js
7. [ ] Test auth flow
8. [ ] Test protected routes redirect

### Production Readiness

9. [ ] Add rate limiting
10. [ ] Add request logging
11. [ ] Add health check endpoint
12. [ ] Create docker-compose.yml for local dev:
    - PostgreSQL container
    - API container
    - Dashboard container

### Documentation

13. [ ] Create apps/api/README.md:
    - Setup instructions
    - Environment variables
    - API documentation
14. [ ] Create apps/dashboard/README.md:
    - Setup instructions
    - Features

## Success Criteria

- [ ] All API tests pass
- [ ] docker-compose up starts full stack
- [ ] README docs complete
- [ ] No console errors in production build

## Conflict Prevention

- Only creates new test files (*.test.ts)
- Only creates new documentation files
- No modifications to existing source files
