# YunSeeAI Setup Guide

This guide will walk you through the complete setup process for YunSeeAI.

## Table of Contents

1. [System Requirements](#system-requirements)
2. [Installation Steps](#installation-steps)
3. [Model Selection](#model-selection)
4. [Configuration](#configuration)
5. [Verification](#verification)
6. [Troubleshooting](#troubleshooting)

---

## System Requirements

### Minimum Requirements

- **CPU**: 4 cores (x64 architecture)
- **RAM**: 8 GB
- **Disk Space**: 10 GB free space
- **Operating System**: 
  - Windows 10/11
  - macOS 10.15+
  - Linux (Ubuntu 20.04+, Debian 11+, or equivalent)
- **Node.js**: Version 18.0.0 or higher

### Recommended Requirements

- **CPU**: 8+ cores with AVX2 support
- **RAM**: 16 GB or more
- **Disk Space**: 20 GB+ (for models and logs)
- **GPU**: Optional, but speeds up inference significantly

---

## Installation Steps

### 1. Install Node.js

#### Windows

Download from [nodejs.org](https://nodejs.org/) and run the installer.

Verify installation:
```powershell
node --version
npm --version
```

#### macOS

Using Homebrew:
```bash
brew install node@18
```

#### Linux (Ubuntu/Debian)

```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
```

### 2. Clone the Repository

```bash
git clone https://github.com/yourusername/yunsee-ai.git
cd yunsee-ai
```

### 3. Install Dependencies

```bash
npm install
```

This will install all required packages including:
- `node-llama-cpp` - LLM inference engine
- `inquirer` - Interactive CLI
- `chalk` - Terminal styling
- `commander` - Command parsing
- And others...

**Note**: The installation may take 5-10 minutes as it compiles native modules.

### 4. Download AI Model

YunSeeAI requires a GGUF format model file. Several options are available:

#### Option A: Recommended Model (DeepSeek)

```bash
# Download using wget (Linux/macOS)
wget https://huggingface.co/deepseek-ai/DeepSeek-R1-Distill-Qwen-7B-GGUF/resolve/main/DeepSeek-R1-0528-Qwen3-8B-Q4_K_M.gguf

# Or using curl
curl -L -o DeepSeek-R1-0528-Qwen3-8B-Q4_K_M.gguf \
  https://huggingface.co/deepseek-ai/DeepSeek-R1-Distill-Qwen-7B-GGUF/resolve/main/DeepSeek-R1-0528-Qwen3-8B-Q4_K_M.gguf
```

#### Option B: Alternative Models

Visit [Hugging Face](https://huggingface.co/models?library=gguf) and search for:
- **LLaMA 2 7B** (good balance)
- **Mistral 7B** (fast)
- **Qwen 7B** (multilingual)

Download and place in project root.

### 5. Build the Project

```bash
npm run build
```

This compiles TypeScript to JavaScript in the `dist/` directory.

---

## Model Selection

### Understanding GGUF Models

GGUF (GPT-Generated Unified Format) is an efficient model format supporting:
- Quantization (reduced memory usage)
- Fast inference
- Cross-platform compatibility

### Quantization Levels

| Quantization | Size | RAM Required | Quality | Speed |
|--------------|------|--------------|---------|-------|
| Q2_K | ~3 GB | 4 GB | Low | Very Fast |
| Q4_K_M | ~4 GB | 6 GB | Good | Fast |
| Q5_K_M | ~5 GB | 8 GB | Very Good | Moderate |
| Q8_0 | ~7 GB | 10 GB | Excellent | Slow |
| F16 | ~14 GB | 16 GB | Best | Very Slow |

**Recommendation**: Q4_K_M provides the best balance for most users.

### Model Size Guidelines

**For 8 GB RAM**:
- Use 7B parameter models with Q4 quantization
- Maximum model file size: ~4 GB

**For 16 GB RAM**:
- Use 7B-13B parameter models with Q5/Q8 quantization
- Maximum model file size: ~8 GB

**For 32 GB+ RAM**:
- Use 13B+ parameter models with Q8/F16 quantization
- Can run larger models

---

## Configuration

### Basic Configuration

Edit `src/config/default.ts`:

```typescript
export const DEFAULT_CONFIG = {
  ai: {
    // Path to your model file
    modelPath: path.join(process.cwd(), 'your-model-name.gguf'),
    
    // Context window size (adjust based on RAM)
    contextSize: 4096,  // Reduce to 2048 for 8GB RAM
    
    // Response creativity (0.0 = deterministic, 1.0 = creative)
    temperature: 0.7,
    
    // Maximum response length
    maxTokens: 2048,
    
    // CPU threads (set to your CPU core count)
    threads: 4,
  },
};
```

### Advanced Configuration

**For Low-Memory Systems** (8 GB RAM):

```typescript
ai: {
  modelPath: './model-q4.gguf',
  contextSize: 2048,
  temperature: 0.7,
  maxTokens: 1024,
  threads: 2,
}
```

**For High-Performance Systems** (16+ GB RAM):

```typescript
ai: {
  modelPath: './model-q8.gguf',
  contextSize: 8192,
  temperature: 0.8,
  maxTokens: 4096,
  threads: 8,
}
```

### Environment Variables

Create a `.env` file (optional):

```bash
# Model configuration
MODEL_PATH=./DeepSeek-R1-0528-Qwen3-8B-Q4_K_M.gguf
MODEL_CONTEXT_SIZE=4096
MODEL_THREADS=4

# Logging
LOG_LEVEL=info
LOG_FILE=./logs/yunsee.log

# Features
ENABLE_WAF=false
WAF_PORT=8080
```

---

## Verification

### 1. Test Installation

```bash
npm start
```

You should see:

```
✔ Initializing YunSeeAI...
✔ Loading AI model (this may take a minute)...
✔ AI model loaded successfully

╔══════════════════════════════════════════════════════════════╗
║              YunSeeAI - AI Security Assistant               ║
╚══════════════════════════════════════════════════════════════╝
```

### 2. Test AI Response

Type in the CLI:

```
🛡️ You: hello
```

You should get an AI response.

### 3. Check System Status

```
🛡️ You: /status
```

Verify all modules show correct status.

### 4. Test Commands

```
🛡️ You: /help
```

Ensure all commands are listed.

---

## Troubleshooting

### Issue: "Model file not found"

**Cause**: Model file path is incorrect

**Solution**:
1. Verify file exists: `ls -lh *.gguf` (Linux/macOS) or `dir *.gguf` (Windows)
2. Check filename matches configuration
3. Use absolute path in config if needed

### Issue: "JavaScript heap out of memory"

**Cause**: Node.js default memory limit exceeded

**Solution**:

**Linux/macOS**:
```bash
export NODE_OPTIONS="--max-old-space-size=8192"
npm start
```

**Windows (PowerShell)**:
```powershell
$env:NODE_OPTIONS="--max-old-space-size=8192"
npm start
```

Or add to `package.json`:
```json
"scripts": {
  "start": "node --max-old-space-size=8192 dist/cli.js"
}
```

### Issue: "Cannot find module 'node-llama-cpp'"

**Cause**: Native module compilation failed

**Solution**:

1. Install build tools:

**Windows**:
```powershell
npm install --global windows-build-tools
```

**Linux**:
```bash
sudo apt-get install build-essential python3
```

**macOS**:
```bash
xcode-select --install
```

2. Rebuild modules:
```bash
npm rebuild
```

### Issue: Slow inference (>30 seconds per response)

**Causes & Solutions**:

1. **Model too large**: Use a smaller quantized model (Q4 instead of Q8)
2. **Not enough threads**: Increase `threads` in config
3. **Context too large**: Reduce `contextSize` to 2048 or 1024
4. **Swap memory usage**: Close other applications

### Issue: Low-quality responses

**Solutions**:

1. **Use better model**: Upgrade from Q2 to Q4/Q5
2. **Increase temperature**: Set to 0.8-0.9 for more creativity
3. **Better prompts**: Be more specific in questions
4. **Check context**: Use `/clear` to reset if context is polluted

### Issue: Port already in use (WAF module)

**Solution**:

Change WAF port in config:
```typescript
waf: {
  port: 8081,  // Or any available port
}
```

---

## Next Steps

After successful setup:

1. **Read the User Guide**: `docs/USAGE.md`
2. **Explore Commands**: Type `/help` in CLI
3. **Try Examples**: See README for use cases
4. **Configure Modules**: Enable WAF, Scanner, etc.

---

## Getting Help

If you encounter issues not covered here:

1. Check [GitHub Issues](https://github.com/yourusername/yunsee-ai/issues)
2. Read [FAQ](docs/FAQ.md)
3. Join [Discussions](https://github.com/yourusername/yunsee-ai/discussions)
4. Contact support: support@yunsee-ai.com

---

**Congratulations! You're ready to use YunSeeAI.** 🎉

Start exploring with: `npm start`


