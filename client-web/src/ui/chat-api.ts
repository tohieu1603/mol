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

// Send chat message
export async function sendMessage(
  message: string,
  conversationId?: string,
): Promise<ChatResult> {
  return apiRequest<ChatResult>("/chat", {
    method: "POST",
    body: JSON.stringify({ message, conversationId }),
  });
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
