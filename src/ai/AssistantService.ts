/**
 * AI Assistant Service - High-level interface for AI interactions
 */

import { ModelServer } from './ModelServer.js';
import { ConversationMessage } from '../types/index.js';
import { DEFAULT_CONFIG } from '../config/default.js';
import { KnowledgeBase } from './KnowledgeBase.js';
import { WebSearch } from './WebSearch.js';
import chalk from 'chalk';

export class AssistantService {
  private modelServer: ModelServer;
  private conversationHistory: ConversationMessage[] = [];
  private systemPrompt: string;
  private knowledgeBase: KnowledgeBase;
  private webSearch: WebSearch;
  private debugMode: boolean = false;

  constructor(
    modelServer: ModelServer, 
    systemPrompt?: string,
    knowledgeBase?: KnowledgeBase,
    webSearch?: WebSearch
  ) {
    this.modelServer = modelServer;
    this.systemPrompt = systemPrompt || DEFAULT_CONFIG.prompts.system;
    this.knowledgeBase = knowledgeBase || new KnowledgeBase();
    this.webSearch = webSearch || new WebSearch({ enabled: false });
    
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
    // Enhance message with context from knowledge base and web search
    const enhancedMessage = await this.enhanceMessageWithContext(userMessage);
    
    // Add user message to history (original message)
    this.conversationHistory.push({
      role: 'user',
      content: userMessage,
    });

    // Generate response using enhanced message
    const response = await this.modelServer.generateResponse(
      this.buildMessagesWithContext(enhancedMessage),
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
   * Enhance user message with context from knowledge base and web search
   * Priority: Web Search > Knowledge Base
   */
  private async enhanceMessageWithContext(userMessage: string): Promise<string> {
    let context = '';
    let hasWebResults = false;

    // 1. Try web search first (highest priority)
    if (this.webSearch.isAvailable()) {
      try {
        const webResults = await this.webSearch.search(userMessage);
        if (webResults && webResults.length > 0) {
          context += this.webSearch.buildContextFromResults(webResults);
          hasWebResults = true;
        }
      } catch (error) {
        console.error(chalk.yellow('⚠ Web search failed:', error));
      }
    }

    // 2. Search knowledge base (second priority)
    try {
      const kbResults = this.knowledgeBase.search(userMessage, 3);
      if (kbResults && kbResults.length > 0) {
        const kbContext = this.knowledgeBase.buildContextFromResults(kbResults);
        context += kbContext;
        
        // Debug mode: show what knowledge was found
        if (this.debugMode) {
          console.log(chalk.magenta('\n🔍 [调试模式] 知识库检索结果:'));
          console.log(chalk.gray(`   找到 ${kbResults.length} 条相关知识`));
          kbResults.forEach((result, i) => {
            console.log(chalk.gray(`   ${i + 1}. 相关度: ${(result.score * 100).toFixed(0)}% | 关键词: ${result.matchedKeywords.join(', ')}`));
          });
        }
      } else {
        if (this.debugMode) {
          console.log(chalk.yellow('\n⚠ [调试模式] 知识库未找到相关内容'));
        }
      }
    } catch (error) {
      console.error(chalk.yellow('⚠ Knowledge base search failed:', error));
    }

    // Build enhanced message
    if (context) {
      const enhancedMsg = `${context}\n用户问题: ${userMessage}\n\n请基于以上${hasWebResults ? '网络搜索结果和' : ''}知识库内容回答问题。`;
      
      // Debug mode: show the full enhanced message sent to AI
      if (this.debugMode) {
        console.log(chalk.magenta('\n📤 [调试模式] AI实际接收到的完整消息:'));
        console.log(chalk.gray('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'));
        console.log(chalk.cyan(enhancedMsg.substring(0, 500) + (enhancedMsg.length > 500 ? '...' : '')));
        console.log(chalk.gray('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n'));
      }
      
      return enhancedMsg;
    }

    if (this.debugMode) {
      console.log(chalk.yellow('\n⚠ [调试模式] 未使用知识库增强（无相关内容）\n'));
    }

    return userMessage;
  }

  /**
   * Build message array with enhanced context
   */
  private buildMessagesWithContext(enhancedMessage: string): ConversationMessage[] {
    const messages = [...this.conversationHistory];
    // Replace last user message with enhanced version
    messages[messages.length - 1] = {
      role: 'user',
      content: enhancedMessage,
    };
    return messages;
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

  /**
   * Get knowledge base instance
   */
  getKnowledgeBase(): KnowledgeBase {
    return this.knowledgeBase;
  }

  /**
   * Get web search instance
   */
  getWebSearch(): WebSearch {
    return this.webSearch;
  }

  /**
   * Enable debug mode to see AI context
   */
  enableDebugMode(): void {
    this.debugMode = true;
  }

  /**
   * Disable debug mode
   */
  disableDebugMode(): void {
    this.debugMode = false;
  }

  /**
   * Check if debug mode is enabled
   */
  isDebugMode(): boolean {
    return this.debugMode;
  }
}

