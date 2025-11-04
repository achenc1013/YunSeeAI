/**
 * AI Integration Module
 * Handles natural language understanding and tool calling
 */

import { executeTool, getToolDefinitions } from './tools-registry.js';
import { formatScanResults } from './scanner-client.js';

/**
 * System prompt for scanner AI assistant
 */
export const SCANNER_SYSTEM_PROMPT = `You are YunSeeAI, an intelligent security asset scanner assistant. Your role is to help users scan and analyze target systems, websites, and networks.

You have access to the following scanning tools:
1. scan_ports - Scan for open ports on a target
2. scan_fingerprint - Identify web frameworks, CMS, and technologies
3. scan_full - Perform comprehensive scanning (ports + fingerprint)

When users ask about targets, you should:
- Understand their intent (what information they want to gather)
- Choose the appropriate scanning tool(s)
- Call the tool with correct parameters
- Interpret and explain the results in clear, actionable language

User queries you should handle:
- "What ports are open on example.com?"
- "What framework does https://example.com use?"
- "Scan https://example.com for me"
- "Check what services are running on 192.168.1.1"
- "What technology stack is used by example.com?"

Always:
- Extract the target from user's natural language input
- Be security-conscious and ethical
- Explain findings in user-friendly terms
- Provide context about discovered services/technologies
- Warn about potential security implications if relevant

Response format:
- First, acknowledge the request
- Then call appropriate tools
- Finally, summarize findings with insights`;

/**
 * Parse user intent and determine which tool to call
 * @param {string} userMessage - User's natural language request
 * @returns {Object} - Parsed intent with tool and parameters
 */
// Store last target for context awareness
let lastTarget = null;

export function parseIntent(userMessage) {
  const message = userMessage.toLowerCase();
  
  // Extract target (URL, hostname, or IP with optional port)
  // Enhanced patterns to support ports and trailing slashes
  const ipWithPortPattern = /(?:https?:\/\/)?(?:\d{1,3}\.){3}\d{1,3}:\d+(?:\/[^\s]*)?/g;
  const urlPattern = /(?:https?:\/\/)?(?:[\w-]+\.)+[\w-]+(?::\d+)?(?:\/[^\s]*)?/gi;
  const ipPattern = /\b(?:\d{1,3}\.){3}\d{1,3}\b/g;
  
  // Try to match IP with port first (most specific)
  let target = userMessage.match(ipWithPortPattern)?.[0];
  
  // If no IP with port, try regular URL pattern
  if (!target) {
    const urlMatches = userMessage.match(urlPattern);
    target = urlMatches?.[0];
  }
  
  // If still no match, try IP without port
  if (!target) {
    const ipMatches = userMessage.match(ipPattern);
    target = ipMatches?.[0];
  }
  
  // Clean up trailing slash if it's just a slash
  if (target && target.endsWith('/') && !target.match(/\/[^\/]+\/$/)) {
    // Keep the trailing slash as it's part of the URL
  }
  
  // If no target found but user is clearly requesting a scan, use last target
  const scanIndicators = ['扫描', '端口扫描', 'scan', 'port scan', '扫一下', '扫描一下'];
  const isScanCommand = scanIndicators.some(indicator => message.includes(indicator));
  
  if (!target && isScanCommand && lastTarget) {
    target = lastTarget;
    console.log(`[INFO] No target in message, using last target: ${target}`);
  }
  
  if (!target) {
    return {
      success: false,
      error: 'Could not identify target in your message. Please specify a URL, hostname, or IP address.'
    };
  }
  
  // Store target for future context
  lastTarget = target;
  
  // Determine intent - be specific and precise
  const keywords = {
    vulnerability: ['vulnerability', 'vulnerabilities', 'cve', 'exploit', 'security issue', 'security flaw', '漏洞', '安全漏洞', '安全问题', 'CVE'],
    waf: ['waf', 'firewall', '防火墙', 'web application firewall', 'waf防火墙'],  // WAF keywords
    port: [
      'port', 'ports', 'open port', 'service', 'services', '端口', '开放', '开放端口',
      '端口扫描', 'port scan', 'scan port', '扫描端口', 'nmap',
      '开通', '开通了', '提供', '提供了', '运行', '运行了',
      '开通了哪些服务', '提供了什么服务', '运行了什么服务', '开了哪些端口',
      '哪些服务', '什么服务', '服务列表'
    ],
    framework: ['framework', 'technology', 'technologies', 'stack', 'built with', 'using', 'powered by', '框架', '技术', '用的', '使用', '技术栈'],
    cms: ['cms', 'CMS', '内容管理系统', 'content management', '用了什么cms', '什么cms'],  // Dedicated CMS keywords
    full: ['全面', 'full scan', 'complete scan', 'everything', '全部', '完整', '全面扫描']
  };
  
  // More intelligent intent detection with priority
  let intent = null;
  
  // Highest priority: Vulnerability/CVE queries
  if (keywords.vulnerability.some(kw => message.includes(kw))) {
    intent = 'vulnerability';
  }
  // Check for WAF queries (high priority)
  else if (keywords.waf.some(kw => message.includes(kw))) {
    intent = 'waf';
  }
  // Check for explicit CMS requests (high priority)
  else if (keywords.cms.some(kw => message.includes(kw))) {
    intent = 'cms';
  }
  // Check for explicit full scan requests
  else if (keywords.full.some(kw => message.includes(kw))) {
    intent = 'full';
  }
  // Check for port-specific requests
  else if (keywords.port.some(kw => message.includes(kw))) {
    intent = 'port';
  }
  // Check for framework/technology requests
  else if (keywords.framework.some(kw => message.includes(kw))) {
    intent = 'framework';
  }
  // Generic "scan" without specifics - default to port scan
  else if (message.includes('scan') || message.includes('扫描')) {
    intent = 'port';
  }
  
  // If still no intent determined, this shouldn't be a scan request
  if (!intent) {
    return {
      success: false,
      error: 'Could not determine scan intent. Please specify what you want to scan (ports, framework, vulnerabilities, or full scan).'
    };
  }
  
  // Map intent to tool
  const toolMap = {
    vulnerability: 'scan_vulnerabilities',
    waf: 'scan_waf',  // WAF detection
    port: 'scan_ports',
    framework: 'scan_fingerprint',
    cms: 'scan_fingerprint',  // CMS queries use fingerprint scanning
    full: 'scan_full'
  };
  
  return {
    success: true,
    tool: toolMap[intent],
    intent: intent,
    target: target,
    parameters: {
      target: target
    }
  };
}

/**
 * Process user query and execute appropriate scan
 * @param {string} userMessage - User's natural language request
 * @returns {Promise<Object>} - Result with scan data and formatted response
 */
export async function processQuery(userMessage) {
  // Parse user intent
  const intent = parseIntent(userMessage);
  
  if (!intent.success) {
    return {
      success: false,
      error: intent.error,
      message: intent.error
    };
  }
  
  // Execute the appropriate tool
  try {
    const scanResult = await executeTool(intent.tool, intent.parameters);
    
    if (!scanResult.success) {
      return {
        success: false,
        error: scanResult.error,
        message: `Failed to scan ${intent.target}: ${scanResult.error}`
      };
    }
    
    // Format results for human consumption
    const formattedResults = formatScanResults(scanResult);
    
    // Generate AI response
    const aiResponse = generateResponse(intent, scanResult, formattedResults);
    
    return {
      success: true,
      intent: intent.intent,
      target: intent.target,
      tool_used: intent.tool,
      raw_results: scanResult,
      formatted_results: formattedResults,
      ai_response: aiResponse
    };
    
  } catch (error) {
    return {
      success: false,
      error: error.message,
      message: `An error occurred while scanning: ${error.message}`
    };
  }
}

/**
 * Generate natural language response based on scan results
 * @param {Object} intent - Parsed intent
 * @param {Object} scanResult - Raw scan results
 * @param {string} formattedResults - Formatted scan results
 * @returns {string} - Natural language response
 */
function generateResponse(intent, scanResult, formattedResults) {
  let response = '';
  
  if (intent.intent === 'vulnerability') {
    const vulnData = scanResult;
    
    if (vulnData.total_vulnerabilities > 0) {
      response += `发现 ${vulnData.total_vulnerabilities} 个已知漏洞：\n\n`;
      
      // Group by severity
      const bySeverity = {
        'Critical': [],
        'High': [],
        'Medium': [],
        'Low': [],
        'Unknown': []
      };
      
      vulnData.vulnerabilities.forEach(vuln => {
        const severity = vuln.severity || 'Unknown';
        if (!bySeverity[severity]) bySeverity[severity] = [];
        bySeverity[severity].push(vuln);
      });
      
      // Display by severity
      for (const [severity, vulns] of Object.entries(bySeverity)) {
        if (vulns.length === 0) continue;
        
        const severityIcon = {
          'Critical': '🔴',
          'High': '🟠',
          'Medium': '🟡',
          'Low': '🟢',
          'Unknown': '⚪'
        }[severity];
        
        response += `${severityIcon} ${severity} 级别 (${vulns.length}):\n`;
        
        vulns.forEach(vuln => {
          response += `\n  【${vuln.cve_id}】\n`;
          response += `  影响组件: ${vuln.technology}`;
          if (vuln.affected_version) {
            response += ` ${vuln.affected_version}`;
          }
          response += '\n';
          
          if (vuln.description) {
            const desc = vuln.description.length > 100 
              ? vuln.description.substring(0, 100) + '...' 
              : vuln.description;
            response += `  描述: ${desc}\n`;
          }
          
          if (vuln.impact) {
            response += `  影响: ${vuln.impact}\n`;
          }
          
          if (vuln.score) {
            response += `  CVSS评分: ${vuln.score}\n`;
          }
          
          // Highlight exploit availability (searchsploit-like)
          if (vuln.has_exploit || vuln.exploit_available) {
            response += `  ⚠️ 公开Exploit存在`;
            if (vuln.exploit_type) {
              response += ` (${vuln.exploit_type})`;
            }
            response += ` - 威胁级别提升！\n`;
          }
        });
        
        response += '\n';
      }
      
      // Add recommendations
      const criticalCount = bySeverity['Critical'].length;
      const highCount = bySeverity['High'].length;
      
      if (criticalCount > 0 || highCount > 0) {
        response += `\n⚠️ 安全建议:\n`;
        if (criticalCount > 0) {
          response += `  • 发现 ${criticalCount} 个严重漏洞，建议立即修复\n`;
        }
        if (highCount > 0) {
          response += `  • 发现 ${highCount} 个高危漏洞，建议尽快处理\n`;
        }
        response += `  • 建议更新受影响的组件到安全版本\n`;
        response += `  • 可以访问 https://nvd.nist.gov/vuln/detail/[CVE-ID] 查看详情\n`;
      }
      
    } else {
      response += `未发现已知漏洞。\n\n`;
      response += `说明：\n`;
      response += `  • 基于当前检测到的技术栈进行了CVE匹配\n`;
      response += `  • 未发现匹配的已知漏洞记录\n`;
      response += `  • 这并不意味着完全安全，建议定期更新组件\n`;
    }
  }
  else if (intent.intent === 'port') {
    const portData = scanResult.port_scan || scanResult;
    
    if (portData.total_open > 0) {
      response += `发现 ${portData.total_open} 个开放端口：\n\n`;
      portData.open_ports.forEach(port => {
        response += `  • 端口 ${port.port} (${port.service}) - ${port.state}\n`;
        if (port.banner) {
          response += `    Banner: ${port.banner.substring(0, 60)}${port.banner.length > 60 ? '...' : ''}\n`;
        }
      });
      
      // Add security insight
      const criticalPorts = portData.open_ports.filter(p => 
        [21, 23, 3389, 5900].includes(p.port)
      );
      if (criticalPorts.length > 0) {
        response += `\n⚠️ 安全提醒: 检测到敏感端口开放 (${criticalPorts.map(p => p.port).join(', ')})，请确保已做好安全加固。\n`;
      }
      
      // Port-specific recommendations
      const hasDB = portData.open_ports.some(p => [3306, 5432, 27017, 6379].includes(p.port));
      if (hasDB) {
        response += `\n💡 建议: 发现数据库端口开放，建议配置防火墙规则限制访问来源。\n`;
      }
    } else {
      response += `未检测到开放端口（扫描范围：常见端口）。\n`;
    }
  }
  else if (intent.intent === 'waf') {
    // WAF detection output
    const wafData = scanResult;
    
    if (wafData.waf_detected) {
      if (wafData.detected_wafs && wafData.detected_wafs.length > 0) {
        response += `🛡️ 检测到WAF防护：\n\n`;
        wafData.detected_wafs.forEach(waf => {
          response += `  • ${waf.name}\n`;
          response += `    置信度: ${waf.confidence}\n`;
        });
        response += `\n💡 提示: WAF防护可能会影响后续的扫描和安全测试。\n`;
      } else {
        response += `⚠️ 检测到通用WAF防护\n\n`;
        response += `说明: 目标存在WAF防护，但无法识别具体类型。\n`;
      }
    } else {
      response += `✅ 未检测到WAF防护\n\n`;
      response += `说明:\n`;
      response += `  • 目标网站可能没有部署WAF\n`;
      response += `  • 或WAF配置较为隐蔽\n`;
    }
  }
  else if (intent.intent === 'cms') {
    // CMS-specific output format
    const fpData = scanResult.fingerprint_scan || scanResult;
    
    if (fpData.technologies && fpData.technologies.length > 0) {
      const cmsItems = fpData.technologies.filter(tech => tech.type === 'CMS');
      
      if (cmsItems.length > 0) {
        response += `🎯 CMS识别结果：\n\n`;
        
        cmsItems.forEach(cms => {
          response += `✅ ${cms.name}\n`;
          response += `   置信度: ${cms.confidence}\n`;
          if (cms.version && cms.version !== 'detected') {
            response += `   版本: ${cms.version}\n`;
          }
          if (cms.detected_path) {
            response += `   特征路径: ${cms.detected_path}\n`;
          }
          response += '\n';
        });
        
        // Show other related technologies
        const otherTech = fpData.technologies.filter(tech => tech.type !== 'CMS');
        if (otherTech.length > 0) {
          response += `📦 相关技术栈：\n`;
          const byType = {};
          otherTech.forEach(tech => {
            if (!byType[tech.type]) byType[tech.type] = [];
            byType[tech.type].push(tech);
          });
          
          Object.entries(byType).forEach(([type, techs]) => {
            response += `  ${type}: ${techs.map(t => t.name).join(', ')}\n`;
          });
        }
      } else {
        response += `未检测到CMS系统，但发现其他技术栈：\n\n`;
        
        const byType = {};
        fpData.technologies.forEach(tech => {
          if (!byType[tech.type]) byType[tech.type] = [];
          byType[tech.type].push(tech);
        });
        
        Object.entries(byType).forEach(([type, techs]) => {
          response += `【${type}】\n`;
          techs.forEach(tech => {
            response += `  • ${tech.name}\n`;
          });
          response += '\n';
        });
        
        response += `💡 提示: 目标网站可能使用了自定义开发或静态页面。\n`;
      }
      
      // Add server info if available
      if (fpData.server_info && Object.keys(fpData.server_info).length > 0) {
        response += `\n🖥️  服务器信息：\n`;
        Object.entries(fpData.server_info).forEach(([key, value]) => {
          response += `  • ${key}: ${value}\n`;
        });
      }
    } else {
      response += `❌ 未能识别CMS系统。\n\n`;
      response += `可能原因：\n`;
      response += `  • 使用了自定义开发而非CMS\n`;
      response += `  • 启用了指纹隐藏保护\n`;
      response += `  • 目标网站配置了高级安全防护\n`;
      response += `  • 静态网站生成器或单页应用\n`;
    }
  }
  else if (intent.intent === 'framework') {
    const fpData = scanResult.fingerprint_scan || scanResult;
    
    if (fpData.technologies && fpData.technologies.length > 0) {
      response += `检测到以下技术栈：\n\n`;
      
      const byType = {};
      fpData.technologies.forEach(tech => {
        if (!byType[tech.type]) byType[tech.type] = [];
        byType[tech.type].push(tech);
      });
      
      Object.entries(byType).forEach(([type, techs]) => {
        response += `【${type}】\n`;
        techs.forEach(tech => {
          response += `  • ${tech.name} (置信度: ${tech.confidence})\n`;
          if (tech.detected_path) {
            response += `    检测位置: ${tech.detected_path}\n`;
          }
        });
        response += '\n';
      });
      
      // Add server info if available
      if (fpData.server_info && Object.keys(fpData.server_info).length > 0) {
        response += `服务器信息：\n`;
        Object.entries(fpData.server_info).forEach(([key, value]) => {
          response += `  • ${key}: ${value}\n`;
        });
      }
    } else {
      response += `未能识别具体框架或CMS。可能原因：\n`;
      response += `  • 使用了自定义框架\n`;
      response += `  • 启用了指纹隐藏保护\n`;
      response += `  • 目标网站配置了安全防护\n`;
    }
  }
  else {
    // Full scan - show everything
    response += formattedResults;
    response += `\n📊 这是一次完整扫描，包含了端口信息和技术栈分析。\n`;
  }
  
  return response;
}

/**
 * Create tool calling messages for LLM
 * @returns {Array<Object>} - Tool definitions for model
 */
export function getToolsForModel() {
  return getToolDefinitions();
}

export default {
  SCANNER_SYSTEM_PROMPT,
  parseIntent,
  processQuery,
  generateResponse,
  getToolsForModel
};

