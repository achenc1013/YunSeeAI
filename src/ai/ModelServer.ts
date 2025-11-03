/**
 * AI Model Server - Handles LLM inference using llama.cpp
 */

import { getLlama, LlamaModel, LlamaContext, LlamaChatSession } from 'node-llama-cpp';
import { ConversationMessage, AIResponse, AIModelConfig } from '../types/index.js';
import { EventEmitter } from 'events';

export class ModelServer extends EventEmitter {
  private model?: LlamaModel;
  private context?: LlamaContext;
  private session?: LlamaChatSession;
  private config: AIModelConfig;
  private isInitialized: boolean = false;

  constructor(config: AIModelConfig) {
    super();
    this.config = config;
  }

  /**
   * Initialize the model and create context
   */
  async initialize(): Promise<void> {
    try {
      this.emit('status', 'Loading model...');
      
      // Get llama instance
      const llama = await getLlama();
      
      // Load the model with new API
      this.model = await llama.loadModel({
        modelPath: this.config.modelPath,
      });

      this.emit('status', 'Creating context...');

      // Create context with new API
      this.context = await this.model.createContext({
        contextSize: this.config.contextSize,
      });

      // Create chat session with new API
      this.session = new LlamaChatSession({
        contextSequence: this.context.getSequence(),
      });

      this.isInitialized = true;
      this.emit('ready', 'Model loaded successfully');
    } catch (error) {
      this.emit('error', error);
      throw new Error(`Failed to initialize model: ${error}`);
    }
  }

  /**
   * Generate response from the model
   */
  async generateResponse(
    messages: ConversationMessage[],
    onToken?: (token: string) => void
  ): Promise<AIResponse> {
    if (!this.isInitialized || !this.session) {
      throw new Error('Model not initialized. Call initialize() first.');
    }

    const startTime = Date.now();
    let fullResponse = '';
    let tokenCount = 0;

    try {
      // Convert messages to the format expected by llama.cpp
      const prompt = this.formatMessages(messages);

      // Generate response with streaming
      const response = await this.session.prompt(prompt, {
        temperature: this.config.temperature,
        maxTokens: this.config.maxTokens,
        topP: this.config.topP,
        topK: this.config.topK,
        onTextChunk: (chunk) => {
          fullResponse += chunk;
          tokenCount++;
          if (onToken) {
            onToken(chunk);
          }
        },
      });

      const timeTaken = Date.now() - startTime;

      return {
        content: fullResponse || response,
        tokensGenerated: tokenCount,
        timeTaken,
      };
    } catch (error) {
      throw new Error(`Failed to generate response: ${error}`);
    }
  }

  /**
   * Format conversation messages into a prompt string
   */
  private formatMessages(messages: ConversationMessage[]): string {
    let prompt = '';
    
    for (const msg of messages) {
      if (msg.role === 'system') {
        prompt += `System: ${msg.content}\n\n`;
      } else if (msg.role === 'user') {
        prompt += `User: ${msg.content}\n\n`;
      } else if (msg.role === 'assistant') {
        prompt += `Assistant: ${msg.content}\n\n`;
      }
    }
    
    prompt += 'Assistant: ';
    return prompt;
  }

  /**
   * Reset the conversation session
   */
  async resetSession(): Promise<void> {
    if (this.context) {
      this.session = new LlamaChatSession({
        contextSequence: this.context.getSequence(),
      });
    }
  }

  /**
   * Cleanup resources
   */
  async dispose(): Promise<void> {
    this.session = undefined;
    
    if (this.context) {
      await this.context.dispose();
      this.context = undefined;
    }
    
    if (this.model) {
      await this.model.dispose();
      this.model = undefined;
    }
    
    this.isInitialized = false;
  }

  /**
   * Check if model is ready
   */
  isReady(): boolean {
    return this.isInitialized;
  }

  /**
   * Get model information
   */
  getModelInfo(): { path: string; contextSize: number; ready: boolean } {
    return {
      path: this.config.modelPath,
      contextSize: this.config.contextSize,
      ready: this.isInitialized,
    };
  }
}
