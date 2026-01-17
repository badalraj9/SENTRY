/**
 * Ask Command - Assistant Query Interface
 */

import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import * as api from '../api.js';
import * as config from '../config.js';
import { error, header, output, info } from '../output.js';

export const askCommand = new Command('ask')
  .description('Ask the SENTRY assistant')
  .argument('<query...>', 'Your question')
  .option('-p, --project <id>', 'Project ID')
  .option('-c, --chat <id>', 'Chat ID for context')
  .option('-m, --mode <mode>', 'Mode: analyst, advisor, or facilitator')
  .action(async (queryParts, options) => {
    const projectId = options.project || config.getDefaultProject();
    if (!projectId) {
      error('No project specified. Use --project or set default with `sentry project use`');
      return;
    }

    const query = queryParts.join(' ');
    const spinner = ora('Thinking...').start();

    const result = await api.askAssistant(query, projectId, options.chat, options.mode);
    spinner.stop();

    if (result.error) {
      error(result.error);
      return;
    }

    const response = result.data as {
      mode: string;
      answer: string;
      sources: Array<{
        type: string;
        id: string;
        statement: string;
      }>;
      suggestions?: string[];
    };

    output(response, () => {
      // Mode indicator
      const modeColors: Record<string, typeof chalk.cyan> = {
        analyst: chalk.cyan,
        advisor: chalk.magenta,
        facilitator: chalk.yellow,
      };
      const modeColor = modeColors[response.mode] || chalk.white;
      console.log(modeColor(`[${response.mode.toUpperCase()}]`));
      console.log();

      // Answer
      console.log(response.answer);

      // Sources
      if (response.sources.length > 0) {
        console.log();
        console.log(chalk.dim('Sources:'));
        for (const source of response.sources.slice(0, 3)) {
          console.log(chalk.dim(`  • ${source.type}: ${source.statement.slice(0, 60)}...`));
        }
      }

      // Suggestions
      if (response.suggestions && response.suggestions.length > 0) {
        console.log();
        console.log(chalk.blue('Suggestions:'));
        for (const suggestion of response.suggestions) {
          console.log(chalk.blue(`  → ${suggestion}`));
        }
      }
    });
  });
