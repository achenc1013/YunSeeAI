# 🛡️ WAF识别功能集成说明

## 📋 更新概述

**版本**: v1.6.0  
**日期**: 2025-11-04  
**新功能**: 集成WAFW00F进行WAF（Web应用防火墙）识别

---

## 🎯 功能介绍

### What is WAF?

**WAF (Web Application Firewall)** 是部署在Web应用前的安全防护层，用于：
- 🛡️ 过滤恶意请求
- 🚫 阻止SQL注入、XSS等攻击
- 🔒 保护Web应用安全
- 📊 记录和分析访问日志

### Why Detect WAF?

在安全测试前识别WAF至关重要：
- ✅ 了解目标的防护级别
- ✅ 调整测试策略避免被拦截
- ✅ 选择合适的绕过技术
- ✅ 评估真实的安全风险

---

## 🔧 技术实现

### 1. WAFW00F集成

**WAFW00F** 是业界知名的WAF指纹识别工具，支持识别150+种WAF：

**支持的WAF类型：**
- 🌐 CDN WAF: Cloudflare, Akamai, AWS WAF
- 🏢 商业WAF: F5, Barracuda, Imperva
- 🇨🇳 国产WAF: 阿里云盾, 腾讯云, 百度云加速
- 🔓 开源WAF: ModSecurity, NAXSI

### 2. Python扫描器

**文件**: `scanner/waf_scanner.py`

```python
class WAFScanner:
    """WAF detection scanner using WAFW00F"""
    
    def scan(self) -> Dict:
        """Perform WAF detection scan"""
        # Create WAFW00F instance
        attacker = WAFW00F(self.target)
        
        # Check if target is reachable
        if not attacker.normalRequest():
            return {"success": False, "error": "Target not reachable"}
        
        # Perform WAF detection
        waf_results = attacker.identwaf()
        
        # Parse results
        detected_wafs = []
        if waf_results:
            for waf in waf_results:
                detected_wafs.append({
                    "name": waf,
                    "confidence": "high"
                })
        
        return {
            "success": True,
            "waf_detected": len(detected_wafs) > 0,
            "detected_wafs": detected_wafs,
            "total_detected": len(detected_wafs)
        }
```

### 3. Node.js客户端

**文件**: `scanner/scanner-client.js`

```javascript
export async function scanWAF(target, timeout = 10) {
  try {
    const args = [target];
    if (timeout) {
      args.push('--timeout', timeout.toString());
    }
    
    const result = await executePythonScript('waf_scanner.py', args);
    return result;
  } catch (error) {
    return {
      success: false,
      error: error.message,
      target
    };
  }
}
```

### 4. 工具注册

**文件**: `scanner/tools-registry.js`

```javascript
{
  name: 'scan_waf',
  description: 'Detect Web Application Firewall (WAF) protecting the target. Use this when user asks about WAF, firewall, or security protection.',
  parameters: {
    type: 'object',
    properties: {
      target: {
        type: 'string',
        description: 'Target URL to scan for WAF'
      },
      timeout: {
        type: 'number',
        description: 'Timeout in seconds (default: 10)',
        default: 10
      }
    },
    required: ['target']
  },
  handler: async (args) => {
    const { target, timeout = 10 } = args;
    return await scanWAF(target, timeout);
  }
}
```

---

## 🧠 智能语义识别

### 支持的自然语言表达

**直接询问：**
```
✅ "xxx网站有什么WAF？"
✅ "xxx使用了什么防火墙？"
✅ "xxx有WAF吗？"
✅ "那它用的啥WAF？"
✅ "它有防火墙吗？"
```

**英文询问：**
```
✅ "Does xxx have WAF?"
✅ "What WAF is xxx using?"
✅ "Is xxx protected by firewall?"
```

### 语义模式定义

**文件**: `scanner/semantic-intent-parser.js`

```javascript
waf: {
  direct: [
    /\bwaf\b/i,
    /web\s+application\s+firewall/i,
    /firewall/i,
    /防火墙/,
    /waf防火墙/,
    
    // Chinese queries
    /(?:有|存在|使用|部署).*(?:waf|防火墙)/i,
    /(?:waf|防火墙).*(?:有|存在|使用|部署)/i,
    /(?:什么|哪个|哪种).*(?:waf|防火墙)/i,
    /(?:waf|防火墙).*(?:什么|哪个|哪种)/i
  ],
  
  questions: [
    /(?:has|have|use|using|deploy).*waf/i,
    /waf.*(?:detect|present|installed)/i,
    /protected\s+by.*waf/i,
    
    // Chinese questions
    /是否.*(?:waf|防火墙)/,
    /有没有.*(?:waf|防火墙)/
  ]
}
```

### 上下文感知

**场景：**
```
用户: http://example.com 有什么WAF？
AI: [识别WAF] → 使用了Cloudflare WAF

用户: 那它用的啥防火墙？
AI: [自动使用上次目标] → Cloudflare WAF
```

---

## 💡 显示效果

### 情况1: 检测到WAF

```
🔍 检测到扫描请求，正在执行扫描...
   目标: http://example.com
   类型: waf
   💡 智能理解: 语义分析识别意图

✓ 扫描完成！

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📊 扫描结果:

目标: http://example.com

🛡️  WAF检测结果:

  ✅ 检测到WAF防护:

     • Cloudflare
       置信度: high

  提示: WAF防护可能影响扫描和测试结果

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🤖 YunSeeAI 分析:
目标http://example.com使用了Cloudflare WAF防护。Cloudflare提供了强大的DDoS防护和应用层过滤，建议在测试时注意请求频率。
```

### 情况2: 未检测到WAF

```
目标: http://example.com

  ✅ 未检测到WAF防护

  说明:
  • 目标网站可能没有部署WAF
  • 或WAF配置较为隐蔽

🤖 YunSeeAI 分析:
目标http://example.com未检测到WAF防护。这可能意味着网站缺少应用层防护，建议考虑部署WAF提升安全性。
```

### 情况3: 检测到通用WAF

```
🛡️  WAF检测结果:

  ⚠️  检测到通用WAF防护
     (无法识别具体WAF类型)

  提示: WAF防护可能影响扫描和测试结果

🤖 YunSeeAI 分析:
目标存在WAF防护，但无法识别具体类型。建议进行更深入的指纹识别或手动分析。
```

---

## 🧪 使用示例

### 示例1: 基本WAF检测

```bash
npm start
```

```
You: http://example.com 有什么WAF？
```

**预期输出：**
- ✅ 语义识别为WAF检测
- ✅ 执行WAFW00F扫描
- ✅ 显示检测到的WAF类型
- ✅ AI简要说明WAF的作用

### 示例2: 连续对话

```
You: http://192.168.1.100 有WAF吗？
AI: [扫描] 检测到ModSecurity WAF

You: 那它用的啥防火墙？
AI: [自动使用上次目标] ModSecurity WAF，开源的Web应用防火墙...
```

### 示例3: 英文查询

```
You: Does https://cloudflare.com have WAF?
AI: [Detection] Yes, Cloudflare WAF detected
```

---

## 🎯 支持的WAF列表

### 🌐 国际知名WAF

- **CDN WAF**: Cloudflare, Akamai, AWS WAF, Azure Front Door
- **硬件WAF**: F5 BIG-IP ASM, Barracuda, Fortinet FortiWeb
- **云WAF**: Imperva/Incapsula, Cloudflare, Akamai Kona
- **开源WAF**: ModSecurity, NAXSI, Shadow Daemon

### 🇨🇳 国产WAF

- **云服务商**: 阿里云盾, 腾讯云WAF, 百度云加速
- **安全厂商**: 安全狗, 云锁, 知道创宇云防御
- **专业WAF**: 绿盟, 启明星辰, 深信服

### 完整列表（150+种）

查看 `wafw00f-2.3.1/wafw00f/plugins/` 目录获取完整支持列表

---

## 📊 技术特性

### 1. 多维度检测

WAFW00F通过多种方式识别WAF：
- 🔍 **HTTP响应头分析** - 检查特殊头部
- 🔍 **Cookie分析** - 识别WAF特征Cookie
- 🔍 **响应内容分析** - 检测拦截页面特征
- 🔍 **响应码模式** - 分析异常状态码

### 2. 智能识别

- ✅ 支持150+种WAF
- ✅ 高准确率识别
- ✅ 通用WAF检测
- ✅ 多WAF并存检测

### 3. 上下文感知

- 🧠 记住最近查询的目标
- 🧠 理解多种自然语言表达
- 🧠 支持中英文查询

---

## 🔧 配置与依赖

### Python依赖

```bash
# 安装WAFW00F
pip install wafw00f

# 或使用项目中的版本
cd wafw00f-2.3.1
python setup.py install
```

### 项目结构

```
scanner/
  ├── waf_scanner.py          # WAF扫描器
  ├── scanner-client.js       # Node.js客户端
  ├── semantic-intent-parser.js  # 语义识别
  ├── tools-registry.js       # 工具注册
  └── test-waf.js            # 测试脚本

wafw00f-2.3.1/               # WAFW00F源码
  └── wafw00f/
      ├── main.py
      └── plugins/           # 150+ WAF插件
```

---

## 🧪 测试验证

### 创建测试脚本

**文件**: `scanner/test-waf.js`

```javascript
import { parseSemanticIntent } from './semantic-intent-parser.js';

const testCases = [
  {
    input: "http://example.com 有什么WAF？",
    expectedIntent: "waf"
  },
  {
    input: "http://example.com 使用了什么防火墙？",
    expectedIntent: "waf"
  },
  {
    input: "http://example.com 有WAF吗？",
    expectedIntent: "waf"
  },
  {
    input: "那它用的啥防火墙？",
    expectedIntent: "waf",
    expectUseLastTarget: true
  }
];

console.log("🛡️ WAF Detection Test\n");
testCases.forEach((testCase, index) => {
  console.log(`Test ${index + 1}: ${testCase.input}`);
  const result = parseSemanticIntent(testCase.input);
  console.log(`Intent: ${result.intent} ${result.intent === testCase.expectedIntent ? '✅' : '❌'}\n`);
});
```

### 运行测试

```bash
cd scanner
node test-waf.js
```

**预期输出：**
```
🛡️ WAF Detection Test

Test 1: http://example.com 有什么WAF？
Intent: waf ✅

Test 2: http://example.com 使用了什么防火墙？
Intent: waf ✅

Test 3: http://example.com 有WAF吗？
Intent: waf ✅

Test 4: 那它用的啥防火墙？
Intent: waf ✅ (using last target)
```

---

## 💡 最佳实践

### 对于用户

1. **明确询问WAF**
   ```
   ✅ "xxx有什么WAF？"
   ✅ "xxx有防火墙吗？"
   ✅ "xxx部署了WAF吗？"
   ```

2. **后续查询可省略URL**
   ```
   第一次: "http://example.com 有WAF吗？"
   第二次: "那它用的啥防火墙？"  ← 自动使用上次目标
   ```

### 对于渗透测试

1. **测试前先检测WAF**
   - 了解目标防护级别
   - 调整测试策略
   - 避免触发防御规则

2. **绕过技术选择**
   - 根据WAF类型选择绕过方法
   - 控制请求频率
   - 使用混淆技术

---

## 🔄 集成流程

### 工作流程

```
用户输入
    ↓
[语义解析] → 识别为WAF检测
    ↓
[调用WAFW00F] → Python扫描器
    ↓
[WAF指纹识别] → 150+ WAF规则
    ↓
[结果解析] → 格式化输出
    ↓
[AI分析] → 简要说明
    ↓
显示结果
```

### 数据流

```javascript
User Query
  ↓
Semantic Parser (waf intent)
  ↓
tools-registry.js (scan_waf tool)
  ↓
scanner-client.js (scanWAF function)
  ↓
waf_scanner.py (Python)
  ↓
WAFW00F library
  ↓
WAF Detection Result
  ↓
CommandHandler.ts (display)
  ↓
User Output + AI Analysis
```

---

## 🎓 WAF知识库

### 常见WAF及其特征

| WAF | 类型 | 特征 |
|-----|------|------|
| Cloudflare | CDN | `cf-ray` header, `__cfduid` cookie |
| AWS WAF | Cloud | `x-amzn-requestid` header |
| ModSecurity | Open Source | `mod_security` in Server header |
| 阿里云盾 | Cloud | `aliyungf_` cookies |
| 安全狗 | Local | `safedog` in response |

### WAF绕过技术（仅供授权测试）

1. **编码绕过**: URL编码、Unicode编码
2. **分块传输**: 使用HTTP chunked encoding
3. **协议混淆**: HTTP/2, WebSocket
4. **频率控制**: 降低请求速度
5. **IP轮换**: 使用代理池

---

## 📚 相关文档

- [语义理解系统说明](语义理解系统说明.md)
- [自然语言查询参考](自然语言查询参考.md)
- [上下文优化和CMS识别增强](上下文优化和CMS识别增强.md)

---

## 🙏 致谢

感谢用户建议集成WAF识别功能！

**WAFW00F项目：**
- GitHub: https://github.com/EnableSecurity/wafw00f
- 作者: Sandro Gauci
- License: BSD 3-Clause

---

**YunSeeAI v1.6.0**  
智能WAF识别，全面安全评估 🛡️

**新增功能：**
- ✅ 150+ WAF识别
- ✅ 智能语义理解
- ✅ 上下文感知
- ✅ 中英文支持
- ✅ 纯英文代码，高兼容性

