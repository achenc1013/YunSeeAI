/**
 * Command Handler - Processes CLI commands
 */

import { AssistantService } from '../ai/AssistantService.js';
import chalk from 'chalk';

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

      // Send to AI for processing
      let response = '';
      process.stdout.write(chalk.blue('\n🤖 YunSeeAI: '));
      
      response = await this.assistant.sendMessage(input, (token) => {
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
  🔍 Scanner Module   - Available (use: "scan ports")
  ⚙️  Audit Module    - Available (use: "audit config")
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

