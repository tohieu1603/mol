# Code Review Report: Security Audit - apps/api/

**Review Date:** 2026-01-30
**Reviewer:** Code Review Agent
**Focus:** Security vulnerabilities and error handling

---

## Code Review Summary

### Scope
- Files reviewed: 40+ TypeScript files in `apps/api/src/`
- Lines of code analyzed: ~2,500 LOC
- Review focus: Security vulnerabilities, authentication, SQL injection, error handling, input validation
- Build status: **FAILED** - 2 TypeScript errors (non-security)

### Overall Assessment
**Grade: B+ (Good, with critical improvements needed)**

The codebase demonstrates solid security fundamentals with proper use of Drizzle ORM, bcrypt hashing, JWT authentication, and Helmet middleware. However, several **critical** and **high-priority** issues require immediate attention before production deployment.

---

## ✅ Positive Observations (What's Done Right)

### 1. **SQL Injection Protection**
- **Excellent use of Drizzle ORM** throughout - all queries parameterized
- No raw SQL with user input concatenation found
- Proper use of `eq()`, `and()`, `desc()`, `like()` operators
- Example (user.service.ts:30-32):
  ```typescript
  query = query.where(
    sql`${users.email} ILIKE ${`%${search}%`} OR ${users.name} ILIKE ${`%${search}%`}`
  ) as typeof query;
  ```
  *Note: While this uses `sql` template, parameters are still safely bound*

### 2. **Password Security**
- Bcrypt with 12 salt rounds (hash.ts:3) - industry standard
- Passwords properly hashed before storage
- No plaintext passwords in database schema
- Proper use of `verifyPassword()` with timing-safe comparison

### 3. **API Key Security**
- API keys are **hashed** (bcrypt) before storage - excellent
- Only prefix shown to users (`sk_live_a1b2...`)
- 32-character random keys generated via `crypto.randomBytes()`
- Format validation before processing

### 4. **Authentication & Authorization**
- JWT with separate access/refresh tokens
- Proper token expiry (15m access, 7d refresh)
- Role-based access control (admin middleware)
- Authorization checks in middleware layer

### 5. **Information Disclosure Protection**
- Generic error messages: "Invalid email or password" (auth.service.ts:68,72)
- Passwords sanitized from user objects via `sanitizeUser()`
- API key hashes removed before returning to client

### 6. **Security Headers**
- Helmet middleware configured (app.ts:11)
- CORS properly configured with credentials support

### 7. **Error Handling**
- Global error handler middleware
- Try-catch blocks on all async routes
- Zod validation errors properly formatted
- Custom AppError class for controlled error responses

---

## ❌ Critical Issues (Fix Immediately)

### 1. **JWT Secrets in Production** 🔴
**File:** `src/config/index.ts:13-15`

**Issue:**
```typescript
jwt: {
  secret: process.env.JWT_SECRET || "default-secret-change-me",
  refreshSecret: process.env.JWT_REFRESH_SECRET || "default-refresh-secret-change-me",
```

**Problem:** Fallback to weak default secrets allows production deployment without secure keys.

**Impact:** Complete authentication bypass if defaults used in production. Anyone can forge tokens.

**Fix:**
```typescript
jwt: {
  secret: getRequiredEnv('JWT_SECRET'),
  refreshSecret: getRequiredEnv('JWT_REFRESH_SECRET'),
  // ...
}

function getRequiredEnv(key: string): string {
  const value = process.env[key];
  if (!value && process.env.NODE_ENV === 'production') {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value || `dev-${key.toLowerCase()}`; // Only for development
}
```

### 2. **Database URL Missing Validation** 🔴
**File:** `src/config/index.ts:9`

**Issue:**
```typescript
databaseUrl: process.env.DATABASE_URL!,
```

**Problem:** Non-null assertion without validation. Server starts without database connection, crashes at first query.

**Fix:**
```typescript
databaseUrl: getRequiredEnv('DATABASE_URL'),
```

### 3. **API Key Timing Attack Vulnerability** 🔴
**File:** `src/middleware/api-key.ts:29-41`

**Issue:**
```typescript
const activeKeys = await db
  .select()
  .from(apiKeys)
  .where(eq(apiKeys.isActive, true));

let matchedKey = null;
for (const key of activeKeys) {
  if (await verifyApiKey(apiKey, key.keyHash)) {
    matchedKey = key;
    break; // ⚠️ Early exit reveals timing information
  }
}
```

**Problem:**
- Loads ALL active keys (performance issue)
- Early break in loop creates timing oracle attack
- With many keys, attacker can determine if first char is correct by measuring response time

**Impact:**
- DOS via N bcrypt comparisons per request (if 1000 users = 1000 comparisons)
- Timing oracle allows key brute-forcing

**Fix:**
```typescript
// Option 1: Extract prefix and query specific key
const prefix = apiKey.slice(0, 12) + "...";
const candidates = await db
  .select()
  .from(apiKeys)
  .where(and(
    eq(apiKeys.isActive, true),
    eq(apiKeys.keyPrefix, prefix)
  ))
  .limit(1);

if (candidates.length === 0) {
  res.status(401).json({ error: "Invalid API key" });
  return;
}

const isValid = await verifyApiKey(apiKey, candidates[0].keyHash);
if (!isValid) {
  res.status(401).json({ error: "Invalid API key" });
  return;
}

// Option 2: Use constant-time comparison for all keys (worse performance)
```

### 4. **Missing Rate Limiting** 🔴
**File:** `src/app.ts`

**Issue:** No rate limiting middleware configured.

**Impact:**
- Brute force attacks on `/api/auth/login`
- API key enumeration on `/api/chat`
- DOS via expensive bcrypt operations

**Fix:**
```bash
pnpm add express-rate-limit
```

```typescript
import rateLimit from 'express-rate-limit';

// Auth endpoints (stricter)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 requests per window
  message: 'Too many login attempts, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
});

// API endpoints (moderate)
const apiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 60, // 60 requests per minute
  message: 'Rate limit exceeded',
});

app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);
app.use('/api', apiLimiter);
```

---

## ⚠️ High Priority Findings

### 5. **Console Logging of Errors** 🟠
**Files:**
- `src/middleware/error-handler.ts:23`
- `src/middleware/api-key.ts:75`
- `src/index.ts:8-16`

**Issue:**
```typescript
console.error("Error:", err); // May log sensitive data
console.error("API key verification error:", error);
```

**Problem:** Errors may contain sensitive information (passwords, tokens, database connection strings).

**Fix:**
```typescript
// Use structured logging library
import pino from 'pino';

const logger = pino({
  redact: ['req.headers.authorization', 'req.body.password', 'err.config.headers']
});

// In error handler
logger.error({ err, type: 'application_error' }, 'Request failed');
```

### 6. **Missing Input Sanitization** 🟠
**File:** `src/routes/chat.routes.ts:16`

**Issue:**
```typescript
const chatSchema = z.object({
  message: z.string().min(1).max(10000), // ✓ Length limited
  sessionId: z.string().uuid().optional(), // ✓ UUID validated
  model: z.string().default("claude-3-sonnet"), // ⚠️ No validation
});
```

**Problem:** `model` parameter accepts any string, could inject malicious model names or cause errors.

**Fix:**
```typescript
model: z.enum([
  "claude-3-sonnet",
  "claude-3-haiku",
  "claude-3-opus",
  "gpt-4",
  "gpt-3.5-turbo"
]).default("claude-3-sonnet"),
```

### 7. **Query Parameter Injection Risk** 🟠
**File:** `src/routes/users.routes.ts:25-27`

**Issue:**
```typescript
const page = parseInt(req.query.page as string) || 1;
const limit = parseInt(req.query.limit as string) || 20;
const search = req.query.search as string | undefined;
```

**Problem:**
- No validation on `page`/`limit` - could pass negative numbers or huge values
- `search` not sanitized (though SQL injection protected by Drizzle)

**Fix:**
```typescript
const page = Math.max(1, Math.min(1000, parseInt(req.query.page as string) || 1));
const limit = Math.max(1, Math.min(100, parseInt(req.query.limit as string) || 20));
const search = req.query.search
  ? String(req.query.search).slice(0, 100).trim()
  : undefined;
```

### 8. **Session Hijacking Risk** 🟠
**File:** `src/routes/auth.routes.ts:54-94`

**Issue:** Refresh token endpoint doesn't validate token is from same user/device.

**Problem:** Stolen refresh token allows indefinite access until 7-day expiry.

**Recommendations:**
- Store refresh tokens in database with device fingerprint
- Implement token rotation (invalidate old refresh token on use)
- Add revocation mechanism

### 9. **CORS Origin Wildcard Risk** 🟠
**File:** `src/config/index.ts:21`

**Issue:**
```typescript
corsOrigin: process.env.CORS_ORIGIN || "http://localhost:3000",
```

**Problem:** No validation. Production env could set `CORS_ORIGIN=*`.

**Fix:**
```typescript
corsOrigin: process.env.CORS_ORIGIN?.split(',').map(o => o.trim())
  || ["http://localhost:3000"],
```

Then in app.ts:
```typescript
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || config.corsOrigin.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
}));
```

---

## 🔍 Medium Priority Improvements

### 10. **Missing XSS Protection Headers**
**File:** `src/app.ts:11`

**Current:** Basic Helmet configuration.

**Enhancement:**
```typescript
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  },
}));
```

### 11. **Missing CSRF Protection**
**File:** `src/app.ts`

**Issue:** No CSRF tokens for state-changing operations.

**Fix:** Add `csurf` middleware for non-API routes or require custom header:
```typescript
app.use((req, res, next) => {
  if (req.method !== 'GET' && !req.headers['x-requested-with']) {
    return res.status(403).json({ error: 'Missing CSRF protection header' });
  }
  next();
});
```

### 12. **Weak Token Estimation**
**Files:**
- `src/routes/chat.routes.ts:32`
- `src/modules/ai-provider/ai-provider.service.ts:143`

**Issue:**
```typescript
const inputTokens = Math.ceil(input.message.length / 4); // Too simplistic
```

**Problem:** Inaccurate token counting leads to balance issues. Multi-byte characters (emojis, Chinese) counted incorrectly.

**Fix:** Use proper tokenizer library:
```bash
pnpm add gpt-tokenizer
```

```typescript
import { encode } from 'gpt-tokenizer';
const tokens = encode(text).length;
```

### 13. **Password Strength Not Enforced**
**File:** `src/routes/auth.routes.ts:18`

**Issue:**
```typescript
password: z.string().min(8), // Only length check
```

**Enhancement:**
```typescript
password: z.string()
  .min(8)
  .max(128)
  .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
    'Password must contain uppercase, lowercase, and number'),
```

### 14. **Missing Request ID Tracking**
**File:** `src/app.ts`

**Issue:** No correlation IDs for debugging/auditing.

**Fix:**
```typescript
import { randomUUID } from 'crypto';

app.use((req, res, next) => {
  req.id = req.headers['x-request-id'] as string || randomUUID();
  res.setHeader('X-Request-ID', req.id);
  next();
});
```

### 15. **Email Validation Insufficient**
**File:** `src/routes/auth.routes.ts:17`

**Issue:**
```typescript
email: z.string().email(), // Basic validation only
```

**Enhancement:**
```typescript
email: z.string()
  .email()
  .max(255)
  .toLowerCase()
  .refine((email) => {
    // Block disposable email providers
    const disposableDomains = ['tempmail.com', 'throwaway.email'];
    const domain = email.split('@')[1];
    return !disposableDomains.includes(domain);
  }, 'Disposable email addresses not allowed'),
```

---

## 📋 Low Priority Suggestions

### 16. **Missing API Versioning**
Consider adding `/api/v1/` prefix for future compatibility.

### 17. **No Health Check Authentication**
`/api/health` is public - consider if this reveals infrastructure details.

### 18. **Missing Graceful Shutdown**
Server doesn't handle SIGTERM/SIGINT for database connection cleanup.

### 19. **TypeScript Build Errors**
```
src/modules/chat/chat.controller.ts(80,73): error TS2345
src/services/auth.service.ts(40,26): error TS2339: Property 'defaultTokenBalance'
```
Must fix before deployment.

### 20. **Duplicate Chat Routes**
Both `src/routes/chat.routes.ts` and `src/modules/chat/chat.controller.ts` exist - consolidate.

---

## 🔧 Recommended Actions (Priority Order)

### Immediate (Before Production)
1. ✅ Remove default JWT secrets, add validation
2. ✅ Fix API key timing attack (extract prefix first)
3. ✅ Add rate limiting middleware
4. ✅ Validate `DATABASE_URL` exists
5. ✅ Fix TypeScript build errors

### Short Term (This Sprint)
6. ✅ Replace console.log with structured logging (pino)
7. ✅ Add model parameter validation
8. ✅ Implement query parameter sanitization
9. ✅ Add refresh token rotation
10. ✅ Enhance CORS validation

### Medium Term (Next Sprint)
11. ✅ Add CSP headers
12. ✅ Implement proper token counting
13. ✅ Enforce password complexity
14. ✅ Add request ID tracking
15. ✅ Email validation enhancement

---

## 📊 Metrics

### Security Posture
- **SQL Injection:** ✅ Protected (Drizzle ORM)
- **XSS:** ⚠️ Partial (Helmet, but missing CSP)
- **CSRF:** ❌ Not implemented
- **Authentication:** ✅ Strong (JWT + bcrypt)
- **Authorization:** ✅ Implemented (RBAC)
- **Rate Limiting:** ❌ Not implemented
- **Input Validation:** ⚠️ Partial (Zod present, gaps exist)
- **Error Handling:** ✅ Comprehensive

### Code Quality
- **Type Safety:** ⚠️ Build fails (2 errors)
- **Error Handling:** ✅ Try-catch on all routes
- **Code Structure:** ✅ Clean separation of concerns
- **Logging:** ⚠️ Basic console.log only

---

## Unresolved Questions

1. **Token Balance System:** Is `config.tokens.defaultBalance` supposed to be `config.defaultTokenBalance`? (auth.service.ts:40)
2. **Chat Route Duplication:** Should legacy `src/routes/chat.routes.ts` be removed in favor of `src/modules/chat/`?
3. **Production Database:** What's the planned production Postgres setup? (Connection pooling, SSL required?)
4. **AI Gateway Auth:** Is `GATEWAY_AUTH_TOKEN` validated/enforced? What happens if not set?
5. **API Key Permissions:** The `permissions` array exists but isn't checked anywhere - is this WIP?
6. **Session Cleanup:** Are old chat sessions cleaned up? No TTL or archive mechanism visible.

---

**Report Generated:** 2026-01-30
**Next Review:** After critical issues fixed
