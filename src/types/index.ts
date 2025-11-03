/**
 * Type definitions for YunSeeAI
 */

export interface AIModelConfig {
  modelPath: string;
  contextSize: number;
  temperature: number;
  maxTokens: number;
  topP: number;
  topK: number;
}

export interface ConversationMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface AIResponse {
  content: string;
  tokensGenerated: number;
  timeTaken: number;
}

export interface CLICommand {
  name: string;
  description: string;
  execute: (args: string[]) => Promise<void>;
}

export interface ScanResult {
  timestamp: string;
  type: 'vulnerability' | 'config' | 'port' | 'waf';
  severity: 'low' | 'medium' | 'high' | 'critical';
  findings: Array<{
    title: string;
    description: string;
    recommendation?: string;
  }>;
}


