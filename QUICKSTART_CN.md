# YunSeeAI 快速入门指南

## 🎯 5分钟上手

本指南将帮助你在5分钟内开始使用YunSeeAI。

---

## ✅ 前置检查

### 1. 确认环境

**检查Node.js版本**:
```bash
node --version
```

应该显示 `v18.0.0` 或更高版本。

### 2. 确认文件

确保以下文件存在：

```
✓ package.json
✓ tsconfig.json
✓ src/ 目录
✓ DeepSeek-R1-0528-Qwen3-8B-Q4_K_M.gguf（约4.7GB）
```

---

## 🚀 启动步骤

### 步骤1：安装依赖（已完成✅）

```bash
npm install
```

### 步骤2：编译项目（已完成✅）

```bash
npm run build
```

### 步骤3：启动YunSeeAI

**选择以下任一方式**：

#### 方式A：直接启动
```bash
npm start
```

#### 方式B：使用批处理（Windows）
双击运行 `start.bat`

#### 方式C：开发模式
```bash
npm run dev
```

---

## 👋 首次使用

### 启动后你会看到：

```
✔ Initializing YunSeeAI...
✔ Loading AI model (this may take a minute)...
✔ AI model loaded successfully

╔══════════════════════════════════════════════════════════════╗
║              YunSeeAI - AI Security Assistant               ║
╚══════════════════════════════════════════════════════════════╝

Welcome to YunSeeAI - Your intelligent security companion

Type /help for commands or just chat naturally
Press Ctrl+C or type exit to quit
```

**注意**：首次启动可能需要1-2分钟加载模型，请耐心等待。

---

## 💬 试试这些命令

### 1. 查看帮助
```
🛡️ You: /help
```

### 2. 问候AI
```
🛡️ You: hello

🤖 YunSeeAI: Hello! I'm YunSeeAI, your AI security assistant...
```

### 3. 检查系统状态
```
🛡️ You: /status
```

### 4. 提问安全问题
```
🛡️ You: How do I secure my SSH server?

🤖 YunSeeAI: To secure SSH, follow these steps:
1. Disable password authentication...
```

### 5. 清除历史
```
🛡️ You: /clear
```

### 6. 退出程序
```
🛡️ You: exit
```

或按 `Ctrl+C`

---

## 📖 使用技巧

### ✨ 自然对话

你不需要记住特定命令，直接像聊天一样输入即可：

```
🛡️ You: 检查服务器安全

🛡️ You: 扫描漏洞

🛡️ You: 如何防止SQL注入？

🛡️ You: 分析这个日志文件
```

### 🔄 上下文理解

AI会记住对话上下文：

```
🛡️ You: 扫描我的系统

🤖 YunSeeAI: [显示扫描结果]

🛡️ You: 修复最严重的问题

🤖 YunSeeAI: [针对刚才扫描结果提供修复建议]

🛡️ You: 给我具体命令

🤖 YunSeeAI: [提供可执行的命令]
```

### ⚡ 快捷操作

| 操作 | 快捷方式 |
|------|---------|
| 退出 | `Ctrl+C` 或输入 `exit` |
| 清屏 | `Ctrl+L`（终端原生） |
| 查看历史 | `/history` |
| 清除对话 | `/clear` |

---

## ⚙️ 性能优化

### 8GB内存系统

编辑 `src/config/default.ts`:

```typescript
ai: {
  contextSize: 2048,  // 从4096减少
  threads: 2,         // 从4减少
}
```

### 16GB+内存系统

可以使用默认设置，或提高性能：

```typescript
ai: {
  contextSize: 8192,  // 增加上下文
  threads: 8,         // 增加线程
}
```

修改后重新编译：
```bash
npm run build
npm start
```

---

## ❓ 常见问题

### Q1: 模型加载失败

**错误**: `Model file not found`

**解决**:
检查模型文件名和路径：
```bash
ls -l DeepSeek-R1-0528-Qwen3-8B-Q4_K_M.gguf
```

### Q2: 启动很慢

**正常现象**：首次加载4.7GB模型需要1-2分钟

**如果超过5分钟**：
1. 检查内存是否充足（至少8GB）
2. 关闭其他占用内存的程序
3. 尝试重启

### Q3: 响应缓慢

每次响应需要5-30秒是正常的（取决于CPU性能）。

**加速方法**：
1. 使用更少的线程减少上下文切换
2. 降低 `contextSize`
3. 使用更小的量化模型

### Q4: 内存溢出

```bash
# Windows PowerShell
$env:NODE_OPTIONS="--max-old-space-size=8192"
npm start

# Linux/Mac
export NODE_OPTIONS="--max-old-space-size=8192"
npm start
```

---

## 📚 下一步

现在你已经成功运行YunSeeAI了！继续探索：

1. **阅读使用指南**: [docs/USAGE.md](docs/USAGE.md)
2. **了解架构**: [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)
3. **查看配置选项**: [docs/SETUP.md](docs/SETUP.md)
4. **参与贡献**: [CONTRIBUTING.md](CONTRIBUTING.md)

---

## 🎓 学习资源

### 命令参考

查看 [docs/USAGE.md](docs/USAGE.md) 了解所有命令和用法示例。

### 实际案例

```
🛡️ You: 我想保护我的Web服务器

🤖 YunSeeAI: 让我帮你进行安全审计...
[一步步指导加固过程]
```

### 互动学习

```
🛡️ You: 教我关于XSS攻击

🤖 YunSeeAI: [详细解释XSS攻击原理、示例和防护]

🛡️ You: 给我一个实际例子

🤖 YunSeeAI: [提供代码示例和防护措施]
```

---

## 🆘 获取帮助

如果遇到问题：

1. **查看文档**: 先阅读 [docs/](docs/) 目录下的文档
2. **搜索Issues**: [GitHub Issues](https://github.com/yourusername/yunsee-ai/issues)
3. **提问**: [GitHub Discussions](https://github.com/yourusername/yunsee-ai/discussions)

---

## ✨ 提示

- **耐心等待**：模型加载需要时间
- **自然对话**：像跟人聊天一样输入
- **善用上下文**：AI会记住对话内容
- **经常清理**：对话过长时用 `/clear` 清除历史
- **查看状态**：用 `/status` 监控资源使用

---

**祝你使用愉快！** 🛡️

有任何问题随时在CLI中问AI或查看文档。


