# YunSeeAI Architecture Documentation

This document provides a comprehensive overview of YunSeeAI's architecture, design patterns, and technical implementation.

## Table of Contents

1. [System Overview](#system-overview)
2. [Module Architecture](#module-architecture)
3. [Data Flow](#data-flow)
4. [AI Integration](#ai-integration)
5. [Security Modules](#security-modules)
6. [Extension Points](#extension-points)

---

## System Overview

### High-Level Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                        User Interface                         │
│                    (CLI / Future: Web UI)                     │
└───────────────────────────┬──────────────────────────────────┘
                            │
                            ▼
┌──────────────────────────────────────────────────────────────┐
│                   AI Assistant Module                         │
│  ┌────────────────────────────────────────────────────┐     │
│  │  Natural Language Understanding                      │     │
│  │  - Intent Recognition                                │     │
│  │  - Context Management                                │     │
│  │  - Response Generation                               │     │
│  └────────────────────────────────────────────────────┘     │
└───────┬──────────────┬──────────────┬──────────────┬─────────┘
        │              │              │              │
        ▼              ▼              ▼              ▼
┌──────────┐   ┌──────────┐   ┌──────────┐   ┌──────────┐
│   WAF    │   │ Scanner  │   │ Auditor  │   │  Utils   │
│  Module  │   │  Module  │   │  Module  │   │  Module  │
└──────────┘   └──────────┘   └──────────┘   └──────────┘
     │              │              │              │
     └──────────────┴──────────────┴──────────────┘
                     │
                     ▼
        ┌────────────────────────┐
        │   System Resources     │
        │  - Logs                │
        │  - Configs             │
        │  - Network             │
        │  - Processes           │
        └────────────────────────┘
```

### Design Principles

1. **Modularity**: Each module is self-contained and independently functional
2. **AI-Centric**: AI orchestrates all operations and provides intelligent analysis
3. **Local-First**: All processing happens locally, no cloud dependencies
4. **Extensibility**: Plugin architecture allows easy addition of new modules
5. **Performance**: Optimized for consumer-grade hardware
6. **Privacy**: No data leaves the local machine

---

## Module Architecture

### 1. AI Assistant Module

**Location**: `src/ai/`

**Components**:

#### ModelServer (`ModelServer.ts`)

Responsible for low-level LLM inference.

```typescript
class ModelServer {
  - model: LlamaModel
  - context: LlamaContext
  - session: LlamaChatSession
  
  + initialize(): Promise<void>
  + generateResponse(messages, onToken): Promise<AIResponse>
  + resetSession(): Promise<void>
  + dispose(): Promise<void>
}
```

**Key Features**:
- Loads GGUF models using `node-llama-cpp`
- Manages context window
- Supports streaming responses
- Event-driven status updates

#### AssistantService (`AssistantService.ts`)

High-level AI service abstraction.

```typescript
class AssistantService {
  - modelServer: ModelServer
  - conversationHistory: ConversationMessage[]
  - systemPrompt: string
  
  + sendMessage(message, onToken): Promise<string>
  + clearHistory(): void
  + getHistory(): ConversationMessage[]
  + trimHistory(keepLastN): void
}
```

**Key Features**:
- Maintains conversation context
- Manages system prompts
- Automatic context trimming
- Token counting and management

### 2. CLI Module

**Location**: `src/cli/`

**Components**:

#### Interface (`Interface.ts`)

User interface layer.

```typescript
class CLIInterface {
  - commandHandler: CommandHandler
  - isRunning: boolean
  
  + start(): Promise<void>
  + exit(): Promise<void>
  + showLoading(message): Spinner
  + showError(message): void
}
```

**Key Features**:
- Interactive prompt using `inquirer`
- Colored output with `chalk`
- Loading spinners with `ora`
- Graceful error handling

#### CommandHandler (`CommandHandler.ts`)

Command processing and routing.

```typescript
class CommandHandler {
  - assistant: AssistantService
  
  + processInput(input): Promise<string>
  - handleCommand(command): Promise<string>
  - handleNaturalLanguage(input): Promise<string>
}
```

**Key Features**:
- Command parsing (built-in vs. natural language)
- AI query routing
- Response formatting
- Help system

### 3. Configuration Module

**Location**: `src/config/`

**Components**:

#### default.ts

Central configuration management.

```typescript
export const DEFAULT_CONFIG = {
  ai: { modelPath, contextSize, temperature, ... },
  prompts: { system, welcome },
  cli: { prompt, historySize },
  waf: { enabled, port, ... },
  scanner: { timeout, maxConcurrent },
};
```

**Key Features**:
- Type-safe configuration
- Environment variable support
- Default values with overrides
- Module-specific settings

### 4. Type Definitions

**Location**: `src/types/`

**Components**:

#### index.ts

TypeScript interfaces and types.

```typescript
interface AIModelConfig { ... }
interface ConversationMessage { ... }
interface AIResponse { ... }
interface ScanResult { ... }
```

**Key Features**:
- Strong typing for all components
- Shared interfaces across modules
- IDE autocomplete support
- Compile-time type checking

---

## Data Flow

### 1. User Input Flow

```
User Input (CLI)
    │
    ▼
CLIInterface.start()
    │
    ▼
CommandHandler.processInput()
    │
    ├─→ Built-in command? ──→ handleCommand()
    │                              │
    │                              ▼
    │                         Execute & Return
    │
    └─→ Natural language? ──→ handleNaturalLanguage()
                                   │
                                   ▼
                          AssistantService.sendMessage()
                                   │
                                   ▼
                          ModelServer.generateResponse()
                                   │
                                   ▼
                          LLM Inference (streaming)
                                   │
                                   ▼
                          Response to User
```

### 2. AI Processing Flow

```
User Query
    │
    ▼
AssistantService
    │
    ├─→ Add to conversation history
    ├─→ Check context window usage
    ├─→ Trim history if needed
    │
    ▼
ModelServer
    │
    ├─→ Format messages to prompt
    ├─→ Call llama.cpp inference
    ├─→ Stream tokens
    │
    ▼
LlamaChatSession
    │
    ├─→ Apply temperature, top-p, top-k
    ├─→ Generate token by token
    ├─→ Emit onToken events
    │
    ▼
Response Assembly
    │
    ├─→ Collect full response
    ├─→ Add to conversation history
    ├─→ Return to user
```

### 3. Module Interaction Flow

```
User: "Scan my system for vulnerabilities"
    │
    ▼
AI Assistant (Intent Recognition)
    │
    ├─→ Identifies: vulnerability scan request
    ├─→ Plans: call Auditor + Scanner modules
    │
    ├─→ Call: Auditor.scanVulnerabilities()
    │   │
    │   └─→ Returns: List of CVEs
    │
    ├─→ Call: Scanner.scanPorts()
    │   │
    │   └─→ Returns: Open ports & services
    │
    ▼
AI Assistant (Response Generation)
    │
    ├─→ Combines results
    ├─→ Analyzes severity
    ├─→ Generates recommendations
    │
    ▼
User: Formatted report with actionable advice
```

---

## AI Integration

### Model Loading

**Process**:

1. Application starts
2. Check model file exists
3. Load model into memory (~3-5 GB)
4. Create inference context
5. Initialize chat session
6. Ready for queries

**Optimization**:

- **Quantization**: Q4_K_M balances quality and performance
- **Context Window**: 4096 tokens typical, adjustable
- **Threading**: Multi-threaded inference (4-8 threads optimal)
- **Memory Mapping**: Model stays on disk, mapped to memory

### Prompt Engineering

**System Prompt Structure**:

```
You are YunSeeAI, an intelligent cybersecurity assistant.

Capabilities:
- Security configuration analysis
- Vulnerability scanning
- Threat detection
- Command execution guidance

Guidelines:
- Provide clear, actionable advice
- Explain commands before suggesting
- Prioritize user safety
- Be concise but thorough
```

**User Prompt Formatting**:

```
System: [System prompt]

User: [Previous user message]
Assistant: [Previous AI response]

User: [Current user message]
Assistant: [AI generates response here]
```

### Context Management

**Strategy**:

1. **Rolling Window**: Keep last N messages
2. **System Prompt**: Always retained
3. **Summarization**: Condense old context (future feature)
4. **Selective Trimming**: Remove low-value messages first

**Token Budget**:

```
Total Context: 4096 tokens
- System Prompt: ~500 tokens
- User Query: ~200 tokens
- AI Response: ~800 tokens
- History Buffer: ~2596 tokens
```

---

## Security Modules

### WAF Module (Planned)

**Architecture**:

```
HTTP Request
    │
    ▼
┌─────────────────┐
│  Reverse Proxy  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Rule Engine    │
│  - Signature    │
│  - Behavioral   │
└────────┬────────┘
         │
    ┌────┴─────┐
    │          │
Allow      Block
    │          │
    ▼          ▼
 Backend    403/Log
```

**Components**:

1. **Traffic Interceptor**: Captures all HTTP/HTTPS requests
2. **Rule Engine**: Applies security rules (SQL injection, XSS, etc.)
3. **ML Analyzer**: Behavioral analysis using trained models
4. **Response Handler**: Blocks malicious requests, logs events
5. **AI Advisor**: Analyzes blocked requests, suggests improvements

### Scanner Module (Planned)

**Architecture**:

```
Scan Request
    │
    ▼
┌─────────────────┐
│  Port Scanner   │
│  (Nmap wrapper) │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Fingerprinter  │
│  (Service info) │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Vuln Matcher    │
│ (CVE database)  │
└────────┬────────┘
         │
         ▼
     AI Analysis
```

**Components**:

1. **Port Scanner**: TCP/UDP port enumeration
2. **Service Detector**: Banner grabbing, version detection
3. **Fingerprint Engine**: Web framework, OS detection
4. **CVE Matcher**: Match services to known vulnerabilities
5. **Risk Scorer**: AI-powered risk assessment

### Auditor Module (Planned)

**Architecture**:

```
Audit Request
    │
    ▼
┌─────────────────┐
│  Config Reader  │
│  (SSH, FW, etc.)│
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Rule Checker   │
│  (CIS baseline) │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  CVE Scanner    │
│  (Package list) │
└────────┬────────┘
         │
         ▼
     AI Report
```

**Components**:

1. **System Inspector**: Reads OS, package, service info
2. **Config Auditor**: Checks against security baselines
3. **CVE Database**: Local vulnerability database
4. **Remediation Engine**: Generates fix scripts
5. **AI Explainer**: Natural language reports

---

## Extension Points

### Adding New Modules

**Step 1**: Create module directory

```bash
mkdir src/modules/my-module
```

**Step 2**: Implement module interface

```typescript
// src/modules/my-module/index.ts
export class MyModule {
  async execute(params: any): Promise<any> {
    // Module logic
  }
}
```

**Step 3**: Register with AI Assistant

```typescript
// src/ai/AssistantService.ts
import { MyModule } from '../modules/my-module';

class AssistantService {
  private modules = {
    myModule: new MyModule(),
    // ... other modules
  };
}
```

**Step 4**: Add commands

```typescript
// src/cli/CommandHandler.ts
case 'mycommand':
  return await this.assistant.modules.myModule.execute(args);
```

### Adding New Commands

**Built-in Command**:

```typescript
// src/cli/CommandHandler.ts
private async handleCommand(command: string): Promise<string> {
  const [cmd, ...args] = command.slice(1).split(' ');
  
  switch (cmd.toLowerCase()) {
    case 'mynewcmd':
      return this.handleMyNewCommand(args);
    // ... other commands
  }
}

private async handleMyNewCommand(args: string[]): Promise<string> {
  // Implementation
  return chalk.green('Command executed');
}
```

**Natural Language Trigger**:

Handled automatically by AI - just update system prompt to include new capabilities.

### Customizing AI Behavior

**Method 1**: Edit system prompt

```typescript
// src/config/default.ts
prompts: {
  system: `
    You are YunSeeAI...
    
    NEW CAPABILITY: When user asks about X, do Y.
  `,
}
```

**Method 2**: Add context to messages

```typescript
// src/ai/AssistantService.ts
async sendMessage(userMessage: string): Promise<string> {
  // Add context
  const enrichedMessage = `
    Current system state: ${getSystemInfo()}
    User query: ${userMessage}
  `;
  
  // Continue processing
}
```

---

## Performance Optimization

### Memory Management

1. **Model Quantization**: Use Q4_K_M or Q5_K_M
2. **Context Trimming**: Limit to 10-20 messages
3. **Lazy Loading**: Load modules on demand
4. **Resource Cleanup**: Dispose of unused resources

### Inference Speed

1. **CPU Threads**: Match physical core count
2. **Batch Processing**: Group related queries
3. **Caching**: Cache common responses
4. **Streaming**: Show partial responses immediately

### Scalability

1. **Module Isolation**: Each module runs independently
2. **Async Operations**: Non-blocking I/O throughout
3. **Worker Threads**: Offload heavy computations (future)
4. **Database**: SQLite for local data storage (future)

---

## Security Considerations

### Local Model Security

- Models run in isolated process
- No network access during inference
- File system access controlled
- Memory encryption (future enhancement)

### Data Privacy

- All conversations stay local
- No telemetry or analytics
- Optional audit logs (user-controlled)
- Encrypted storage (future feature)

### Command Execution

- Dangerous commands require confirmation
- Sandboxed execution (planned)
- Privilege escalation warnings
- Audit trail of all actions

---

## Future Architecture Enhancements

### Planned Improvements

1. **Web UI**: React-based dashboard
2. **API Server**: RESTful API for integrations
3. **Plugin System**: NPM-installable plugins
4. **Distributed Mode**: Multi-server management
5. **Custom Model Training**: Fine-tune on user data
6. **GPU Acceleration**: CUDA/Metal support
7. **Database Layer**: Persistent storage
8. **Notification System**: Alerts and webhooks

---

## References

- [llama.cpp Documentation](https://github.com/ggerganov/llama.cpp)
- [Node.js Best Practices](https://github.com/goldbergyoni/nodebestpractices)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [OWASP WAF Guidance](https://owasp.org/www-community/Web_Application_Firewall)

---

**Last Updated**: 2025-01-03
**Version**: 1.0.0


