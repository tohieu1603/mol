# MIGRATION FROM MOLTBOT

**Step-by-Step Guide to Transform Moltbot into Operis**

Version: 1.0
Date: 2026-01-29

---

## 1. OVERVIEW

### 1.1. What Changes?

| Component | Before (Moltbot) | After (Operis) | Change Level |
|-----------|------------------|----------------|--------------|
| **Agent Runtime** | Local execution | Cloud execution | ⚠️ Minimal (tool selection only) |
| **Tools** | Direct execution | Proxied via relay gateway | ➕ New proxy wrappers |
| **UI** | Local Lit app | Static UI + cloud backend | ➕ New Web UI backend |
| **Cron** | Local Croner | Cloud Croner | ✅ No changes |
| **Database** | Local SQLite | PostgreSQL + SQLite | ➕ New PostgreSQL |
| **Channels** | Direct connections | Via mini-PC | ⚠️ Proxy WhatsApp/Telegram |

**Code Reuse:** ~95% of Moltbot code unchanged!

---

## 2. MIGRATION STEPS

### 2.1. Phase 1: Add Relay Gateway (Week 1-2)

**Step 1.1: Create relay-gateway module**

```bash
mkdir -p src/relay-gateway
touch src/relay-gateway/index.ts
touch src/relay-gateway/server.ts
touch src/relay-gateway/box-manager.ts
touch src/relay-gateway/command-router.ts
touch src/relay-gateway/connection-pool.ts
touch src/relay-gateway/health-monitor.ts
```

Copy implementations from [04-relay-gateway-spec.md](04-relay-gateway-spec.md)

**Step 1.2: Install dependencies**

```bash
npm install ws uuid
npm install --save-dev @types/ws @types/uuid
```

**Step 1.3: Start gateway in main entry point**

```typescript
// src/index.ts (modify)
import { RelayGateway } from './relay-gateway';

// ... existing Moltbot initialization

// Add relay gateway
const relayGateway = new RelayGateway(8443);
await relayGateway.start();

export { relayGateway }; // Export for use by tools
```

**Step 1.4: Test gateway**

```bash
npm run build
npm start

# In another terminal
wscat -c "ws://localhost:8443?boxId=test&apiKey=test&hwid=test"
```

---

### 2.2. Phase 2: Create Tool Proxies (Week 2-3)

**Step 2.1: Create proxy directory**

```bash
mkdir -p src/agents/tools/proxy
touch src/agents/tools/proxy/index.ts
touch src/agents/tools/proxy/base-proxy.ts
touch src/agents/tools/proxy/bash-proxy.ts
touch src/agents/tools/proxy/browser-proxy.ts
touch src/agents/tools/proxy/file-proxy.ts
```

**Step 2.2: Implement proxies**

Copy implementations from [06-tool-proxying.md](06-tool-proxying.md)

**Step 2.3: Create tool factory**

```typescript
// src/agents/tools/proxy/index.ts
import { createBashToolProxy } from './bash-proxy';
import { createBrowserToolProxy } from './browser-proxy';
import { createFileToolProxy } from './file-proxy';

export function getProxiedTools(boxId: string) {
  return {
    bash: createBashToolProxy(boxId),
    browser: createBrowserToolProxy(boxId),
    file: createFileToolProxy(boxId),
  };
}
```

**Step 2.4: Test proxies (with mock)**

```bash
npm test -- proxy
```

---

### 2.3. Phase 3: Modify Agent Creation (Week 3-4)

**Step 3.1: Update agent creation**

```typescript
// src/commands/agent.ts (modify existing)
import { getLocalTools } from '../agents/tools';
import { getProxiedTools } from '../agents/tools/proxy';

export async function createAgent(config: AgentConfig) {
  // Check if relay mode
  const isRelayMode = !!config.boxId;

  // Get appropriate tools
  const tools = isRelayMode
    ? getProxiedTools(config.boxId)
    : getLocalTools();

  const agent = new PiAgent({
    model: config.model,
    systemPrompt: config.systemPrompt,
    tools: tools,
  });

  await agent.start();

  return agent;
}
```

**Step 3.2: Add boxId parameter to agent config**

```typescript
// src/types/agent.ts (modify)
export interface AgentConfig {
  model: string;
  systemPrompt?: string;
  boxId?: string; // NEW - for relay mode
}
```

**Step 3.3: Test agent creation (both modes)**

```typescript
// test/agent.test.ts
it('should create local agent (no boxId)', async () => {
  const agent = await createAgent({
    model: 'claude-sonnet-4.5',
  });
  // Uses local tools
});

it('should create relay agent (with boxId)', async () => {
  const agent = await createAgent({
    model: 'claude-sonnet-4.5',
    boxId: 'box-123',
  });
  // Uses proxied tools
});
```

---

### 2.4. Phase 4: Add PostgreSQL (Week 4-5)

**Step 4.1: Install dependencies**

```bash
npm install pg
npm install --save-dev @types/pg
npm install node-pg-migrate
```

**Step 4.2: Create database module**

```bash
mkdir -p src/database
touch src/database/index.ts
touch src/database/client.ts
```

**Step 4.3: Implement database client**

```typescript
// src/database/client.ts
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export const db = {
  query: (text: string, params?: any[]) => pool.query(text, params),

  boxes: {
    findOne: async (where: any) => {
      const result = await pool.query(
        'SELECT * FROM boxes WHERE id = $1 LIMIT 1',
        [where.id]
      );
      return result.rows[0];
    },
    // ... other methods
  },

  // ... other tables
};
```

**Step 4.4: Create migrations**

```bash
mkdir migrations
npm run migrate create initial_schema
```

Copy schema from [07-database-schema.md](07-database-schema.md)

**Step 4.5: Run migrations**

```bash
npm run migrate up
```

---

### 2.5. Phase 5: Add Web UI Backend (Week 5-6)

**Step 5.1: Create web-ui-backend module**

```bash
mkdir -p src/web-ui-backend
touch src/web-ui-backend/index.ts
touch src/web-ui-backend/websocket-server.ts
touch src/web-ui-backend/auth.ts
```

**Step 5.2: Implement WebSocket server for browsers**

```typescript
// src/web-ui-backend/websocket-server.ts
import { WebSocketServer } from 'ws';

export class WebUIBackend {
  private wss: WebSocketServer;

  constructor(port: number = 3000) {
    this.wss = new WebSocketServer({ port });
  }

  async start() {
    this.wss.on('connection', (ws, req) => {
      const url = new URL(req.url!, 'wss://localhost');
      const boxId = url.searchParams.get('boxId');

      // Authenticate customer
      // ...

      // Handle messages from browser
      ws.on('message', (data) => {
        const message = JSON.parse(data.toString());

        if (message.type === 'chat') {
          // Send to agent
          this.handleChatMessage(boxId, message.content);
        }
      });
    });

    console.log('[WebUIBackend] Started on port', this.wss.options.port);
  }

  private async handleChatMessage(boxId: string, content: string) {
    // Create or resume agent
    const agent = await createAgent({ boxId, model: 'claude-sonnet-4.5' });

    // Process message
    const response = await agent.chat(content);

    // Send response back to browser
    // ...
  }
}
```

**Step 5.3: Start Web UI backend**

```typescript
// src/index.ts (modify)
import { WebUIBackend } from './web-ui-backend';

// ... existing code

const webUIBackend = new WebUIBackend(3000);
await webUIBackend.start();
```

---

### 2.6. Phase 6: Build Relay Agent (Week 6-8)

See [03-relay-agent-spec.md](03-relay-agent-spec.md) for complete implementation.

**Step 6.1: Create Go project**

```bash
mkdir operis-relay-agent
cd operis-relay-agent

go mod init github.com/yourcompany/operis-relay-agent

mkdir -p cmd/agent
mkdir -p internal/{connection,handlers,webui,config,security}
```

**Step 6.2: Implement relay agent**

Copy implementations from [03-relay-agent-spec.md](03-relay-agent-spec.md)

**Step 6.3: Build binaries**

```bash
make build-all

# Outputs:
# bin/operis-relay-agent-linux-amd64
# bin/operis-relay-agent-linux-arm64
# bin/operis-relay-agent-windows-amd64.exe
# bin/operis-relay-agent-darwin-amd64
# bin/operis-relay-agent-darwin-arm64
```

**Step 6.4: Test with cloud server**

```bash
# On cloud
npm start

# On mini-PC (or local test)
./bin/operis-relay-agent-linux-amd64 --config config.json
```

---

### 2.7. Phase 7: Integration Testing (Week 8-9)

**Step 7.1: End-to-end test**

```typescript
// test/e2e/full-flow.test.ts
describe('Full Relay Flow', () => {
  it('should execute bash command via relay', async () => {
    // 1. Start cloud server
    const cloud = await startCloudServer();

    // 2. Start relay agent (Docker)
    const relayAgent = await startRelayAgentDocker();

    // 3. Create agent via API
    const agent = await cloud.createAgent({
      boxId: relayAgent.boxId,
      model: 'claude-sonnet-4.5',
    });

    // 4. Send chat message
    const response = await agent.chat('Run: ls -la');

    // 5. Verify tool execution
    expect(response).toContain('total');
    expect(response).toContain('drwx');
  });
});
```

**Step 7.2: Test all tools**

```bash
npm test -- e2e
```

---

### 2.8. Phase 8: Deploy (Week 9-10)

See [10-deployment-guide.md](10-deployment-guide.md) for complete deployment instructions.

**Step 8.1: Deploy cloud server**

```bash
# On production server
cd /opt/operis
git pull origin main
npm install --production
npm run build
npm run migrate up
sudo systemctl restart operis
```

**Step 8.2: Upload relay agent binaries**

```bash
aws s3 sync bin/ s3://operis-releases/relay-agent/latest/
```

**Step 8.3: Test with pilot customers**

```bash
# Give customers installation command
curl -sSL https://install.operis.com | sudo bash

# Provide Box ID and API Key
```

---

## 3. TESTING CHECKLIST

### 3.1. Before Migration

- [ ] All Moltbot tests passing
- [ ] Code coverage > 70%
- [ ] No critical bugs

### 3.2. During Migration

- [ ] Relay gateway connects mini-PCs
- [ ] All tool proxies work
- [ ] Agent creation works (both modes)
- [ ] Cronjobs work
- [ ] Database migrations applied
- [ ] Web UI backend serves browsers

### 3.3. After Migration

- [ ] End-to-end tests pass
- [ ] Performance benchmarks acceptable
- [ ] Security audit completed
- [ ] Documentation updated
- [ ] Pilot customers successful

---

## 4. ROLLBACK PLAN

### 4.1. If Migration Fails

**Option 1: Continue with local Moltbot**

```bash
# Revert changes
git revert <commit-hash>

# Run local Moltbot as before
npm start
```

**Option 2: Run both in parallel**

```bash
# Cloud server (Operis)
NODE_ENV=production npm start

# Local Moltbot (unchanged)
cd moltbot-backup
npm start
```

---

## 5. SUMMARY

### 5.1. Migration Timeline

| Phase | Duration | Deliverable |
|-------|----------|-------------|
| 1. Relay Gateway | 1-2 weeks | WebSocket server working |
| 2. Tool Proxies | 1 week | All tools proxied |
| 3. Agent Modification | 1 week | Agents use proxy tools |
| 4. PostgreSQL | 1 week | Database schema migrated |
| 5. Web UI Backend | 1-2 weeks | Browsers can connect |
| 6. Relay Agent | 2-3 weeks | Go binary working |
| 7. Integration Testing | 1-2 weeks | E2E tests pass |
| 8. Deployment | 1 week | Production ready |
| **TOTAL** | **9-13 weeks** | **Operis live!** |

### 5.2. Code Changes Summary

**New Code:** ~10,000 LOC
- Relay Gateway: ~3,000 LOC (TypeScript)
- Tool Proxies: ~1,000 LOC (TypeScript)
- Web UI Backend: ~2,000 LOC (TypeScript)
- Database Layer: ~1,000 LOC (TypeScript)
- Relay Agent: ~2,000 LOC (Go)
- Static Web UI: ~1,000 LOC (HTML/JS/CSS)

**Modified Code:** ~500 LOC
- Agent creation: Tool selection logic
- Entry point: Start gateway & web UI backend

**Unchanged:** ~290,000 LOC
- All agent runtime logic
- All LLM integration
- All memory/RAG
- All plugins
- All channels (except proxied)

**Reuse:** 95%+ of existing Moltbot code!

---

**Document Version:** 1.0
**Date:** 2026-01-29
**Status:** Complete - Ready for execution
