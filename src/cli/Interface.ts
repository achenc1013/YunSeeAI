/**
 * CLI Interface - Interactive command-line interface
 */

import inquirer from 'inquirer';
import chalk from 'chalk';
import ora from 'ora';
import { CommandHandler } from './CommandHandler.js';
import { AssistantService } from '../ai/AssistantService.js';

export class CLIInterface {
  private commandHandler: CommandHandler;
  private isRunning: boolean = false;

  constructor(assistant: AssistantService) {
    this.commandHandler = new CommandHandler(assistant);
  }

  /**
   * Display welcome banner
   */
  private showBanner(): void {
    console.clear();
    console.log(chalk.cyan.bold(`
╔══════════════════════════════════════════════════════════════╗
║                                                              ║
║   ██╗   ██╗██╗   ██╗███╗   ██╗███████╗███████╗███████╗       ║
║   ╚██╗ ██╔╝██║   ██║████╗  ██║██╔════╝██╔════╝██╔════╝       ║
║    ╚████╔╝ ██║   ██║██╔██╗ ██║███████╗█████╗  █████╗         ║
║     ╚██╔╝  ██║   ██║██║╚██╗██║╚════██║██╔══╝  ██╔══╝         ║
║      ██║   ╚██████╔╝██║ ╚████║███████║███████╗███████╗       ║
║      ╚═╝    ╚═════╝ ╚═╝  ╚═══╝╚══════╝╚══════╝╚══════╝       ║
║                                                              ║
║              AI-Powered Security Assistant                   ║
║                    Version 1.0.0                             ║
╚══════════════════════════════════════════════════════════════╝
`));
    
    console.log(chalk.white('  Welcome to YunSeeAI - Your intelligent security companion\n'));
    console.log(chalk.gray('  Type') + chalk.cyan(' /help ') + chalk.gray('for commands or just chat naturally'));
    console.log(chalk.gray('  Press') + chalk.cyan(' Ctrl+C ') + chalk.gray('or type') + chalk.cyan(' exit ') + chalk.gray('to quit\n'));
  }

  /**
   * Start the interactive CLI loop
   */
  async start(): Promise<void> {
    this.showBanner();
    this.isRunning = true;

    while (this.isRunning) {
      try {
        const { input } = await inquirer.prompt([
          {
            type: 'input',
            name: 'input',
            message: chalk.green('🛡️  You'),
            prefix: '',
          },
        ]);

        if (!input.trim()) {
          continue;
        }

        const response = await this.commandHandler.processInput(input);

        if (response === 'EXIT') {
          await this.exit();
          break;
        }

        if (response) {
          console.log(response);
        }

      } catch (error) {
        if ((error as any).isTtyError) {
          console.error(chalk.red('✗ CLI interface not supported in this environment'));
          break;
        } else {
          console.error(chalk.red(`✗ Error: ${error}`));
        }
      }
    }
  }

  /**
   * Stop the CLI
   */
  async exit(): Promise<void> {
    console.log(chalk.cyan('\n👋 Thank you for using YunSeeAI. Stay secure!\n'));
    this.isRunning = false;
    process.exit(0);
  }

  /**
   * Show loading spinner
   */
  showLoading(message: string): any {
    return ora({
      text: message,
      color: 'cyan',
      spinner: 'dots',
    }).start();
  }

  /**
   * Display error message
   */
  showError(message: string): void {
    console.log(chalk.red(`\n✗ Error: ${message}\n`));
  }

  /**
   * Display success message
   */
  showSuccess(message: string): void {
    console.log(chalk.green(`\n✓ ${message}\n`));
  }

  /**
   * Display info message
   */
  showInfo(message: string): void {
    console.log(chalk.blue(`\nℹ ${message}\n`));
  }
}

