/**
 * Default configuration for YunSeeAI
 */

import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export const DEFAULT_CONFIG = {
  // AI Model Configuration
  ai: {
    modelPath: path.resolve(process.cwd(), 'YunSee(deepseek).gguf'),
    contextSize: 4096,
    temperature: 0.7,
    maxTokens: 2048,
    topP: 0.95,
    topK: 40,
    threads: 4,
  },

  // System Prompts (in English for compatibility)
  prompts: {
    system: `You are YunSeeAI, an intelligent cybersecurity assistant designed to help developers with security tasks. You can:
1. Analyze security configurations
2. Scan for vulnerabilities
3. Detect threats in web traffic
4. Provide security recommendations
5. Execute security-related commands

Always provide clear, actionable advice. When suggesting commands, explain what they do. Be concise but thorough.`,

    welcome: `Welcome to YunSeeAI - Your AI Security Assistant
Type 'help' to see available commands or just chat naturally about security concerns.`,
  },

  // CLI Configuration
  cli: {
    prompt: '🛡️ YunSeeAI> ',
    historySize: 100,
  },

  // WAF Configuration
  waf: {
    enabled: false,
    port: 8080,
    logLevel: 'info',
  },

  // Scanner Configuration
  scanner: {
    timeout: 5000,
    maxConcurrent: 10,
  },
};

export type AppConfig = typeof DEFAULT_CONFIG;

