/**
 * CLI Configuration
 * Handles API endpoint and credentials storage
 */

import Conf from 'conf';

interface ConfigSchema {
  apiUrl: string;
  apiKey: string | null;
  defaultProjectId: string | null;
  outputFormat: 'human' | 'json';
}

export const config = new Conf<ConfigSchema>({
  projectName: 'sentry-cli',
  defaults: {
    apiUrl: 'http://localhost:3000',
    apiKey: null,
    defaultProjectId: null,
    outputFormat: 'human',
  },
});

export function getApiUrl(): string {
  return config.get('apiUrl');
}

export function setApiUrl(url: string): void {
  config.set('apiUrl', url);
}

export function getApiKey(): string | null {
  return config.get('apiKey');
}

export function setApiKey(key: string): void {
  config.set('apiKey', key);
}

export function clearApiKey(): void {
  config.set('apiKey', null);
}

export function getDefaultProject(): string | null {
  return config.get('defaultProjectId');
}

export function setDefaultProject(projectId: string): void {
  config.set('defaultProjectId', projectId);
}

export function getOutputFormat(): 'human' | 'json' {
  return config.get('outputFormat');
}

export function setOutputFormat(format: 'human' | 'json'): void {
  config.set('outputFormat', format);
}

export function isAuthenticated(): boolean {
  return !!config.get('apiKey');
}
