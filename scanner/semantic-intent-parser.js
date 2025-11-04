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
      
      // Chinese
      /(?:哪个|什么).*cms/i,
      /cms.*(?:用|使用|是)/,
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
      
      // Chinese
      /(?:哪个|什么).*(?:框架|技术)/,
      /(?:框架|技术).*(?:用|使用)/,
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
      /(?:any|exist|have).*vulnerabilit/i,
      /is.*vulnerable/i,
      /security\s+problems?/i,
      
      // Chinese
      /(?:有|存在).*漏洞/,
      /是否.*漏洞/
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
  
  // Extract target URL/IP
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
  
  // Determine intent by checking patterns
  const intent = determineIntent(message);
  
  if (!intent) {
    return {
      success: false,
      error: 'Could not determine scan intent from your message.'
    };
  }
  
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
  const intentOrder = ['vulnerability', 'waf', 'cms', 'full', 'port', 'framework'];
  
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

