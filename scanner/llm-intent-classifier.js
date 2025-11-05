/**
 * LLM-Based Intent Classifier
 * Uses AI to understand user intent naturally, not just keyword matching
 */

/**
 * Classify user intent using LLM understanding
 * This is a placeholder that will be enhanced when LLM integration is ready
 * 
 * @param {string} userMessage - User's input message
 * @param {Function} llmInfer - LLM inference function (optional)
 * @returns {Promise<Object>} - Classified intent
 */
export async function classifyIntent(userMessage, llmInfer = null) {
  // If LLM is available, use it for classification
  if (llmInfer) {
    try {
      const prompt = `Analyze this user request and determine what they want to do. 
Respond with ONLY ONE of these intent types:
- security_audit: User wants to check system security, analyze logs, detect attacks, check configurations
- port_scan: User wants to scan network ports
- web_fingerprint: User wants to identify website technology, CMS, framework
- vulnerability_scan: User wants to find security vulnerabilities, CVEs
- waf_detection: User wants to detect WAF/firewall
- chat: Just general conversation, no scanning needed

User request: "${userMessage}"

Intent type:`;

      const response = await llmInfer(prompt, { maxTokens: 50, temperature: 0.1 });
      const intent = response.trim().toLowerCase();
      
      // Map LLM response to our intent system
      const intentMap = {
        'security_audit': 'security_audit',
        'port_scan': 'port',
        'web_fingerprint': 'framework',
        'vulnerability_scan': 'vulnerability',
        'waf_detection': 'waf',
        'chat': null
      };
      
      for (const [key, value] of Object.entries(intentMap)) {
        if (intent.includes(key)) {
          return {
            success: true,
            intent: value,
            method: 'llm-understanding',
            confidence: 'high'
          };
        }
      }
    } catch (error) {
      console.error('[LLM Intent Classifier] Error:', error);
    }
  }
  
  // Fallback: Enhanced keyword matching with context awareness
  return fallbackClassifier(userMessage);
}

/**
 * Fallback classifier using enhanced patterns
 * CONSERVATIVE: Only trigger for EXPLICIT scanning requests
 */
function fallbackClassifier(message) {
  const msg = message.toLowerCase().trim();
  
  // Security audit patterns - VERY SPECIFIC
  const securityAuditPatterns = [
    // Must have both "system/server" AND "security/audit/scan"
    /\b(系统|服务器|system|server).*\b(安全扫描|安全审计|安全检查|security\s+audit|security\s+scan|security\s+check)\b/i,
    /\b(安全扫描|安全审计|安全检查|security\s+audit|security\s+scan|security\s+check).*\b(系统|服务器|system|server)\b/i,
    
    // Exact phrases only
    /^(系统安全扫描|安全审计|系统安全检查|检查系统安全)$/i,
    /^(security audit|system security scan|check system security)$/i,
    
    // Attack detection - must be explicit about checking
    /\b(检测|扫描|check|scan|detect).*\b(暴力破解|爆破|brute\s*force|attack|攻击)\b/i,
    
    // REMOVED: generic patterns that could match normal questions
    // /\b(security|安全).*\b(check|检查)\b/i  - TOO BROAD
    // /\b(analyze|分析).*\b(log|日志)\b/i - TOO BROAD
    // /有.*攻击/i - TOO BROAD
  ];
  
  // WAF detection patterns
  const wafPatterns = [
    /(检测|扫描|check|detect|scan).*waf/i,
    /waf.*(检测|扫描|有|detect|check|scan)/i,
    /(检测|扫描).*(防火墙|firewall)/i,
    /有.*waf/i,
    /waf.*吗/i
  ];
  
  // Port scan patterns
  const portPatterns = [
    /(扫描|scan).*(端口|port)/i,
    /(端口|port).*(扫描|scan)/i,
    /(开了|开放了).*(哪些|什么).*(端口|服务)/i,
    /\b(what|which).*\b(port|service).*\b(open|running)/i
  ];
  
  // Web fingerprint/CMS patterns
  const fingerprintPatterns = [
    // CMS queries
    /cms|内容管理/i,
    /(什么|啥|哪个|哪种).*(cms|框架)/i,
    /(cms|框架).*(什么|啥|哪个|哪种)/i,
    /(用了|使用|用的|用着).*(什么|啥).*(cms|框架)/i,
    
    // Framework queries
    /技术栈|tech\s*stack|technology/i,
    /\bframework/i,
    
    // Website detection
    /(检测|扫描).*(网站|website)/i,
    /\b(identify|fingerprint).*\b(website)/i
  ];
  
  // Vulnerability patterns - Enhanced for CVE detection
  const vulnPatterns = [
    // Scanning/checking for vulnerabilities
    /(扫描|检测|查找|检查).*(漏洞|vulnerability|cve)/i,
    /(漏洞|vulnerability|cve).*(扫描|检测|检查)/i,
    
    // Questions about vulnerabilities
    /(有没有|有|存在|是否有|是否存在).*(漏洞|vulnerability|cve)/i,
    /(漏洞|vulnerability|cve).*(有没有|有|存在|是否|吗)/i,
    
    // Direct CVE questions
    /\bcve\b.*漏洞/i,
    /漏洞.*\bcve\b/i,
    /\bcve\b/i,  // Just "CVE" is strong enough
    
    // Security questions
    /(安全|security).*(漏洞|问题|vulnerability|issue|flaw)/i,
    /(漏洞|vulnerability).*(安全|security)/i
  ];
  
  // Check patterns in priority order
  if (securityAuditPatterns.some(p => p.test(msg))) {
    return {
      success: true,
      intent: 'security_audit',
      target: null,
      method: 'enhanced-pattern-matching',
      confidence: 'high'
    };
  }
  
  if (wafPatterns.some(p => p.test(msg))) {
    return { success: true, intent: 'waf', method: 'pattern-matching' };
  }
  
  if (vulnPatterns.some(p => p.test(msg))) {
    return { success: true, intent: 'vulnerability', method: 'pattern-matching' };
  }
  
  if (portPatterns.some(p => p.test(msg))) {
    return { success: true, intent: 'port', method: 'pattern-matching' };
  }
  
  if (fingerprintPatterns.some(p => p.test(msg))) {
    // Distinguish between CMS and framework queries
    const isCmsQuery = /\b(cms|内容管理)/i.test(msg);
    return { 
      success: true, 
      intent: isCmsQuery ? 'cms' : 'framework', 
      method: 'pattern-matching' 
    };
  }
  
  return {
    success: false,
    intent: null,
    method: 'no-match'
  };
}

/**
 * Export for testing
 */
export { fallbackClassifier };

