# Express.js + TypeScript SaaS API Backend Best Practices
**Date:** 2026-01-29 | **Focus:** Project structure, JWT auth, API key middleware, Drizzle ORM

---

## 1. Project Structure (Layered Architecture)

**Recommended folder layout:**
```
src/
├── config/          # Environment & database config
├── controllers/     # Request handlers (HTTP layer)
├── middleware/      # Auth, validation, error handling
├── models/          # Drizzle ORM schemas
├── routes/          # Route definitions
├── services/        # Business logic layer
├── utils/           # Helpers, validators
├── types/           # TypeScript interfaces
└── index.ts         # Entry point
dist/                # Built output
```

**Why:** Feature-first scales better for SaaS; layered approach clearer for onboarding. Use tsx runner for dev, separate DB logic from services for maintainability.

---

## 2. JWT Authentication (Access + Refresh Tokens)

**Key concepts:**
- **Access token:** Short-lived (15-60min), stateless, checked on each request
- **Refresh token:** Long-lived (7-30 days), stored in HttpOnly cookie (XSS-safe)
- **Middleware pattern:** Extract JWT, verify signature, attach decoded user to `req.user`

**Express middleware example:**
```typescript
import jwt from 'jsonwebtoken';

export const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!);
    req.user = decoded;
    next();
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
};
```

**Token refresh endpoint:**
```typescript
app.post('/auth/refresh', (req, res) => {
  const refreshToken = req.cookies.refreshToken;
  try {
    const decoded = jwt.verify(refreshToken, process.env.REFRESH_SECRET!);
    const newAccessToken = jwt.sign({ userId: decoded.userId }, process.env.JWT_SECRET!, { expiresIn: '1h' });
    res.json({ accessToken: newAccessToken });
  } catch {
    res.status(401).json({ error: 'Refresh failed' });
  }
});
```

---

## 3. API Key Authentication Middleware

**Stateless pattern for service-to-service or public API access:**
```typescript
export const apiKeyMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const apiKey = req.headers['x-api-key'] as string;
  if (!apiKey) return res.status(401).json({ error: 'Missing API key' });

  // Validate against DB or env (cache in production)
  const isValid = validateApiKey(apiKey); // Drizzle query or cache
  if (!isValid) return res.status(403).json({ error: 'Invalid API key' });

  req.apiClient = { apiKeyId: extractKeyId(apiKey) };
  next();
};
```

**Validation service (using Drizzle):**
```typescript
export async function validateApiKey(key: string) {
  const result = await db.select().from(apiKeys).where(eq(apiKeys.key, key)).limit(1);
  return result.length > 0 && !result[0].revoked;
}
```

---

## 4. Drizzle ORM + PostgreSQL Setup

**Install dependencies:**
```bash
npm install drizzle-orm pg dotenv
npm install -D drizzle-kit @types/node
```

**Define schema (`src/models/schema.ts`):**
```typescript
import { pgTable, serial, varchar, timestamp, boolean } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  email: varchar('email', { length: 255 }).unique(),
  passwordHash: varchar('password_hash', { length: 255 }),
  createdAt: timestamp('created_at').defaultNow(),
});

export const apiKeys = pgTable('api_keys', {
  id: serial('id').primaryKey(),
  userId: serial('user_id').references(() => users.id),
  key: varchar('key', { length: 255 }).unique(),
  revoked: boolean('revoked').default(false),
  createdAt: timestamp('created_at').defaultNow(),
});
```

**Initialize client (`src/config/db.ts`):**
```typescript
import { drizzle } from 'drizzle-orm/node-postgres';
import { Client } from 'pg';

const client = new Client({ connectionString: process.env.DATABASE_URL });
await client.connect();
export const db = drizzle(client);
```

**drizzle.config.ts (root):**
```typescript
import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: './src/models/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: { connectionString: process.env.DATABASE_URL! },
});
```

**Run migrations:** `npx drizzle-kit migrate`

---

## 5. Express App Integration

```typescript
import express from 'express';
import { authMiddleware, apiKeyMiddleware } from './middleware';
import { userController } from './controllers';

const app = express();
app.use(express.json());

// Public endpoints
app.post('/auth/login', userController.login);
app.post('/auth/refresh', userController.refresh);

// JWT-protected endpoints
app.get('/api/profile', authMiddleware, userController.getProfile);

// API key-protected endpoints
app.get('/api/data', apiKeyMiddleware, userController.getData);

app.listen(3000, () => console.log('Server running on :3000'));
```

---

## Key Takeaways

- **Structure:** Layered architecture for clarity; separate concerns (DB/services/controllers)
- **Auth:** JWT in Authorization header + refresh in HttpOnly cookie; middleware checks both
- **API Keys:** Cache validation; mark revoked keys in DB; validate on each request
- **Drizzle:** Type-safe, zero-dependency ORM; migrations via drizzle-kit; eager/lazy relations

---

**Unresolved questions:**
- Token rotation strategy for compromised keys?
- Caching layer (Redis) for API key validation in high-traffic scenarios?
