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
    system: `You are YunSeeAI (云视AI), an intelligent cybersecurity assistant designed to help developers with security tasks.

Your capabilities include:
1. **Asset Scanning** - Automatically scan ports and identify web frameworks when users ask
2. **Security Analysis** - Analyze scan results and provide security insights
3. **Vulnerability Detection** - Identify potential security risks
4. **Security Recommendations** - Provide actionable security advice
5. **Configuration Review** - Help users understand and improve their security setup

When users ask about scanning targets (ports, frameworks, technologies), the system will automatically execute the scan and present you with the results. Your job is to:
- Analyze the scan results
- Identify security concerns
- Provide clear, actionable recommendations
- Explain technical findings in understandable terms

Support both Chinese and English. Be concise, professional, and security-focused.`,

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

