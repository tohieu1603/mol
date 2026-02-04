# BINARY SEPARATION ARCHITECTURE

**Tách Relay Agent Binary Ra Khỏi Main Codebase**

Version: 1.0
Date: 2026-01-29
Purpose: Explain separate repository architecture for relay agent

---

## 1. YÊU CẦU

**User Requirement:** "Phần chương trình được binary sẽ được chia ra nha, tôi muốn chương trình cài đặt trên mini-pc sẽ được chạy ở 1 phần riêng"

**Translation:** The binary program part should be separated, I want the program installed on mini-PC to run in a separate part.

**Meaning:** The relay agent (Go binary that runs on mini-PC) should be in a separate repository/project, NOT part of the main Moltbot/Operis codebase.

---

## 2. REPOSITORY STRUCTURE

### 2.1. Two Separate Projects

```
┌─────────────────────────────────────────────────────────────┐
│  PROJECT 1: OPERIS (Cloud Server)                           │
│  Repository: github.com/yourcompany/operis                   │
│  ─────────────────────────────────────────────────────────  │
│                                                               │
│  • Language: TypeScript/Node.js                              │
│  • Runtime: Cloud server only                                │
│  • Contains:                                                 │
│    - Full Moltbot codebase (src/)                            │
│    - Agent runtime (Pi Agent Framework)                      │
│    - Business logic & plugins                                │
│    - Relay Gateway (NEW - routes to mini-PCs)               │
│    - Web UI Backend (NEW - serves browser clients)          │
│    - Database schemas                                        │
│    - LLM integrations                                        │
│    - Multi-channel integrations                              │
│                                                               │
│  • Size: 290,000 LOC                                         │
│  • Access: PRIVATE (your IP)                                 │
│  • Deployment: Cloud server                                  │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  PROJECT 2: OPERIS-RELAY-AGENT (Mini-PC Client)             │
│  Repository: github.com/yourcompany/operis-relay-agent       │
│  ─────────────────────────────────────────────────────────  │
│                                                               │
│  • Language: Go                                              │
│  • Runtime: Mini-PC only                                     │
│  • Contains:                                                 │
│    - WebSocket client (connects to cloud)                    │
│    - Command executors (bash, browser, file, etc.)           │
│    - Web UI static files (HTML/JS/CSS)                       │
│    - HTTP server (serves Web UI)                             │
│    - Hardware ID binding                                     │
│    - Config encryption                                       │
│                                                               │
│  • Size: ~2,000 LOC Go + static files                        │
│  • Access: CAN BE PUBLIC (no business logic)                 │
│  • Deployment: Customer mini-PC (binary)                     │
└─────────────────────────────────────────────────────────────┘
```

### 2.2. Why Separate?

| Benefit | Explanation |
|---------|-------------|
| **IP Protection** | Relay agent repo has zero business logic - safe to distribute |
| **Independent Versioning** | Cloud v2.5.0 can work with relay-agent v1.3.0 |
| **Clearer Deployment** | Cloud deploys to your servers, relay-agent to customers |
| **Different Languages** | TypeScript for cloud, Go for relay agent |
| **Security** | Relay agent developers can't see cloud code |
| **Open Source Option** | You could open-source relay-agent (no risk) |
| **Distribution** | Easier to distribute binary-only without source |

---

## 3. PROJECT DETAILS

### 3.1. Project 1: Operis (Cloud Server)

**Repository Structure:**

```
operis/                              (Main Moltbot codebase)
├── src/
│   ├── commands/
│   │   └── agent.ts                (Agent creation)
│   ├── agents/
│   │   ├── pi-embedded-runner/
│   │   └── tools/
│   │       ├── bash-tools.ts       (Original)
│   │       ├── browser-tool.ts     (Original)
│   │       └── proxy/              (NEW - Tool proxying layer)
│   │           ├── bash-proxy.ts   (Proxies bash to relay agent)
│   │           ├── browser-proxy.ts
│   │           └── file-proxy.ts
│   ├── relay-gateway/              (NEW - Manages relay agents)
│   │   ├── server.ts               (WebSocket server for mini-PCs)
│   │   ├── box-manager.ts          (Register/auth boxes)
│   │   ├── command-router.ts       (Route commands to boxes)
│   │   └── protocol.ts             (Command protocol definitions)
│   ├── web-ui-backend/             (NEW - Serves browser clients)
│   │   ├── websocket-server.ts
│   │   └── static-server.ts
│   ├── cron/
│   │   └── manager.ts              (Cronjob scheduler)
│   ├── memory/
│   ├── plugins/
│   └── ... (all other Moltbot modules)
│
├── package.json
├── tsconfig.json
├── README.md
└── docs/

Deployment:
→ Cloud server (your infrastructure)
→ Docker / Kubernetes
→ Environment: NODE_ENV=production RELAY_MODE=true
```

**Key Changes to Moltbot:**

1. **Add Tool Proxy Layer:**
   ```typescript
   // src/agents/tools/proxy/bash-proxy.ts
   export function createBashToolProxy(boxId: string) {
     return async (command: string) => {
       return await relayGateway.sendCommand(boxId, {
         type: 'bash.exec',
         command: command
       });
     };
   }
   ```

2. **Add Relay Gateway:**
   ```typescript
   // src/relay-gateway/server.ts
   import WebSocket from 'ws';

   export class RelayGateway {
     private wss: WebSocket.Server;
     private boxes: Map<string, WebSocket> = new Map();

     start(port: number) {
       this.wss = new WebSocket.Server({ port });

       this.wss.on('connection', (ws, req) => {
         const boxId = req.url.split('boxId=')[1];
         this.boxes.set(boxId, ws);
       });
     }

     async sendCommand(boxId: string, command: any): Promise<any> {
       const ws = this.boxes.get(boxId);
       if (!ws) throw new Error('Box not connected');

       return new Promise((resolve, reject) => {
         ws.send(JSON.stringify(command));
         ws.once('message', (data) => {
           resolve(JSON.parse(data.toString()));
         });
       });
     }
   }
   ```

3. **Modify Agent Tool Selection:**
   ```typescript
   // src/commands/agent.ts
   const tools = process.env.RELAY_MODE === 'true'
     ? getProxiedTools(boxId)  // NEW: Use proxied tools
     : getLocalTools();         // OLD: Use local tools

   const agent = new PiAgent({ tools });
   ```

### 3.2. Project 2: Operis-Relay-Agent (Mini-PC Client)

**Repository Structure:**

```
operis-relay-agent/                 (Separate Go project)
├── cmd/
│   └── agent/
│       └── main.go                 (Entry point)
│
├── internal/
│   ├── connection/
│   │   ├── websocket.go            (WebSocket client)
│   │   ├── heartbeat.go
│   │   └── reconnect.go
│   ├── handlers/
│   │   ├── bash.go                 (Execute bash commands)
│   │   ├── browser.go              (Chrome automation)
│   │   ├── file.go                 (File operations)
│   │   ├── whatsapp.go             (WhatsApp client)
│   │   └── telegram.go             (Telegram client)
│   ├── webui/
│   │   ├── server.go               (HTTP server)
│   │   └── static/                 (Embedded files)
│   │       ├── index.html
│   │       ├── app.js
│   │       └── styles.css
│   ├── config/
│   │   └── config.go               (Config management)
│   └── security/
│       ├── hwid.go                 (Hardware ID)
│       └── encryption.go
│
├── go.mod
├── go.sum
├── Makefile
├── README.md
└── scripts/
    ├── install.sh                  (Installation script)
    └── operis-relay-agent.service  (Systemd service)

Build Output:
→ bin/operis-relay-agent-linux-amd64      (~20MB)
→ bin/operis-relay-agent-linux-arm64      (~18MB)
→ bin/operis-relay-agent-windows-amd64.exe (~22MB)
→ bin/operis-relay-agent-darwin-amd64     (~20MB)
→ bin/operis-relay-agent-darwin-arm64     (~18MB)

Distribution:
→ Upload to: https://releases.operis.com/relay-agent/
→ Customers download and install on mini-PC
→ No source code distributed - binary only!
```

**Key Files:**

See [03-relay-agent-spec.md](03-relay-agent-spec.md) for complete implementation.

---

## 4. COMMUNICATION PROTOCOL

### 4.1. Shared Protocol Definition

**Problem:** Both projects need to agree on command format.

**Solution:** Define protocol schema in both repos (small duplication is OK for independence).

**Option A: Duplicate Definition (Recommended)**

```typescript
// operis/src/relay-gateway/protocol.ts
export interface BashCommand {
  type: 'bash.exec';
  command: string;
  timeout?: number;
}

export interface BashResponse {
  success: boolean;
  output: string;
  error?: string;
}

// ... other command types
```

```go
// operis-relay-agent/internal/protocol/types.go
package protocol

type BashCommand struct {
	Type    string `json:"type"`    // "bash.exec"
	Command string `json:"command"`
	Timeout int    `json:"timeout,omitempty"`
}

type BashResponse struct {
	Success bool   `json:"success"`
	Output  string `json:"output"`
	Error   string `json:"error,omitempty"`
}

// ... other command types
```

**Option B: Shared Schema File (More complex)**

```
protocol-schema/                    (Separate tiny repo)
├── schema.json                     (JSON Schema definition)
└── README.md

# Generate TypeScript types
quicktype schema.json -o types.ts

# Generate Go types
quicktype schema.json -o types.go
```

**Recommendation:** Option A (duplicate) - simpler, both projects independent.

### 4.2. Version Compatibility

**Protocol Versioning:**

```typescript
// Cloud sends with version
{
  "protocol_version": "1.0",
  "type": "bash.exec",
  "command": "ls"
}
```

```go
// Relay agent checks version
func (h *Handler) HandleCommand(cmd Command) Response {
  if cmd.ProtocolVersion != "1.0" {
    return Response{
      Success: false,
      Error: "Unsupported protocol version: " + cmd.ProtocolVersion,
    }
  }
  // ...
}
```

**Compatibility Matrix:**

| Cloud Version | Relay Agent Version | Compatible? |
|--------------|---------------------|-------------|
| v2.0.x | v1.0.x | ✅ (protocol v1.0) |
| v2.5.x | v1.0.x | ✅ (protocol v1.0) |
| v3.0.x | v1.0.x | ❌ (protocol v2.0) - need upgrade |
| v3.0.x | v2.0.x | ✅ (protocol v2.0) |

---

## 5. DEVELOPMENT WORKFLOW

### 5.1. Development Process

```
┌─────────────────────────────────────────────────────────────┐
│  PHASE 1: Cloud Development (Operis Repo)                   │
├─────────────────────────────────────────────────────────────┤
│  1. Implement relay gateway (src/relay-gateway/)             │
│  2. Add tool proxy layer (src/agents/tools/proxy/)          │
│  3. Modify agent creation to use proxied tools              │
│  4. Test with mock relay agent (for development)            │
│  5. Deploy to cloud server                                  │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│  PHASE 2: Relay Agent Development (Separate Repo)           │
├─────────────────────────────────────────────────────────────┤
│  1. Create new Go project (operis-relay-agent/)             │
│  2. Implement WebSocket client                              │
│  3. Implement command handlers (bash, browser, file)        │
│  4. Embed static Web UI files                               │
│  5. Test locally against cloud server                       │
│  6. Build binaries for all platforms                        │
│  7. Upload to releases.operis.com                           │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│  PHASE 3: Integration Testing                               │
├─────────────────────────────────────────────────────────────┤
│  1. Install relay agent on test mini-PC                     │
│  2. Test all command types (bash, browser, file, etc.)      │
│  3. Test agent creation via Web UI                          │
│  4. Test cronjobs                                           │
│  5. Performance testing (latency, throughput)               │
│  6. Security testing (penetration test)                     │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│  PHASE 4: Production Deployment                             │
├─────────────────────────────────────────────────────────────┤
│  Cloud: Deploy Operis v2.0 with relay gateway               │
│  Client: Distribute relay agent v1.0 to customers           │
└─────────────────────────────────────────────────────────────┘
```

### 5.2. Testing Strategy

**Cloud Server (Operis) Tests:**

```typescript
// test/relay-gateway.test.ts
describe('Relay Gateway', () => {
  it('should route command to connected box', async () => {
    const gateway = new RelayGateway();
    const mockBox = new MockWebSocketClient();

    await gateway.start(8443);
    await mockBox.connect('ws://localhost:8443?boxId=test123');

    const response = await gateway.sendCommand('test123', {
      type: 'bash.exec',
      command: 'echo hello'
    });

    expect(response.output).toBe('hello\n');
  });
});
```

**Relay Agent Tests:**

```go
// internal/handlers/bash_test.go
package handlers

import (
	"testing"
)

func TestBashHandler(t *testing.T) {
	handler := &Handler{}

	cmd := BashCommand{
		Type:    "bash.exec",
		Command: "echo hello",
	}

	response := handler.HandleBash(cmd)

	if !response.Success {
		t.Errorf("Expected success, got error: %s", response.Error)
	}

	if response.Output != "hello\n" {
		t.Errorf("Expected 'hello\\n', got '%s'", response.Output)
	}
}
```

**Integration Tests:**

```typescript
// test/integration/e2e.test.ts
describe('End-to-End', () => {
  it('should execute bash command via relay agent', async () => {
    // Start cloud server
    const cloud = await startCloudServer();

    // Start relay agent (in Docker)
    const relayAgent = await startRelayAgentDocker();

    // Create agent via API
    const agent = await cloud.createAgent({
      boxId: relayAgent.boxId,
      model: 'claude-sonnet-4.5'
    });

    // Send message to agent
    const response = await agent.chat('Run: echo test123');

    // Verify tool execution
    expect(response).toContain('test123');
  });
});
```

---

## 6. DEPLOYMENT & DISTRIBUTION

### 6.1. Cloud Server Deployment (Operis)

**Docker Compose:**

```yaml
# docker-compose.yml
version: '3.8'

services:
  operis-cloud:
    build: .
    ports:
      - "443:443"      # HTTPS for Web UI
      - "8443:8443"    # WSS for relay agents
    environment:
      - NODE_ENV=production
      - RELAY_MODE=true
      - DATABASE_URL=postgresql://...
      - REDIS_URL=redis://...
    volumes:
      - ./data:/app/data
    restart: always

  postgres:
    image: postgres:16
    # ...

  redis:
    image: redis:7
    # ...
```

**Deployment:**

```bash
# On your cloud server
cd operis/
git pull origin main
docker-compose build
docker-compose up -d

# Verify
curl https://cloud.operis.com/health
```

### 6.2. Relay Agent Distribution

**Build & Release:**

```bash
# In operis-relay-agent repo
cd operis-relay-agent/

# Build for all platforms
make build-all

# This creates:
# bin/operis-relay-agent-linux-amd64
# bin/operis-relay-agent-linux-arm64
# bin/operis-relay-agent-windows-amd64.exe
# bin/operis-relay-agent-darwin-amd64
# bin/operis-relay-agent-darwin-arm64

# Upload to releases server
aws s3 sync bin/ s3://operis-releases/relay-agent/v1.0.0/

# Update "latest" symlink
aws s3 cp s3://operis-releases/relay-agent/v1.0.0/ \
          s3://operis-releases/relay-agent/latest/ \
          --recursive
```

**Customer Installation:**

```bash
# Customer runs on their mini-PC
curl -sSL https://install.operis.com | sudo bash

# Script does:
# 1. Detect OS/arch
# 2. Download appropriate binary from releases.operis.com
# 3. Install to /usr/local/bin/
# 4. Prompt for Box ID and API Key (you provide these)
# 5. Create /etc/operis/config.json
# 6. Install systemd service
# 7. Start service
# 8. Print Web UI URL: http://localhost:18789
```

---

## 7. VERSIONING & UPDATES

### 7.1. Cloud Server Updates

**Easy - You control entirely:**

```bash
# Deploy new version anytime
git push origin main
# CI/CD auto-deploys to cloud

# Zero downtime updates:
docker-compose up -d --no-deps operis-cloud
```

**Customer Impact:** ZERO (relay agents auto-reconnect)

### 7.2. Relay Agent Updates

**Two Options:**

**Option A: Manual Update (Simple)**

```bash
# Customer SSH to mini-PC
curl -sSL https://update.operis.com | sudo bash

# Script updates binary and restarts service
```

**Option B: Auto-Update (Advanced)**

```go
// internal/updater/updater.go
func (u *Updater) CheckForUpdates() {
	resp := http.Get("https://api.operis.com/relay-agent/latest-version")
	latestVersion := parseVersion(resp.Body)

	if latestVersion > currentVersion {
		u.downloadAndInstall(latestVersion)
		u.restart()
	}
}
```

**Update Strategy:**

| Scenario | Update Method | Frequency |
|----------|--------------|-----------|
| **Critical Security Fix** | Push update notification to mini-PC | Immediate |
| **Bug Fixes** | Auto-update (background) | Weekly check |
| **New Features** | Customer opt-in via Web UI | On demand |
| **Breaking Changes** | Manual update required | Rare |

---

## 8. SECURITY CONSIDERATIONS

### 8.1. Separate Repos = Better Security

**Why It's Safer:**

1. **Relay Agent Repo:**
   - NO business logic → Safe to distribute binary
   - NO API keys → Nothing to steal
   - NO LLM integration code → Can't see your prompts
   - NO database schemas → Can't understand your data model

2. **Cloud Repo:**
   - PRIVATE repository → Only your team can see
   - Contains all IP → Protected
   - Contains all secrets → Encrypted in env vars

**Even if relay agent is reverse engineered:**

```
Attacker gets:
✅ WebSocket client code (useless without your server)
✅ Command executor code (just exec wrappers)
✅ Hardware ID generation (public algorithm)
❌ Business logic (not in binary)
❌ Agent intelligence (on cloud)
❌ LLM prompts (on cloud)
❌ Your customers' data (on cloud)

Conclusion: ZERO VALUE for attacker!
```

### 8.2. API Key Security

**Cloud Side:**

```typescript
// Check hardware ID + API key
app.post('/relay/auth', async (req, res) => {
  const { boxId, apiKey, hwid } = req.body;

  const box = await db.boxes.findOne({ id: boxId });

  if (!box) return res.status(404).json({ error: 'Box not found' });
  if (box.api_key !== apiKey) return res.status(401).json({ error: 'Invalid API key' });
  if (box.hardware_id !== hwid) return res.status(403).json({ error: 'Hardware ID mismatch' });

  return res.json({ authorized: true });
});
```

**Relay Agent Side:**

```go
// Config encrypted at rest
func (c *Config) Save(path string) error {
	data, _ := json.Marshal(c)
	encrypted := encrypt(data, getMachineKey())
	return ioutil.WriteFile(path, encrypted, 0600)
}
```

---

## 9. FAQ

### Q1: Relay agent repo có thể public không?

**A: CÓ - Safely!**

Vì relay agent không chứa business logic, bạn có thể public repo này nếu muốn. Benefits:
- Community contributions
- Transparency for customers
- Open source credibility

**BUT:** Keep cloud repo PRIVATE!

### Q2: Relay agent có thể hoạt động standalone không?

**A: KHÔNG - Hoàn toàn phụ thuộc vào cloud server.**

Without cloud server:
- Relay agent chỉ serve static UI files
- Nhưng Web UI cần WebSocket tới cloud → fail
- Không có commands gửi xuống → idle
- Useless without cloud!

### Q3: Customer có thể modify relay agent không?

**A: CÓ - Nhưng vô ích.**

- Relay agent là open/closed source đều được
- Nếu customer modify: Break hardware ID check → rejected by cloud
- Nếu bypass check: Still need valid API key → don't have
- **Kết luận:** Có thể modify nhưng không lợi gì

### Q4: Làm sao sync protocol changes giữa 2 repos?

**A: Version protocol explicitly.**

```typescript
// Cloud sends
{ "protocol_version": "1.2", ... }

// Relay agent checks
if (cmd.ProtocolVersion < "1.2") {
  return { error: "Please update relay agent" }
}
```

### Q5: Relay agent có cần update thường xuyên không?

**A: KHÔNG - Very stable.**

Update reasons:
- Security fixes (rare)
- Bug fixes (occasional)
- New tool types (rare)

Most updates happen cloud-side only!

---

## 10. SUMMARY

### 10.1. Two Separate Projects

```
┌────────────────────────────────────┐  ┌────────────────────────────────────┐
│  OPERIS (Cloud)                    │  │  OPERIS-RELAY-AGENT (Mini-PC)      │
│  ────────────────                  │  │  ──────────────────────            │
│                                    │  │                                    │
│  • TypeScript/Node.js              │  │  • Go                              │
│  • 290,000 LOC                     │  │  • 2,000 LOC                       │
│  • Full business logic             │  │  • Zero business logic             │
│  • PRIVATE repo                    │  │  • Can be public                   │
│  • Deploy to cloud                 │  │  • Distribute binary only          │
│  • Update anytime                  │  │  • Stable (rare updates)           │
└────────────────────────────────────┘  └────────────────────────────────────┘
                  ↕
         WebSocket (protocol v1.0)
```

### 10.2. Benefits

✅ **Clear Separation:** Cloud code vs mini-PC code
✅ **Maximum IP Protection:** Business logic never leaves cloud
✅ **Independent Development:** Teams can work separately
✅ **Independent Versioning:** v2.5 cloud + v1.0 relay = OK
✅ **Easier Distribution:** Binary-only, no source
✅ **Security:** Relay agent repo can't see cloud secrets
✅ **Open Source Option:** Could open-source relay agent safely

### 10.3. Recommendation

**✅ STRONGLY RECOMMEND: Separate repos as described**

This provides:
- Best IP protection
- Clearest architecture
- Easiest deployment
- Most flexible development

**Folder Structure:**

```
yourcompany/
├── operis/                    (PRIVATE - Cloud server)
│   └── src/
│       ├── relay-gateway/     (NEW)
│       └── agents/tools/proxy/ (NEW)
│
└── operis-relay-agent/        (Can be PUBLIC - Mini-PC)
    ├── cmd/agent/
    ├── internal/
    └── bin/ (build outputs)
```

**Next Steps:**

1. Create `operis-relay-agent` repository
2. Implement relay agent (see [03-relay-agent-spec.md](03-relay-agent-spec.md))
3. Modify `operis` to add relay gateway
4. Test integration
5. Deploy!

---

**Document Version:** 1.0
**Date:** 2026-01-29
**Status:** Complete - Architecture defined
**Recommendation:** SEPARATE REPOS ✅
