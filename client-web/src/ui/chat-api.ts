/**
 * Chat API Service
 * Handles chat with Operis API
 */

import { apiRequest } from "./auth-api";

// Types matching Operis API response (Anthropic format)
export interface ContentBlock {
  type: "text" | "thinking";
  text?: string;
  thinking?: string;
}

export interface TokenUsage {
  input: number;
  output: number;
  cacheRead: number;
  cacheWrite: number;
  totalTokens: number;
  cost: {
    input: number;
    output: number;
    cacheRead: number;
    cacheWrite: number;
    total: number;
  };
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string | ContentBlock[];
}

export interface ChatResult {
  role: "assistant";
  content: ContentBlock[];
  model: string;
  provider: string;
  usage: TokenUsage;
  stopReason: string;
  conversationId: string;
  tokenBalance: number;
}

export interface ChatError {
  error: string;
  code?: string;
}

// Extract text content from response
export function extractTextContent(content: ContentBlock[]): string {
  return content
    .filter((block) => block.type === "text" && block.text)
    .map((block) => block.text)
    .join("\n");
}

// Chat request options
export interface ChatOptions {
  model?: string;
  systemPrompt?: string;
  conversationId?: string;
}

// Send chat message (non-streaming)
export async function sendMessageSync(
  message: string,
  options?: ChatOptions,
): Promise<ChatResult> {
  return apiRequest<ChatResult>("/chat", {
    method: "POST",
    body: JSON.stringify({
      message,
      model: options?.model,
      systemPrompt: options?.systemPrompt,
      conversationId: options?.conversationId,
    }),
  });
}

// Send chat message with SSE streaming
export async function sendMessage(
  message: string,
  conversationId?: string,
  onDelta?: (text: string) => void,
  onDone?: (result: ChatResult) => void,
): Promise<ChatResult> {
  const { API_CONFIG } = await import("../config");
  const { getAccessToken } = await import("./auth-api");

  const url = `${API_CONFIG.baseUrl}/chat/stream`;
  const token = getAccessToken();

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ message, conversationId }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    let errorMessage = `Request failed: ${response.status}`;
    try {
      const errorJson = JSON.parse(errorText);
      errorMessage = errorJson.error || errorMessage;
    } catch {
      // Keep default error message
    }
    throw new Error(errorMessage);
  }

  // Parse SSE stream with named events (event: xxx\ndata: {...})
  const reader = response.body?.getReader();
  if (!reader) throw new Error("No response body");

  const decoder = new TextDecoder();
  let buffer = "";
  let finalResult: ChatResult | null = null;
  let accumulatedText = "";
  let currentEvent = "";
  let convId = conversationId || "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() || ""; // Keep incomplete line in buffer

    for (const line of lines) {
      // Parse event name
      if (line.startsWith("event: ")) {
        currentEvent = line.slice(7).trim();
        continue;
      }

      // Parse data
      if (line.startsWith("data: ")) {
        const jsonStr = line.slice(6).trim();
        if (!jsonStr || jsonStr === "[DONE]") continue;

        try {
          const data = JSON.parse(jsonStr);

          // Handle based on event type from backend
          if (currentEvent === "meta" && data.conversationId) {
            convId = data.conversationId;
          } else if (currentEvent === "content" && data.content !== undefined) {
            // Backend sends full accumulated content in each chunk
            accumulatedText = data.content;
            onDelta?.(accumulatedText);
          } else if (currentEvent === "done") {
            // Build final result from done event
            finalResult = {
              role: "assistant",
              content: [{ type: "text", text: accumulatedText }],
              model: "unknown",
              provider: "unknown",
              usage: data.usage || { input: 0, output: 0, cacheRead: 0, cacheWrite: 0, totalTokens: 0, cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0, total: 0 } },
              stopReason: "end_turn",
              conversationId: data.conversationId || convId,
              tokenBalance: data.tokenBalance || 0,
            };
            onDone?.(finalResult);
          } else if (currentEvent === "error") {
            // Mark as SSE error and throw
            const err = new Error(data.error || "Stream error");
            (err as Error & { isSSEError: boolean }).isSSEError = true;
            throw err;
          }

          // Reset event after processing
          currentEvent = "";
        } catch (e) {
          // Re-throw SSE errors from backend, skip malformed JSON parsing errors
          if (e instanceof Error && (e as Error & { isSSEError?: boolean }).isSSEError) {
            throw e;
          }
        }
      }
    }
  }

  // Return final result or construct one from accumulated text
  if (finalResult) return finalResult;

  return {
    role: "assistant",
    content: [{ type: "text", text: accumulatedText }],
    model: "unknown",
    provider: "unknown",
    usage: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0, totalTokens: 0, cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0, total: 0 } },
    stopReason: "end_turn",
    conversationId: convId,
    tokenBalance: 0,
  };
}

// Get token balance
export async function getChatBalance(): Promise<{ balance: number }> {
  return apiRequest<{ balance: number }>("/chat/balance");
}

// Conversation types
export interface Conversation {
  conversation_id: string;
  last_message_at: string;
  message_count: number;
  preview?: string;
}

export interface HistoryMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  created_at: string;
}

// Get all conversations
export async function getConversations(): Promise<{ conversations: Conversation[] }> {
  return apiRequest<{ conversations: Conversation[] }>("/chat/conversations");
}

// Get conversation history
export async function getConversationHistory(conversationId: string): Promise<{ messages: HistoryMessage[] }> {
  return apiRequest<{ messages: HistoryMessage[] }>(`/chat/conversations/${conversationId}`);
}

// Start new conversation
export async function newConversation(): Promise<{ conversationId: string }> {
  return apiRequest<{ conversationId: string }>("/chat/conversations/new", {
    method: "POST",
  });
}

// Delete conversation
export async function deleteConversation(conversationId: string): Promise<{ success: boolean }> {
  return apiRequest<{ success: boolean }>(`/chat/conversations/${conversationId}`, {
    method: "DELETE",
  });
}
