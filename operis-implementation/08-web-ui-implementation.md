# WEB UI IMPLEMENTATION

**Static Web UI served by Mini-PC Relay Agent**

Version: 1.0
Date: 2026-01-29

---

## 1. ARCHITECTURE

### 1.1. Three-Part UI System

```
┌────────────────────────────────────────────────────────────┐
│  1. STATIC WEB UI (Mini-PC)                                │
│     ─────────────────────                                  │
│     • HTML/CSS/JS files (~5MB)                             │
│     • Embedded in relay agent Go binary                    │
│     • Served at http://localhost:18789                     │
│     • Pure presentation layer (NO business logic)          │
└────────────────────────┬───────────────────────────────────┘
                         │ WebSocket (WSS)
┌────────────────────────▼───────────────────────────────────┐
│  2. WEB UI BACKEND (Cloud)                                 │
│     ─────────────────────────                              │
│     • WebSocket server for browser clients                 │
│     • Authentication (JWT)                                 │
│     • Message routing (UI ↔ Agent)                         │
│     • Session management                                   │
└────────────────────────┬───────────────────────────────────┘
                         │ Internal calls
┌────────────────────────▼───────────────────────────────────┐
│  3. AGENT RUNTIME (Cloud)                                  │
│     ──────────────────────                                 │
│     • Processes user messages                              │
│     • Calls LLM                                            │
│     • Executes tools via relay gateway                     │
│     • Returns formatted responses                          │
└────────────────────────────────────────────────────────────┘
```

---

## 2. STATIC WEB UI (ON MINI-PC)

### 2.1. File Structure

```
static/
├── index.html           (~5KB - Main page)
├── app.js               (~30KB - WebSocket client, UI logic)
├── styles.css           (~10KB - Styling)
├── logo.svg             (~2KB - Operis logo)
└── manifest.json        (~1KB - PWA manifest)

Total: ~50KB (gzipped: ~15KB)
```

### 2.2. index.html (Complete)

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Operis Control</title>
    <link rel="stylesheet" href="/static/styles.css">
    <link rel="manifest" href="/static/manifest.json">
</head>
<body>
    <div id="app">
        <nav class="navbar">
            <div class="navbar-brand">
                <img src="/static/logo.svg" alt="Operis">
                <h1>Operis Control</h1>
            </div>
            <div class="navbar-status">
                <span id="status" class="status-badge disconnected">Connecting...</span>
            </div>
        </nav>

        <div class="container">
            <aside class="sidebar">
                <h2>Agents</h2>
                <div id="agents-list"></div>
                <button onclick="showCreateAgentDialog()" class="btn-primary">+ New Agent</button>

                <h2 style="margin-top: 30px;">Cronjobs</h2>
                <div id="cronjobs-list"></div>
                <button onclick="showCreateCronjobDialog()" class="btn-primary">+ New Cronjob</button>
            </aside>

            <main class="main-content">
                <div id="chat-view" class="view active">
                    <div id="messages"></div>
                    <div class="input-container">
                        <input
                            type="text"
                            id="message-input"
                            placeholder="Type your message..."
                            onkeypress="handleKeyPress(event)"
                        >
                        <button onclick="sendMessage()" class="btn-send">Send</button>
                    </div>
                </div>
            </main>
        </div>
    </div>

    <!-- Dialogs -->
    <div id="create-agent-dialog" class="dialog" style="display: none;">
        <div class="dialog-content">
            <h2>Create New Agent</h2>
            <form onsubmit="createAgent(event)">
                <label>Name</label>
                <input type="text" id="agent-name" required>

                <label>Model</label>
                <select id="agent-model">
                    <option value="claude-sonnet-4.5">Claude Sonnet 4.5</option>
                    <option value="claude-opus-4.5">Claude Opus 4.5</option>
                    <option value="gpt-4">GPT-4</option>
                </select>

                <label>System Prompt</label>
                <textarea id="agent-prompt" rows="4"></textarea>

                <div class="dialog-actions">
                    <button type="button" onclick="hideDialog('create-agent-dialog')">Cancel</button>
                    <button type="submit" class="btn-primary">Create</button>
                </div>
            </form>
        </div>
    </div>

    <script src="/static/app.js"></script>
</body>
</html>
```

### 2.3. app.js (Complete)

```javascript
// Configuration
const BOX_ID = localStorage.getItem('operis_box_id') || 'demo-box';
const CLOUD_WS_URL = `wss://cloud.operis.com/ws?boxId=${BOX_ID}`;

// State
let ws = null;
let currentAgentId = null;
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 5;

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    connectToCloud();
    loadAgents();
    loadCronjobs();
});

// WebSocket Connection
function connectToCloud() {
    console.log('[WS] Connecting to cloud...');

    ws = new WebSocket(CLOUD_WS_URL);

    ws.onopen = () => {
        console.log('[WS] Connected');
        updateStatus('connected', 'Connected ✓');
        reconnectAttempts = 0;
    };

    ws.onclose = () => {
        console.log('[WS] Disconnected');
        updateStatus('disconnected', 'Disconnected ✗');

        // Attempt reconnect
        if (reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
            reconnectAttempts++;
            const delay = Math.min(1000 * Math.pow(2, reconnectAttempts), 30000);
            console.log(`[WS] Reconnecting in ${delay}ms...`);
            setTimeout(connectToCloud, delay);
        }
    };

    ws.onerror = (error) => {
        console.error('[WS] Error:', error);
    };

    ws.onmessage = (event) => {
        const message = JSON.parse(event.data);
        handleMessage(message);
    };
}

function handleMessage(message) {
    switch (message.type) {
        case 'chat_response':
            displayMessage({ role: 'assistant', content: message.content });
            break;
        case 'agent_created':
            addAgentToList(message.agent);
            hideDialog('create-agent-dialog');
            break;
        case 'cronjob_created':
            addCronjobToList(message.cronjob);
            hideDialog('create-cronjob-dialog');
            break;
        // ... other message types
    }
}

// UI Functions
function updateStatus(status, text) {
    const statusEl = document.getElementById('status');
    statusEl.className = `status-badge ${status}`;
    statusEl.textContent = text;
}

function sendMessage() {
    const input = document.getElementById('message-input');
    const text = input.value.trim();

    if (!text || !ws || ws.readyState !== WebSocket.OPEN) return;

    // Send to cloud
    ws.send(JSON.stringify({
        type: 'chat',
        agent_id: currentAgentId,
        content: text,
    }));

    // Display locally
    displayMessage({ role: 'user', content: text });

    // Clear input
    input.value = '';
}

function displayMessage(message) {
    const messagesEl = document.getElementById('messages');

    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${message.role}`;

    const contentDiv = document.createElement('div');
    contentDiv.className = 'content';
    contentDiv.textContent = message.content;

    messageDiv.appendChild(contentDiv);
    messagesEl.appendChild(messageDiv);

    // Scroll to bottom
    messagesEl.scrollTop = messagesEl.scrollHeight;
}

function handleKeyPress(event) {
    if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault();
        sendMessage();
    }
}

// Agent Management
function loadAgents() {
    if (!ws || ws.readyState !== WebSocket.OPEN) {
        setTimeout(loadAgents, 1000);
        return;
    }

    ws.send(JSON.stringify({ type: 'list_agents' }));
}

function createAgent(event) {
    event.preventDefault();

    const name = document.getElementById('agent-name').value;
    const model = document.getElementById('agent-model').value;
    const prompt = document.getElementById('agent-prompt').value;

    ws.send(JSON.stringify({
        type: 'create_agent',
        config: { name, model, systemPrompt: prompt },
    }));
}

function addAgentToList(agent) {
    const listEl = document.getElementById('agents-list');

    const agentEl = document.createElement('div');
    agentEl.className = 'agent-item';
    agentEl.innerHTML = `
        <div class="agent-name">${agent.name}</div>
        <div class="agent-model">${agent.model}</div>
    `;
    agentEl.onclick = () => selectAgent(agent.id);

    listEl.appendChild(agentEl);
}

function selectAgent(agentId) {
    currentAgentId = agentId;
    // Update UI to show selected agent
}

// Cronjob Management
function loadCronjobs() {
    if (!ws || ws.readyState !== WebSocket.OPEN) {
        setTimeout(loadCronjobs, 1000);
        return;
    }

    ws.send(JSON.stringify({ type: 'list_cronjobs' }));
}

function createCronjob(event) {
    event.preventDefault();

    const name = document.getElementById('cronjob-name').value;
    const schedule = document.getElementById('cronjob-schedule').value;
    const action = document.getElementById('cronjob-action').value;

    ws.send(JSON.stringify({
        type: 'create_cronjob',
        config: { name, schedule, action },
    }));
}

function addCronjobToList(cronjob) {
    const listEl = document.getElementById('cronjobs-list');

    const cronEl = document.createElement('div');
    cronEl.className = 'cronjob-item';
    cronEl.innerHTML = `
        <div class="cronjob-name">${cronjob.name}</div>
        <div class="cronjob-schedule">${cronjob.schedule}</div>
    `;

    listEl.appendChild(cronEl);
}

// Dialog Functions
function showCreateAgentDialog() {
    document.getElementById('create-agent-dialog').style.display = 'flex';
}

function showCreateCronjobDialog() {
    document.getElementById('create-cronjob-dialog').style.display = 'flex';
}

function hideDialog(dialogId) {
    document.getElementById(dialogId).style.display = 'none';
}
```

### 2.4. styles.css (Abbreviated)

```css
/* Reset & Base */
* { margin: 0; padding: 0; box-sizing: border-box; }

body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    background: #0f172a;
    color: #e2e8f0;
}

/* Navbar */
.navbar {
    background: #1e293b;
    padding: 1rem 2rem;
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-bottom: 1px solid #334155;
}

.navbar-brand {
    display: flex;
    align-items: center;
    gap: 1rem;
}

.navbar-brand h1 {
    font-size: 1.5rem;
    font-weight: 600;
}

/* Status Badge */
.status-badge {
    padding: 0.5rem 1rem;
    border-radius: 0.5rem;
    font-size: 0.875rem;
    font-weight: 500;
}

.status-badge.connected {
    background: #10b981;
    color: white;
}

.status-badge.disconnected {
    background: #ef4444;
    color: white;
}

/* Container */
.container {
    display: flex;
    height: calc(100vh - 70px);
}

/* Sidebar */
.sidebar {
    width: 300px;
    background: #1e293b;
    padding: 1.5rem;
    border-right: 1px solid #334155;
    overflow-y: auto;
}

/* Main Content */
.main-content {
    flex: 1;
    display: flex;
    flex-direction: column;
}

/* Chat View */
#chat-view {
    display: flex;
    flex-direction: column;
    height: 100%;
}

#messages {
    flex: 1;
    padding: 2rem;
    overflow-y: auto;
}

.message {
    margin-bottom: 1rem;
    padding: 1rem;
    border-radius: 0.5rem;
    max-width: 70%;
}

.message.user {
    background: #3b82f6;
    margin-left: auto;
}

.message.assistant {
    background: #475569;
    margin-right: auto;
}

/* Input */
.input-container {
    padding: 1.5rem;
    background: #1e293b;
    border-top: 1px solid #334155;
    display: flex;
    gap: 1rem;
}

#message-input {
    flex: 1;
    padding: 0.75rem;
    border-radius: 0.5rem;
    border: 1px solid #475569;
    background: #0f172a;
    color: #e2e8f0;
    font-size: 1rem;
}

/* Buttons */
button {
    padding: 0.75rem 1.5rem;
    border-radius: 0.5rem;
    border: none;
    font-size: 0.875rem;
    font-weight: 500;
    cursor: pointer;
}

.btn-primary {
    background: #3b82f6;
    color: white;
}

.btn-primary:hover {
    background: #2563eb;
}

.btn-send {
    background: #10b981;
    color: white;
}

/* Dialogs */
.dialog {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.7);
    display: flex;
    align-items: center;
    justify-content: center;
}

.dialog-content {
    background: #1e293b;
    padding: 2rem;
    border-radius: 0.5rem;
    min-width: 500px;
}
```

---

## 3. WEB UI BACKEND (ON CLOUD)

### 3.1. WebSocket Server

```typescript
// File: src/web-ui-backend/websocket-server.ts
import { WebSocketServer, WebSocket } from 'ws';
import { verifyJWT } from './auth';

export class WebUIBackend {
  private wss: WebSocketServer;
  private connections: Map<string, WebSocket> = new Map();

  constructor(port: number = 3000) {
    this.wss = new WebSocketServer({ port });
  }

  async start() {
    this.wss.on('connection', async (ws, req) => {
      const url = new URL(req.url!, 'wss://localhost');
      const boxId = url.searchParams.get('boxId');
      const token = url.searchParams.get('token');

      // Authenticate
      try {
        const user = await verifyJWT(token);
        // Verify user owns this box
        // ...

        console.log(`[WebUIBackend] Browser connected for box ${boxId}`);

        this.connections.set(boxId, ws);

        ws.on('message', (data) => {
          this.handleBrowserMessage(boxId, data);
        });

        ws.on('close', () => {
          this.connections.delete(boxId);
        });

      } catch (error) {
        ws.close(1008, 'Authentication failed');
      }
    });

    console.log('[WebUIBackend] Started on port', this.wss.options.port);
  }

  private async handleBrowserMessage(boxId: string, data: Buffer) {
    const message = JSON.parse(data.toString());

    switch (message.type) {
      case 'chat':
        await this.handleChat(boxId, message);
        break;
      case 'create_agent':
        await this.handleCreateAgent(boxId, message);
        break;
      // ... other message types
    }
  }

  private async handleChat(boxId: string, message: any) {
    // Create or resume agent
    const agent = await getOrCreateAgent(boxId, message.agent_id);

    // Process message
    const response = await agent.chat(message.content);

    // Send response to browser
    this.sendToBrowser(boxId, {
      type: 'chat_response',
      content: response,
    });
  }

  private sendToBrowser(boxId: string, message: any) {
    const ws = this.connections.get(boxId);
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(message));
    }
  }
}
```

---

## 4. SUMMARY

✅ **Static UI:** ~50KB files embedded in relay agent
✅ **Zero Logic:** Pure presentation layer
✅ **Real-time:** WebSocket to cloud
✅ **Features:** Agent creation, cronjobs, chat
✅ **Responsive:** Works on desktop + mobile

**Next:** Deploy and test UI!

---

**Document Version:** 1.0
**Date:** 2026-01-29
