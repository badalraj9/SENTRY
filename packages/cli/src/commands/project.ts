/**
 * Project Commands
 */

import { Command } from 'commander';
import prompts from 'prompts';
import * as api from '../api.js';
import * as config from '../config.js';
import { success, error, header, table, output } from '../output.js';

export const projectCommand = new Command('project')
  .description('Project management commands');

/**
 * sentry project list
 */
projectCommand
  .command('list')
  .alias('ls')
  .description('List your projects')
  .action(async () => {
    const result = await api.getProjects();
    if (result.error) {
      error(result.error);
      return;
    }

    const projects = result.data as Array<{
      id: string;
      name: string;
      visibility: string;
      createdAt: string;
    }>;

    output(projects, () => {
      header('Your Projects');
      table(
        projects.map(p => ({
          id: p.id.slice(0, 8),
          name: p.name,
          visibility: p.visibility,
          created: new Date(p.createdAt).toLocaleDateString(),
        })),
        ['id', 'name', 'visibility', 'created']
      );
    });
  });

/**
 * sentry project create
 */
projectCommand
  .command('create')
  .description('Create a new project')
  .argument('[name]', 'Project name')
  .option('-d, --description <desc>', 'Project description')
  .action(async (name, options) => {
    let projectName = name;

    if (!projectName) {
      const response = await prompts({
        type: 'text',
        name: 'name',
        message: 'Project name:',
      });
      projectName = response.name;
    }

    if (!projectName) {
      error('Project name required');
      return;
    }

    const result = await api.createProject(projectName, options.description);
    if (result.error) {
      error(result.error);
      return;
    }

    const project = result.data as { id: string; name: string };
    success(`Created project: ${project.name}`);
    output(project);
  });

/**
 * sentry project use
 */
projectCommand
  .command('use')
  .description('Set default project for commands')
  .argument('<project-id>', 'Project ID')
  .action((projectId) => {
    config.setDefaultProject(projectId);
    success(`Default project set: ${projectId.slice(0, 8)}...`);
  });

/**
 * sentry project show
 */
projectCommand
  .command('show')
  .description('Show project details')
  .argument('[project-id]', 'Project ID (uses default if not specified)')
  .action(async (projectId) => {
    const id = projectId || config.getDefaultProject();
    if (!id) {
      error('No project specified. Use --project or set a default with `sentry project use`');
      return;
    }

    const result = await api.getProject(id);
    if (result.error) {
      error(result.error);
      return;
    }

    const project = result.data as {
      id: string;
      name: string;
      description: string;
      visibility: string;
      createdAt: string;
    };

    output(project, () => {
      header(project.name);
      console.log(`ID:          ${project.id}`);
      console.log(`Description: ${project.description || '-'}`);
      console.log(`Visibility:  ${project.visibility}`);
      console.log(`Created:     ${new Date(project.createdAt).toLocaleString()}`);
    });
  });
