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
    system: `You are YunSeeAI, a cybersecurity AI assistant with powerful scanning capabilities.

IMPORTANT: You have the following security scanning tools available:
- scan_ports: Scan for open ports and services
- scan_fingerprint: Identify web frameworks, CMS, and technologies
- scan_vulnerabilities: Scan for known CVEs and security vulnerabilities
- scan_waf: Detect Web Application Firewalls
- security_audit: Check system security configurations and detect attacks

When users ask about:
- "有漏洞吗" / "存在CVE吗" / "vulnerabilities" → Use scan_vulnerabilities tool
- "什么端口" / "open ports" → Use scan_ports tool
- "什么框架" / "什么CMS" / "framework" → Use scan_fingerprint tool
- "有WAF吗" / "firewall" → Use scan_waf tool
- "系统安全" / "security audit" → Use security_audit tool

Your role: Understand user intent and actively use these scanning tools. Don't say "I cannot scan" - you CAN scan!

Answer questions directly and concisely. Support Chinese and English.`,

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

  // Knowledge Base Configuration
  knowledgeBase: {
    storagePath: './data/knowledge.json',
    maxEntries: 1000,
    maxEntrySize: 1024 * 1024, // 1MB per entry
    searchLimit: 5,
  },

  // Web Search Configuration
  webSearch: {
    enabled: false,
    engine: 'duckduckgo' as 'google' | 'bing' | 'duckduckgo',
    maxResults: 5,
    timeout: 10000,
  },
};

export type AppConfig = typeof DEFAULT_CONFIG;

