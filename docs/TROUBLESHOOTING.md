# YunSeeAI Troubleshooting Guide

Common issues and solutions for YunSeeAI.

---

## Table of Contents

1. [Model Loading Issues](#model-loading-issues)
2. [Module System Errors](#module-system-errors)
3. [Memory Issues](#memory-issues)
4. [Performance Problems](#performance-problems)
5. [Installation Issues](#installation-issues)

---

## Model Loading Issues

### Error: "unknown model architecture: 'qwen3'"

**Problem**: The model uses a newer architecture not supported by older versions of llama.cpp.

**Solution**:

1. **Update node-llama-cpp**:
   ```bash
   npm install node-llama-cpp@latest
   npm run build
   npm start
   ```

2. **Use a compatible model**:
   - LLaMA 2 (7B, 13B)
   - Mistral 7B
   - Qwen 1.5 / Qwen 2
   - Any GGUF model with llama, mistral, or qwen2 architecture

**Model Compatibility**:
```
✅ Supported Architectures:
- llama (LLaMA 1/2/3)
- mistral
- qwen2
- qwen3 (requires node-llama-cpp >= 3.14.0)
- phi
- gemma

❌ May Not Be Supported:
- Very new architectures (update node-llama-cpp)
- Custom architectures
```

### Error: "Model file not found"

**Problem**: The model file path is incorrect or file doesn't exist.

**Solutions**:

1. **Check file exists**:
   ```bash
   # Windows PowerShell
   Test-Path "DeepSeek-R1-0528-Qwen3-8B-Q4_K_M.gguf"
   
   # Linux/Mac
   ls -lh *.gguf
   ```

2. **Verify path in config**:
   Edit `src/config/default.ts`:
   ```typescript
   ai: {
     modelPath: path.resolve(process.cwd(), 'YOUR_MODEL_NAME.gguf'),
   }
   ```

3. **Use absolute path**:
   ```typescript
   ai: {
     modelPath: 'C:\\Users\\YourName\\models\\model.gguf',
   }
   ```

### Error: "Failed to load model" (generic)

**Possible causes**:

1. **Corrupted download**: Re-download the model
2. **Insufficient memory**: Close other applications
3. **Wrong file format**: Ensure it's a `.gguf` file (not `.bin`, `.pth`, etc.)
4. **File permissions**: Check read permissions on the model file

**Debug steps**:

```bash
# Check file size (should be several GB)
ls -lh your-model.gguf

# Check file type
file your-model.gguf

# Try with smaller model first
# Download a 3B or 7B model to test
```

---

## Module System Errors

### Error: "ERR_REQUIRE_ASYNC_MODULE"

**Problem**: Mixing CommonJS and ESM modules.

**Full error**:
```
Error [ERR_REQUIRE_ASYNC_MODULE]: require() cannot be used on an ESM graph with top-level await
```

**Solution**:

This was fixed in v1.0.0. If you still see it:

1. **Ensure package.json has**:
   ```json
   {
     "type": "module"
   }
   ```

2. **Check tsconfig.json**:
   ```json
   {
     "compilerOptions": {
       "module": "ES2020",
       "moduleResolution": "bundler"
     }
   }
   ```

3. **All imports must use .js extension**:
   ```typescript
   import { ModelServer } from './ModelServer.js'; // ✅ Correct
   import { ModelServer } from './ModelServer';    // ❌ Wrong in ESM
   ```

4. **Rebuild**:
   ```bash
   npm run clean
   npm run build
   npm start
   ```

### Error: "Cannot find module"

**Problem**: Import paths are incorrect.

**Solutions**:

1. **Ensure .js extensions in imports**
2. **Check file exists in src/**
3. **Rebuild project**: `npm run build`
4. **Clear node_modules and reinstall**:
   ```bash
   rm -rf node_modules package-lock.json
   npm install
   ```

---

## Memory Issues

### Error: "JavaScript heap out of memory"

**Problem**: Node.js default memory limit exceeded (usually ~2GB).

**Solution**:

**Windows (PowerShell)**:
```powershell
$env:NODE_OPTIONS="--max-old-space-size=8192"
npm start
```

**Linux/Mac**:
```bash
export NODE_OPTIONS="--max-old-space-size=8192"
npm start
```

**Permanent fix** - Add to package.json:
```json
{
  "scripts": {
    "start": "node --max-old-space-size=8192 dist/cli.js"
  }
}
```

### System Freezing / Swapping

**Problem**: Not enough physical RAM, system using swap.

**Symptoms**:
- System very slow
- High disk activity
- Response time > 60 seconds

**Solutions**:

1. **Use smaller model**:
   - Q4_K_M instead of Q8
   - 7B instead of 13B
   - Reduce context size in config

2. **Reduce context size**:
   ```typescript
   // src/config/default.ts
   ai: {
     contextSize: 2048, // Down from 4096
   }
   ```

3. **Close other applications**

4. **Upgrade RAM** (8GB minimum, 16GB recommended)

### Model Loading Takes Forever

**Problem**: First load is slow due to memory mapping.

**Normal behavior**:
- First load: 1-3 minutes (loading to RAM)
- Subsequent uses: Faster

**Speed it up**:
1. Use SSD instead of HDD
2. Reduce model size (use Q4 instead of Q8)
3. Increase RAM
4. Close background applications

---

## Performance Problems

### Slow Response Times (> 30 seconds)

**Solutions**:

1. **Reduce context size**:
   ```typescript
   contextSize: 2048 // or even 1024
   ```

2. **Use fewer threads** (counter-intuitive but can help):
   ```typescript
   threads: 2 // instead of 4 or 8
   ```

3. **Use smaller quantization**:
   - Q4_K_M (faster, slightly lower quality)
   - Q5_K_M (balanced)
   - Q8 (slower, better quality)

4. **Reduce max tokens**:
   ```typescript
   maxTokens: 1024 // instead of 2048
   ```

5. **Lower temperature** (less creative, faster):
   ```typescript
   temperature: 0.5 // instead of 0.7
   ```

### CPU Usage 100%

**Normal during inference**. AI models are CPU-intensive.

**Reduce CPU usage**:
```typescript
threads: 2, // Reduce from 4 or 8
```

### GPU Not Being Used

**Current limitation**: node-llama-cpp CPU-only by default.

**GPU acceleration** (advanced):
1. Build llama.cpp with CUDA/Metal support
2. Use custom build of node-llama-cpp
3. See: [node-llama-cpp GPU docs](https://github.com/withcatai/node-llama-cpp)

---

## Installation Issues

### "npm install" Fails

**Problem**: Native module compilation issues.

**Solutions**:

**Windows**:
```powershell
npm install --global windows-build-tools
npm install
```

**Linux (Ubuntu/Debian)**:
```bash
sudo apt update
sudo apt install build-essential python3
npm install
```

**macOS**:
```bash
xcode-select --install
npm install
```

### TypeScript Compilation Errors

**Problem**: Type mismatches after updates.

**Solution**:

1. **Clean and rebuild**:
   ```bash
   npm run clean
   rm -rf node_modules package-lock.json
   npm install
   npm run build
   ```

2. **Check TypeScript version**:
   ```bash
   npx tsc --version
   # Should be 5.3.3 or higher
   ```

3. **Update dependencies**:
   ```bash
   npm update
   npm run build
   ```

### node-llama-cpp Installation Fails

**Problem**: Binary download or compilation fails.

**Solutions**:

1. **Use pre-built binaries**:
   ```bash
   npm install node-llama-cpp --ignore-scripts=false
   ```

2. **Manual build** (if pre-built unavailable):
   - Requires CMake, C++ compiler
   - See [node-llama-cpp build guide](https://github.com/withcatai/node-llama-cpp)

3. **Try older version**:
   ```bash
   npm install node-llama-cpp@3.0.0
   ```

---

## Runtime Issues

### CLI Not Responding

**Problem**: Stuck at prompt, no response.

**Possible causes**:

1. **Model still loading**: Wait 1-2 minutes
2. **Hung process**: Check with Ctrl+C, restart
3. **Context overflow**: Use `/clear` command

**Debug**:
```bash
# Check if process is running
# Windows
tasklist | findstr node

# Linux/Mac
ps aux | grep node

# Kill if hung
# Windows
taskkill /F /IM node.exe

# Linux/Mac
pkill -9 node
```

### Responses Are Gibberish

**Problem**: Model outputs random characters or wrong language.

**Solutions**:

1. **Wrong model format**: Ensure it's a chat-tuned model
2. **Corrupted model**: Re-download
3. **Wrong prompt format**: Check system prompt
4. **Temperature too high**: Lower to 0.7 or less

### Context Window Full

**Message**: "Context nearly full - consider /clear"

**Solutions**:

1. **Clear history**: Type `/clear`
2. **Increase context size** (if you have RAM):
   ```typescript
   contextSize: 8192 // instead of 4096
   ```
3. **Auto-trimming**: Implemented in AssistantService

---

## Getting More Help

### Enable Debug Logging

```bash
# Set environment variable
export DEBUG=yunsee:*
npm start
```

### Check Logs

```bash
# Look for error details
npm start 2>&1 | tee yunsee.log
```

### System Information

Collect this info when reporting issues:

```bash
# Node.js version
node --version

# npm version
npm --version

# OS info
# Windows
systeminfo | findstr /B /C:"OS Name" /C:"OS Version"

# Linux
uname -a
cat /etc/os-release

# macOS
sw_vers

# Memory
# Windows
systeminfo | findstr /C:"Total Physical Memory"

# Linux
free -h

# macOS
sysctl hw.memsize
```

### Reporting Issues

When reporting issues on GitHub, include:

1. **Error message** (full text)
2. **System info** (OS, RAM, Node version)
3. **Model info** (name, size, source)
4. **Steps to reproduce**
5. **Config file** (sanitized)

---

## Quick Fixes Checklist

Before asking for help, try:

- [ ] Restart the application
- [ ] Clear conversation: `/clear`
- [ ] Rebuild: `npm run build`
- [ ] Update: `npm install node-llama-cpp@latest`
- [ ] Check RAM usage (Task Manager / htop)
- [ ] Try smaller model
- [ ] Reduce context size
- [ ] Close other applications
- [ ] Check model file integrity
- [ ] Read error message carefully

---

## Known Issues

### Issue: Path with Special Characters (Windows)

**Problem**: Paths with Chinese/special characters may fail.

**Workaround**: Move project to simple path like `C:\yunsee-ai\`

### Issue: Antivirus Blocking

**Problem**: Antivirus quarantines node-llama-cpp binaries.

**Solution**: Add exception for project folder

### Issue: Windows Defender High CPU

**Problem**: Defender scans model file repeatedly.

**Solution**: Exclude model directory from real-time scanning

---

## Advanced Troubleshooting

### Trace Model Loading

```typescript
// Add to ModelServer.ts
console.log('Loading model from:', this.config.modelPath);
console.log('File exists:', existsSync(this.config.modelPath));
console.log('File size:', statSync(this.config.modelPath).size);
```

### Profile Performance

```bash
# Run with profiler
node --prof dist/cli.js

# Analyze
node --prof-process isolate-*.log > profile.txt
```

### Memory Profiling

```bash
# Track memory usage
node --trace-gc dist/cli.js
```

---

**Last Updated**: 2025-11-03
**Version**: 1.0.1

For more help, visit:
- [GitHub Issues](https://github.com/yourusername/yunsee-ai/issues)
- [Discussions](https://github.com/yourusername/yunsee-ai/discussions)


