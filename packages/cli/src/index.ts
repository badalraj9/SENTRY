#!/usr/bin/env node
/**
 * SENTRY CLI
 * Command-line interface for the Developer Collaboration OS
 */

import { Command } from 'commander';
import chalk from 'chalk';
import { authCommand, projectCommand, decisionCommand, askCommand } from './commands/index.js';
import { isAuthenticated } from './config.js';

const program = new Command();

program
  .name('sentry')
  .description('SENTRY - Developer Collaboration OS')
  .version('0.1.0')
  .option('--json', 'Output in JSON format')
  .hook('preAction', (thisCommand) => {
    // Set JSON output if requested
    if (thisCommand.opts().json) {
      const { setOutputFormat } = require('./config.js');
      setOutputFormat('json');
    }

    // Check auth for commands that need it
    const noAuthCommands = ['auth', 'help'];
    const commandName = thisCommand.args[0];
    if (!noAuthCommands.includes(commandName) && !isAuthenticated()) {
      console.log(chalk.yellow('⚠'), 'Not authenticated. Run `sentry auth login` first.');
      process.exit(1);
    }
  });

// Register commands
program.addCommand(authCommand);
program.addCommand(projectCommand);
program.addCommand(decisionCommand);
program.addCommand(askCommand);

// Banner
if (process.argv.length === 2) {
  console.log();
  console.log(chalk.bold.cyan('  ╔═══════════════════════════════════════╗'));
  console.log(chalk.bold.cyan('  ║   SENTRY - Developer Collaboration OS ║'));
  console.log(chalk.bold.cyan('  ╚═══════════════════════════════════════╝'));
  console.log();
  console.log(chalk.gray('  Decision intelligence for development teams.'));
  console.log();
  program.outputHelp();
} else {
  program.parse();
}
