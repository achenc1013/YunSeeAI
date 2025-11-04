/**
 * Command Handler - Processes CLI commands
 */

import { AssistantService } from '../ai/AssistantService.js';
import chalk from 'chalk';
// Import scanner functionality
// @ts-ignore - Scanner module is pure JS
import { parseIntent, processQuery } from '../../scanner/ai-integration.js';
// @ts-ignore - Scanner module is pure JS
import { formatScanResults } from '../../scanner/scanner-client.js';

export class CommandHandler {
  private assistant: AssistantService;

  constructor(assistant: AssistantService) {
    this.assistant = assistant;
  }

  /**
   * Process a command or natural language input
   */
  async processInput(input: string): Promise<string | null> {
    const trimmed = input.trim();
    
    if (!trimmed) {
      return null;
    }

    // Check for built-in commands
    if (trimmed.startsWith('/')) {
      return await this.handleCommand(trimmed);
    }

    // Otherwise, treat as natural language query to AI
    return await this.handleNaturalLanguage(trimmed);
  }

  /**
   * Handle built-in commands
   */
  private async handleCommand(command: string): Promise<string> {
    const [cmd, ...args] = command.slice(1).split(' ');

    switch (cmd.toLowerCase()) {
      case 'help':
        return this.showHelp();
      
      case 'clear':
        this.assistant.clearHistory();
        return chalk.green('✓ Conversation history cleared');
      
      case 'history':
        return this.showHistory();
      
      case 'status':
        return this.showStatus();
      
      case 'reset':
        await this.assistant.clearHistory();
        return chalk.green('✓ Session reset');
      
      case 'exit':
      case 'quit':
        return 'EXIT';
      
      default:
        return chalk.yellow(`Unknown command: ${cmd}\nType /help for available commands`);
    }
  }

  /**
   * Handle natural language input
   */
  private async handleNaturalLanguage(input: string): Promise<string> {
    try {
      // Check for common quick commands
      const lowerInput = input.toLowerCase();
      
      if (lowerInput === 'help') {
        return this.showHelp();
      }
      
      if (lowerInput === 'exit' || lowerInput === 'quit') {
        return 'EXIT';
      }

      // Check if this is a scanning request
      const scanKeywords = [
        'scan', 'port', 'ports', 'framework', 'technology', 'technologies',
        'fingerprint', 'website', 'open', 'service', 'services',
        'vulnerability', 'vulnerabilities', 'cve', 'exploit', 'security issue',
        'cms', 'nmap', 'port scan', 'waf', 'firewall',
        '扫描', '端口', '框架', '技术', '网站', '开放', '漏洞', '安全漏洞', '安全问题',
        '端口扫描', '开通', '提供', '运行', '服务', 'CMS', '内容管理系统',
        '哪些服务', '什么服务', '开了哪些', '提供了什么', '运行了什么',
        'WAF', '防火墙', '防护'
      ];
      
      const isScanRequest = scanKeywords.some(kw => lowerInput.includes(kw));
      
      if (isScanRequest) {
        // Use semantic pattern matching for intelligent understanding
        let intent = null;
        
        try {
          // Import semantic parser
          // @ts-ignore
          const { parseSemanticIntent } = await import('../../scanner/semantic-intent-parser.js');
          
          // Try semantic understanding
          intent = parseSemanticIntent(input);
          
          if (intent.success && intent.method === 'semantic-understanding') {
            process.stdout.write(chalk.gray(`   💡 智能理解: 语义分析识别意图\n`));
          }
        } catch (error) {
          // Fallback to simple keyword parsing
          console.error('[Semantic Parser] Failed, using fallback:', error);
          // @ts-ignore
          const { parseIntent } = await import('../../scanner/ai-integration.js');
          intent = parseIntent(input);
        }
        
        if (intent.success && intent.target) {
          // This is a valid scan request - execute it
          process.stdout.write(chalk.yellow('\n🔍 检测到扫描请求，正在执行扫描...\n'));
          process.stdout.write(chalk.gray(`   目标: ${intent.target}\n`));
          process.stdout.write(chalk.gray(`   类型: ${intent.intent}\n\n`));
          
          try {
            // Execute the scan
            const scanResult = await processQuery(input);
            
            if (scanResult.success) {
              // Show scan results
              process.stdout.write(chalk.green('✓ 扫描完成！\n\n'));
              process.stdout.write(chalk.cyan('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n'));
              process.stdout.write(chalk.bold('📊 扫描结果:\n\n'));
              
              // Display ONLY what user asked for
              let displayResult = '';
              let aiContext = '';
              
              if (intent.intent === 'vulnerability') {
                // Only show vulnerability scan results
                const vulnData = scanResult.raw_results;
                if (vulnData.success) {
                  displayResult += `目标: ${vulnData.target}\n`;
                  displayResult += `扫描模式: ${vulnData.scan_mode || '本地+在线'}\n\n`;
                  
                  if (vulnData.total_vulnerabilities > 0) {
                    displayResult += `发现漏洞: ${vulnData.total_vulnerabilities} 个\n\n`;
                    
                    // Group by severity
                    const bySeverity: any = {
                      'Critical': [],
                      'High': [],
                      'Medium': [],
                      'Low': [],
                      'Unknown': []
                    };
                    
                    vulnData.vulnerabilities.forEach((vuln: any) => {
                      const severity = vuln.severity || 'Unknown';
                      if (!bySeverity[severity]) bySeverity[severity] = [];
                      bySeverity[severity].push(vuln);
                    });
                    
                    // Display by severity
                    for (const [severity, vulns] of Object.entries(bySeverity) as [string, any[]][]) {
                      if (vulns.length === 0) continue;
                      
                      const severityIcon: any = {
                        'Critical': '🔴',
                        'High': '🟠',
                        'Medium': '🟡',
                        'Low': '🟢',
                        'Unknown': '⚪'
                      };
                      
                      displayResult += `${severityIcon[severity]} ${severity} 级别 (${vulns.length}):\n`;
                      
                      vulns.forEach((vuln: any) => {
                        displayResult += `\n  【${vuln.cve_id}】\n`;
                        displayResult += `  组件: ${vuln.technology}`;
                        if (vuln.affected_version && vuln.affected_version !== 'unknown') {
                          displayResult += ` ${vuln.affected_version}`;
                        }
                        displayResult += '\n';
                        
                        if (vuln.description) {
                          const desc = vuln.description.length > 100 
                            ? vuln.description.substring(0, 100) + '...' 
                            : vuln.description;
                          displayResult += `  描述: ${desc}\n`;
                        }
                        
                        if (vuln.impact) {
                          displayResult += `  影响: ${vuln.impact}\n`;
                        }
                        
                        if (vuln.score) {
                          displayResult += `  CVSS: ${vuln.score}\n`;
                        }
                        
                        // Highlight if public exploit exists (searchsploit-like feature)
                        if (vuln.has_exploit || vuln.exploit_available) {
                          displayResult += chalk.red(`  ⚠️  公开Exploit存在`);
                          if (vuln.exploit_type) {
                            displayResult += ` (${vuln.exploit_type})`;
                          }
                          displayResult += `\n`;
                          displayResult += chalk.yellow(`  🔗 搜索Exploit: https://www.exploit-db.com/search?cve=${vuln.cve_id}\n`);
                        }
                      });
                      
                      displayResult += '\n';
                    }
                  } else {
                    displayResult += '  ✓ 未发现已知漏洞\n';
                  }
                  
                  aiContext = `目标 ${intent.target} 的漏洞扫描结果：`;
                  if (vulnData.total_vulnerabilities > 0) {
                    aiContext += `发现 ${vulnData.total_vulnerabilities} 个已知漏洞（CVE）。`;
                    const criticalCount = vulnData.vulnerabilities.filter((v: any) => v.severity === 'Critical').length;
                    const highCount = vulnData.vulnerabilities.filter((v: any) => v.severity === 'High').length;
                    if (criticalCount > 0) aiContext += `其中 ${criticalCount} 个严重漏洞。`;
                    if (highCount > 0) aiContext += `其中 ${highCount} 个高危漏洞。`;
                  } else {
                    aiContext += '未发现已知漏洞。';
                  }
                }
              }
              else if (intent.intent === 'port') {
                // Only show port scan results
                const portData = scanResult.raw_results.port_scan || scanResult.raw_results;
                if (portData.success) {
                  displayResult += `目标: ${portData.target} (${portData.target_ip || 'N/A'})\n`;
                  displayResult += `开放端口: ${portData.total_open}/${portData.total_scanned}\n\n`;
                  
                  if (portData.open_ports && portData.open_ports.length > 0) {
                    portData.open_ports.forEach((port: any) => {
                      displayResult += `  • 端口 ${port.port} (${port.service}) - ${port.state}\n`;
                      if (port.banner) {
                        displayResult += `    Banner: ${port.banner.substring(0, 60)}${port.banner.length > 60 ? '...' : ''}\n`;
                      }
                    });
                  } else {
                    displayResult += '  未发现开放端口\n';
                  }
                  
                  aiContext = `目标 ${intent.target} 的端口扫描结果：发现 ${portData.total_open} 个开放端口。`;
                  if (portData.open_ports && portData.open_ports.length > 0) {
                    aiContext += `开放端口包括：${portData.open_ports.map((p: any) => `${p.port}(${p.service})`).join(', ')}。`;
                  }
                }
              } 
              else if (intent.intent === 'waf') {
                // WAF detection display
                const wafData = scanResult.raw_results;
                if (wafData.success) {
                  displayResult += `目标: ${wafData.target}\n\n`;
                  
                  if (wafData.waf_detected && wafData.detected_wafs && wafData.detected_wafs.length > 0) {
                    displayResult += `🛡️  WAF检测结果:\n\n`;
                    
                    wafData.detected_wafs.forEach((waf: any) => {
                      const confidenceIcon: any = {
                        'high': '🟢',
                        'medium': '🟡',
                        'low': '⚪'
                      };
                      const icon = confidenceIcon[waf.confidence] || '⚪';
                      
                      displayResult += chalk.green(`  ${confidenceIcon} 检测到WAF: ${waf.name}\n`);
                      displayResult += `     置信度: ${waf.confidence}\n`;
                      displayResult += `     检测方式: ${waf.detection_method}\n`;
                      displayResult += '\n';
                    });
                    
                    // Simplified AI context
                    const wafNames = wafData.detected_wafs.map((w: any) => w.name).join('、');
                    aiContext = `目标${intent.target}使用了${wafNames}防火墙保护。`;
                  } else {
                    displayResult += chalk.yellow(`  未检测到WAF防护\n\n`);
                    displayResult += `  说明：\n`;
                    displayResult += `  • 目标网站可能未部署WAF\n`;
                    displayResult += `  • WAF可能采用了隐藏指纹技术\n`;
                    displayResult += `  • 目标可能使用自定义安全方案\n`;
                    
                    aiContext = `目标${intent.target}未检测到明显的WAF防护。`;
                  }
                }
              }
              else if (intent.intent === 'cms') {
                // CMS-specific display with clear identification
                const fpData = scanResult.raw_results.fingerprint_scan || scanResult.raw_results;
                if (fpData.success) {
                  displayResult += `目标: ${fpData.target}\n\n`;
                  
                  // Extract CMS systems
                  const cmsItems = fpData.technologies ? fpData.technologies.filter((t: any) => t.type === 'CMS') : [];
                  
                  if (cmsItems.length > 0) {
                    displayResult += `🎯 CMS识别结果:\n\n`;
                    cmsItems.forEach((cms: any) => {
                      displayResult += chalk.green(`  ✅ 检测到CMS: ${cms.name}\n`);
                      displayResult += `     置信度: ${cms.confidence}\n`;
                      if (cms.detected_path) {
                        displayResult += `     特征路径: ${cms.detected_path}\n`;
                      }
                      displayResult += '\n';
                    });
                    
                    // Show related tech (optional)
                    const otherTech = fpData.technologies?.filter((t: any) => t.type !== 'CMS') || [];
                    if (otherTech.length > 0) {
                      displayResult += `相关技术:\n`;
                      const byType: any = {};
                      otherTech.forEach((tech: any) => {
                        if (!byType[tech.type]) byType[tech.type] = [];
                        byType[tech.type].push(tech);
                      });
                      Object.entries(byType).forEach(([type, techs]: [string, any]) => {
                        displayResult += `  ${type}: ${techs.map((t: any) => t.name).join(', ')}\n`;
                      });
                    }
                    
                    // Simplified AI context - directly state the CMS
                    const cmsNames = cmsItems.map((c: any) => c.name).join('、');
                    aiContext = `目标${intent.target}使用了${cmsNames} CMS系统。`;
                  } else {
                    displayResult += chalk.yellow(`  未检测到CMS系统\n\n`);
                    displayResult += `  可能原因：\n`;
                    displayResult += `  • 使用自定义开发\n`;
                    displayResult += `  • 启用了指纹隐藏\n`;
                    displayResult += `  • 静态网站\n`;
                    
                    aiContext = `目标${intent.target}未检测到CMS系统，可能使用自定义开发。`;
                  }
                }
              }
              else if (intent.intent === 'waf') {
                // WAF detection display
                const wafData = scanResult.raw_results;
                if (wafData.success) {
                  displayResult += `目标: ${wafData.target}\n\n`;
                  
                  if (wafData.waf_detected) {
                    displayResult += chalk.yellow(`🛡️  WAF检测结果:\n\n`);
                    
                    if (wafData.detected_wafs && wafData.detected_wafs.length > 0) {
                      displayResult += chalk.green(`  ✅ 检测到WAF防护:\n\n`);
                      wafData.detected_wafs.forEach((waf: any) => {
                        displayResult += chalk.cyan(`     • ${waf.name}\n`);
                        displayResult += `       置信度: ${waf.confidence}\n`;
                      });
                      displayResult += '\n';
                      
                      // Simplified AI context
                      const wafNames = wafData.detected_wafs.map((w: any) => w.name).join('、');
                      aiContext = `目标${intent.target}使用了${wafNames} WAF防护。`;
                    } else if (wafData.generic_detection) {
                      displayResult += chalk.yellow(`  ⚠️  检测到通用WAF防护\n`);
                      displayResult += `     (无法识别具体WAF类型)\n\n`;
                      
                      aiContext = `目标${intent.target}存在WAF防护，但无法识别具体类型。`;
                    }
                    
                    displayResult += chalk.gray(`  提示: WAF防护可能影响扫描和测试结果\n`);
                  } else {
                    displayResult += chalk.green(`  ✅ 未检测到WAF防护\n\n`);
                    displayResult += `  说明:\n`;
                    displayResult += `  • 目标网站可能没有部署WAF\n`;
                    displayResult += `  • 或WAF配置较为隐蔽\n`;
                    
                    aiContext = `目标${intent.target}未检测到WAF防护。`;
                  }
                }
              }
              else if (intent.intent === 'framework') {
                // Framework/technology display
                const fpData = scanResult.raw_results.fingerprint_scan || scanResult.raw_results;
                if (fpData.success) {
                  displayResult += `目标: ${fpData.target}\n\n`;
                  
                  if (fpData.technologies && fpData.technologies.length > 0) {
                    displayResult += `检测到的技术 (${fpData.total_detected}):\n`;
                    
                    // Group by type
                    const byType: any = {};
                    fpData.technologies.forEach((tech: any) => {
                      if (!byType[tech.type]) byType[tech.type] = [];
                      byType[tech.type].push(tech);
                    });
                    
                    Object.entries(byType).forEach(([type, techs]: [string, any]) => {
                      displayResult += `\n  【${type}】\n`;
                      techs.forEach((tech: any) => {
                        displayResult += `    • ${tech.name} (置信度: ${tech.confidence})\n`;
                      });
                    });
                    
                    // Simplified AI context
                    const techList = fpData.technologies.map((t: any) => t.name).join('、');
                    aiContext = `目标${intent.target}使用了${techList}等技术。`;
                  } else {
                    displayResult += '  未能识别具体框架或技术栈\n';
                    aiContext = `目标${intent.target}未能识别具体技术栈。`;
                  }
                }
              }
              else {
                // Full scan - show everything
                displayResult = formatScanResults(scanResult.raw_results);
                aiContext = `完整扫描了 ${intent.target}，包含端口和技术栈信息。`;
              }
              
              process.stdout.write(displayResult + '\n');
              process.stdout.write(chalk.cyan('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n'));
              
              // Let AI provide additional insights based on what was scanned
              process.stdout.write(chalk.blue('🤖 YunSeeAI 分析:\n'));
              
              let aiPrompt = '';
              if (intent.intent === 'vulnerability') {
                aiPrompt = `${aiContext}\n\n简要分析漏洞风险和修复建议。中文，2-3句。`;
              } else if (intent.intent === 'port') {
                aiPrompt = `${aiContext}\n\n分析端口安全风险，给出建议。中文，2句话。`;
              } else if (intent.intent === 'waf') {
                aiPrompt = `${aiContext}\n\n分析WAF防护效果和建议。中文，2句话。`;
              } else if (intent.intent === 'cms') {
                aiPrompt = `${aiContext}\n\n分析CMS安全性和建议。中文，2句话。不要提端口。`;
              } else if (intent.intent === 'framework') {
                aiPrompt = `${aiContext}\n\n分析技术栈安全性。中文，2句话。`;
              } else {
                aiPrompt = `${aiContext}\n\n简要评估和建议。中文，保持简洁。`;
              }
              
              await this.assistant.sendMessage(aiPrompt, (token) => {
                process.stdout.write(token);
              });
              
              console.log('\n');
              return '';
            } else {
              process.stdout.write(chalk.red(`✗ 扫描失败: ${scanResult.error}\n\n`));
              
              // Ask AI for help
              process.stdout.write(chalk.blue('🤖 YunSeeAI: '));
              await this.assistant.sendMessage(
                `用户尝试扫描但失败了，错误信息：${scanResult.error}。请帮助用户理解问题并提供建议。`,
                (token) => {
                  process.stdout.write(token);
                }
              );
              console.log('\n');
              return '';
            }
          } catch (scanError) {
            process.stdout.write(chalk.red(`✗ 扫描出错: ${scanError}\n\n`));
          }
        }
      }

      // Not a scan request or failed to parse - send to AI normally
      process.stdout.write(chalk.blue('\n🤖 YunSeeAI: '));
      
      await this.assistant.sendMessage(input, (token) => {
        process.stdout.write(token);
      });

      console.log('\n');
      return '';
    } catch (error) {
      return chalk.red(`Error: ${error}`);
    }
  }

  /**
   * Show help information
   */
  private showHelp(): string {
    return chalk.cyan(`
╔══════════════════════════════════════════════════════════════╗
║                    YunSeeAI Commands                         ║
╚══════════════════════════════════════════════════════════════╝

${chalk.bold('Built-in Commands:')}
  /help               Show this help message
  /clear              Clear conversation history
  /history            Show conversation history
  /status             Show system status
  /reset              Reset the session
  /exit, /quit        Exit YunSeeAI

${chalk.bold('Natural Language Commands (examples):')}
  Check my server security configuration
  Scan for vulnerabilities
  Show me recent security threats
  How can I improve my SSH security?
  Analyze this log file for suspicious activity

${chalk.bold('Tips:')}
  • Just type naturally - the AI understands context
  • You can ask follow-up questions
  • Commands starting with / are system commands
  • Press Ctrl+C to exit at any time

${chalk.bold('Module Status:')}
  🛡️  AI Assistant    - Active
  🔒 WAF Module       - Available (use: "enable waf")
  🔍 Scanner Module   - Active (自动识别扫描请求)
  ⚙️  Audit Module    - Available (use: "audit config")

${chalk.bold('Scanner Examples (扫描示例):')}
  What ports are open on example.com?
  What framework does https://example.com use?
  扫描 example.com
  请告诉我 http://example.com 开放了哪些端口
  我想知道 https://github.com 用的什么框架
`);
  }

  /**
   * Show conversation history
   */
  private showHistory(): string {
    const history = this.assistant.getHistory();
    let output = chalk.cyan('\n📜 Conversation History:\n\n');

    for (const msg of history.slice(1)) { // Skip system prompt
      if (msg.role === 'user') {
        output += chalk.green(`👤 User: ${msg.content}\n\n`);
      } else if (msg.role === 'assistant') {
        output += chalk.blue(`🤖 Assistant: ${msg.content}\n\n`);
      }
    }

    output += chalk.gray(`\nTotal messages: ${history.length - 1}`);
    output += chalk.gray(`\nEstimated tokens: ${this.assistant.getTokenCount()}`);
    
    return output;
  }

  /**
   * Show system status
   */
  private showStatus(): string {
    const tokenCount = this.assistant.getTokenCount();
    const maxTokens = 4096; // From config
    const usage = ((tokenCount / maxTokens) * 100).toFixed(1);

    return chalk.cyan(`
╔══════════════════════════════════════════════════════════════╗
║                    System Status                             ║
╚══════════════════════════════════════════════════════════════╝

${chalk.bold('AI Model:')}
  Status:             ${chalk.green('✓ Active')}
  Context Usage:      ${usage}% (${tokenCount}/${maxTokens} tokens)
  
${chalk.bold('Modules:')}
  🛡️  AI Assistant    ${chalk.green('✓ Running')}
  🔒 WAF Module       ${chalk.gray('○ Standby')}
  🔍 Scanner Module   ${chalk.gray('○ Standby')}
  ⚙️  Audit Module    ${chalk.gray('○ Standby')}

${chalk.bold('Session:')}
  Messages:           ${this.assistant.getHistory().length - 1}
  ${tokenCount > maxTokens * 0.8 ? chalk.yellow('⚠ Context nearly full - consider /clear') : ''}
`);
  }
}

