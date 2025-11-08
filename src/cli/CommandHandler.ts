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
      
      case 'kb':
      case 'knowledge':
        return await this.handleKnowledgeBaseCommand(args);
      
      case 'debug':
        return this.handleDebugCommand(args);
      
      case 'exit':
      case 'quit':
        return 'EXIT';
      
      default:
        return chalk.yellow(`Unknown command: ${cmd}\nType /help for available commands`);
    }
  }

  /**
   * Handle knowledge base commands
   */
  private async handleKnowledgeBaseCommand(args: string[]): Promise<string> {
    if (args.length === 0) {
      return this.showKnowledgeBaseHelp();
    }

    const subCommand = args[0].toLowerCase();
    const kb = this.assistant.getKnowledgeBase();

    switch (subCommand) {
      case 'add': {
        // Add knowledge from text
        if (args.length < 2) {
          return chalk.yellow('用法: /kb add <知识内容>\n示例: /kb add Python是一种高级编程语言');
        }
        
        const content = args.slice(1).join(' ');
        const entry = kb.addKnowledge(content, 'manual');
        
        return chalk.green(`✓ 知识已添加到知识库\n`) +
               chalk.gray(`   ID: ${entry.id}\n`) +
               chalk.gray(`   内容: ${content.substring(0, 50)}${content.length > 50 ? '...' : ''}`);
      }

      case 'addfile': {
        // Add knowledge from file
        if (args.length < 2) {
          return chalk.yellow('用法: /kb addfile <文件路径>\n示例: /kb addfile ./docs/readme.md');
        }
        
        const filePath = args[1];
        const entry = kb.addFromFile(filePath);
        
        if (entry) {
          return chalk.green(`✓ 已从文件添加知识到知识库\n`) +
                 chalk.gray(`   文件: ${filePath}\n`) +
                 chalk.gray(`   ID: ${entry.id}\n`) +
                 chalk.gray(`   大小: ${entry.content.length} 字符`);
        } else {
          return chalk.red(`✗ 无法读取文件: ${filePath}`);
        }
      }

      case 'list': {
        // List all knowledge entries
        const entries = kb.getAllKnowledge();
        
        if (entries.length === 0) {
          return chalk.yellow('知识库为空\n使用 /kb add 或 /kb addfile 添加知识');
        }

        let output = chalk.cyan(`\n📚 知识库列表 (共 ${entries.length} 条):\n\n`);
        
        for (const entry of entries.slice(0, 10)) {
          output += chalk.white(`${entry.id}\n`);
          output += chalk.gray(`  来源: ${entry.source}${entry.sourceDetail ? ` (${entry.sourceDetail})` : ''}\n`);
          output += chalk.gray(`  时间: ${new Date(entry.timestamp).toLocaleString('zh-CN')}\n`);
          
          const preview = entry.content.substring(0, 100).replace(/\n/g, ' ');
          output += chalk.gray(`  内容: ${preview}${entry.content.length > 100 ? '...' : ''}\n\n`);
        }

        if (entries.length > 10) {
          output += chalk.gray(`... 还有 ${entries.length - 10} 条知识\n`);
        }

        return output;
      }

      case 'search': {
        // Search knowledge base
        if (args.length < 2) {
          return chalk.yellow('用法: /kb search <查询内容>\n示例: /kb search Python编程');
        }

        const query = args.slice(1).join(' ');
        const results = kb.search(query, 5);

        if (results.length === 0) {
          return chalk.yellow(`未找到与 "${query}" 相关的知识`);
        }

        let output = chalk.cyan(`\n🔍 搜索结果 (共 ${results.length} 条):\n\n`);

        for (let i = 0; i < results.length; i++) {
          const result = results[i];
          output += chalk.white(`${i + 1}. ${result.entry.id} (相关度: ${(result.score * 100).toFixed(0)}%)\n`);
          output += chalk.gray(`   来源: ${result.entry.source}${result.entry.sourceDetail ? ` (${result.entry.sourceDetail})` : ''}\n`);
          
          const preview = result.entry.content.substring(0, 150).replace(/\n/g, ' ');
          output += chalk.gray(`   ${preview}${result.entry.content.length > 150 ? '...' : ''}\n`);
          output += chalk.yellow(`   匹配关键词: ${result.matchedKeywords.join(', ')}\n\n`);
        }

        return output;
      }

      case 'delete': {
        // Delete knowledge entry
        if (args.length < 2) {
          return chalk.yellow('用法: /kb delete <知识ID>\n示例: /kb delete kb_1234567890_abc123');
        }

        const id = args[1];
        const success = kb.deleteKnowledge(id);

        if (success) {
          return chalk.green(`✓ 已删除知识: ${id}`);
        } else {
          return chalk.red(`✗ 未找到知识ID: ${id}`);
        }
      }

      case 'stats': {
        // Show statistics
        const stats = kb.getStats();
        
        let output = chalk.cyan('\n📊 知识库统计:\n\n');
        output += chalk.white(`  总条目数: ${stats.totalEntries}\n`);
        output += chalk.white(`  总大小: ${(stats.totalSize / 1024).toFixed(2)} KB\n\n`);
        
        if (Object.keys(stats.bySource).length > 0) {
          output += chalk.white('  按来源分类:\n');
          for (const [source, count] of Object.entries(stats.bySource)) {
            output += chalk.gray(`    ${source}: ${count} 条\n`);
          }
        }

        return output;
      }

      case 'clear': {
        // Clear all knowledge (with confirmation)
        const entries = kb.getAllKnowledge();
        if (entries.length === 0) {
          return chalk.yellow('知识库已经是空的');
        }

        kb.clearAll();
        return chalk.green(`✓ 已清空知识库 (删除了 ${entries.length} 条知识)`);
      }

      case 'semantic': {
        // Toggle semantic search
        if (args.length < 2) {
          const isEnabled = kb.isSemanticSearchEnabled();
          return chalk.cyan(`\n🧠 语义搜索: ${isEnabled ? chalk.green('开启') : chalk.gray('关闭')}\n`) +
                 chalk.gray(`   用法: /kb semantic on|off\n`);
        }

        const action = args[1].toLowerCase();
        if (action === 'on') {
          kb.setSemanticSearch(true);
          return chalk.green(`\n✓ 语义搜索已开启\n`) +
                 chalk.gray(`   现在会根据句意理解问题，而不只是关键词匹配\n`);
        } else if (action === 'off') {
          kb.setSemanticSearch(false);
          return chalk.yellow(`\n✓ 语义搜索已关闭\n`) +
                 chalk.gray(`   恢复为传统关键词匹配模式\n`);
        } else {
          return chalk.yellow(`未知选项: ${action}\n用法: /kb semantic on|off`);
        }
      }

      case 'help':
        return this.showKnowledgeBaseHelp();

      default:
        return chalk.yellow(`未知的知识库命令: ${subCommand}\n使用 /kb help 查看帮助`);
    }
  }

  /**
   * Handle debug command
   */
  private handleDebugCommand(args: string[]): string {
    if (args.length === 0 || args[0].toLowerCase() === 'status') {
      const isEnabled = this.assistant.isDebugMode();
      return chalk.cyan(`\n🔧 调试模式: ${isEnabled ? chalk.green('开启') : chalk.gray('关闭')}\n`);
    }

    const action = args[0].toLowerCase();
    
    switch (action) {
      case 'on':
      case 'enable':
        this.assistant.enableDebugMode();
        return chalk.green(`\n✓ 调试模式已开启\n`) +
               chalk.gray(`   现在您可以看到:\n`) +
               chalk.gray(`   • 知识库检索详情\n`) +
               chalk.gray(`   • AI接收到的完整上下文\n`) +
               chalk.gray(`   • 关键词匹配情况\n`);
      
      case 'off':
      case 'disable':
        this.assistant.disableDebugMode();
        return chalk.green(`\n✓ 调试模式已关闭\n`);
      
      default:
        return chalk.yellow(`未知的调试命令: ${action}\n`) +
               chalk.gray(`用法:\n`) +
               chalk.gray(`  /debug on     - 开启调试模式\n`) +
               chalk.gray(`  /debug off    - 关闭调试模式\n`) +
               chalk.gray(`  /debug status - 查看状态\n`);
    }
  }

  /**
   * Show knowledge base help
   */
  private showKnowledgeBaseHelp(): string {
    return chalk.cyan(`
╔══════════════════════════════════════════════════════════════╗
║                   知识库管理命令                              ║
╚══════════════════════════════════════════════════════════════╝

${chalk.bold('基本命令:')}
  /kb add <内容>          添加知识到知识库
  /kb addfile <文件>      从文件添加知识（支持相对/绝对路径）
  /kb list                列出所有知识
  /kb search <查询>       搜索知识库
  /kb delete <ID>         删除指定知识
  /kb stats               显示知识库统计
  /kb semantic on/off     开启/关闭语义搜索
  /kb clear               清空知识库
  /kb help                显示此帮助

${chalk.bold('使用示例:')}
  /kb add Python是一种高级编程语言，广泛应用于数据分析
  /kb addfile ./docs/security-guide.md
  /kb search Python
  /kb delete kb_1234567890_abc123

${chalk.bold('知识库特性:')}
  • 🧠 AI自动学习知识库内容
  • 🔍 智能语义搜索（理解句意，非关键词匹配）
  • 📁 支持多种文件格式 (txt, md, json等)
  • 📂 支持相对路径和绝对路径
  • 🎯 优先级: 网络搜索 > 知识库 > 普通对话

${chalk.bold('语义搜索示例:')}
  问题: "Python适合做什么？"
  也能匹配: "Python应用领域" "Python用途" "Python使用场景"
  
  传统关键词只能匹配 "Python" + "做什么"
  语义搜索能理解 "应用" = "用途" = "适合做" = "使用场景"

${chalk.bold('提示:')}
  当你向AI提问时，系统会自动搜索知识库中的相关内容，
  并结合这些知识为你提供更准确的回答。
`);
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
      // More inclusive: include URL/IP pattern detection
      const hasTarget = /https?:\/\/|(?:\d{1,3}\.){3}\d{1,3}/.test(lowerInput);
      
      const scanKeywords = [
        // Explicit scanning actions
        'scan', 'nmap', '扫描', '检测',
        
        // Security audit
        'security audit', 'system security', '安全审计', '系统安全', '安全检查',
        
        // Action + target patterns (these imply scanning)
        '有waf', '有防火墙', '啥框架', '啥cms', '啥waf',
        '用了什么', '用了啥', '用的什么', '用的啥',
        '用着什么', '用着啥', '使用了什么', '使用了啥',
        '开了哪些', '开放了哪些', '运行了什么',
        
        // Do NOT include bare technical terms (cms, waf, framework)
        // Those are checked separately with hasTarget
      ];
      
      // Determine if this is a scan request
      // Priority 1: Has target + technical keyword = definitely a scan
      // Priority 2: Has scan-specific keywords (scan, audit, etc.)
      const hasTechnicalTerm = [
        'waf', 'cms', 'framework', 'port', 
        'vulnerability', 'vulnerabilities', 'cve', 'exploit',
        '框架', '端口', '防火墙', '漏洞', 'CVE'
      ].some(t => lowerInput.includes(t));
      const hasScanKeyword = scanKeywords.some(kw => lowerInput.includes(kw));
      
      const isScanRequest = (hasTarget && hasTechnicalTerm) || hasScanKeyword;
      
      if (isScanRequest) {
        // Use intelligent intent classification (enhanced pattern matching + LLM ready)
        let intent = null;
        
        try {
          // Try LLM-based intent classifier first (uses enhanced patterns)
          // @ts-ignore
          const { classifyIntent } = await import('../../scanner/llm-intent-classifier.js');
          const classified = await classifyIntent(input);
          
          if (classified.success && classified.intent) {
            // LLM classifier succeeded, now extract target if needed
            if (classified.intent === 'security_audit') {
              // Security audit doesn't need target
              intent = {
                success: true,
                intent: 'security_audit',
                target: null,
                tool: 'security_audit',
                method: classified.method,
                confidence: classified.confidence
              };
              process.stdout.write(chalk.gray(`   💡 智能理解: ${classified.method === 'llm-understanding' ? 'AI模型理解' : '增强语义分析'}\n`));
            } else {
              // Other intents need target, use semantic parser for extraction
              // @ts-ignore
              const { parseSemanticIntent } = await import('../../scanner/semantic-intent-parser.js');
              intent = parseSemanticIntent(input);
              
              // Override intent with LLM classification if semantic parser succeeded
              if (intent.success) {
                intent.intent = classified.intent;
                intent.method = classified.method;
                process.stdout.write(chalk.gray(`   💡 智能理解: 增强语义分析\n`));
              }
            }
          } else {
            // Fallback to semantic parser
            // @ts-ignore
            const { parseSemanticIntent } = await import('../../scanner/semantic-intent-parser.js');
            intent = parseSemanticIntent(input);
            
            if (intent.success) {
              process.stdout.write(chalk.gray(`   💡 智能理解: 语义分析识别意图\n`));
            }
          }
        } catch (error) {
          // Final fallback
          console.error('[Intent Classifier] Failed, using final fallback:', error);
          // @ts-ignore
          const { parseIntent } = await import('../../scanner/ai-integration.js');
          intent = parseIntent(input);
        }
        
        // Security audit doesn't need a target (scans local system)
        const needsTarget = intent.intent !== 'security_audit';
        
        if (intent.success && (intent.target || !needsTarget)) {
          // This is a valid scan request - execute it
          process.stdout.write(chalk.yellow('\n🔍 检测到扫描请求，正在执行扫描...\n'));
          if (intent.target) {
            process.stdout.write(chalk.gray(`   目标: ${intent.target}\n`));
          } else {
            process.stdout.write(chalk.gray(`   目标: 本地系统\n`));
          }
          process.stdout.write(chalk.gray(`   类型: ${intent.intent}\n\n`));
          
          try {
            // Execute the scan with the already-parsed intent
            const scanResult = await processQuery(input, intent);
            
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
              else if (intent.intent === 'security_audit') {
                // Security audit display
                const auditData = scanResult.raw_results;
                if (auditData.success) {
                  displayResult += `🔒 系统安全审计报告\n\n`;
                  displayResult += `系统类型: ${auditData.os_type} (${auditData.os_name})\n`;
                  displayResult += `扫描时间: ${new Date(auditData.timestamp).toLocaleString('zh-CN')}\n\n`;
                  
                  // Display configuration issues
                  if (auditData.config_issues && auditData.config_issues.length > 0) {
                    displayResult += chalk.yellow(`⚠️  配置安全问题 (${auditData.config_issues.length}):\n\n`);
                    
                    const highIssues = auditData.config_issues.filter((i: any) => i.severity === 'high');
                    const mediumIssues = auditData.config_issues.filter((i: any) => i.severity === 'medium');
                    const lowIssues = auditData.config_issues.filter((i: any) => i.severity === 'low');
                    
                    if (highIssues.length > 0) {
                      displayResult += chalk.red(`  🔴 高危 (${highIssues.length}):\n`);
                      highIssues.forEach((issue: any) => {
                        displayResult += `     • ${issue.service}: ${issue.issue}\n`;
                        displayResult += chalk.gray(`       建议: ${issue.recommendation}\n`);
                      });
                      displayResult += '\n';
                    }
                    
                    if (mediumIssues.length > 0) {
                      displayResult += chalk.yellow(`  🟡 中危 (${mediumIssues.length}):\n`);
                      mediumIssues.forEach((issue: any) => {
                        displayResult += `     • ${issue.service}: ${issue.issue}\n`;
                      });
                      displayResult += '\n';
                    }
                    
                    if (lowIssues.length > 0) {
                      displayResult += chalk.blue(`  🔵 低危 (${lowIssues.length}):\n`);
                      lowIssues.forEach((issue: any) => {
                        displayResult += `     • ${issue.service}: ${issue.issue}\n`;
                      });
                      displayResult += '\n';
                    }
                  } else {
                    displayResult += chalk.green(`  ✅ 未发现配置安全问题\n\n`);
                  }
                  
                  // Display log analysis results
                  if (auditData.log_analysis && Object.keys(auditData.log_analysis).length > 0) {
                    displayResult += chalk.red(`🚨 攻击检测:\n\n`);
                    
                    if (auditData.log_analysis.ssh) {
                      const sshData = auditData.log_analysis.ssh;
                      displayResult += `  📊 SSH暴力破解尝试:\n`;
                      displayResult += `     总失败次数: ${sshData.total_failed_attempts}\n`;
                      
                      if (sshData.suspicious_ips && sshData.suspicious_ips.length > 0) {
                        displayResult += chalk.red(`     可疑IP (${sshData.suspicious_ips.length}):\n`);
                        sshData.suspicious_ips.slice(0, 5).forEach((ip: any) => {
                          const threatIcon = ip.threat_level === 'high' ? '🔴' : '🟡';
                          displayResult += `       ${threatIcon} ${ip.ip} - ${ip.failed_attempts}次失败\n`;
                        });
                        if (sshData.suspicious_ips.length > 5) {
                          displayResult += chalk.gray(`       ... 还有${sshData.suspicious_ips.length - 5}个可疑IP\n`);
                        }
                      }
                      displayResult += '\n';
                    }
                    
                    if (auditData.log_analysis.ftp) {
                      displayResult += `  📊 FTP登录失败: ${auditData.log_analysis.ftp.total_failed_attempts}次\n\n`;
                    }
                    
                    if (auditData.log_analysis.smb) {
                      displayResult += `  📊 SMB登录失败: ${auditData.log_analysis.smb.total_failed_attempts}次\n\n`;
                    }
                  }
                  
                  // Display banned IPs
                  if (auditData.banned_ips && auditData.banned_ips.length > 0) {
                    displayResult += chalk.green(`✅ 自动封禁 (${auditData.banned_ips.length}个IP):\n\n`);
                    auditData.banned_ips.forEach((ban: any) => {
                      displayResult += `  🛡️  ${ban.ip}\n`;
                      displayResult += `     失败次数: ${ban.failed_attempts}\n`;
                      displayResult += `     封禁方式: ${ban.method}\n`;
                      displayResult += chalk.gray(`     时间: ${new Date(ban.timestamp).toLocaleString('zh-CN')}\n`);
                    });
                    displayResult += '\n';
                  }
                  
                  // Display recommendations
                  if (auditData.recommendations && auditData.recommendations.length > 0) {
                    displayResult += chalk.cyan(`💡 安全建议:\n\n`);
                    auditData.recommendations.forEach((rec: string) => {
                      displayResult += `  • ${rec}\n`;
                    });
                  }
                  
                  // Generate AI context
                  const highCount = auditData.config_issues ? auditData.config_issues.filter((i: any) => i.severity === 'high').length : 0;
                  const bannedCount = auditData.banned_ips ? auditData.banned_ips.length : 0;
                  aiContext = `系统安全审计完成。发现${highCount}个高危配置问题，`;
                  aiContext += bannedCount > 0 ? `自动封禁了${bannedCount}个攻击IP。` : '未检测到活跃攻击。';
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
              } else if (intent.intent === 'security_audit') {
                aiPrompt = `${aiContext}\n\n分析系统安全状况和建议。中文，2-3句。`;
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
  /kb, /knowledge     Knowledge base management (use /kb help)
  /debug on/off       Enable/disable debug mode (see AI context)
  /exit, /quit        Exit YunSeeAI

${chalk.bold('Knowledge Base Commands:')}
  /kb add <内容>      Add knowledge to knowledge base
  /kb addfile <文件>  Add knowledge from file
  /kb list            List all knowledge entries
  /kb search <查询>   Search knowledge base
  /kb help            Show knowledge base help

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
  • 🧠 AI automatically learns from knowledge base
  • Press Ctrl+C to exit at any time

${chalk.bold('Module Status:')}
  🛡️  AI Assistant    - Active
  📚 Knowledge Base   - Active (AI自主学习)
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
    
    const kb = this.assistant.getKnowledgeBase();
    const kbStats = kb.getStats();

    return chalk.cyan(`
╔══════════════════════════════════════════════════════════════╗
║                    System Status                             ║
╚══════════════════════════════════════════════════════════════╝

${chalk.bold('AI Model:')}
  Status:             ${chalk.green('✓ Active')}
  Context Usage:      ${usage}% (${tokenCount}/${maxTokens} tokens)
  
${chalk.bold('Knowledge Base:')}
  Status:             ${chalk.green('✓ Active')}
  Entries:            ${kbStats.totalEntries} 条
  Total Size:         ${(kbStats.totalSize / 1024).toFixed(2)} KB
  
${chalk.bold('Modules:')}
  🛡️  AI Assistant    ${chalk.green('✓ Running')}
  📚 Knowledge Base   ${chalk.green('✓ Running')}
  🔒 WAF Module       ${chalk.gray('○ Standby')}
  🔍 Scanner Module   ${chalk.gray('○ Standby')}
  ⚙️  Audit Module    ${chalk.gray('○ Standby')}

${chalk.bold('Session:')}
  Messages:           ${this.assistant.getHistory().length - 1}
  ${tokenCount > maxTokens * 0.8 ? chalk.yellow('⚠ Context nearly full - consider /clear') : ''}
`);
  }
}

