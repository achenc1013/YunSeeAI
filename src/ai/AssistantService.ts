/**
 * AI Assistant Service - High-level interface for AI interactions
 */

import { ModelServer } from './ModelServer.js';
import { ConversationMessage } from '../types/index.js';
import { DEFAULT_CONFIG } from '../config/default.js';

export class AssistantService {
  private modelServer: ModelServer;
  private conversationHistory: ConversationMessage[] = [];
  private systemPrompt: string;

  constructor(modelServer: ModelServer, systemPrompt?: string) {
    this.modelServer = modelServer;
    this.systemPrompt = systemPrompt || DEFAULT_CONFIG.prompts.system;
    
    // Initialize with system prompt
    this.conversationHistory.push({
      role: 'system',
      content: this.systemPrompt,
    });
  }

  /**
   * Send a message and get AI response
   */
  async sendMessage(
    userMessage: string,
    onToken?: (token: string) => void
  ): Promise<string> {
    // Add user message to history
    this.conversationHistory.push({
      role: 'user',
      content: userMessage,
    });

    // Generate response
    const response = await this.modelServer.generateResponse(
      this.conversationHistory,
      onToken
    );

    // Add assistant response to history
    this.conversationHistory.push({
      role: 'assistant',
      content: response.content,
    });

    return response.content;
  }

  /**
   * Clear conversation history (keeps system prompt)
   */
  clearHistory(): void {
    this.conversationHistory = [
      {
        role: 'system',
        content: this.systemPrompt,
      },
    ];
  }

  /**
   * Get conversation history
   */
  getHistory(): ConversationMessage[] {
    return [...this.conversationHistory];
  }

  /**
   * Set a new system prompt and reset conversation
   */
  setSystemPrompt(prompt: string): void {
    this.systemPrompt = prompt;
    this.clearHistory();
  }

  /**
   * Get current token count (approximate)
   */
  getTokenCount(): number {
    // Rough estimation: ~4 chars per token
    const totalChars = this.conversationHistory.reduce(
      (sum, msg) => sum + msg.content.length,
      0
    );
    return Math.ceil(totalChars / 4);
  }

  /**
   * Check if we need to trim history to fit context window
   */
  shouldTrimHistory(maxTokens: number): boolean {
    return this.getTokenCount() > maxTokens * 0.8; // 80% threshold
  }

  /**
   * Trim old messages (keeping system prompt and recent messages)
   */
  trimHistory(keepLastN: number = 10): void {
    const systemMsg = this.conversationHistory[0];
    const recentMessages = this.conversationHistory.slice(-keepLastN);
    
    this.conversationHistory = [systemMsg, ...recentMessages];
  }
}

