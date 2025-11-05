/**
 * Tools Registry - Function Calling Interface
 * Defines available tools for AI to call
 */

import { scanPorts, scanFingerprint, scanFull, scanVulnerabilities, scanWAF, performSecurityAudit } from './scanner-client.js';

/**
 * Available tools for AI function calling
 */
export const SCANNER_TOOLS = [
  {
    name: 'scan_ports',
    description: 'Scan open ports on a target host or website. Use this when user asks about open ports, services, or what ports are exposed.',
    parameters: {
      type: 'object',
      properties: {
        target: {
          type: 'string',
          description: 'Target hostname, IP address, or URL to scan (e.g., example.com, 192.168.1.1, https://example.com)'
        },
        ports: {
          type: 'string',
          description: 'Ports to scan: "common" for common ports (default), "all" for ports 1-1024, or comma-separated list like "80,443,8080"',
          default: 'common'
        },
        timeout: {
          type: 'number',
          description: 'Timeout in seconds for each port (default: 5)',
          default: 5
        }
      },
      required: ['target']
    },
    handler: async (args) => {
      const { target, ports = 'common', timeout = 5 } = args;
      return await scanPorts(target, ports, timeout);
    }
  },
  
  {
    name: 'scan_fingerprint',
    description: 'Identify web framework, CMS, technologies used by a website. Use this when user asks about what framework, CMS, or technologies a website uses.',
    parameters: {
      type: 'object',
      properties: {
        target: {
          type: 'string',
          description: 'Target URL to scan (e.g., https://example.com, example.com)'
        },
        timeout: {
          type: 'number',
          description: 'Timeout in seconds for HTTP requests (default: 10)',
          default: 10
        }
      },
      required: ['target']
    },
    handler: async (args) => {
      const { target, timeout = 10 } = args;
      return await scanFingerprint(target, timeout);
    }
  },
  
  {
    name: 'scan_full',
    description: 'Perform comprehensive scan including both port scanning and fingerprint detection. Use this when user asks for complete information about a target.',
    parameters: {
      type: 'object',
      properties: {
        target: {
          type: 'string',
          description: 'Target hostname or URL to scan comprehensively'
        },
        ports: {
          type: 'string',
          description: 'Port range to scan: "common", "all", or comma-separated list',
          default: 'common'
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
      const { target, ports = 'common', timeout = 10 } = args;
      return await scanFull(target, { ports, timeout });
    }
  },
  
  {
    name: 'scan_vulnerabilities',
    description: 'Scan for known vulnerabilities (CVEs) based on detected technologies. Use this when user asks about vulnerabilities, security issues, or CVEs. Automatically performs fingerprint scan if needed.',
    parameters: {
      type: 'object',
      properties: {
        target: {
          type: 'string',
          description: 'Target URL to scan for vulnerabilities (e.g., https://example.com)'
        },
        online: {
          type: 'boolean',
          description: 'Enable online CVE database queries for more accurate results (default: true)',
          default: true
        }
      },
      required: ['target']
    },
    handler: async (args) => {
      const { target, online = true } = args;
      return await scanVulnerabilities(target, null, online);
    }
  },
  
  {
    name: 'scan_waf',
    description: 'Detect Web Application Firewall (WAF) protecting the target. Use this when user asks about WAF, firewall, or security protection.',
    parameters: {
      type: 'object',
      properties: {
        target: {
          type: 'string',
          description: 'Target URL to scan for WAF (e.g., https://example.com)'
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
  },
  
  {
    name: 'security_audit',
    description: 'Perform comprehensive security audit on the local system. Checks configurations (SSH, firewall), analyzes logs for attacks (SSH, FTP, SMB brute force), and auto-bans malicious IPs. Use this when user asks to check system security, detect attacks, or audit configurations.',
    parameters: {
      type: 'object',
      properties: {},
      required: []
    },
    handler: async (args) => {
      return await performSecurityAudit();
    }
  }
];

/**
 * Execute a tool by name
 * @param {string} toolName - Name of the tool to execute
 * @param {Object} args - Arguments for the tool
 * @returns {Promise<Object>} - Tool execution result
 */
export async function executeTool(toolName, args) {
  const tool = SCANNER_TOOLS.find(t => t.name === toolName);
  
  if (!tool) {
    throw new Error(`Tool '${toolName}' not found`);
  }
  
  try {
    const result = await tool.handler(args);
    return result;
  } catch (error) {
    return {
      success: false,
      error: error.message,
      tool: toolName
    };
  }
}

/**
 * Get tool definitions for AI model (OpenAI function calling format)
 * @returns {Array<Object>} - Array of tool definitions
 */
export function getToolDefinitions() {
  return SCANNER_TOOLS.map(tool => ({
    type: 'function',
    function: {
      name: tool.name,
      description: tool.description,
      parameters: tool.parameters
    }
  }));
}

export default {
  SCANNER_TOOLS,
  executeTool,
  getToolDefinitions
};

