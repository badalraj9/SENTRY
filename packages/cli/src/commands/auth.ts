/**
 * Auth Commands
 */

import { Command } from 'commander';
import prompts from 'prompts';
import chalk from 'chalk';
import * as api from '../api.js';
import * as config from '../config.js';
import { success, error, info, header } from '../output.js';

export const authCommand = new Command('auth')
  .description('Authentication commands');

/**
 * sentry auth login
 */
authCommand
  .command('login')
  .description('Login with email and password, then generate an API key')
  .action(async () => {
    if (config.isAuthenticated()) {
      const { confirm } = await prompts({
        type: 'confirm',
        name: 'confirm',
        message: 'Already logged in. Re-authenticate?',
        initial: false,
      });
      if (!confirm) return;
    }

    const response = await prompts([
      {
        type: 'text',
        name: 'email',
        message: 'Email:',
      },
      {
        type: 'password',
        name: 'password',
        message: 'Password:',
      },
    ]);

    if (!response.email || !response.password) {
      error('Login cancelled');
      return;
    }

    info('Authenticating...');

    const loginResult = await api.login(response.email, response.password);
    if (loginResult.error) {
      error(`Login failed: ${loginResult.error}`);
      return;
    }

    // Temporarily set the access token to create an API key
    config.setApiKey(loginResult.data!.accessToken);

    // Create a CLI API key
    const keyResult = await api.createApiKey('sentry-cli');
    if (keyResult.error) {
      error(`Failed to create API key: ${keyResult.error}`);
      config.clearApiKey();
      return;
    }

    // Save the permanent API key
    config.setApiKey(keyResult.data!.key);

    success('Logged in successfully!');
    info(`API key created: ${keyResult.data!.apiKey.prefix}...`);
  });

/**
 * sentry auth logout
 */
authCommand
  .command('logout')
  .description('Remove stored credentials')
  .action(() => {
    config.clearApiKey();
    success('Logged out');
  });

/**
 * sentry auth status
 */
authCommand
  .command('status')
  .description('Check authentication status')
  .action(async () => {
    if (!config.isAuthenticated()) {
      info('Not logged in');
      console.log(chalk.dim('Run `sentry auth login` to authenticate'));
      return;
    }

    const apiKey = config.getApiKey();
    if (apiKey) {
      success('Authenticated');
      console.log(chalk.dim(`API key: ${apiKey.slice(0, 12)}...`));
    }
  });

/**
 * sentry auth config
 */
authCommand
  .command('config')
  .description('View or update CLI configuration')
  .option('--api-url <url>', 'Set API URL')
  .option('--format <format>', 'Set output format (human|json)')
  .action((options) => {
    if (options.apiUrl) {
      config.setApiUrl(options.apiUrl);
      success(`API URL set to ${options.apiUrl}`);
    }

    if (options.format) {
      if (options.format !== 'human' && options.format !== 'json') {
        error('Format must be "human" or "json"');
        return;
      }
      config.setOutputFormat(options.format);
      success(`Output format set to ${options.format}`);
    }

    if (!options.apiUrl && !options.format) {
      header('Current Configuration');
      console.log(`API URL:     ${config.getApiUrl()}`);
      console.log(`Output:      ${config.getOutputFormat()}`);
      console.log(`Logged in:   ${config.isAuthenticated() ? 'Yes' : 'No'}`);
    }
  });
