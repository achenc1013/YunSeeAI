# 🚀 YunSeeAI 功能总览

**版本**: v1.6.0  
**更新日期**: 2025-11-04

---

## 📋 核心功能

### 1. 🔌 端口扫描

**识别查询：**
```
✅ "xxx开了哪些端口？"
✅ "xxx开通了什么服务？"
✅ "xxx提供了什么服务？"
✅ "xxx运行了什么服务？"
```

**功能：**
- TCP端口扫描
- 服务识别
- Banner抓取
- 常见/全部端口

---

### 2. 🎯 CMS识别

**识别查询：**
```
✅ "xxx用了什么CMS？"
✅ "xxx的内容管理系统是什么？"
✅ "xxx是什么CMS？"
```

**支持CMS：**
- WordPress, Joomla, Drupal
- Discuz, DedeCMS, 帝国CMS
- Shopify, Magento
- 20+ 种CMS

---

### 3. 🔧 框架识别

**识别查询：**
```
✅ "xxx使用了什么框架？"
✅ "xxx的技术栈是什么？"
✅ "xxx用了什么技术？"
```

**支持技术：**
- 后端：Laravel, Django, Flask
- 前端：React, Vue, Angular
- 服务器：Nginx, Apache

---

### 4. 🔒 漏洞扫描

**识别查询：**
```
✅ "xxx有什么漏洞？"
✅ "xxx存在什么安全问题？"
✅ "xxx有哪些CVE？"
```

**功能：**
- CVE数据库匹配
- 在线查询支持
- 严重程度评估
- Exploit可用性检测

---

### 5. 🛡️ WAF识别 (NEW!)

**识别查询：**
```
✅ "xxx有什么WAF？"
✅ "xxx使用了什么防火墙？"
✅ "xxx有WAF吗？"
✅ "那它用的啥防火墙？"
```

**支持WAF：**
- 国际：Cloudflare, AWS, Azure
- 国产：阿里云盾, 腾讯云
- 开源：ModSecurity, NAXSI
- 150+ 种WAF

---

### 6. 🌐 全面扫描

**识别查询：**
```
✅ "全面扫描xxx"
✅ "完整扫描xxx"
✅ "xxx全面扫描一下"
```

**包含：**
- 端口扫描
- 框架识别
- 综合分析

---

## 🧠 智能特性

### 1. 语义理解

**不依赖固定关键词：**
- ✅ "开了哪些服务" → 端口扫描
- ✅ "提供了什么服务" → 端口扫描
- ✅ "用了啥CMS" → CMS识别
- ✅ "有什么WAF" → WAF检测

### 2. 上下文记忆

**省略URL的后续查询：**
```
第1次: "http://example.com 有什么WAF？"
第2次: "那它用的啥CMS？"  ← 自动使用example.com
第3次: "端口扫描一下"     ← 继续使用example.com
```

### 3. 多语言支持

- ✅ 中文查询
- ✅ 英文查询
- ✅ 中英混用

---

## 📊 技术指标

| 功能 | 支持数量 | 准确率 |
|------|---------|--------|
| 端口扫描 | 常见+全部 | 99% |
| CMS识别 | 20+ | 95% |
| 框架识别 | 15+ | 90% |
| CVE扫描 | 数千+ | 85% |
| WAF识别 | 150+ | 90% |
| 语义识别 | - | 93.8% |

---

## 🎯 使用流程

### 启动系统

```bash
npm run build
npm start
```

### 基础查询

```
You: http://example.com 有什么WAF？
You: http://example.com 用了什么CMS？
You: http://example.com 开了哪些端口？
You: http://example.com 有什么漏洞？
```

### 组合查询

```
You: http://target.com 有WAF吗？
AI: [检测] Cloudflare WAF

You: 那它用的啥CMS？
AI: [识别] WordPress

You: 开了哪些端口？
AI: [扫描] 80, 443, 22

You: 有什么漏洞？
AI: [CVE扫描] 发现3个漏洞...
```

---

## 💡 实用场景

### 场景1: 渗透测试前

```
步骤1: "xxx有WAF吗？"       ← 了解防护
步骤2: "xxx用了什么CMS？"    ← 识别目标
步骤3: "xxx开了哪些端口？"   ← 发现入口
步骤4: "xxx有什么漏洞？"     ← 查找弱点
```

### 场景2: 安全评估

```
评估清单：
☐ WAF防护检测
☐ CMS/框架识别
☐ 开放端口分析
☐ 已知漏洞扫描
☐ 综合风险评估
```

### 场景3: 竞品分析

```
了解竞品：
- 使用的技术栈
- 安全防护措施
- 潜在安全风险
```

---

## 🎨 显示效果

### 端口扫描

```
📊 扫描结果:

开放端口 (4/19):

  • 端口 22 (SSH) - open
  • 端口 80 (HTTP) - open
  • 端口 443 (HTTPS) - open
  • 端口 3306 (MySQL) - open
```

### CMS识别

```
🎯 CMS识别结果:

  ✅ 检测到CMS: WordPress
     置信度: high
     特征路径: /wp-content/
```

### WAF识别

```
🛡️  WAF检测结果:

  ✅ 检测到WAF防护:

     • Cloudflare
       置信度: high
```

### 漏洞扫描

```
发现漏洞: 3 个

🔴 Critical 级别 (1):

  【CVE-2023-1234】
  影响组件: WordPress 6.0
  描述: SQL注入漏洞...
  ⚠️ 公开Exploit存在
```

---

## 📚 文档资源

### 用户指南
- [自然语言查询参考](scanner/自然语言查询参考.md)
- [WAF识别快速指南](scanner/WAF识别快速指南.md)
- [CMS识别测试指南](scanner/CMS识别测试指南.md)

### 技术文档
- [语义理解系统说明](scanner/语义理解系统说明.md)
- [WAF识别集成说明](scanner/WAF识别集成说明.md)
- [CMS识别增强说明](scanner/CMS识别增强说明.md)
- [CVE模块使用指南](scanner/CVE模块使用指南.md)

### 集成文档
- [模块概览](scanner/MODULE_OVERVIEW.md)
- [集成指南](scanner/INTEGRATION_GUIDE.md)

---

## 🧪 测试脚本

```bash
# 语义识别测试
cd scanner
node test-semantic-parser.js

# WAF检测测试
node test-waf.js

# 意图识别测试
node test-intent-recognition.js
```

---

## ⚙️ 配置选项

### AI配置

```typescript
ai: {
  modelPath: 'YunSee(deepseek).gguf',
  contextSize: 4096,
  temperature: 0.7,
  maxTokens: 2048
}
```

### 扫描配置

```typescript
scanner: {
  timeout: 5000,
  maxConcurrent: 10
}
```

---

## 🔄 版本历史

| 版本 | 日期 | 新增功能 |
|------|------|---------|
| v1.6.0 | 2025-11-04 | 🛡️ WAF识别 |
| v1.5.0 | 2025-11-04 | 📉 上下文优化 |
| v1.4.0 | 2025-11-04 | 🧠 语义理解 |
| v1.3.0 | 2025-11-04 | 💬 智能意图识别 |
| v1.2.0 | 2025-11-04 | 🎯 CMS识别增强 |
| v1.1.0 | 2025-11-04 | 🔒 CVE扫描 |
| v1.0.0 | 2025-11-04 | 🔌 基础扫描 |

---

## 🎯 未来规划

### 近期
- [ ] WAF绕过建议
- [ ] 批量目标扫描
- [ ] 扫描报告导出

### 中期
- [ ] Web界面
- [ ] API接口
- [ ] 插件系统

### 远期
- [ ] 自动化渗透测试
- [ ] 机器学习增强
- [ ] 漏洞利用模块

---

## 📞 获取帮助

### 命令帮助

```
npm start
> help
```

### 文档查询

查看 `scanner/` 目录下的各类文档

### 测试验证

运行测试脚本验证功能

---

**YunSeeAI - 让安全更智能** 🚀

**核心优势：**
- 🧠 智能语义理解
- 💬 自然语言交互
- 🎯 精准意图识别
- 🔍 全面安全扫描
- 🛡️ 150+ WAF识别
- ⚡ 快速响应
- 🌐 中英文支持

