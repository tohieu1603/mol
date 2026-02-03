/**
 * Chat Service - With usage tracking from session transcripts
 * - Saves chat history to PostgreSQL
 * - Uses Gateway for AI calls
 * - Reads actual token usage from session transcripts
 */

import crypto from "node:crypto";
import * as fs from "node:fs";
import * as path from "node:path";
import { Errors } from "../core/errors/api-error.js";
import { tokenService } from "./token.service.js";
import { usersRepo, chatMessagesRepo } from "../../db/index.js";
import { resolveSessionTranscriptsDir } from "../../config/sessions.js";

// Default gateway (fallback if user has no custom gateway)
const DEFAULT_GATEWAY_URL = process.env.GATEWAY_URL || "";
const DEFAULT_GATEWAY_TOKEN = process.env.GATEWAY_TOKEN || "";
const CHAT_TIMEOUT_MS = 120_000;
const MAX_HISTORY_MESSAGES = 20;

interface ContentBlock {
  type: "text" | "thinking";
  text?: string;
  thinking?: string;
}

interface TokenUsage {
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

interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

interface ChatResult {
  role: "assistant";
  content: ContentBlock[];
  model: string;
  provider: string;
  usage: TokenUsage;
  stopReason: string;
  conversationId: string;
  tokenBalance: number;
}

class ChatService {
  async sendMessage(userId: string, message: string, conversationId?: string): Promise<ChatResult> {
    const user = await usersRepo.getUserById(userId);
    if (!user) throw Errors.notFound("User");
    if (!user.is_active) throw Errors.accountDeactivated();

    // Get gateway config: user's custom gateway or fallback to default
    const gatewayUrl = user.gateway_url || DEFAULT_GATEWAY_URL;
    const gatewayToken = user.gateway_token || DEFAULT_GATEWAY_TOKEN;

    if (!gatewayUrl || !gatewayToken) {
      throw Errors.serviceUnavailable("Gateway not configured");
    }

    const convId = conversationId || this.generateConversationId();
    const sessionKey = `operis:${convId}`;

    const history = await this.loadConversationHistory(userId, convId);

    await chatMessagesRepo.createMessage({
      user_id: userId,
      conversation_id: convId,
      role: "user",
      content: message,
    });

    history.push({ role: "user", content: message });

    // Call user's gateway and get response
    const { text, chatId } = await this.callGateway(history, sessionKey, gatewayUrl, gatewayToken);

    // Get full response with usage from session transcript
    const aiResponse = await this.getResponseFromTranscript(chatId, text);

    const textContent = aiResponse.content
      .filter((block) => block.type === "text")
      .map((block) => block.text)
      .join("\n");

    await chatMessagesRepo.createMessage({
      user_id: userId,
      conversation_id: convId,
      role: "assistant",
      content: textContent,
      model: aiResponse.model,
      provider: aiResponse.provider,
      tokens_used: aiResponse.usage.totalTokens,
      cost: aiResponse.usage.cost.total,
    });

    const tokensToDeduct = aiResponse.usage.totalTokens;
    if (tokensToDeduct > 0 && user.token_balance < tokensToDeduct) {
      throw Errors.insufficientBalance(user.token_balance, tokensToDeduct);
    }

    if (tokensToDeduct > 0) {
      await tokenService.debit(userId, tokensToDeduct, `Chat: ${message.slice(0, 30)}...`);
    }

    const updatedUser = await usersRepo.getUserById(userId);

    return {
      ...aiResponse,
      conversationId: convId,
      tokenBalance: updatedUser?.token_balance ?? 0,
    };
  }

  private async callGateway(
    messages: ChatMessage[],
    sessionKey: string,
    gatewayUrl: string,
    gatewayToken: string,
  ): Promise<{ text: string; chatId: string }> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), CHAT_TIMEOUT_MS);

    try {
      const response = await fetch(`${gatewayUrl}/v1/chat/completions`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${gatewayToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          messages: messages,
          user: sessionKey,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        console.error("[chat] Gateway error:", errorText);
        throw Errors.serviceUnavailable("Chat");
      }

      const data = await response.json();
      const text = data.choices?.[0]?.message?.content || "";
      const chatId = data.id || "";

      return { text, chatId };
    } catch (error: any) {
      clearTimeout(timeoutId);
      if (error.name === "AbortError") {
        throw Errors.serviceUnavailable("Chat timeout");
      }
      throw error;
    }
  }

  /**
   * Get response with usage from session transcript
   */
  private async getResponseFromTranscript(
    chatId: string,
    fallbackText: string,
  ): Promise<Omit<ChatResult, "conversationId" | "tokenBalance">> {
    try {
      // Wait for transcript to be written
      await new Promise((resolve) => setTimeout(resolve, 300));

      const transcriptsDir = resolveSessionTranscriptsDir();
      if (!fs.existsSync(transcriptsDir)) {
        return this.defaultResponse(fallbackText);
      }

      // Find most recently modified transcript
      const files = fs
        .readdirSync(transcriptsDir)
        .filter((f) => f.endsWith(".jsonl"))
        .map((f) => ({
          path: path.join(transcriptsDir, f),
          mtime: fs.statSync(path.join(transcriptsDir, f)).mtimeMs,
        }))
        .sort((a, b) => b.mtime - a.mtime);

      if (files.length === 0) {
        return this.defaultResponse(fallbackText);
      }

      const transcriptFile = files[0].path;
      const lines = fs.readFileSync(transcriptFile, "utf-8").trim().split("\n");

      // Get last assistant message with usage
      for (let i = lines.length - 1; i >= 0; i--) {
        try {
          const entry = JSON.parse(lines[i]);
          const msg = entry.message || entry;

          if (msg.role === "assistant" && msg.usage) {
            const content: ContentBlock[] = [];

            if (Array.isArray(msg.content)) {
              for (const block of msg.content) {
                if (block.type === "text" && block.text) {
                  content.push({ type: "text", text: block.text });
                } else if (block.type === "thinking" && block.thinking) {
                  content.push({ type: "thinking", thinking: block.thinking });
                }
              }
            } else if (typeof msg.content === "string") {
              content.push({ type: "text", text: msg.content });
            }

            return {
              role: "assistant",
              content,
              model: msg.model || "claude-sonnet-4-20250514",
              provider: msg.provider || "anthropic",
              usage: msg.usage,
              stopReason: msg.stopReason || "stop",
            };
          }
        } catch {
          // Skip invalid lines
        }
      }

      return this.defaultResponse(fallbackText);
    } catch (error) {
      console.error("[chat] Error reading transcript:", error);
      return this.defaultResponse(fallbackText);
    }
  }

  private defaultResponse(text: string): Omit<ChatResult, "conversationId" | "tokenBalance"> {
    return {
      role: "assistant",
      content: [{ type: "text", text }],
      model: "claude-sonnet-4-20250514",
      provider: "anthropic",
      usage: {
        input: 0,
        output: 0,
        cacheRead: 0,
        cacheWrite: 0,
        totalTokens: 0,
        cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0, total: 0 },
      },
      stopReason: "stop",
    };
  }

  private generateConversationId(): string {
    return crypto.randomUUID();
  }

  private async loadConversationHistory(
    userId: string,
    conversationId: string,
  ): Promise<ChatMessage[]> {
    const messages = await chatMessagesRepo.getConversationHistory(
      userId,
      conversationId,
      MAX_HISTORY_MESSAGES,
    );

    return messages.map((msg) => ({
      role: msg.role as "user" | "assistant",
      content: msg.content,
    }));
  }

  async getBalance(userId: string): Promise<{ balance: number }> {
    const balance = await tokenService.getBalance(userId);
    return { balance };
  }

  async getConversations(userId: string): Promise<any[]> {
    return chatMessagesRepo.getUserConversations(userId);
  }

  async getHistory(userId: string, conversationId: string): Promise<any[]> {
    return chatMessagesRepo.getConversationHistory(userId, conversationId);
  }

  async newConversation(userId: string): Promise<{ conversationId: string }> {
    return { conversationId: crypto.randomUUID() };
  }

  async deleteConversation(userId: string, conversationId: string): Promise<void> {
    await chatMessagesRepo.deleteConversation(userId, conversationId);
  }
}

export const chatService = new ChatService();
