# SECURITY & AUTHENTICATION

**Complete Security Architecture**

Version: 1.0
Date: 2026-01-29

---

## 1. AUTHENTICATION LAYERS

### 1.1. Three Authentication Levels

```
┌────────────────────────────────────────────────────────────┐
│  LEVEL 1: MINI-PC (Box) Authentication                     │
│  ─────────────────────────────────────                     │
│  Who: Relay agent connecting to cloud                      │
│  Method: API Key + Hardware ID                             │
│  Protocol: WebSocket handshake                             │
└────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────┐
│  LEVEL 2: Customer (User) Authentication                   │
│  ─────────────────────────────────────────                 │
│  Who: Customer accessing Web UI                            │
│  Method: Email + Password → JWT token                      │
│  Protocol: HTTPS                                           │
└────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────┐
│  LEVEL 3: Agent-to-Agent Communication                      │
│  ─────────────────────────────────────────────────         │
│  Who: Internal cloud services                              │
│  Method: Service tokens                                    │
│  Protocol: Internal (no external exposure)                 │
└────────────────────────────────────────────────────────────┘
```

---

## 2. MINI-PC AUTHENTICATION

### 2.1. Registration Flow

```typescript
// Admin creates box
const { boxId, apiKey } = await boxManager.register(customerId, 'Server 1');

// Store in database
await db.boxes.insert({
  id: boxId,                    // UUID
  customer_id: customerId,
  api_key_hash: hash(apiKey),   // SHA-256 hash
  hardware_id: null,            // Set on first connection
  status: 'pending',
});

// Give to customer
console.log('Box ID:', boxId);
console.log('API Key:', apiKey);  // Show once, never stored plain
```

### 2.2. First Connection

```
Mini-PC Relay Agent:
1. Generate hardware ID from CPU/motherboard serial
2. Connect: wss://cloud.operis.com:8443?boxId=xxx&apiKey=yyy&hwid=zzz

Cloud Server:
3. Verify boxId exists
4. Verify hash(apiKey) matches stored hash
5. Check if hardware_id is null
6. If null: Store hwid, mark as 'online'
7. If not null: Verify hwid matches stored
8. Accept connection or reject

Result:
✅ Connection accepted: Box authenticated
❌ Connection rejected: Invalid credentials or hardware mismatch
```

### 2.3. Hardware ID Generation

```go
// File: internal/security/hwid.go
package security

import (
	"crypto/sha256"
	"encoding/hex"
	"os/exec"
	"runtime"
	"strings"
)

func GetHardwareID() (string, error) {
	switch runtime.GOOS {
	case "linux":
		return getLinuxHWID()
	case "windows":
		return getWindowsHWID()
	case "darwin":
		return getMacOSHWID()
	default:
		return "", fmt.Errorf("unsupported OS")
	}
}

func getLinuxHWID() (string, error) {
	// Try multiple methods
	cmd := exec.Command("bash", "-c", `
		cat /sys/class/dmi/id/product_uuid 2>/dev/null || \
		cat /var/lib/dbus/machine-id 2>/dev/null || \
		cat /etc/machine-id 2>/dev/null
	`)

	output, err := cmd.Output()
	if err != nil {
		return "", err
	}

	uuid := strings.TrimSpace(string(output))

	// Hash for privacy
	hash := sha256.Sum256([]byte(uuid))
	return hex.EncodeToString(hash[:]), nil
}

func getWindowsHWID() (string, error) {
	cmd := exec.Command("wmic", "csproduct", "get", "UUID")
	output, err := cmd.Output()
	if err != nil {
		return "", err
	}

	lines := strings.Split(string(output), "\n")
	if len(lines) < 2 {
		return "", fmt.Errorf("failed to get UUID")
	}

	uuid := strings.TrimSpace(lines[1])

	hash := sha256.Sum256([]byte(uuid))
	return hex.EncodeToString(hash[:]), nil
}
```

**Anti-Piracy:** If customer copies relay agent to another machine, hardware ID won't match → connection rejected.

---

## 3. CUSTOMER AUTHENTICATION

### 3.1. Registration

```typescript
// File: src/auth/register.ts
import bcrypt from 'bcrypt';
import { db } from '../database';

export async function registerCustomer(email: string, password: string, name: string) {
  // Validate email
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error('Invalid email');
  }

  // Check if exists
  const existing = await db.customers.findOne({ email });
  if (existing) {
    throw new Error('Email already registered');
  }

  // Hash password (bcrypt with 10 rounds)
  const passwordHash = await bcrypt.hash(password, 10);

  // Insert customer
  const customer = await db.customers.insert({
    email,
    password_hash: passwordHash,
    name,
    plan: 'starter',
    max_boxes: 1,
  });

  return customer;
}
```

### 3.2. Login

```typescript
// File: src/auth/login.ts
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { db } from '../database';

export async function login(email: string, password: string) {
  // Find customer
  const customer = await db.customers.findOne({ email });
  if (!customer) {
    throw new Error('Invalid credentials');
  }

  // Verify password
  const valid = await bcrypt.compare(password, customer.password_hash);
  if (!valid) {
    throw new Error('Invalid credentials');
  }

  // Generate JWT
  const token = jwt.sign(
    {
      customer_id: customer.id,
      email: customer.email,
      plan: customer.plan,
    },
    process.env.JWT_SECRET!,
    { expiresIn: '7d' }
  );

  return { token, customer };
}
```

### 3.3. JWT Verification

```typescript
// File: src/auth/verify.ts
import jwt from 'jsonwebtoken';

export function verifyJWT(token: string): any {
  try {
    return jwt.verify(token, process.env.JWT_SECRET!);
  } catch (error) {
    throw new Error('Invalid token');
  }
}

// Middleware for Express/Hono
export function authMiddleware(req, res, next) {
  const token = req.headers.authorization?.replace('Bearer ', '');

  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  try {
    req.user = verifyJWT(token);
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' });
  }
}
```

---

## 4. TLS/SSL ENCRYPTION

### 4.1. Certificate Setup (Caddy)

```
# File: /etc/caddy/Caddyfile

cloud.operis.com {
  # Automatic HTTPS (Let's Encrypt)
  # Caddy handles certificate generation & renewal

  # Reverse proxy to app
  reverse_proxy localhost:3000

  # Security headers
  header {
    Strict-Transport-Security "max-age=31536000; includeSubDomains; preload"
    X-Content-Type-Options "nosniff"
    X-Frame-Options "DENY"
    Referrer-Policy "no-referrer-when-downgrade"
    Permissions-Policy "geolocation=(), microphone=(), camera=()"
  }
}

cloud.operis.com:8443 {
  # WebSocket for relay agents
  reverse_proxy localhost:8443 {
    header_up Host {host}
    header_up X-Real-IP {remote}
    header_up X-Forwarded-For {remote}
    header_up X-Forwarded-Proto {scheme}
  }
}
```

**Result:**
- ✅ Automatic HTTPS for Web UI (port 443)
- ✅ Automatic WSS for relay agents (port 8443)
- ✅ Auto-renewal of certificates
- ✅ A+ SSL Labs rating

### 4.2. Certificate Pinning (Optional - Extra Security)

```go
// File: internal/connection/websocket.go (relay agent)
import "crypto/tls"

func (c *Connection) Connect() error {
	// Load expected certificate fingerprint
	expectedFingerprint := c.config.CertFingerprint

	// Custom TLS config
	tlsConfig := &tls.Config{
		VerifyPeerCertificate: func(rawCerts [][]byte, verifiedChains [][]*x509.Certificate) error {
			// Compute fingerprint of server cert
			actualFingerprint := sha256.Sum256(rawCerts[0])

			if hex.EncodeToString(actualFingerprint[:]) != expectedFingerprint {
				return fmt.Errorf("certificate fingerprint mismatch")
			}

			return nil
		},
	}

	// Connect with certificate pinning
	dialer := &websocket.Dialer{
		TLSClientConfig: tlsConfig,
	}

	conn, _, err := dialer.Dial(c.endpoint, nil)
	// ...
}
```

**Benefit:** Prevents MITM attacks even if CA is compromised.

---

## 5. API KEY MANAGEMENT

### 5.1. API Key Generation

```typescript
// File: src/auth/api-keys.ts
import crypto from 'crypto';

export function generateApiKey(): string {
  // 32 bytes = 256 bits of entropy
  return crypto.randomBytes(32).toString('base64');
  // Example: "7XkV9mP2tQ8hN3wL6cR4fG1sA5bK0dY="
}

export function hashApiKey(apiKey: string): string {
  return crypto
    .createHash('sha256')
    .update(apiKey + process.env.API_KEY_SALT)
    .digest('hex');
}
```

### 5.2. API Key Rotation

```typescript
// File: src/auth/rotate-keys.ts
export async function rotateApiKey(boxId: string): Promise<string> {
  const newApiKey = generateApiKey();
  const newApiKeyHash = hashApiKey(newApiKey);

  // Update database
  await db.boxes.update(
    { id: boxId },
    {
      api_key_hash: newApiKeyHash,
      old_api_key_hash: (await db.boxes.findOne({ id: boxId })).api_key_hash,
      rotation_date: new Date(),
    }
  );

  // Push to mini-PC
  await relayGateway.sendCommand(boxId, {
    type: 'system.update_config',
    config: { api_key: newApiKey },
  });

  return newApiKey;
}
```

**Auto-rotation schedule:** Every 90 days (cron job)

---

## 6. RATE LIMITING

### 6.1. Per-Box Rate Limiting

```typescript
// File: src/middleware/rate-limit.ts
import { RateLimiterMemory } from 'rate-limiter-flexible';

const boxRateLimiter = new RateLimiterMemory({
  points: 100,          // 100 commands
  duration: 60,         // per 60 seconds
  blockDuration: 60,    // block for 60s if exceeded
});

export async function checkBoxRateLimit(boxId: string): Promise<boolean> {
  try {
    await boxRateLimiter.consume(boxId);
    return true;
  } catch (error) {
    // Rate limit exceeded
    return false;
  }
}

// Usage in relay gateway
if (!await checkBoxRateLimit(boxId)) {
  ws.send(JSON.stringify({
    error: 'Rate limit exceeded. Try again in 60 seconds.',
  }));
  return;
}
```

### 6.2. Per-Customer Rate Limiting

```typescript
const customerRateLimiter = new RateLimiterMemory({
  points: 1000,         // 1000 requests
  duration: 3600,       // per hour
});

export async function checkCustomerRateLimit(customerId: string): Promise<boolean> {
  try {
    await customerRateLimiter.consume(customerId);
    return true;
  } catch (error) {
    return false;
  }
}
```

---

## 7. SQL INJECTION PREVENTION

### 7.1. Parameterized Queries

```typescript
// ❌ BAD: SQL injection vulnerable
const result = await db.query(`
  SELECT * FROM boxes WHERE id = '${boxId}'
`);

// ✅ GOOD: Parameterized query
const result = await db.query(
  'SELECT * FROM boxes WHERE id = $1',
  [boxId]
);
```

### 7.2. ORM Usage

```typescript
// Using an ORM (Prisma, TypeORM, etc.)
const box = await prisma.box.findUnique({
  where: { id: boxId },  // Automatically parameterized
});
```

---

## 8. XSS PREVENTION

### 8.1. Content Security Policy

```typescript
// File: src/server.ts
app.use((req, res, next) => {
  res.setHeader('Content-Security-Policy', `
    default-src 'self';
    script-src 'self';
    style-src 'self' 'unsafe-inline';
    img-src 'self' data:;
    connect-src 'self' wss://cloud.operis.com;
  `);
  next();
});
```

### 8.2. Output Encoding

```javascript
// In Web UI
function displayMessage(message) {
  const contentDiv = document.createElement('div');
  contentDiv.textContent = message.content;  // Automatically escapes HTML
  // NOT: contentDiv.innerHTML = message.content; ← XSS vulnerable!

  messageDiv.appendChild(contentDiv);
}
```

---

## 9. SECRETS MANAGEMENT

### 9.1. Environment Variables

```bash
# .env.production (encrypted at rest)
DATABASE_URL=postgresql://operis:PASSWORD@localhost/operis_prod
JWT_SECRET=RANDOM_64_CHAR_STRING_HERE
API_KEY_SALT=RANDOM_32_CHAR_STRING_HERE
ANTHROPIC_API_KEY=sk-ant-...
OPENAI_API_KEY=sk-...

# Permissions: 600 (only owner can read)
chmod 600 .env.production
```

### 9.2. Secrets in Database

```typescript
// Encrypt sensitive data before storing
import crypto from 'crypto';

const algorithm = 'aes-256-gcm';
const key = Buffer.from(process.env.ENCRYPTION_KEY!, 'hex');

export function encrypt(text: string): string {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(algorithm, key, iv);

  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  const authTag = cipher.getAuthTag();

  return iv.toString('hex') + ':' + authTag.toString('hex') + ':' + encrypted;
}

export function decrypt(encrypted: string): string {
  const [ivHex, authTagHex, encryptedText] = encrypted.split(':');

  const iv = Buffer.from(ivHex, 'hex');
  const authTag = Buffer.from(authTagHex, 'hex');
  const decipher = crypto.createDecipheriv(algorithm, key, iv);

  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
  decrypted += decipher.final('utf8');

  return decrypted;
}
```

---

## 10. SECURITY CHECKLIST

### 10.1. Pre-Production

- [ ] All passwords bcrypt hashed (10+ rounds)
- [ ] API keys hashed (SHA-256 + salt)
- [ ] JWT secret is random (64+ chars)
- [ ] TLS/SSL certificates valid
- [ ] Rate limiting enabled
- [ ] SQL injection prevention (parameterized queries)
- [ ] XSS prevention (CSP headers, output encoding)
- [ ] Secrets encrypted at rest
- [ ] Hardware ID binding tested
- [ ] API key rotation scheduled

### 10.2. Post-Production

- [ ] Monitor failed authentication attempts
- [ ] Log all security events
- [ ] Regular security audits
- [ ] Dependency updates (npm audit)
- [ ] Penetration testing
- [ ] Backup encryption enabled

---

## 11. SUMMARY

**Security Layers:**

1. ✅ **Authentication:** 3 levels (box, customer, service)
2. ✅ **Encryption:** TLS/SSL for all traffic
3. ✅ **API Keys:** Generated, hashed, rotated
4. ✅ **Hardware ID:** Anti-piracy binding
5. ✅ **Rate Limiting:** Prevent abuse
6. ✅ **SQL Injection:** Parameterized queries
7. ✅ **XSS:** CSP headers + output encoding
8. ✅ **Secrets:** Encrypted at rest

**Result:** Production-grade security ✅

---

**Document Version:** 1.0
**Date:** 2026-01-29
**Status:** Complete - Ready for implementation
