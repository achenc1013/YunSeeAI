# Changelog

All notable changes to YunSeeAI will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [1.0.1] - 2025-11-03

### Fixed
- **Model Loading**: Fixed "unknown model architecture: 'qwen3'" error
  - Updated `node-llama-cpp` to v3.14.2
  - Updated API calls to use new node-llama-cpp v3 syntax
  - Now supports qwen3, qwen2, llama, mistral, and other architectures

- **Module System**: Fixed ESM/CommonJS compatibility issues
  - Migrated from CommonJS to ESM modules
  - Added `.js` extensions to all import statements
  - Updated `package.json` with `"type": "module"`
  - Updated `tsconfig.json` to target ES2020 modules

### Changed
- **ModelServer.ts**: Updated to use new node-llama-cpp v3 API
  - `new LlamaModel()` → `llama.loadModel()`
  - `new LlamaContext()` → `model.createContext()`
  - `new LlamaChatSession({ context })` → `new LlamaChatSession({ contextSequence })`
  - Added proper `getLlama()` initialization

### Documentation
- Added comprehensive `TROUBLESHOOTING.md` guide
- Created `CHANGELOG.md` to track version history
- Updated README with latest installation instructions

---

## [1.0.0] - 2025-11-03

### Added
- **AI Assistant Module**
  - Natural language command-line interface
  - Conversational AI powered by local LLM models
  - Context-aware dialogue system
  - Streaming response support

- **Model Server**
  - GGUF model loading support
  - Configurable inference parameters (temperature, top-p, top-k)
  - Context window management (4096 tokens default)
  - Multi-threaded CPU inference

- **CLI Interface**
  - Interactive terminal UI with colored output
  - Built-in commands: `/help`, `/status`, `/clear`, `/history`, `/reset`, `/exit`
  - Real-time streaming responses
  - Loading animations and status indicators

- **Configuration System**
  - Type-safe configuration with TypeScript
  - Customizable AI parameters
  - English system prompts for compatibility
  - Module-specific settings

- **Documentation**
  - Comprehensive README (English and Chinese)
  - Installation guide (SETUP.md)
  - Usage guide with examples (USAGE.md)
  - Architecture documentation (ARCHITECTURE.md)
  - Quick start guide (QUICKSTART_CN.md)
  - Contributing guidelines (CONTRIBUTING.md)

### Technical Details
- **Language**: TypeScript 5.3.3
- **Runtime**: Node.js >= 18.0.0
- **Module System**: ES2020 (ESM)
- **AI Engine**: node-llama-cpp with llama.cpp backend
- **Supported Models**: GGUF format (LLaMA, Mistral, Qwen, etc.)
- **Dependencies**: 
  - inquirer 8.2.6 (CLI interaction)
  - chalk 4.1.2 (terminal colors)
  - ora 5.4.1 (loading spinners)
  - node-llama-cpp 3.14.2 (LLM inference)

### Project Structure
```
yunsee-ai/
├── src/
│   ├── ai/           # AI model and service logic
│   ├── cli/          # Command-line interface
│   ├── config/       # Configuration files
│   └── types/        # TypeScript type definitions
├── docs/             # Documentation
├── dist/             # Compiled JavaScript
└── README.md         # Project documentation
```

### Supported Platforms
- Windows 10/11
- macOS 10.15+
- Linux (Ubuntu 20.04+, Debian 11+)

### Known Limitations
- WAF module not yet implemented (planned for v1.1.0)
- Scanner module not yet implemented (planned for v1.1.0)
- Auditor module not yet implemented (planned for v1.1.0)
- CPU-only inference (GPU support planned)
- No web UI yet (CLI only)

---

## [Unreleased]

### Planned for v1.1.0
- [ ] Web Application Firewall (WAF) module
- [ ] Port and vulnerability scanner
- [ ] Security configuration auditor
- [ ] Automated security reports
- [ ] Integration with Nmap
- [ ] CVE database integration

### Planned for v1.2.0
- [ ] Web dashboard interface
- [ ] Multi-server management
- [ ] Plugin system
- [ ] Custom model fine-tuning support
- [ ] API gateway for integrations

### Planned for v2.0.0
- [ ] GPU acceleration support
- [ ] Distributed scanning
- [ ] Real-time threat intelligence
- [ ] Machine learning-based anomaly detection
- [ ] Enterprise features

---

## Version History

- **v1.0.1** (2025-11-03) - Bug fixes and model compatibility
- **v1.0.0** (2025-11-03) - Initial release with AI assistant and CLI

---

## How to Upgrade

### From v1.0.0 to v1.0.1

```bash
# Pull latest changes
git pull origin main

# Update dependencies
npm install node-llama-cpp@latest

# Rebuild
npm run clean
npm run build

# Start
npm start
```

### Breaking Changes

None in v1.0.1 - fully backward compatible with v1.0.0.

---

## Migration Guide

### Upgrading node-llama-cpp

If you customized `ModelServer.ts`, update your code:

**Old API (v2.x)**:
```typescript
this.model = new LlamaModel({ modelPath });
this.context = new LlamaContext({ model, contextSize });
this.session = new LlamaChatSession({ context });
```

**New API (v3.x)**:
```typescript
const llama = await getLlama();
this.model = await llama.loadModel({ modelPath });
this.context = await this.model.createContext({ contextSize });
this.session = new LlamaChatSession({ 
  contextSequence: this.context.getSequence() 
});
```

---

## Support

For issues or questions about specific versions:
- [GitHub Issues](https://github.com/yourusername/yunsee-ai/issues)
- [Release Notes](https://github.com/yourusername/yunsee-ai/releases)
- [Discussions](https://github.com/yourusername/yunsee-ai/discussions)

---

**Maintained by**: YunSeeAI Team
**License**: MIT


