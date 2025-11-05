/**
 * Semantic Intent Parser
 * Intelligent rule-based parser with semantic understanding
 * Fast and accurate - no LLM calls needed for intent parsing
 */

// Semantic patterns for each intent type
const SEMANTIC_PATTERNS = {
  // WAF detection patterns
  waf: {
    direct: [
      /\bwaf\b/i,
      /web\s+application\s+firewall/i,
      /firewall/i,
      /防火墙/,
      /waf.*detect/i,
      /detect.*waf/i
    ],
    
    questions: [
      /(?:what|which|any).*waf/i,
      /(?:has|have|using|use|uses).*waf/i,
      /waf.*(?:protect|security|defense)/i,
      /(?:什么|哪个|有没有|是否).*waf/i,
      /(?:什么|哪个|有没有|是否).*防火墙/,
      /waf.*(?:保护|防护)/,
      /(?:用|使用).*waf/
    ],
    
    security: [
      /security\s+protection/i,
      /protection\s+system/i,
      /安全防护/,
      /防护系统/
    ]
  },
  
  // Port scanning patterns
  port: {
    // Direct port-related phrases
    direct: [
      /ports?\s+(?:scan|open|check|list)/i,
      /(?:scan|check|list)\s+ports?/i,
      /open\s+ports?/i,
      /(?:which|what)\s+ports?/i,
      
      // Chinese direct
      /端口.*(?:扫描|检查|列表|开放)/,
      /(?:扫描|检查|列表).*端口/,
      /开放.*端口/,
      /(?:哪些|什么).*端口/
    ],
    
    // Service-related phrases (semantic understanding)
    services: [
      /(?:which|what).*services?.*(?:running|open|available|provided)/i,
      /services?.*(?:running|open|available|provided)/i,
      /(?:running|open|available|provided).*services?/i,
      
      // Chinese service phrases
      /(?:哪些|什么).*服务.*(?:运行|开放|提供|开通)/,
      /服务.*(?:运行|开放|提供|开通)/,
      /(?:运行|开放|提供|开通).*(?:哪些|什么)?.*服务/,
      /开[了通].*(?:哪些|什么)?.*服务/,
      /提供[了]?.*(?:哪些|什么)?.*服务/
    ],
    
    // Network discovery
    discovery: [
      /network.*scan/i,
      /discover.*services?/i,
      /enumerate.*services?/i,
      /nmap/i
    ]
  },
  
  // CMS identification patterns
  cms: {
    direct: [
      /(?:which|what).*cms/i,
      /cms.*(?:using|used|is)/i,
      /content\s+management/i,
      
      // Chinese - 更宽松的模式
      /(?:哪个|什么|啥).*cms/i,  // "啥cms", "什么cms"
      /cms.*(?:用|使用|是|啥|什么|哪个)/,  // "cms用的啥"
      /(?:用了|用的|用着|使用了).*(?:啥|什么).*cms/i,  // "用的啥cms"
      /内容管理系统/
    ],
    
    platform: [
      /(?:which|what).*(?:platform|system).*(?:using|used)/i,
      /built\s+with/i,
      /powered\s+by/i
    ]
  },
  
  // Framework/Technology patterns
  framework: {
    direct: [
      /(?:which|what).*(?:framework|technology|stack)/i,
      /(?:framework|technology|stack).*(?:using|used)/i,
      /tech\s+stack/i,
      
      // Chinese - 更宽松的模式
      /(?:哪个|什么|啥).*(?:框架|技术)/,  // "啥框架"
      /(?:框架|技术).*(?:用|使用|啥|什么)/,  // "框架用的啥"
      /(?:用了|用的|用着|使用了).*(?:啥|什么).*(?:框架|技术)/,  // "用的啥框架"
      /技术栈/
    ]
  },
  
  // Vulnerability scanning patterns
  vulnerability: {
    direct: [
      /vulnerabilit(?:y|ies)/i,
      /cve/i,
      /exploit/i,
      /security\s+(?:issue|flaw|bug|hole)/i,
      
      // Chinese
      /漏洞/,
      /安全.*(?:问题|隐患|风险)/,
      /CVE/
    ],
    
    questions: [
      /(?:any|exist|have|find|check).*vulnerabilit/i,
      /is.*vulnerable/i,
      /security\s+problems?/i,
      /vulnerabilit.*(?:exist|present|found)/i,
      
      // CVE specific questions
      /(?:any|exist|have|find).*cve/i,
      /cve.*(?:exist|present|found)/i,
      
      // Chinese
      /(?:有|存在|有没有|是否有|是否存在).*漏洞/,
      /(?:有|存在|有没有|是否有|是否存在).*cve/i,
      /是否.*漏洞/,
      /漏洞.*(?:有|存在|吗)/,
      /cve.*(?:有|存在|吗)/i
    ]
  },
  
  // Security audit patterns
  security_audit: {
    direct: [
      /security\s+audit/i,
      /security\s+check/i,
      /system\s+security/i,
      /check\s+security/i,
      /安全检查/,
      /安全审计/,
      /系统安全/,
      /安全扫描/,
      
      // Attack detection
      /(?:detect|check|find).*(?:attack|brute\s*force|intrusion)/i,
      /(?:检测|发现|查找).*(?:攻击|入侵)/,
      /检测.*暴力破解/,
      /暴力破解.*检测/,
      
      // Config check
      /(?:check|audit|review).*config/i,
      /(?:检查|审计|查看).*配置/,
      
      // Log analysis
      /(?:analyze|check|scan).*(?:log|日志)/i,
      /(?:分析|检查|扫描).*日志/,
      
      // Auto-ban
      /(?:ban|block|封禁|拦截).*(?:ip|攻击)/i
    ],
    
    questions: [
      /is\s+(?:my\s+)?system\s+secure/i,
      /any\s+attacks?/i,
      /(?:系统|服务器).*(?:安全|攻击)/,
      /有.*(?:攻击|爆破|入侵)/,
      /是否.*(?:安全|攻击)/
    ]
  },
  
  // WAF detection patterns
  waf: {
    direct: [
      /\bwaf\b/i,
      /web\s+application\s+firewall/i,
      /firewall/i,
      /防火墙/,
      /waf防火墙/,
      
      // Chinese queries - 更宽松的模式
      /(?:有|存在|使用|部署|用了|用的|用着).*(?:waf|防火墙)/i,  // "有waf", "用了waf"
      /(?:waf|防火墙).*(?:有|存在|使用|部署|吗|啥|什么)/i,  // "waf吗", "waf是啥"
      /(?:什么|哪个|哪种|啥).*(?:waf|防火墙)/i,  // "啥waf"
    ],
    
    questions: [
      /(?:has|have|use|using|deploy).*waf/i,
      /waf.*(?:detect|present|installed)/i,
      /protected\s+by.*waf/i,
      
      // Chinese questions
      /是否.*(?:waf|防火墙)/,
      /有没有.*(?:waf|防火墙)/
    ]
  },
  
  // Full scan patterns
  full: {
    direct: [
      /full\s+scan/i,
      /complete\s+scan/i,
      /comprehensive\s+scan/i,
      /all\s+scan/i,
      
      // Chinese
      /全面.*扫描/,
      /完整.*扫描/,
      /完全.*扫描/
    ]
  }
};

// Store last target for context
let lastTarget = null;

/**
 * Parse intent using semantic pattern matching
 * @param {string} userMessage - User's input
 * @returns {Object} - Parsed intent
 */
export function parseSemanticIntent(userMessage) {
  const message = userMessage.trim();
  
  // Determine intent first
  const intent = determineIntent(message);
  
  if (!intent) {
    return {
      success: false,
      error: 'Could not determine scan intent from your message.'
    };
  }
  
  // Security audit doesn't need a target (scans local system)
  if (intent === 'security_audit') {
    return {
      success: true,
      tool: 'security_audit',
      intent: intent,
      target: null,
      parameters: {},
      method: 'semantic-understanding',
      confidence: 'high'
    };
  }
  
  // Extract target URL/IP for other intents
  const target = extractTarget(message);
  
  // If no target found, try to use last target
  let finalTarget = target;
  if (!target) {
    const hasScanIntent = detectScanIntent(message);
    if (hasScanIntent && lastTarget) {
      finalTarget = lastTarget;
      console.log(`[Semantic Parser] Using last target: ${lastTarget}`);
    }
  }
  
  if (!finalTarget) {
    return {
      success: false,
      error: 'Could not identify target. Please specify a URL or IP address.'
    };
  }
  
  // Store target for future
  lastTarget = finalTarget;
  
  // Map intent to tool
  const toolMap = {
    port: 'scan_ports',
    cms: 'scan_fingerprint',
    framework: 'scan_fingerprint',
    vulnerability: 'scan_vulnerabilities',
    waf: 'scan_waf',
    full: 'scan_full'
  };
  
  return {
    success: true,
    tool: toolMap[intent],
    intent: intent,
    target: finalTarget,
    parameters: {
      target: finalTarget
    },
    method: 'semantic-understanding',
    confidence: 'high'
  };
}

/**
 * Extract target URL or IP from message
 * @param {string} message - User message
 * @returns {string|null} - Extracted target
 */
function extractTarget(message) {
  // Patterns in order of specificity
  const patterns = [
    // IP with port and path
    /(?:https?:\/\/)?(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}:\d+(?:\/[^\s]*)?)/g,
    
    // Domain with port and path
    /(?:https?:\/\/)?([\w-]+\.)+[\w-]+:\d+(?:\/[^\s]*)?/gi,
    
    // IP with path (no port)
    /(?:https?:\/\/)?(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}(?:\/[^\s]*)?)/g,
    
    // Domain with path (no port)
    /(?:https?:\/\/)?([\w-]+\.)+[\w-]+(?:\/[^\s]*)?/gi,
    
    // Just IP
    /\b(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})\b/g
  ];
  
  for (const pattern of patterns) {
    const match = message.match(pattern);
    if (match && match[0]) {
      return match[0];
    }
  }
  
  return null;
}

/**
 * Detect if message has scan intent
 * @param {string} message - User message
 * @returns {boolean}
 */
function detectScanIntent(message) {
  const scanIndicators = [
    /\b(?:scan|check|test|analyze|examine)\b/i,
    /(?:扫描|检查|测试|分析|查看)/,  // Removed \b for Chinese
    /(?:nmap|端口.*扫描|扫描.*端口)/
  ];
  
  return scanIndicators.some(pattern => pattern.test(message));
}

/**
 * Determine intent from message using semantic patterns
 * @param {string} message - User message
 * @returns {string|null} - Intent type
 */
function determineIntent(message) {
  // Priority order (most specific first)
  const intentOrder = ['vulnerability', 'security_audit', 'waf', 'cms', 'full', 'port', 'framework'];
  
  for (const intentType of intentOrder) {
    const patterns = SEMANTIC_PATTERNS[intentType];
    
    if (!patterns) continue;
    
    // Check all pattern categories for this intent
    for (const category of Object.values(patterns)) {
      if (Array.isArray(category)) {
        for (const pattern of category) {
          if (pattern.test(message)) {
            return intentType;
          }
        }
      }
    }
  }
  
  // Default to port scan if scan-related keywords found
  if (detectScanIntent(message)) {
    return 'port';
  }
  
  return null;
}

/**
 * Clear context (for testing or session reset)
 */
export function clearContext() {
  lastTarget = null;
}

/**
 * Get current context
 */
export function getContext() {
  return {
    lastTarget: lastTarget
  };
}

export default {
  parseSemanticIntent,
  clearContext,
  getContext
};

