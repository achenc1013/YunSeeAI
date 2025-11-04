# YunSeeAI - AI驱动的安全助手

<div align="center">

![YunSeeAI Logo](https://img.shields.io/badge/YunSeeAI-v1.0.0-blue)
![Node.js](https://img.shields.io/badge/Node.js-%3E%3D18.0.0-green)
![TypeScript](https://img.shields.io/badge/TypeScript-5.3.3-blue)
![License](https://img.shields.io/badge/License-MIT-yellow)

**基于本地AI模型的智能开源安全助手**

</div>

---

## 🌟 项目概述

YunSeeAI是一个面向个人开发者的创新开源网络安全项目。它结合人工智能技术，提供从威胁检测到漏洞修复建议的一站式安全解决方案。

### 核心特点

- 🤖 **本地AI处理** - 完全离线运行，使用本地大语言模型
- 🛡️ **自然语言界面** - 通过对话式CLI控制安全工具
- 🔒 **智能WAF** - AI驱动的Web应用防火墙（即将推出）
- 🔍 **漏洞扫描器** - 自动化安全审计和CVE检测（即将推出）
- 🌐 **资产发现** - 端口扫描和服务指纹识别（即将推出）
- 🎯 **完全本地化** - 无需云服务，完全隐私可控

---

## 📋 功能模块

### 1. AI助手模块（✅ 已实现）
- **自然语言CLI** - 交互式命令行界面
- **上下文感知对话** - 理解后续问题
- **本地LLM集成** - 使用GGUF格式模型（llama.cpp）
- **智能命令路由** - 自动分发任务到相应模块

### 2. Web应用防火墙（即将推出）
- 实时流量监控
- 基于机器学习的攻击检测
- 动态IP封禁
- 低误报率

### 3. 安全审计模块（即将推出）
- SSH配置检查
- 防火墙状态验证
- CVE漏洞扫描
- 配置加固建议

### 4. 资产发现模块（即将推出）
- 端口扫描（Nmap集成）
- 服务指纹识别
- Web框架检测
- 漏洞匹配

---

## 🚀 快速开始

### 环境要求

- **Node.js** >= 18.0.0
- **内存** >= 8GB（推荐16GB）
- **操作系统**: Windows 10/11, macOS, Linux

### 安装步骤

项目已经完成初始化！接下来只需：

#### 1. 确认模型文件

模型文件已存在：
```
YunSee(deepseek).gguf (约4.7GB)
```

#### 2. 启动应用

**方式一：使用npm**
```bash
npm start
```

**方式二：使用批处理文件（Windows）**
```bash
start.bat
```

**方式三：开发模式**
```bash
npm run dev
```

---

## 💡 使用示例

### 启动界面

```
╔══════════════════════════════════════════════════════════════╗
║              YunSeeAI - AI安全助手                          ║
╚══════════════════════════════════════════════════════════════╝

欢迎使用YunSeeAI - 你的智能安全伙伴

输入 /help 查看命令或直接自然对话
按 Ctrl+C 或输入 exit 退出
```

### 内置命令

| 命令 | 说明 |
|------|------|
| `/help` | 显示所有可用命令 |
| `/clear` | 清除对话历史 |
| `/history` | 显示对话历史 |
| `/status` | 显示系统状态 |
| `/reset` | 重置AI会话 |
| `/exit` 或 `/quit` | 退出程序 |

### 自然语言示例

直接输入自然语言，AI会理解你的意图：

```
🛡️ 你: 检查我的服务器安全配置

🤖 YunSeeAI: 我将扫描你的服务器安全配置...
[显示分析结果]

🛡️ 你: 如何修复SSH问题？

🤖 YunSeeAI: 要保护SSH，你应该...
[提供详细建议]

🛡️ 你: 给我命令

🤖 YunSeeAI: 这是更新SSH配置的命令...
```

### 常用场景

**1. 安全审计**
```
🛡️ 你: 扫描系统漏洞
```

**2. 配置检查**
```
🛡️ 你: 我的防火墙配置正确吗？
```

**3. 威胁分析**
```
🛡️ 你: 分析这个可疑的日志条目: [粘贴日志]
```

**4. 安全建议**
```
🛡️ 你: 如何防止SQL注入攻击？
```

---

## 🏗️ 项目架构

```
yunsee-ai/
├── src/
│   ├── ai/                    # AI模型服务
│   │   ├── ModelServer.ts     # LLM推理引擎
│   │   └── AssistantService.ts # AI服务接口
│   ├── cli/                   # CLI界面
│   │   ├── Interface.ts       # 用户界面
│   │   └── CommandHandler.ts  # 命令处理
│   ├── config/                # 配置文件
│   │   └── default.ts         # 默认配置
│   ├── types/                 # 类型定义
│   │   └── index.ts
│   └── cli.ts                 # CLI入口
├── dist/                      # 编译输出
├── docs/                      # 文档
│   ├── SETUP.md              # 安装指南
│   ├── USAGE.md              # 使用指南
│   └── ARCHITECTURE.md        # 架构文档
├── package.json
├── tsconfig.json
├── README.md                  # 英文文档
└── README_CN.md              # 中文文档（本文件）
```

---

## ⚙️ 配置

编辑 `src/config/default.ts` 来自定义设置：

```typescript
export const DEFAULT_CONFIG = {
  ai: {
    modelPath: './your-model.gguf',
    contextSize: 4096,        // 上下文窗口大小
    temperature: 0.7,          // 响应创造性（0.0-1.0）
    maxTokens: 2048,          // 最大响应长度
    threads: 4,               // CPU线程数
  },
  // ... 其他模块配置
};
```

### 配置建议

**8GB内存系统**:
```typescript
contextSize: 2048,
threads: 2,
```

**16GB+内存系统**:
```typescript
contextSize: 8192,
threads: 8,
```

---

## 🔧 开发

### 开发模式运行

```bash
npm run dev
```

### 构建生产版本

```bash
npm run build
```

### 项目命令

```bash
npm run build      # 编译TypeScript
npm run dev        # 开发模式运行
npm start          # 运行编译版本
npm run clean      # 清理dist目录
```

---

## 🛠️ 故障排除

### 模型未加载

**错误**: `Model file not found`

**解决**:
1. 确认GGUF模型文件在项目根目录
2. 检查文件名与配置匹配
3. 验证文件未损坏

### 内存不足

**错误**: `JavaScript heap out of memory`

**解决**:
```bash
# PowerShell
$env:NODE_OPTIONS="--max-old-space-size=8192"
npm start
```

### 推理速度慢

**问题**: AI响应缓慢

**解决方案**:
- 使用更小的量化模型（Q4、Q5）
- 减少配置中的 `contextSize`
- 增加 `threads` 数量
- 关闭其他占用内存的程序

---

## 📚 文档

- [安装指南](docs/SETUP.md) - 详细安装说明
- [使用指南](docs/USAGE.md) - 全面使用示例
- [架构文档](docs/ARCHITECTURE.md) - 技术架构详解
- [贡献指南](CONTRIBUTING.md) - 如何贡献代码

---

## 🤝 参与贡献

我们欢迎贡献！请查看 [CONTRIBUTING.md](CONTRIBUTING.md) 了解详情。

### 贡献方式

- 🐛 报告bug
- 💡 建议新功能
- 📝 改进文档
- 🔧 提交PR
- ⭐ 给项目加星

---

## 📄 许可证

本项目采用MIT许可证 - 详见 [LICENSE](LICENSE) 文件

---

## 🙏 致谢

- **llama.cpp** - 高效的LLM推理
- **Node.js** 社区 - 优秀的生态系统
- **开源AI模型** - 让AI变得可及

---

## 📞 支持

- **Issues**: [GitHub Issues](https://github.com/yourusername/yunsee-ai/issues)
- **讨论**: [GitHub Discussions](https://github.com/yourusername/yunsee-ai/discussions)

---

## 🗺️ 路线图

### 阶段1：基础（当前）
- ✅ AI助手模块
- ✅ CLI界面
- ✅ 本地LLM集成

### 阶段2：核心安全（进行中）
- ⏳ WAF模块
- ⏳ 安全审计模块
- ⏳ 基础漏洞扫描器

### 阶段3：高级功能（计划中）
- 📋 资产发现模块
- 📋 自动化修复
- 📋 Web仪表板
- 📋 插件系统

### 阶段4：企业功能（未来）
- 📋 多服务器管理
- 📋 自定义模型训练
- 📋 API网关
- 📋 集成中心

---

<div align="center">

**由YunSeeAI团队用❤️制作**

[⬆ 回到顶部](#yunseeai---ai驱动的安全助手)

</div>

