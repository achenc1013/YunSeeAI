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
export function parseIntent(userMessage) {
  const message = userMessage.toLowerCase();
  
  // Extract target (URL, hostname, or IP)
  const urlPattern = /(?:https?:\/\/)?(?:[\w-]+\.)+[\w-]+(?:\/[\w-]*)?/gi;
  const ipPattern = /\b(?:\d{1,3}\.){3}\d{1,3}\b/g;
  
  const urlMatches = userMessage.match(urlPattern);
  const ipMatches = userMessage.match(ipPattern);
  
  const target = urlMatches?.[0] || ipMatches?.[0] || null;
  
  if (!target) {
    return {
      success: false,
      error: 'Could not identify target in your message. Please specify a URL, hostname, or IP address.'
    };
  }
  
  // Determine intent - be specific and precise
  const keywords = {
    port: ['port', 'ports', 'open port', 'service', 'services', '端口', '开放'],
    framework: ['framework', 'cms', 'technology', 'technologies', 'stack', 'built with', 'using', 'powered by', '框架', '技术', '用的', '使用'],
    full: ['全面', 'full scan', 'complete scan', 'everything', '全部', '完整']
  };
  
  // More intelligent intent detection
  let intent = null;
  
  // Check for explicit full scan requests
  if (keywords.full.some(kw => message.includes(kw))) {
    intent = 'full';
  }
  // Check for port-specific requests (high priority)
  else if (keywords.port.some(kw => message.includes(kw))) {
    intent = 'port';
  }
  // Check for framework/technology requests (high priority)
  else if (keywords.framework.some(kw => message.includes(kw))) {
    intent = 'framework';
  }
  // Generic "scan" without specifics - ask user or default to port scan
  else if (message.includes('scan') || message.includes('扫描')) {
    // If just "scan", default to port scan (most common need)
    intent = 'port';
  }
  
  // If still no intent determined, this shouldn't be a scan request
  if (!intent) {
    return {
      success: false,
      error: 'Could not determine scan intent. Please specify what you want to scan (ports, framework, or full scan).'
    };
  }
  
  // Map intent to tool
  const toolMap = {
    port: 'scan_ports',
    framework: 'scan_fingerprint',
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
  
  if (intent.intent === 'port') {
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

