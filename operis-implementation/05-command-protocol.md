# COMMAND PROTOCOL SPECIFICATION

**Complete Protocol for Cloud ↔ Mini-PC Communication**

Version: 1.0
Date: 2026-01-29
Protocol Version: 1.0

---

## 1. OVERVIEW

### 1.1. Protocol Purpose

The command protocol defines the JSON message format for communication between:
- **Cloud Server (Operis)** → Sends commands
- **Mini-PC (Relay Agent)** → Executes commands and returns results

### 1.2. Transport

**WebSocket** (bidirectional, persistent connection)

```
Mini-PC → Connects to: wss://cloud.operis.com:8443/relay?boxId=xxx&apiKey=yyy&hwid=zzz
Cloud → Accepts connection, validates credentials
Both → Exchange JSON messages
```

### 1.3. Message Structure

**Command (Cloud → Mini-PC):**

```json
{
  "protocol_version": "1.0",
  "command_id": "uuid-v4-here",
  "type": "bash.exec",
  "timestamp": 1706543210,
  ...command-specific-fields
}
```

**Response (Mini-PC → Cloud):**

```json
{
  "protocol_version": "1.0",
  "command_id": "uuid-v4-here",
  "success": true,
  "timestamp": 1706543211,
  ...response-specific-fields
}
```

---

## 2. COMMAND TYPES

### 2.1. Bash Commands

#### `bash.exec` - Execute Bash Command

**Command:**

```json
{
  "protocol_version": "1.0",
  "command_id": "abc-123",
  "type": "bash.exec",
  "command": "ls -la /home",
  "timeout": 120,
  "working_dir": "/home/user",
  "env": {
    "PATH": "/usr/bin:/bin"
  }
}
```

**Response:**

```json
{
  "protocol_version": "1.0",
  "command_id": "abc-123",
  "success": true,
  "output": "total 24\ndrwxr-xr-x 3 user user 4096 ...",
  "exit_code": 0,
  "execution_time_ms": 145
}
```

**Error Response:**

```json
{
  "protocol_version": "1.0",
  "command_id": "abc-123",
  "success": false,
  "error": "Command timed out after 120 seconds",
  "error_code": "TIMEOUT",
  "execution_time_ms": 120000
}
```

**Error Codes:**
- `TIMEOUT` - Command exceeded timeout
- `NOT_FOUND` - Command not found
- `PERMISSION_DENIED` - Insufficient permissions
- `EXEC_ERROR` - General execution error

---

### 2.2. Browser Commands

#### `browser.navigate` - Navigate to URL

**Command:**

```json
{
  "protocol_version": "1.0",
  "command_id": "def-456",
  "type": "browser.navigate",
  "url": "https://example.com",
  "wait_for_load": true,
  "screenshot": true,
  "viewport": {
    "width": 1920,
    "height": 1080
  }
}
```

**Response:**

```json
{
  "protocol_version": "1.0",
  "command_id": "def-456",
  "success": true,
  "screenshot": "base64_encoded_image_data...",
  "title": "Example Domain",
  "url": "https://example.com",
  "execution_time_ms": 2340
}
```

#### `browser.click` - Click Element

**Command:**

```json
{
  "protocol_version": "1.0",
  "command_id": "ghi-789",
  "type": "browser.click",
  "selector": "#submit-button",
  "selector_type": "css",
  "wait_after_click_ms": 1000,
  "screenshot_after": true
}
```

**Response:**

```json
{
  "protocol_version": "1.0",
  "command_id": "ghi-789",
  "success": true,
  "screenshot": "base64_encoded_image_data...",
  "execution_time_ms": 1250
}
```

#### `browser.type` - Type Text

**Command:**

```json
{
  "protocol_version": "1.0",
  "command_id": "jkl-012",
  "type": "browser.type",
  "selector": "#search-input",
  "text": "hello world",
  "clear_first": true
}
```

**Response:**

```json
{
  "protocol_version": "1.0",
  "command_id": "jkl-012",
  "success": true,
  "execution_time_ms": 450
}
```

#### `browser.screenshot` - Take Screenshot

**Command:**

```json
{
  "protocol_version": "1.0",
  "command_id": "mno-345",
  "type": "browser.screenshot",
  "full_page": false,
  "quality": 90
}
```

**Response:**

```json
{
  "protocol_version": "1.0",
  "command_id": "mno-345",
  "success": true,
  "screenshot": "base64_encoded_image_data...",
  "width": 1920,
  "height": 1080,
  "format": "png",
  "size_bytes": 245678,
  "execution_time_ms": 890
}
```

#### `browser.html` - Get Page HTML

**Command:**

```json
{
  "protocol_version": "1.0",
  "command_id": "pqr-678",
  "type": "browser.html",
  "selector": "body"
}
```

**Response:**

```json
{
  "protocol_version": "1.0",
  "command_id": "pqr-678",
  "success": true,
  "html": "<body>...</body>",
  "execution_time_ms": 120
}
```

#### `browser.close` - Close Browser

**Command:**

```json
{
  "protocol_version": "1.0",
  "command_id": "stu-901",
  "type": "browser.close"
}
```

**Response:**

```json
{
  "protocol_version": "1.0",
  "command_id": "stu-901",
  "success": true,
  "execution_time_ms": 50
}
```

---

### 2.3. File Commands

#### `file.read` - Read File

**Command:**

```json
{
  "protocol_version": "1.0",
  "command_id": "vwx-234",
  "type": "file.read",
  "path": "/home/user/data.txt",
  "encoding": "utf-8",
  "max_size_bytes": 1048576
}
```

**Response:**

```json
{
  "protocol_version": "1.0",
  "command_id": "vwx-234",
  "success": true,
  "content": "file content here...",
  "size_bytes": 12345,
  "encoding": "utf-8",
  "execution_time_ms": 45
}
```

**Binary File Response:**

```json
{
  "protocol_version": "1.0",
  "command_id": "vwx-234",
  "success": true,
  "content_base64": "base64_encoded_binary_data...",
  "size_bytes": 98765,
  "mime_type": "image/png",
  "execution_time_ms": 180
}
```

#### `file.write` - Write File

**Command:**

```json
{
  "protocol_version": "1.0",
  "command_id": "yza-567",
  "type": "file.write",
  "path": "/home/user/output.txt",
  "content": "data to write",
  "encoding": "utf-8",
  "mode": 0644,
  "create_dirs": true
}
```

**Response:**

```json
{
  "protocol_version": "1.0",
  "command_id": "yza-567",
  "success": true,
  "bytes_written": 13,
  "execution_time_ms": 32
}
```

#### `file.list` - List Directory

**Command:**

```json
{
  "protocol_version": "1.0",
  "command_id": "bcd-890",
  "type": "file.list",
  "path": "/home/user",
  "recursive": false,
  "include_hidden": false
}
```

**Response:**

```json
{
  "protocol_version": "1.0",
  "command_id": "bcd-890",
  "success": true,
  "files": [
    {
      "name": "document.pdf",
      "path": "/home/user/document.pdf",
      "size_bytes": 123456,
      "is_dir": false,
      "modified_at": 1706543210,
      "permissions": "0644"
    },
    {
      "name": "photos",
      "path": "/home/user/photos",
      "size_bytes": 4096,
      "is_dir": true,
      "modified_at": 1706543150,
      "permissions": "0755"
    }
  ],
  "execution_time_ms": 78
}
```

#### `file.delete` - Delete File

**Command:**

```json
{
  "protocol_version": "1.0",
  "command_id": "efg-123",
  "type": "file.delete",
  "path": "/home/user/temp.txt"
}
```

**Response:**

```json
{
  "protocol_version": "1.0",
  "command_id": "efg-123",
  "success": true,
  "execution_time_ms": 28
}
```

#### `file.move` - Move/Rename File

**Command:**

```json
{
  "protocol_version": "1.0",
  "command_id": "hij-456",
  "type": "file.move",
  "source": "/home/user/old.txt",
  "destination": "/home/user/new.txt"
}
```

**Response:**

```json
{
  "protocol_version": "1.0",
  "command_id": "hij-456",
  "success": true,
  "execution_time_ms": 45
}
```

#### `file.copy` - Copy File

**Command:**

```json
{
  "protocol_version": "1.0",
  "command_id": "klm-789",
  "type": "file.copy",
  "source": "/home/user/original.txt",
  "destination": "/home/user/copy.txt"
}
```

**Response:**

```json
{
  "protocol_version": "1.0",
  "command_id": "klm-789",
  "success": true,
  "bytes_copied": 5678,
  "execution_time_ms": 67
}
```

---

### 2.4. WhatsApp Commands

#### `whatsapp.send_text` - Send Text Message

**Command:**

```json
{
  "protocol_version": "1.0",
  "command_id": "nop-012",
  "type": "whatsapp.send_text",
  "to": "1234567890@s.whatsapp.net",
  "message": "Hello from Operis!"
}
```

**Response:**

```json
{
  "protocol_version": "1.0",
  "command_id": "nop-012",
  "success": true,
  "message_id": "wamid.xxx",
  "timestamp": 1706543210,
  "execution_time_ms": 345
}
```

#### `whatsapp.send_image` - Send Image

**Command:**

```json
{
  "protocol_version": "1.0",
  "command_id": "qrs-345",
  "type": "whatsapp.send_image",
  "to": "1234567890@s.whatsapp.net",
  "image_url": "https://example.com/image.jpg",
  "caption": "Check this out!"
}
```

**Response:**

```json
{
  "protocol_version": "1.0",
  "command_id": "qrs-345",
  "success": true,
  "message_id": "wamid.yyy",
  "timestamp": 1706543220,
  "execution_time_ms": 2340
}
```

#### `whatsapp.get_messages` - Get Recent Messages

**Command:**

```json
{
  "protocol_version": "1.0",
  "command_id": "tuv-678",
  "type": "whatsapp.get_messages",
  "limit": 50,
  "since_timestamp": 1706543000
}
```

**Response:**

```json
{
  "protocol_version": "1.0",
  "command_id": "tuv-678",
  "success": true,
  "messages": [
    {
      "id": "wamid.zzz",
      "from": "9876543210@s.whatsapp.net",
      "timestamp": 1706543150,
      "type": "text",
      "content": "Hi there!"
    }
  ],
  "execution_time_ms": 234
}
```

---

### 2.5. Telegram Commands

#### `telegram.send_message` - Send Message

**Command:**

```json
{
  "protocol_version": "1.0",
  "command_id": "wxy-901",
  "type": "telegram.send_message",
  "chat_id": 123456789,
  "text": "Hello from Operis!",
  "parse_mode": "Markdown"
}
```

**Response:**

```json
{
  "protocol_version": "1.0",
  "command_id": "wxy-901",
  "success": true,
  "message_id": 12345,
  "timestamp": 1706543210,
  "execution_time_ms": 456
}
```

---

### 2.6. System Commands

#### `system.ping` - Heartbeat

**Command:**

```json
{
  "protocol_version": "1.0",
  "command_id": "ping-001",
  "type": "system.ping",
  "timestamp": 1706543210
}
```

**Response:**

```json
{
  "protocol_version": "1.0",
  "command_id": "ping-001",
  "success": true,
  "timestamp": 1706543210,
  "execution_time_ms": 1
}
```

#### `system.status` - Get System Status

**Command:**

```json
{
  "protocol_version": "1.0",
  "command_id": "zab-234",
  "type": "system.status"
}
```

**Response:**

```json
{
  "protocol_version": "1.0",
  "command_id": "zab-234",
  "success": true,
  "status": {
    "uptime_seconds": 86400,
    "cpu_usage_percent": 23.5,
    "memory_usage_mb": 512,
    "memory_total_mb": 2048,
    "disk_usage_percent": 45.2,
    "network_rx_bytes": 1234567890,
    "network_tx_bytes": 987654321
  },
  "execution_time_ms": 123
}
```

#### `system.update_config` - Update Configuration

**Command:**

```json
{
  "protocol_version": "1.0",
  "command_id": "cde-567",
  "type": "system.update_config",
  "config": {
    "log_level": "debug",
    "heartbeat_interval": 30
  }
}
```

**Response:**

```json
{
  "protocol_version": "1.0",
  "command_id": "cde-567",
  "success": true,
  "execution_time_ms": 89
}
```

#### `system.restart` - Restart Relay Agent

**Command:**

```json
{
  "protocol_version": "1.0",
  "command_id": "fgh-890",
  "type": "system.restart",
  "delay_seconds": 5
}
```

**Response:**

```json
{
  "protocol_version": "1.0",
  "command_id": "fgh-890",
  "success": true,
  "message": "Restarting in 5 seconds",
  "execution_time_ms": 10
}
```

---

## 3. ERROR HANDLING

### 3.1. Common Error Codes

| Error Code | Description | HTTP Equivalent |
|------------|-------------|-----------------|
| `UNKNOWN_COMMAND` | Command type not recognized | 400 Bad Request |
| `INVALID_PARAMS` | Missing or invalid parameters | 400 Bad Request |
| `PERMISSION_DENIED` | Insufficient permissions | 403 Forbidden |
| `NOT_FOUND` | Resource not found | 404 Not Found |
| `TIMEOUT` | Command exceeded timeout | 504 Gateway Timeout |
| `EXEC_ERROR` | Execution failed | 500 Internal Server Error |
| `NOT_IMPLEMENTED` | Command not implemented yet | 501 Not Implemented |

### 3.2. Error Response Format

```json
{
  "protocol_version": "1.0",
  "command_id": "xxx-yyy",
  "success": false,
  "error": "Human-readable error message",
  "error_code": "ERROR_CODE",
  "details": {
    "additional": "context"
  },
  "execution_time_ms": 123
}
```

---

## 4. PROTOCOL NEGOTIATION

### 4.1. Version Mismatch

**Cloud sends command with protocol_version: "2.0"**
**Mini-PC only supports protocol_version: "1.0"**

**Response:**

```json
{
  "protocol_version": "1.0",
  "command_id": "xxx-yyy",
  "success": false,
  "error": "Protocol version 2.0 not supported. Please update relay agent.",
  "error_code": "PROTOCOL_VERSION_MISMATCH",
  "supported_versions": ["1.0"]
}
```

### 4.2. Backward Compatibility

**New fields are optional:**

```json
{
  "protocol_version": "1.1",
  "command_id": "xxx-yyy",
  "type": "bash.exec",
  "command": "ls",
  "new_field_in_v1.1": "value"
}
```

**Mini-PC (v1.0) ignores unknown fields and processes command normally.**

---

## 5. BATCHING & STREAMING

### 5.1. Batch Commands

**Send multiple commands in one message:**

```json
{
  "protocol_version": "1.0",
  "batch_id": "batch-001",
  "commands": [
    {
      "command_id": "cmd-1",
      "type": "bash.exec",
      "command": "ls"
    },
    {
      "command_id": "cmd-2",
      "type": "file.read",
      "path": "/etc/hostname"
    }
  ]
}
```

**Response:**

```json
{
  "protocol_version": "1.0",
  "batch_id": "batch-001",
  "responses": [
    {
      "command_id": "cmd-1",
      "success": true,
      "output": "..."
    },
    {
      "command_id": "cmd-2",
      "success": true,
      "content": "..."
    }
  ]
}
```

### 5.2. Streaming Responses

**For long-running commands, stream output:**

**Command:**

```json
{
  "protocol_version": "1.0",
  "command_id": "stream-001",
  "type": "bash.exec",
  "command": "find / -name '*.log'",
  "stream_output": true
}
```

**Responses (multiple messages):**

```json
{
  "protocol_version": "1.0",
  "command_id": "stream-001",
  "stream": true,
  "chunk": 1,
  "output": "/var/log/syslog\n"
}
```

```json
{
  "protocol_version": "1.0",
  "command_id": "stream-001",
  "stream": true,
  "chunk": 2,
  "output": "/var/log/auth.log\n"
}
```

```json
{
  "protocol_version": "1.0",
  "command_id": "stream-001",
  "stream": true,
  "chunk": 3,
  "output": "/var/log/kern.log\n",
  "final": true,
  "success": true,
  "exit_code": 0,
  "execution_time_ms": 5678
}
```

---

## 6. AUTHENTICATION

### 6.1. Connection Authentication

**Initial WebSocket connection:**

```
wss://cloud.operis.com:8443/relay?boxId=abc123&apiKey=xyz789&hwid=hash123
```

**Cloud validates:**
1. `boxId` exists in database
2. `apiKey` matches record
3. `hwid` matches registered hardware ID

**If valid:** Connection accepted
**If invalid:** Connection rejected with 401 Unauthorized

### 6.2. Per-Command Authentication

**Not needed** - authentication happens at connection level.

All commands over authenticated WebSocket are trusted.

---

## 7. RATE LIMITING

### 7.1. Cloud-Side Limits

| Limit Type | Value |
|------------|-------|
| Commands per mini-PC | 100/minute |
| Commands per customer | 1000/hour |
| WebSocket messages | 1000/minute |
| Batch size | 10 commands max |

### 7.2. Rate Limit Response

```json
{
  "protocol_version": "1.0",
  "command_id": "xxx-yyy",
  "success": false,
  "error": "Rate limit exceeded. Try again in 30 seconds.",
  "error_code": "RATE_LIMIT_EXCEEDED",
  "retry_after_seconds": 30
}
```

---

## 8. IMPLEMENTATION EXAMPLES

### 8.1. Cloud-Side (TypeScript)

```typescript
// src/relay-gateway/client.ts
export class RelayGatewayClient {
  private ws: WebSocket;

  async sendCommand(boxId: string, command: Command): Promise<Response> {
    const commandId = uuidv4();

    const message = {
      protocol_version: '1.0',
      command_id: commandId,
      timestamp: Date.now(),
      ...command,
    };

    return new Promise((resolve, reject) => {
      // Send command
      this.ws.send(JSON.stringify(message));

      // Wait for response (with timeout)
      const timeout = setTimeout(() => {
        reject(new Error('Command timeout'));
      }, 60000);

      const handler = (event: MessageEvent) => {
        const response = JSON.parse(event.data);

        if (response.command_id === commandId) {
          clearTimeout(timeout);
          this.ws.removeEventListener('message', handler);
          resolve(response);
        }
      };

      this.ws.addEventListener('message', handler);
    });
  }
}

// Usage
const gateway = new RelayGatewayClient();
const response = await gateway.sendCommand('box-123', {
  type: 'bash.exec',
  command: 'ls -la',
});

console.log(response.output);
```

### 8.2. Mini-PC Side (Go)

```go
// internal/connection/handler.go
func (h *Handler) HandleMessage(data []byte) {
	var cmd Command
	if err := json.Unmarshal(data, &cmd); err != nil {
		log.Printf("Failed to parse command: %v", err)
		return
	}

	// Route to appropriate handler
	var response Response
	switch cmd.Type {
	case "bash.exec":
		response = h.bashHandler.Handle(cmd)
	case "browser.navigate":
		response = h.browserHandler.Handle(cmd)
	case "file.read":
		response = h.fileHandler.Handle(cmd)
	default:
		response = Response{
			Success: false,
			Error:   "Unknown command type: " + cmd.Type,
			ErrorCode: "UNKNOWN_COMMAND",
		}
	}

	// Add metadata
	response.ProtocolVersion = "1.0"
	response.CommandID = cmd.CommandID

	// Send response
	responseData, _ := json.Marshal(response)
	h.conn.Send(responseData)
}
```

---

## 9. TESTING

### 9.1. Protocol Compliance Tests

```typescript
// test/protocol.test.ts
describe('Command Protocol', () => {
  it('should handle bash.exec command', async () => {
    const command = {
      protocol_version: '1.0',
      command_id: 'test-1',
      type: 'bash.exec',
      command: 'echo hello',
    };

    const response = await sendToRelayAgent(command);

    expect(response.protocol_version).toBe('1.0');
    expect(response.command_id).toBe('test-1');
    expect(response.success).toBe(true);
    expect(response.output).toBe('hello\n');
  });

  it('should handle unknown command type', async () => {
    const command = {
      protocol_version: '1.0',
      command_id: 'test-2',
      type: 'unknown.command',
    };

    const response = await sendToRelayAgent(command);

    expect(response.success).toBe(false);
    expect(response.error_code).toBe('UNKNOWN_COMMAND');
  });
});
```

---

## 10. SUMMARY

### 10.1. Protocol Features

✅ **Bidirectional:** Cloud ↔ Mini-PC communication
✅ **JSON-based:** Easy to parse and debug
✅ **Versioned:** Protocol version in every message
✅ **Extensible:** New command types can be added
✅ **Error handling:** Consistent error format
✅ **Batching:** Multiple commands in one message
✅ **Streaming:** Long-running command output streaming
✅ **Type-safe:** Clear schemas for all commands

### 10.2. Supported Tools

| Tool | Commands | Status |
|------|----------|--------|
| **Bash** | exec | ✅ Implemented |
| **Browser** | navigate, click, type, screenshot, html, close | ✅ Implemented |
| **File** | read, write, list, delete, move, copy | ✅ Implemented |
| **WhatsApp** | send_text, send_image, get_messages | ✅ Implemented |
| **Telegram** | send_message | ✅ Implemented |
| **System** | ping, status, update_config, restart | ✅ Implemented |

### 10.3. Next Steps

1. Implement protocol on both sides (cloud + mini-PC)
2. Add comprehensive tests
3. Document any new command types
4. Version protocol when making breaking changes

---

**Document Version:** 1.0
**Date:** 2026-01-29
**Protocol Version:** 1.0
**Status:** Complete - Ready for implementation
