# RELAY AGENT SPECIFICATION

**Relay Agent: Go Binary Running on Mini-PC**

Component Type: Client-side executor
Language: Go 1.22+
Binary Size: ~20MB
Purpose: Execute commands from cloud server, serve static Web UI

---

## 1. OVERVIEW

### 1.1. What is the Relay Agent?

**The relay agent is a DUMB EXECUTOR, not an intelligent agent!**

```
┌─────────────────────────────────────────────────────────────┐
│  RELAY AGENT (Go Binary on Mini-PC)                         │
│  ──────────────────────────────────────────────              │
│                                                               │
│  Role: Command Executor                                      │
│  Intelligence: ZERO                                          │
│  Decision Making: NONE                                       │
│                                                               │
│  Capabilities:                                               │
│  1. Connect to cloud via WebSocket                           │
│  2. Receive commands (JSON)                                  │
│  3. Execute commands:                                        │
│     • bash -c "command"                                      │
│     • Launch Chromium and navigate                           │
│     • Read/write files                                       │
│     • Send WhatsApp messages (via Baileys-Go)                │
│  4. Return results (JSON)                                    │
│  5. Serve static Web UI files (HTTP server)                  │
│                                                               │
│  What it CANNOT do:                                          │
│  ❌ Make decisions about what commands to run                │
│  ❌ Call LLM or AI services                                  │
│  ❌ Understand context or conversation history               │
│  ❌ Have any business logic                                  │
│  ❌ Work without cloud server                                │
└─────────────────────────────────────────────────────────────┘
```

### 1.2. Why Go?

| Criterion | Go | Node.js | Rust |
|-----------|-----|---------|------|
| **Binary Size** | ✅ 20MB | ❌ 150MB+ | ✅ 15MB |
| **Cross-platform** | ✅ Easy (GOOS/GOARCH) | ⚠️ Need Node runtime | ✅ Hard (complex builds) |
| **Performance** | ✅ Fast | ⚠️ Medium | ✅ Fastest |
| **Development Speed** | ✅ Fast | ✅ Fast | ❌ Slow |
| **Concurrency** | ✅ Goroutines | ⚠️ async/await | ✅ async/tokio |
| **Memory Usage** | ✅ Low (~50MB) | ❌ High (~200MB) | ✅ Very low |
| **Standard Library** | ✅ Excellent | ⚠️ Need many deps | ✅ Good |
| **Deployment** | ✅ Single binary | ❌ Need Node + deps | ✅ Single binary |

**Winner: Go** - Best balance of size, performance, ease of development

---

## 2. ARCHITECTURE

### 2.1. Component Structure

```
relay-agent/
├── cmd/
│   └── agent/
│       └── main.go                 # Entry point
│
├── internal/
│   ├── connection/
│   │   ├── websocket.go            # WebSocket client to cloud
│   │   ├── heartbeat.go            # Keep-alive mechanism
│   │   └── reconnect.go            # Auto-reconnect logic
│   │
│   ├── handlers/
│   │   ├── bash.go                 # Bash command execution
│   │   ├── browser.go              # Browser automation (chromedp)
│   │   ├── file.go                 # File operations
│   │   ├── whatsapp.go             # WhatsApp via go-whatsapp
│   │   └── telegram.go             # Telegram via gotgbot
│   │
│   ├── webui/
│   │   ├── server.go               # HTTP server for static UI
│   │   └── static/                 # Embedded static files
│   │       ├── index.html
│   │       ├── app.js
│   │       └── styles.css
│   │
│   ├── config/
│   │   ├── config.go               # Configuration management
│   │   └── encryption.go           # Config encryption
│   │
│   └── security/
│       ├── hwid.go                 # Hardware ID generation
│       └── apikey.go               # API key validation
│
├── go.mod
├── go.sum
├── README.md
└── Makefile                        # Build scripts
```

### 2.2. Data Flow

```
┌──────────────────────────────────────────────────────────────┐
│  main.go                                                      │
│  ────────                                                     │
│  1. Load config from /etc/operis/config.json                 │
│  2. Start Web UI HTTP server (port 18789)                    │
│  3. Connect to cloud WebSocket                               │
│  4. Enter message handling loop                              │
└────────────────────┬─────────────────────────────────────────┘
                     │
                     ↓
┌──────────────────────────────────────────────────────────────┐
│  connection/websocket.go                                      │
│  ────────────────────────                                    │
│  • Dial wss://cloud.operis.com:8443/relay                    │
│  • Authenticate with API key + Hardware ID                   │
│  • Start heartbeat goroutine (ping every 30s)                │
│  • Start message reader goroutine                            │
└────────────────────┬─────────────────────────────────────────┘
                     │
                     ↓ Receives command
┌──────────────────────────────────────────────────────────────┐
│  Message Router                                               │
│  ──────────────                                              │
│  Parse JSON → Dispatch to handler based on cmd.Type          │
└────────────────────┬─────────────────────────────────────────┘
                     │
          ┌──────────┼──────────┬──────────┐
          ↓          ↓          ↓          ↓
    ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐
    │  Bash   │ │ Browser │ │  File   │ │WhatsApp │
    │ Handler │ │ Handler │ │ Handler │ │ Handler │
    └────┬────┘ └────┬────┘ └────┬────┘ └────┬────┘
         │           │           │           │
         └───────────┴───────────┴───────────┘
                     │
                     ↓ Returns result
┌──────────────────────────────────────────────────────────────┐
│  Send Result Back to Cloud                                    │
│  ─────────────────────────────                               │
│  JSON response via WebSocket                                 │
└──────────────────────────────────────────────────────────────┘
```

---

## 3. IMPLEMENTATION

### 3.1. Main Entry Point

**File: `cmd/agent/main.go`**

```go
package main

import (
	"flag"
	"log"
	"os"
	"os/signal"
	"syscall"

	"github.com/operis/relay-agent/internal/config"
	"github.com/operis/relay-agent/internal/connection"
	"github.com/operis/relay-agent/internal/handlers"
	"github.com/operis/relay-agent/internal/webui"
)

func main() {
	// Parse flags
	configPath := flag.String("config", "/etc/operis/config.json", "Path to config file")
	flag.Parse()

	// Load configuration
	cfg, err := config.Load(*configPath)
	if err != nil {
		log.Fatalf("Failed to load config: %v", err)
	}

	log.Printf("Relay Agent starting...")
	log.Printf("Box ID: %s", cfg.BoxID)
	log.Printf("Cloud: %s", cfg.CloudEndpoint)

	// Start Web UI server in background goroutine
	uiServer := webui.NewServer(cfg.UIPort)
	go func() {
		log.Printf("Web UI starting on http://localhost:%d", cfg.UIPort)
		if err := uiServer.Start(); err != nil {
			log.Fatalf("Web UI server failed: %v", err)
		}
	}()

	// Connect to cloud
	conn, err := connection.New(cfg.CloudEndpoint, cfg.BoxID, cfg.APIKey)
	if err != nil {
		log.Fatalf("Failed to create connection: %v", err)
	}

	if err := conn.Connect(); err != nil {
		log.Fatalf("Failed to connect to cloud: %v", err)
	}

	log.Printf("Connected to cloud successfully")

	// Initialize handlers
	handler := handlers.New(conn, cfg)

	// Start message handling loop
	go handler.Run()

	// Wait for interrupt signal
	sigChan := make(chan os.Signal, 1)
	signal.Notify(sigChan, os.Interrupt, syscall.SIGTERM)
	<-sigChan

	log.Printf("Shutting down...")
	conn.Close()
}
```

### 3.2. WebSocket Connection

**File: `internal/connection/websocket.go`**

```go
package connection

import (
	"encoding/json"
	"log"
	"time"

	"github.com/gorilla/websocket"
	"github.com/operis/relay-agent/internal/security"
)

type Connection struct {
	endpoint string
	boxID    string
	apiKey   string
	conn     *websocket.Conn
	sendChan chan []byte
	recvChan chan []byte
}

func New(endpoint, boxID, apiKey string) (*Connection, error) {
	return &Connection{
		endpoint: endpoint,
		boxID:    boxID,
		apiKey:   apiKey,
		sendChan: make(chan []byte, 100),
		recvChan: make(chan []byte, 100),
	}, nil
}

func (c *Connection) Connect() error {
	// Generate hardware ID for authentication
	hwid, err := security.GetHardwareID()
	if err != nil {
		return err
	}

	// Build WebSocket URL with auth params
	url := c.endpoint + "?boxId=" + c.boxID + "&apiKey=" + c.apiKey + "&hwid=" + hwid

	// Dial WebSocket
	log.Printf("Connecting to %s", url)
	conn, _, err := websocket.DefaultDialer.Dial(url, nil)
	if err != nil {
		return err
	}

	c.conn = conn

	// Start goroutines for send/recv
	go c.sendLoop()
	go c.recvLoop()
	go c.heartbeatLoop()

	return nil
}

func (c *Connection) sendLoop() {
	for {
		select {
		case data := <-c.sendChan:
			if err := c.conn.WriteMessage(websocket.TextMessage, data); err != nil {
				log.Printf("Send error: %v", err)
				// TODO: Reconnect logic
			}
		}
	}
}

func (c *Connection) recvLoop() {
	for {
		_, data, err := c.conn.ReadMessage()
		if err != nil {
			log.Printf("Receive error: %v", err)
			// TODO: Reconnect logic
			return
		}

		c.recvChan <- data
	}
}

func (c *Connection) heartbeatLoop() {
	ticker := time.NewTicker(30 * time.Second)
	defer ticker.Stop()

	for range ticker.C {
		ping := map[string]interface{}{
			"type": "ping",
			"time": time.Now().Unix(),
		}

		data, _ := json.Marshal(ping)
		c.sendChan <- data
	}
}

func (c *Connection) SendResponse(response interface{}) error {
	data, err := json.Marshal(response)
	if err != nil {
		return err
	}

	c.sendChan <- data
	return nil
}

func (c *Connection) Receive() ([]byte, error) {
	data := <-c.recvChan
	return data, nil
}

func (c *Connection) Close() {
	c.conn.Close()
}
```

### 3.3. Command Handlers

#### 3.3.1. Bash Handler

**File: `internal/handlers/bash.go`**

```go
package handlers

import (
	"bytes"
	"context"
	"os/exec"
	"time"
)

type BashCommand struct {
	Type    string `json:"type"`    // "bash.exec"
	Command string `json:"command"` // "ls -la"
	Timeout int    `json:"timeout"` // Seconds (default: 120)
}

type BashResponse struct {
	Success bool   `json:"success"`
	Output  string `json:"output"`
	Error   string `json:"error,omitempty"`
}

func (h *Handler) HandleBash(cmd BashCommand) BashResponse {
	// Set timeout
	timeout := time.Duration(cmd.Timeout) * time.Second
	if timeout == 0 {
		timeout = 120 * time.Second
	}

	ctx, cancel := context.WithTimeout(context.Background(), timeout)
	defer cancel()

	// Execute bash command
	execCmd := exec.CommandContext(ctx, "bash", "-c", cmd.Command)

	var stdout, stderr bytes.Buffer
	execCmd.Stdout = &stdout
	execCmd.Stderr = &stderr

	err := execCmd.Run()

	if err != nil {
		return BashResponse{
			Success: false,
			Output:  stdout.String(),
			Error:   err.Error() + "\n" + stderr.String(),
		}
	}

	return BashResponse{
		Success: true,
		Output:  stdout.String(),
	}
}
```

#### 3.3.2. Browser Handler

**File: `internal/handlers/browser.go`**

```go
package handlers

import (
	"context"
	"encoding/base64"
	"time"

	"github.com/chromedp/chromedp"
)

type BrowserCommand struct {
	Type     string `json:"type"`     // "browser.navigate", "browser.click", etc.
	URL      string `json:"url,omitempty"`
	Selector string `json:"selector,omitempty"`
}

type BrowserResponse struct {
	Success    bool   `json:"success"`
	Screenshot string `json:"screenshot,omitempty"` // Base64 encoded
	HTML       string `json:"html,omitempty"`
	Error      string `json:"error,omitempty"`
}

func (h *Handler) HandleBrowser(cmd BrowserCommand) BrowserResponse {
	// Create Chrome context
	ctx, cancel := chromedp.NewContext(context.Background())
	defer cancel()

	// Set timeout
	ctx, cancel = context.WithTimeout(ctx, 60*time.Second)
	defer cancel()

	switch cmd.Type {
	case "browser.navigate":
		return h.browserNavigate(ctx, cmd.URL)
	case "browser.click":
		return h.browserClick(ctx, cmd.Selector)
	case "browser.screenshot":
		return h.browserScreenshot(ctx)
	default:
		return BrowserResponse{
			Success: false,
			Error:   "Unknown browser command: " + cmd.Type,
		}
	}
}

func (h *Handler) browserNavigate(ctx context.Context, url string) BrowserResponse {
	var screenshot []byte

	err := chromedp.Run(ctx,
		chromedp.Navigate(url),
		chromedp.Sleep(2*time.Second), // Wait for page load
		chromedp.FullScreenshot(&screenshot, 100),
	)

	if err != nil {
		return BrowserResponse{
			Success: false,
			Error:   err.Error(),
		}
	}

	return BrowserResponse{
		Success:    true,
		Screenshot: base64.StdEncoding.EncodeToString(screenshot),
	}
}

func (h *Handler) browserClick(ctx context.Context, selector string) BrowserResponse {
	var screenshot []byte

	err := chromedp.Run(ctx,
		chromedp.Click(selector, chromedp.ByQuery),
		chromedp.Sleep(1*time.Second),
		chromedp.FullScreenshot(&screenshot, 100),
	)

	if err != nil {
		return BrowserResponse{
			Success: false,
			Error:   err.Error(),
		}
	}

	return BrowserResponse{
		Success:    true,
		Screenshot: base64.StdEncoding.EncodeToString(screenshot),
	}
}

func (h *Handler) browserScreenshot(ctx context.Context) BrowserResponse {
	var screenshot []byte

	err := chromedp.Run(ctx,
		chromedp.FullScreenshot(&screenshot, 100),
	)

	if err != nil {
		return BrowserResponse{
			Success: false,
			Error:   err.Error(),
		}
	}

	return BrowserResponse{
		Success:    true,
		Screenshot: base64.StdEncoding.EncodeToString(screenshot),
	}
}
```

#### 3.3.3. File Handler

**File: `internal/handlers/file.go`**

```go
package handlers

import (
	"io/ioutil"
	"os"
	"path/filepath"
)

type FileCommand struct {
	Type    string `json:"type"`    // "file.read", "file.write", "file.list"
	Path    string `json:"path"`
	Content string `json:"content,omitempty"` // For write operations
}

type FileResponse struct {
	Success bool     `json:"success"`
	Content string   `json:"content,omitempty"` // For read operations
	Files   []string `json:"files,omitempty"`   // For list operations
	Error   string   `json:"error,omitempty"`
}

func (h *Handler) HandleFile(cmd FileCommand) FileResponse {
	switch cmd.Type {
	case "file.read":
		return h.fileRead(cmd.Path)
	case "file.write":
		return h.fileWrite(cmd.Path, cmd.Content)
	case "file.list":
		return h.fileList(cmd.Path)
	case "file.delete":
		return h.fileDelete(cmd.Path)
	default:
		return FileResponse{
			Success: false,
			Error:   "Unknown file command: " + cmd.Type,
		}
	}
}

func (h *Handler) fileRead(path string) FileResponse {
	content, err := ioutil.ReadFile(path)
	if err != nil {
		return FileResponse{
			Success: false,
			Error:   err.Error(),
		}
	}

	return FileResponse{
		Success: true,
		Content: string(content),
	}
}

func (h *Handler) fileWrite(path, content string) FileResponse {
	err := ioutil.WriteFile(path, []byte(content), 0644)
	if err != nil {
		return FileResponse{
			Success: false,
			Error:   err.Error(),
		}
	}

	return FileResponse{
		Success: true,
	}
}

func (h *Handler) fileList(path string) FileResponse {
	files, err := ioutil.ReadDir(path)
	if err != nil {
		return FileResponse{
			Success: false,
			Error:   err.Error(),
		}
	}

	var fileNames []string
	for _, file := range files {
		fileNames = append(fileNames, file.Name())
	}

	return FileResponse{
		Success: true,
		Files:   fileNames,
	}
}

func (h *Handler) fileDelete(path string) FileResponse {
	err := os.Remove(path)
	if err != nil {
		return FileResponse{
			Success: false,
			Error:   err.Error(),
		}
	}

	return FileResponse{
		Success: true,
	}
}
```

### 3.4. Main Handler Router

**File: `internal/handlers/handler.go`**

```go
package handlers

import (
	"encoding/json"
	"log"

	"github.com/operis/relay-agent/internal/config"
	"github.com/operis/relay-agent/internal/connection"
)

type Handler struct {
	conn *connection.Connection
	cfg  *config.Config
}

type Command struct {
	Type string `json:"type"`
	// Embed all possible command types
	BashCommand
	BrowserCommand
	FileCommand
	// ... other command types
}

func New(conn *connection.Connection, cfg *config.Config) *Handler {
	return &Handler{
		conn: conn,
		cfg:  cfg,
	}
}

func (h *Handler) Run() {
	log.Printf("Handler starting, listening for commands...")

	for {
		data, err := h.conn.Receive()
		if err != nil {
			log.Printf("Receive error: %v", err)
			continue
		}

		// Parse command
		var cmd Command
		if err := json.Unmarshal(data, &cmd); err != nil {
			log.Printf("Failed to parse command: %v", err)
			continue
		}

		log.Printf("Received command: %s", cmd.Type)

		// Route to appropriate handler
		var response interface{}

		switch cmd.Type {
		case "bash.exec":
			response = h.HandleBash(cmd.BashCommand)

		case "browser.navigate", "browser.click", "browser.screenshot":
			response = h.HandleBrowser(cmd.BrowserCommand)

		case "file.read", "file.write", "file.list", "file.delete":
			response = h.HandleFile(cmd.FileCommand)

		// ... other command types

		default:
			response = map[string]interface{}{
				"success": false,
				"error":   "Unknown command type: " + cmd.Type,
			}
		}

		// Send response back to cloud
		if err := h.conn.SendResponse(response); err != nil {
			log.Printf("Failed to send response: %v", err)
		}
	}
}
```

### 3.5. Web UI Server

**File: `internal/webui/server.go`**

```go
package webui

import (
	"embed"
	"fmt"
	"net/http"
)

//go:embed static/*
var staticFiles embed.FS

type Server struct {
	port int
}

func NewServer(port int) *Server {
	return &Server{port: port}
}

func (s *Server) Start() error {
	// Serve embedded static files
	http.Handle("/", http.FileServer(http.FS(staticFiles)))

	addr := fmt.Sprintf(":%d", s.port)
	fmt.Printf("Web UI server listening on http://localhost%s\n", addr)

	return http.ListenAndServe(addr, nil)
}
```

**File: `internal/webui/static/index.html`**

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Operis Control</title>
    <link rel="stylesheet" href="/static/styles.css">
</head>
<body>
    <div id="app">
        <header>
            <h1>Operis Control</h1>
            <div id="status">Connecting...</div>
        </header>

        <main>
            <div id="chat-container">
                <div id="messages"></div>
                <div id="input-container">
                    <input
                        type="text"
                        id="message-input"
                        placeholder="Type your message..."
                        onkeypress="handleKeyPress(event)"
                    >
                    <button onclick="sendMessage()">Send</button>
                </div>
            </div>
        </main>
    </div>

    <script src="/static/app.js"></script>
</body>
</html>
```

**File: `internal/webui/static/app.js`**

```javascript
// Load Box ID from localStorage (set during installation)
const BOX_ID = localStorage.getItem('operis_box_id');

if (!BOX_ID) {
    alert('Box ID not found. Please contact support.');
}

// Connect to cloud WebSocket
const CLOUD_WS = `wss://cloud.operis.com/ws?boxId=${BOX_ID}`;
const ws = new WebSocket(CLOUD_WS);

ws.onopen = () => {
    console.log('Connected to cloud');
    document.getElementById('status').textContent = 'Connected ✓';
    document.getElementById('status').style.color = 'green';
};

ws.onclose = () => {
    console.log('Disconnected from cloud');
    document.getElementById('status').textContent = 'Disconnected ✗';
    document.getElementById('status').style.color = 'red';

    // Attempt reconnect after 5 seconds
    setTimeout(() => location.reload(), 5000);
};

ws.onerror = (error) => {
    console.error('WebSocket error:', error);
};

ws.onmessage = (event) => {
    const message = JSON.parse(event.data);
    displayMessage(message);
};

function sendMessage() {
    const input = document.getElementById('message-input');
    const text = input.value.trim();

    if (!text) return;

    // Send to cloud
    ws.send(JSON.stringify({
        type: 'chat',
        content: text,
    }));

    // Display locally
    displayMessage({
        role: 'user',
        content: text,
    });

    // Clear input
    input.value = '';
}

function displayMessage(message) {
    const container = document.getElementById('messages');

    const messageDiv = document.createElement('div');
    messageDiv.className = 'message ' + message.role;

    const contentDiv = document.createElement('div');
    contentDiv.className = 'content';
    contentDiv.textContent = message.content;

    messageDiv.appendChild(contentDiv);
    container.appendChild(messageDiv);

    // Scroll to bottom
    container.scrollTop = container.scrollHeight;
}

function handleKeyPress(event) {
    if (event.key === 'Enter') {
        sendMessage();
    }
}
```

---

## 4. CONFIGURATION

### 4.1. Config File Format

**File: `/etc/operis/config.json`**

```json
{
  "box_id": "abc123-def456-ghi789",
  "api_key": "encrypted_base64_api_key_here",
  "cloud_endpoint": "wss://cloud.operis.com:8443/relay",
  "ui_port": 18789,
  "log_level": "info",
  "reconnect_interval": 5,
  "heartbeat_interval": 30
}
```

### 4.2. Hardware ID Binding

**File: `internal/security/hwid.go`**

```go
package security

import (
	"crypto/sha256"
	"encoding/hex"
	"fmt"
	"os/exec"
	"runtime"
	"strings"
)

// GetHardwareID generates a unique hardware identifier
// based on CPU, motherboard, or disk serial numbers
func GetHardwareID() (string, error) {
	switch runtime.GOOS {
	case "linux":
		return getLinuxHWID()
	case "windows":
		return getWindowsHWID()
	case "darwin":
		return getMacOSHWID()
	default:
		return "", fmt.Errorf("unsupported OS: %s", runtime.GOOS)
	}
}

func getLinuxHWID() (string, error) {
	// Try multiple methods to get unique ID
	cmd := exec.Command("bash", "-c", "cat /sys/class/dmi/id/product_uuid 2>/dev/null || cat /var/lib/dbus/machine-id 2>/dev/null")
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

func getMacOSHWID() (string, error) {
	cmd := exec.Command("ioreg", "-rd1", "-c", "IOPlatformExpertDevice")
	output, err := cmd.Output()
	if err != nil {
		return "", err
	}

	// Parse for IOPlatformUUID
	for _, line := range strings.Split(string(output), "\n") {
		if strings.Contains(line, "IOPlatformUUID") {
			parts := strings.Split(line, "\"")
			if len(parts) >= 4 {
				uuid := parts[3]
				hash := sha256.Sum256([]byte(uuid))
				return hex.EncodeToString(hash[:]), nil
			}
		}
	}

	return "", fmt.Errorf("failed to get platform UUID")
}
```

---

## 5. BUILD & DEPLOYMENT

### 5.1. Makefile

**File: `Makefile`**

```makefile
# Relay Agent Build System

BINARY_NAME=operis-relay-agent
VERSION=$(shell git describe --tags --always --dirty)
BUILD_TIME=$(shell date -u '+%Y-%m-%d_%H:%M:%S')
LDFLAGS=-ldflags "-X main.Version=${VERSION} -X main.BuildTime=${BUILD_TIME}"

# Build for current platform
build:
	go build ${LDFLAGS} -o bin/${BINARY_NAME} cmd/agent/main.go

# Build for all platforms
build-all:
	GOOS=linux GOARCH=amd64 go build ${LDFLAGS} -o bin/${BINARY_NAME}-linux-amd64 cmd/agent/main.go
	GOOS=linux GOARCH=arm64 go build ${LDFLAGS} -o bin/${BINARY_NAME}-linux-arm64 cmd/agent/main.go
	GOOS=windows GOARCH=amd64 go build ${LDFLAGS} -o bin/${BINARY_NAME}-windows-amd64.exe cmd/agent/main.go
	GOOS=darwin GOARCH=amd64 go build ${LDFLAGS} -o bin/${BINARY_NAME}-darwin-amd64 cmd/agent/main.go
	GOOS=darwin GOARCH=arm64 go build ${LDFLAGS} -o bin/${BINARY_NAME}-darwin-arm64 cmd/agent/main.go

# Install on current system
install:
	sudo cp bin/${BINARY_NAME} /usr/local/bin/
	sudo cp scripts/operis-relay-agent.service /etc/systemd/system/
	sudo systemctl daemon-reload
	sudo systemctl enable operis-relay-agent
	sudo systemctl start operis-relay-agent

# Clean build artifacts
clean:
	rm -rf bin/

# Run tests
test:
	go test -v ./...

# Run linter
lint:
	golangci-lint run

.PHONY: build build-all install clean test lint
```

### 5.2. Systemd Service

**File: `scripts/operis-relay-agent.service`**

```ini
[Unit]
Description=Operis Relay Agent
After=network.target

[Service]
Type=simple
User=operis
Group=operis
ExecStart=/usr/local/bin/operis-relay-agent --config /etc/operis/config.json
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal
SyslogIdentifier=operis-relay-agent

# Security hardening
NoNewPrivileges=true
PrivateTmp=true
ProtectSystem=strict
ProtectHome=true
ReadWritePaths=/var/lib/operis /var/log/operis

[Install]
WantedBy=multi-user.target
```

### 5.3. Installation Script

**File: `scripts/install.sh`**

```bash
#!/bin/bash

set -e

echo "====================================="
echo "  Operis Relay Agent Installer"
echo "====================================="

# Check root
if [ "$EUID" -ne 0 ]; then
  echo "Please run as root (sudo)"
  exit 1
fi

# Detect platform
OS=$(uname -s | tr '[:upper:]' '[:lower:]')
ARCH=$(uname -m)

case "$ARCH" in
  x86_64) ARCH="amd64" ;;
  aarch64) ARCH="arm64" ;;
  armv7l) ARCH="arm" ;;
esac

BINARY="operis-relay-agent-${OS}-${ARCH}"

echo "Detected: ${OS}-${ARCH}"

# Download binary
echo "Downloading relay agent..."
curl -L "https://releases.operis.com/relay-agent/latest/${BINARY}" -o /tmp/operis-relay-agent

# Verify checksum (TODO: implement)

# Install binary
echo "Installing binary..."
chmod +x /tmp/operis-relay-agent
mv /tmp/operis-relay-agent /usr/local/bin/operis-relay-agent

# Create user
echo "Creating service user..."
useradd -r -s /bin/false operis || true

# Create directories
mkdir -p /etc/operis
mkdir -p /var/lib/operis
mkdir -p /var/log/operis

chown -R operis:operis /var/lib/operis
chown -R operis:operis /var/log/operis

# Prompt for Box ID and API Key
read -p "Enter Box ID: " BOX_ID
read -sp "Enter API Key: " API_KEY
echo

# Generate config
cat > /etc/operis/config.json <<EOF
{
  "box_id": "${BOX_ID}",
  "api_key": "${API_KEY}",
  "cloud_endpoint": "wss://cloud.operis.com:8443/relay",
  "ui_port": 18789,
  "log_level": "info"
}
EOF

chmod 600 /etc/operis/config.json
chown operis:operis /etc/operis/config.json

# Install systemd service
echo "Installing systemd service..."
curl -L "https://releases.operis.com/relay-agent/latest/operis-relay-agent.service" -o /etc/systemd/system/operis-relay-agent.service

systemctl daemon-reload
systemctl enable operis-relay-agent
systemctl start operis-relay-agent

echo ""
echo "====================================="
echo "  Installation Complete!"
echo "====================================="
echo ""
echo "Service Status:"
systemctl status operis-relay-agent --no-pager
echo ""
echo "Web UI: http://localhost:18789"
echo ""
echo "Commands:"
echo "  Start:   sudo systemctl start operis-relay-agent"
echo "  Stop:    sudo systemctl stop operis-relay-agent"
echo "  Restart: sudo systemctl restart operis-relay-agent"
echo "  Status:  sudo systemctl status operis-relay-agent"
echo "  Logs:    sudo journalctl -u operis-relay-agent -f"
echo ""
```

---

## 6. SUMMARY

### 6.1. Key Points

✅ **Binary Size:** ~20MB (single executable)
✅ **Language:** Go 1.22+ (fast, efficient, cross-platform)
✅ **Role:** Dumb executor (NO intelligence, NO business logic)
✅ **Communication:** WebSocket to cloud (persistent connection)
✅ **Capabilities:** Bash, Browser, File, WhatsApp, Telegram
✅ **Web UI:** Embedded HTTP server (port 18789)
✅ **Security:** Hardware ID binding, encrypted config
✅ **Deployment:** Single binary + systemd service

### 6.2. Comparison with Cloud

| Aspect | Relay Agent (Mini-PC) | Cloud Server |
|--------|----------------------|--------------|
| **Code** | 20MB Go binary | 290K LOC TypeScript |
| **Intelligence** | ZERO | Full agent runtime |
| **Decision Making** | NONE | LLM + business logic |
| **Storage** | Config only | PostgreSQL + SQLite |
| **Business Logic** | ZERO | 100% |
| **Updates** | Rarely | Frequently |

### 6.3. What Customer Gets

```
Installation Package:
├── operis-relay-agent (20MB binary)
├── config.json (encrypted)
└── install.sh

Total: ~22MB
```

**What it does:**
- Connects to your cloud server
- Executes commands you send
- Serves Web UI on localhost:18789
- Cannot function without your cloud server

**What customer CANNOT do:**
- ❌ See your business logic
- ❌ Run agent independently
- ❌ Reverse engineer to recreate Operis
- ❌ Use it for anything else

**IP Protection: MAXIMUM** ✅

---

**Document Version:** 1.0
**Date:** 2026-01-29
**Status:** Complete - Ready for implementation
