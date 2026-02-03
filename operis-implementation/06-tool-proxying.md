# TOOL PROXYING IMPLEMENTATION

**How to Modify Moltbot Tools for Relay Mode**

Version: 1.0
Date: 2026-01-29
Location: src/agents/tools/proxy/

---

## 1. CONCEPT

### 1.1. Before (Local Execution)

```typescript
// src/agents/bash-tools.ts (existing)
export const bashTool = async (command: string) => {
  // Executes locally on cloud server
  const result = exec.Command('bash', ['-c', command]);
  return result.stdout;
};
```

### 1.2. After (Proxied Execution)

```typescript
// src/agents/tools/proxy/bash-proxy.ts (NEW)
export const bashToolProxy = (boxId: string) => async (command: string) => {
  // Sends to mini-PC for execution
  const response = await relayGateway.sendCommand(boxId, {
    type: 'bash.exec',
    command: command
  });
  return response.output;
};
```

**Key Difference:** Same interface, different execution location!

---

## 2. IMPLEMENTATION PATTERN

### 2.1. Generic Tool Proxy Wrapper

```typescript
// src/agents/tools/proxy/base-proxy.ts
import { relayGateway } from '../../..';

export function createToolProxy<TInput, TOutput>(
  boxId: string,
  commandType: string,
  transformer?: (input: TInput) => any
) {
  return async (input: TInput): Promise<TOutput> => {
    const command = transformer ? transformer(input) : input;

    const response = await relayGateway.sendCommand(boxId, {
      type: commandType,
      ...command,
    });

    if (!response.success) {
      throw new Error(response.error || 'Command failed');
    }

    return response as TOutput;
  };
}
```

### 2.2. Bash Tool Proxy

```typescript
// src/agents/tools/proxy/bash-proxy.ts
import { createToolProxy } from './base-proxy';

interface BashInput {
  command: string;
  timeout?: number;
  cwd?: string;
  env?: Record<string, string>;
}

interface BashOutput {
  stdout: string;
  stderr: string;
  exitCode: number;
}

export function createBashToolProxy(boxId: string) {
  return async (command: string, options?: Partial<BashInput>): Promise<BashOutput> => {
    const response = await relayGateway.sendCommand(boxId, {
      type: 'bash.exec',
      command: command,
      timeout: options?.timeout || 120,
      working_dir: options?.cwd,
      env: options?.env,
    });

    if (!response.success) {
      throw new Error(response.error || 'Bash command failed');
    }

    return {
      stdout: response.output || '',
      stderr: response.stderr || '',
      exitCode: response.exit_code || 0,
    };
  };
}
```

### 2.3. Browser Tool Proxy

```typescript
// src/agents/tools/proxy/browser-proxy.ts
export function createBrowserToolProxy(boxId: string) {
  return {
    navigate: async (url: string) => {
      const response = await relayGateway.sendCommand(boxId, {
        type: 'browser.navigate',
        url: url,
        wait_for_load: true,
        screenshot: true,
      });

      return {
        screenshot: response.screenshot, // base64
        title: response.title,
        url: response.url,
      };
    },

    click: async (selector: string) => {
      const response = await relayGateway.sendCommand(boxId, {
        type: 'browser.click',
        selector: selector,
        screenshot_after: true,
      });

      return {
        screenshot: response.screenshot,
      };
    },

    type: async (selector: string, text: string) => {
      await relayGateway.sendCommand(boxId, {
        type: 'browser.type',
        selector: selector,
        text: text,
        clear_first: true,
      });
    },

    html: async () => {
      const response = await relayGateway.sendCommand(boxId, {
        type: 'browser.html',
        selector: 'body',
      });

      return response.html;
    },

    screenshot: async () => {
      const response = await relayGateway.sendCommand(boxId, {
        type: 'browser.screenshot',
        full_page: false,
      });

      return response.screenshot; // base64
    },

    close: async () => {
      await relayGateway.sendCommand(boxId, {
        type: 'browser.close',
      });
    },
  };
}
```

### 2.4. File Tool Proxy

```typescript
// src/agents/tools/proxy/file-proxy.ts
export function createFileToolProxy(boxId: string) {
  return {
    read: async (path: string, encoding: string = 'utf-8') => {
      const response = await relayGateway.sendCommand(boxId, {
        type: 'file.read',
        path: path,
        encoding: encoding,
      });

      return response.content;
    },

    write: async (path: string, content: string) => {
      await relayGateway.sendCommand(boxId, {
        type: 'file.write',
        path: path,
        content: content,
        create_dirs: true,
      });
    },

    list: async (path: string) => {
      const response = await relayGateway.sendCommand(boxId, {
        type: 'file.list',
        path: path,
      });

      return response.files; // Array of file objects
    },

    delete: async (path: string) => {
      await relayGateway.sendCommand(boxId, {
        type: 'file.delete',
        path: path,
      });
    },

    move: async (source: string, destination: string) => {
      await relayGateway.sendCommand(boxId, {
        type: 'file.move',
        source: source,
        destination: destination,
      });
    },

    copy: async (source: string, destination: string) => {
      await relayGateway.sendCommand(boxId, {
        type: 'file.copy',
        source: source,
        destination: destination,
      });
    },
  };
}
```

---

## 3. INTEGRATION WITH AGENT RUNTIME

### 3.1. Modify Agent Creation

**File: `src/commands/agent.ts` (modify existing)**

```typescript
import { PiAgent } from '@mariozechner/pi-agent-core';
import { getLocalTools } from '../agents/tools';
import { getProxiedTools } from '../agents/tools/proxy';

export async function createAgent(config: AgentConfig) {
  // Determine if relay mode
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

### 3.2. Tool Factory

**File: `src/agents/tools/proxy/index.ts` (NEW)**

```typescript
import { createBashToolProxy } from './bash-proxy';
import { createBrowserToolProxy } from './browser-proxy';
import { createFileToolProxy } from './file-proxy';

export function getProxiedTools(boxId: string) {
  return {
    bash: createBashToolProxy(boxId),
    browser: createBrowserToolProxy(boxId),
    file: createFileToolProxy(boxId),
    // ... other tools
  };
}
```

---

## 4. ERROR HANDLING

### 4.1. Network Errors

```typescript
export function createBashToolProxy(boxId: string) {
  return async (command: string) => {
    try {
      const response = await relayGateway.sendCommand(boxId, {
        type: 'bash.exec',
        command: command,
      });

      return response.output;

    } catch (error) {
      if (error.message.includes('not connected')) {
        throw new Error(`Mini-PC ${boxId} is offline. Please check connection.`);
      }

      if (error.message.includes('timeout')) {
        throw new Error(`Command timed out. The mini-PC may be overloaded.`);
      }

      throw error;
    }
  };
}
```

### 4.2. Retry Logic

```typescript
async function sendCommandWithRetry(
  boxId: string,
  command: any,
  maxRetries: number = 3
): Promise<any> {
  let lastError: Error;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await relayGateway.sendCommand(boxId, command);
    } catch (error) {
      lastError = error;

      if (attempt < maxRetries) {
        // Exponential backoff
        const delayMs = Math.pow(2, attempt) * 1000;
        await new Promise(resolve => setTimeout(resolve, delayMs));
      }
    }
  }

  throw lastError;
}
```

---

## 5. TESTING

### 5.1. Mock Relay Gateway

```typescript
// test/mocks/relay-gateway.mock.ts
export class MockRelayGateway {
  private responses: Map<string, any> = new Map();

  mockResponse(commandType: string, response: any): void {
    this.responses.set(commandType, response);
  }

  async sendCommand(boxId: string, command: any): Promise<any> {
    const response = this.responses.get(command.type);

    if (!response) {
      throw new Error(`No mock response for ${command.type}`);
    }

    return response;
  }
}
```

### 5.2. Tool Proxy Tests

```typescript
// test/tools/proxy/bash-proxy.test.ts
import { createBashToolProxy } from '../../../src/agents/tools/proxy/bash-proxy';
import { MockRelayGateway } from '../../mocks/relay-gateway.mock';

describe('BashToolProxy', () => {
  let mockGateway: MockRelayGateway;
  let bashTool: ReturnType<typeof createBashToolProxy>;

  beforeEach(() => {
    mockGateway = new MockRelayGateway();
    global.relayGateway = mockGateway;

    bashTool = createBashToolProxy('test-box');
  });

  it('should execute bash command via relay', async () => {
    mockGateway.mockResponse('bash.exec', {
      success: true,
      output: 'hello world\n',
      exit_code: 0,
    });

    const result = await bashTool('echo "hello world"');

    expect(result.stdout).toBe('hello world\n');
    expect(result.exitCode).toBe(0);
  });

  it('should handle command errors', async () => {
    mockGateway.mockResponse('bash.exec', {
      success: false,
      error: 'Command not found',
    });

    await expect(
      bashTool('invalid-command')
    ).rejects.toThrow('Command not found');
  });
});
```

---

## 6. MIGRATION CHECKLIST

### 6.1. Step-by-Step Migration

```
✅ Step 1: Implement Relay Gateway
   • src/relay-gateway/
   • Test WebSocket server
   • Deploy to cloud

✅ Step 2: Create Tool Proxies
   • src/agents/tools/proxy/bash-proxy.ts
   • src/agents/tools/proxy/browser-proxy.ts
   • src/agents/tools/proxy/file-proxy.ts
   • Unit tests for each

✅ Step 3: Modify Agent Creation
   • Update src/commands/agent.ts
   • Add boxId parameter
   • Switch between local/proxied tools

✅ Step 4: Test Integration
   • Connect real mini-PC
   • Test all tools
   • Verify agent functionality

✅ Step 5: Deploy
   • Deploy cloud changes
   • Distribute relay agent binary
   • Monitor production
```

---

## 7. SUMMARY

**What Changed:**
- Agent runtime: ✅ Minimal changes (tool selection only)
- Tool implementations: ✅ New proxy wrappers (parallel to existing)
- Existing tools: ✅ Unchanged (still work locally)

**Result:**
- ✅ Same agent code works in both modes
- ✅ Tools have identical interfaces
- ✅ Easy to switch between local/relay
- ✅ Backward compatible

**Next:** See [04-relay-gateway-spec.md](04-relay-gateway-spec.md) for gateway implementation.

---

**Document Version:** 1.0
**Date:** 2026-01-29
**Status:** Complete - Ready for implementation
