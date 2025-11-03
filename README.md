# YunSeeAI - AI-Powered Security Assistant

<div align="center">

![YunSeeAI Logo](https://img.shields.io/badge/YunSeeAI-v1.0.0-blue)
![Node.js](https://img.shields.io/badge/Node.js-%3E%3D18.0.0-green)
![TypeScript](https://img.shields.io/badge/TypeScript-5.3.3-blue)
![License](https://img.shields.io/badge/License-MIT-yellow)

**An intelligent, open-source security assistant powered by local AI models**

[Features](#features) • [Installation](#installation) • [Usage](#usage) • [Architecture](#architecture) • [Contributing](#contributing)

</div>

---

## 🌟 Overview

YunSeeAI is an innovative open-source cybersecurity project designed for individual developers. It combines artificial intelligence with comprehensive security protection capabilities, providing an all-in-one solution from threat detection to vulnerability remediation.

### Key Highlights

- 🤖 **Local AI Processing** - Runs completely offline with local LLM models
- 🛡️ **Natural Language Interface** - Control security tools through conversational CLI
- 🔒 **Intelligent WAF** - AI-powered Web Application Firewall
- 🔍 **Vulnerability Scanner** - Automated security audits and CVE detection
- 🌐 **Asset Discovery** - Port scanning and service fingerprinting
- 🎯 **Zero Dependencies on Cloud APIs** - Complete privacy and control

---

## 📋 Features

### 1. AI Assistant Module (✅ Implemented)
- **Natural Language CLI** - Interactive command-line interface
- **Context-Aware Conversations** - Understands follow-up questions
- **Local LLM Integration** - Uses GGUF format models (llama.cpp)
- **Intelligent Command Routing** - Automatically dispatches tasks to appropriate modules

### 2. Web Application Firewall (Coming Soon)
- Real-time traffic monitoring
- ML-based attack detection
- Dynamic IP blocking
- Low false-positive rate

### 3. Security Audit Module (Coming Soon)
- SSH configuration checks
- Firewall status verification
- CVE vulnerability scanning
- Configuration hardening recommendations

### 4. Asset Discovery Module (Coming Soon)
- Port scanning (Nmap integration)
- Service fingerprinting
- Web framework detection
- Vulnerability matching

---

## 🚀 Installation

### Prerequisites

- **Node.js** >= 18.0.0
- **npm** or **yarn**
- **8GB+ RAM** recommended for model inference
- **Operating System**: Windows, macOS, or Linux

### Step 1: Clone the Repository

```bash
git clone https://github.com/yourusername/yunsee-ai.git
cd yunsee-ai
```

### Step 2: Install Dependencies

```bash
npm install
```

### Step 3: Download AI Model

YunSeeAI requires a GGUF format language model. The default configuration looks for:
```
DeepSeek-R1-0528-Qwen3-8B-Q4_K_M.gguf
```

**Recommended Models:**
- **DeepSeek-R1-Qwen** (8B parameters, Q4 quantization) - Balanced performance
- **LLaMA 2** (7B/13B parameters) - Good quality
- **Mistral** (7B parameters) - Fast inference

Download from:
- [Hugging Face Model Hub](https://huggingface.co/models)
- Place the `.gguf` file in the project root directory

### Step 4: Build the Project

```bash
npm run build
```

### Step 5: Run YunSeeAI

```bash
npm start
```

Or for development:
```bash
npm run dev
```

---

## 💡 Usage

### Starting the CLI

```bash
npm start
```

You'll see the welcome screen:

```
╔══════════════════════════════════════════════════════════════╗
║              YunSeeAI - AI Security Assistant               ║
╚══════════════════════════════════════════════════════════════╝

Type /help for commands or just chat naturally
Press Ctrl+C or type exit to quit
```

### Built-in Commands

| Command | Description |
|---------|-------------|
| `/help` | Show all available commands |
| `/clear` | Clear conversation history |
| `/history` | Show conversation history |
| `/status` | Display system status |
| `/reset` | Reset the AI session |
| `/exit` or `/quit` | Exit YunSeeAI |

### Natural Language Examples

Just type naturally - the AI understands context:

```
🛡️ You: Check my server security configuration

🤖 YunSeeAI: I'll scan your server's security configuration...
[Analysis results displayed]

🛡️ You: How can I fix the SSH issue?

🤖 YunSeeAI: To secure SSH, you should...
[Detailed recommendations]

🛡️ You: Show me the command

🤖 YunSeeAI: Here's the command to update your SSH config...
```

### Example Use Cases

**1. Security Audit**
```
🛡️ You: Scan my system for vulnerabilities
```

**2. Configuration Check**
```
🛡️ You: Is my firewall properly configured?
```

**3. Threat Analysis**
```
🛡️ You: Analyze this suspicious log entry: [paste log]
```

**4. Security Advice**
```
🛡️ You: How do I prevent SQL injection attacks?
```

---

## 🏗️ Architecture

YunSeeAI consists of four main modules:

```
┌─────────────────────────────────────────────────────────┐
│                    User (CLI)                           │
└─────────────────────┬───────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────┐
│              AI Assistant Module                        │
│  (Natural Language Processing & Orchestration)          │
└──────┬──────────────┬──────────────┬────────────────────┘
       │              │              │
       ▼              ▼              ▼
┌──────────┐   ┌──────────┐   ┌──────────┐
│   WAF    │   │ Scanner  │   │ Auditor  │
│  Module  │   │  Module  │   │  Module  │
└──────────┘   └──────────┘   └──────────┘
```

### Module Responsibilities

- **AI Assistant**: Natural language interface, command routing, response generation
- **WAF Module**: Traffic analysis, attack detection, IP blocking
- **Scanner Module**: Port scanning, service fingerprinting, vulnerability matching
- **Auditor Module**: Configuration checks, CVE scanning, security recommendations

---

## 📁 Project Structure

```
yunsee-ai/
├── src/
│   ├── ai/
│   │   ├── ModelServer.ts        # LLM inference engine
│   │   └── AssistantService.ts   # High-level AI service
│   ├── cli/
│   │   ├── Interface.ts          # CLI user interface
│   │   └── CommandHandler.ts     # Command processing
│   ├── config/
│   │   └── default.ts            # Default configuration
│   ├── types/
│   │   └── index.ts              # TypeScript type definitions
│   └── cli.ts                    # CLI entry point
├── dist/                         # Compiled JavaScript
├── package.json
├── tsconfig.json
└── README.md
```

---

## ⚙️ Configuration

Edit `src/config/default.ts` to customize settings:

```typescript
export const DEFAULT_CONFIG = {
  ai: {
    modelPath: './your-model.gguf',
    contextSize: 4096,
    temperature: 0.7,
    maxTokens: 2048,
    // ... more options
  },
  // ... other modules
};
```

### Key Configuration Options

- **modelPath**: Path to your GGUF model file
- **contextSize**: Maximum context window (tokens)
- **temperature**: Creativity of responses (0.0-1.0)
- **maxTokens**: Maximum response length

---

## 🔧 Development

### Running in Development Mode

```bash
npm run dev
```

### Building for Production

```bash
npm run build
```

### Project Commands

```bash
npm run build      # Compile TypeScript to JavaScript
npm run dev        # Run in development mode with ts-node
npm start          # Run compiled version
npm run clean      # Remove dist/ directory
```

---

## 🛠️ Troubleshooting

### Model Not Loading

**Error**: `Model file not found`

**Solution**: 
1. Ensure the GGUF model file is in the project root
2. Check the filename matches configuration
3. Verify file is not corrupted

### Out of Memory

**Error**: `JavaScript heap out of memory`

**Solution**:
```bash
export NODE_OPTIONS="--max-old-space-size=8192"
npm start
```

### Slow Inference

**Issue**: AI responses are slow

**Solutions**:
- Use a smaller/quantized model (Q4, Q5)
- Reduce `contextSize` in configuration
- Increase CPU threads in config
- Consider GPU acceleration (requires additional setup)

---

## 📚 Documentation

- [Installation Guide](docs/INSTALL.md) - Detailed setup instructions
- [User Guide](docs/USAGE.md) - Comprehensive usage examples
- [API Documentation](docs/API.md) - Module APIs and integration
- [Contributing Guide](CONTRIBUTING.md) - How to contribute

---

## 🤝 Contributing

We welcome contributions! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for details.

### Ways to Contribute

- 🐛 Report bugs
- 💡 Suggest features
- 📝 Improve documentation
- 🔧 Submit pull requests
- ⭐ Star the project

---

## 📄 License

This project is licensed under the MIT License - see [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- **llama.cpp** - Efficient LLM inference
- **Node.js** community - Excellent ecosystem
- **Open-source AI models** - Making AI accessible

---

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/yourusername/yunsee-ai/issues)
- **Discussions**: [GitHub Discussions](https://github.com/yourusername/yunsee-ai/discussions)
- **Email**: support@yunsee-ai.com

---

## 🗺️ Roadmap

### Phase 1: Foundation (Current)
- ✅ AI Assistant Module
- ✅ CLI Interface
- ✅ Local LLM Integration

### Phase 2: Core Security (In Progress)
- ⏳ WAF Module
- ⏳ Security Audit Module
- ⏳ Basic Vulnerability Scanner

### Phase 3: Advanced Features (Planned)
- 📋 Asset Discovery Module
- 📋 Automated Remediation
- 📋 Web Dashboard
- 📋 Plugin System

### Phase 4: Enterprise (Future)
- 📋 Multi-server Management
- 📋 Custom Model Training
- 📋 API Gateway
- 📋 Integration Hub

---

<div align="center">

**Made with ❤️ by the YunSeeAI Team**

[⬆ Back to Top](#yunseeai---ai-powered-security-assistant)

</div>


