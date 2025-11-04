# YunSeeAI CVE漏洞扫描模块

## 🛡️ 功能介绍

CVE（Common Vulnerabilities and Exposures）漏洞扫描模块可以：
- ✅ 基于检测到的技术栈识别已知漏洞
- ✅ 查询本地CVE数据库
- ✅ 联网查询最新CVE信息（可选）
- ✅ 按严重程度分类显示漏洞
- ✅ 提供CVE编号和详细描述
- ✅ 给出修复建议

## 🚀 快速使用

### 命令行查询

启动YunSeeAI后，可以这样问：

```
我想知道 https://example.com 是否存在漏洞？
https://example.com 有啥漏洞？
检查 https://github.com 的安全漏洞
扫描 https://example.com 的CVE
```

### 预期输出

```
🔍 检测到扫描请求，正在执行扫描...
   目标: https://example.com
   类型: vulnerability

✓ 扫描完成！

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📊 扫描结果:

目标: https://example.com
扫描模式: 本地+在线

发现漏洞: 3 个

🔴 Critical 级别 (1):

  【CVE-2021-41773】
  组件: Apache 2.4.49
  描述: Apache HTTP Server Path Traversal and RCE
  影响: Remote Code Execution
  CVSS: 9.8

🟠 High 级别 (2):

  【CVE-2021-23017】
  组件: Nginx 1.18.0
  描述: Nginx DNS resolver off-by-one heap write
  影响: Denial of Service, Potential RCE
  CVSS: 8.1

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🤖 YunSeeAI 分析:
[AI针对性分析漏洞严重程度和修复建议]
```

## 📋 支持的关键词

### 中文
- 漏洞
- 安全漏洞
- 安全问题
- CVE

### 英文
- vulnerability / vulnerabilities
- cve
- exploit
- security issue / security flaw

## 🔍 工作原理

### 1. 检测技术栈
```
用户查询 → 自动指纹扫描 → 识别框架和版本
```

### 2. CVE匹配
```
本地数据库查询 → 联网查询（可选）→ 版本比对 → 返回匹配的CVE
```

### 3. 结果展示
```
按严重程度分类 → 显示CVE详情 → AI分析威胁 → 给出修复建议
```

## 📊 漏洞严重程度

| 级别 | 图标 | 说明 | CVSS分数 |
|------|------|------|----------|
| Critical | 🔴 | 严重 | 9.0-10.0 |
| High | 🟠 | 高危 | 7.0-8.9 |
| Medium | 🟡 | 中危 | 4.0-6.9 |
| Low | 🟢 | 低危 | 0.1-3.9 |

## 🗄️ 本地CVE数据库

模块内置了常见框架的已知漏洞数据库：

### 支持的技术栈

- **Web服务器**: Nginx, Apache, IIS
- **CMS**: WordPress, Joomla, Drupal
- **框架**: Django, Flask, Laravel, Express
- **数据库**: MySQL, PostgreSQL, Redis, MongoDB
- **其他**: OpenSSH, 等

### 数据示例

```python
"Nginx": {
    "1.18.0": ["CVE-2021-23017"],
    "1.16.1": ["CVE-2019-20372"],
},
"WordPress": {
    "6.1": ["CVE-2023-2745", "CVE-2023-2746"],
    "6.0": ["CVE-2022-43497", "CVE-2022-43498"],
}
```

## 🌐 在线查询

### 支持的数据源

1. **CVE Search API** (cve.circl.lu)
   - 免费，无需API Key
   - 实时查询最新CVE
   - 自动启用

2. **NVD API** (可扩展)
   - 美国国家漏洞数据库
   - 需要API Key
   - 更全面的数据

### 在线查询配置

默认启用在线查询。如需禁用：

```javascript
// 在代码中调用
await scanVulnerabilities(target, null, false); // online = false
```

或在Python脚本中：

```bash
python scanner/cve_scanner.py <fingerprint_json> --offline
```

## 🛠️ API使用

### Node.js API

```javascript
import { scanVulnerabilities } from './scanner/scanner-client.js';

// 自动扫描指纹并查找漏洞
const result = await scanVulnerabilities('https://example.com');

// 使用已有的指纹数据
const fingerprint = await scanFingerprint('https://example.com');
const vulns = await scanVulnerabilities('https://example.com', fingerprint);

// 禁用在线查询（仅本地数据库）
const result = await scanVulnerabilities('https://example.com', null, false);
```

### Python API

```bash
# 需要提供指纹扫描结果的JSON
python scanner/cve_scanner.py '{"target":"example.com","technologies":[...]}' 

# 离线模式
python scanner/cve_scanner.py '{"target":"...","technologies":[...]}' --offline
```

## 📦 数据格式

### 输入（指纹数据）

```json
{
  "success": true,
  "target": "https://example.com",
  "technologies": [
    {
      "name": "Nginx",
      "version": "1.18.0",
      "type": "Web Server",
      "confidence": "high"
    },
    {
      "name": "WordPress",
      "version": "6.1",
      "type": "CMS"
    }
  ]
}
```

### 输出（CVE结果）

```json
{
  "success": true,
  "target": "https://example.com",
  "total_vulnerabilities": 3,
  "scan_mode": "online+local",
  "vulnerabilities": [
    {
      "cve_id": "CVE-2021-23017",
      "technology": "Nginx",
      "affected_version": "1.18.0",
      "severity": "High",
      "score": 8.1,
      "description": "Nginx DNS resolver off-by-one heap write",
      "impact": "Denial of Service, Potential RCE",
      "source": "local_database"
    }
  ]
}
```

## 🔧 扩展本地数据库

编辑 `scanner/cve_scanner.py` 添加更多CVE：

```python
KNOWN_VULNERABILITIES = {
    "YourFramework": {
        "1.0.0": ["CVE-2024-XXXXX"],
    }
}

CVE_DETAILS = {
    "CVE-2024-XXXXX": {
        "severity": "Critical",
        "score": 9.8,
        "description": "Your vulnerability description",
        "impact": "What can happen"
    }
}
```

## 🎯 使用场景

### 场景1: 新网站安全评估

```
你: 我想知道 https://newsite.com 是否存在漏洞

AI: [自动扫描]
✓ 检测到 WordPress 6.0
🔴 发现 2 个严重漏洞
- CVE-2022-43497: WordPress Core XSS
- CVE-2022-43498: WordPress Auth Bypass

建议: 立即更新到 WordPress 6.3.1
```

### 场景2: 定期安全巡检

```
你: 扫描 https://myapp.com 的安全漏洞

AI: [执行扫描]
✓ 未发现已知漏洞
所有组件都是最新版本
继续保持更新！
```

### 场景3: 应急响应

```
你: https://production.com 有什么严重漏洞吗？

AI: [紧急扫描]
🔴 Critical: Apache 2.4.49 存在RCE漏洞
CVE-2021-41773 CVSS: 9.8
影响: 远程代码执行

⚠️ 立即处理！建议：
1. 升级Apache到2.4.51+
2. 临时缓解措施: 禁用CGI模块
3. 检查访问日志排查入侵
```

## ⚠️ 重要说明

### 准确性

- ✅ 基于公开的CVE数据库
- ✅ 持续更新本地数据
- ⚠️ 可能存在误报（版本检测不准确）
- ⚠️ 可能存在漏报（新漏洞未收录）

### 建议

1. **定期扫描**: 每周或每月扫描一次
2. **及时更新**: 发现漏洞立即处理
3. **交叉验证**: 配合其他工具验证
4. **关注官方**: 关注框架官方安全公告

### 限制

- 需要能够识别技术栈版本
- 依赖公开CVE数据（存在延迟）
- 不能检测0day漏洞
- 不能检测配置类漏洞

## 🔗 参考资源

- **NVD**: https://nvd.nist.gov/
- **CVE Details**: https://www.cvedetails.com/
- **Exploit-DB**: https://www.exploit-db.com/
- **CVE Search**: https://cve.circl.lu/

## 📝 示例查询

### 基础查询
```
https://example.com 有漏洞吗？
检查 https://example.com 的CVE
扫描 https://example.com 的安全问题
```

### 高级查询
```
https://example.com 有严重漏洞吗？
https://example.com 的WordPress存在什么漏洞？
检查 https://example.com 是否有RCE漏洞
```

## 🎓 工作流程

```
1. 用户查询漏洞
   ↓
2. AI识别为漏洞扫描意图
   ↓
3. 自动执行指纹扫描（如果需要）
   ↓
4. 提取技术栈和版本信息
   ↓
5. 查询本地CVE数据库
   ↓
6. 联网查询最新CVE（如果启用）
   ↓
7. 合并去重结果
   ↓
8. 按严重程度分类
   ↓
9. 格式化输出
   ↓
10. AI分析威胁和给出建议
```

## ✅ 功能特点

- 🎯 **智能识别**: 自动理解漏洞查询意图
- ⚡ **快速扫描**: 本地数据库秒级响应
- 🌐 **在线更新**: 实时查询最新CVE
- 📊 **分级展示**: 按严重程度清晰分类
- 🤖 **AI分析**: 智能评估威胁和建议
- 🔒 **隐私优先**: 可完全离线使用
- 📝 **详细信息**: CVE编号、描述、影响、评分

## 🆚 vs 其他工具

| 特性 | YunSeeAI CVE | 传统漏扫工具 |
|------|--------------|--------------|
| 自然语言查询 | ✅ | ❌ |
| 自动指纹识别 | ✅ | 部分 |
| 在线+本地数据 | ✅ | 单一 |
| AI威胁分析 | ✅ | ❌ |
| 简单易用 | ✅ | ❌ |
| 完全免费 | ✅ | 部分 |

---

**YunSeeAI CVE模块** - 让漏洞扫描像聊天一样简单 🛡️

