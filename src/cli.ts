#!/usr/bin/env node

/**
 * YunSeeAI CLI Entry Point
 */

import { ModelServer } from './ai/ModelServer.js';
import { AssistantService } from './ai/AssistantService.js';
import { KnowledgeBase } from './ai/KnowledgeBase.js';
import { WebSearch } from './ai/WebSearch.js';
import { CLIInterface } from './cli/Interface.js';
import { DEFAULT_CONFIG } from './config/default.js';
import chalk from 'chalk';
import { existsSync } from 'fs';

async function main() {
  const cli = new CLIInterface(
    new AssistantService(
      new ModelServer(DEFAULT_CONFIG.ai)
    )
  );

  // Show loading message
  const spinner = cli.showLoading('Initializing YunSeeAI...');

  try {
    // Check if model file exists
    if (!existsSync(DEFAULT_CONFIG.ai.modelPath)) {
      spinner.fail();
      console.log(chalk.red('\n✗ Model file not found!'));
      console.log(chalk.yellow(`\nExpected location: ${DEFAULT_CONFIG.ai.modelPath}`));
      console.log(chalk.gray('\nPlease ensure the GGUF model file is in the project root directory.'));
      console.log(chalk.gray('You can download models from: https://huggingface.co/\n'));
      process.exit(1);
    }

    // Initialize model server
    spinner.text = 'Loading AI model (this may take a minute)...';
    
    const modelServer = new ModelServer(DEFAULT_CONFIG.ai);
    
    // Listen to model loading events
    modelServer.on('status', (message: string) => {
      spinner.text = message;
    });

    modelServer.on('error', (error: Error) => {
      spinner.fail();
      cli.showError(`Failed to load model: ${error.message}`);
      process.exit(1);
    });

    await modelServer.initialize();
    
    spinner.succeed('AI model loaded successfully');

    // Initialize knowledge base and web search
    console.log(chalk.cyan('📚 Initializing knowledge base...'));
    const knowledgeBase = new KnowledgeBase(DEFAULT_CONFIG.knowledgeBase.storagePath);
    const kbStats = knowledgeBase.getStats();
    console.log(chalk.gray(`   Loaded ${kbStats.totalEntries} knowledge entries`));

    const webSearch = new WebSearch(DEFAULT_CONFIG.webSearch);

    // Create assistant service with knowledge base
    const assistant = new AssistantService(
      modelServer,
      DEFAULT_CONFIG.prompts.system,
      knowledgeBase,
      webSearch
    );
    
    // Create new CLI with initialized assistant
    const mainCLI = new CLIInterface(assistant);

    // Handle graceful shutdown
    process.on('SIGINT', async () => {
      console.log(chalk.yellow('\n\n⚠ Shutting down gracefully...'));
      await modelServer.dispose();
      console.log(chalk.cyan('👋 Goodbye!\n'));
      process.exit(0);
    });

    // Start interactive CLI
    await mainCLI.start();

  } catch (error) {
    spinner.fail();
    cli.showError(`Initialization failed: ${error}`);
    console.error(error);
    process.exit(1);
  }
}

// Run the CLI
main().catch((error) => {
  console.error(chalk.red('\n✗ Fatal error:'), error);
  process.exit(1);
});

