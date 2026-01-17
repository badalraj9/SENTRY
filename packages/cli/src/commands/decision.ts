/**
 * Decision Commands
 */

import { Command } from 'commander';
import prompts from 'prompts';
import chalk from 'chalk';
import * as api from '../api.js';
import * as config from '../config.js';
import { success, error, header, output, decision as formatDecision, proposal as formatProposal } from '../output.js';

export const decisionCommand = new Command('decision')
  .description('Decision management commands')
  .alias('d');

/**
 * Get project ID from option or default
 */
function getProjectId(options: { project?: string }): string | null {
  return options.project || config.getDefaultProject();
}

/**
 * sentry decision list
 */
decisionCommand
  .command('list')
  .alias('ls')
  .description('List decisions')
  .option('-p, --project <id>', 'Project ID')
  .option('-n, --limit <count>', 'Number of decisions', '10')
  .action(async (options) => {
    const projectId = getProjectId(options);
    if (!projectId) {
      error('No project specified');
      return;
    }

    const result = await api.getDecisions(projectId);
    if (result.error) {
      error(result.error);
      return;
    }

    const decisions = result.data as Array<{
      id: string;
      statement: string;
      rationale?: string;
      confidence: number;
      createdAt: string;
    }>;

    output(decisions, () => {
      header('Decisions');
      for (const d of decisions.slice(0, parseInt(options.limit))) {
        formatDecision(d);
        console.log();
      }
    });
  });

/**
 * sentry decision search
 */
decisionCommand
  .command('search')
  .description('Search decisions')
  .argument('<query>', 'Search query')
  .option('-p, --project <id>', 'Project ID')
  .action(async (query, options) => {
    const projectId = getProjectId(options);
    if (!projectId) {
      error('No project specified');
      return;
    }

    const result = await api.searchDecisions(projectId, query);
    if (result.error) {
      error(result.error);
      return;
    }

    const decisions = result.data as Array<{
      id: string;
      statement: string;
      rationale?: string;
      confidence: number;
      createdAt: string;
    }>;

    output(decisions, () => {
      header(`Search Results for "${query}"`);
      if (decisions.length === 0) {
        console.log(chalk.gray('No decisions found'));
        return;
      }
      for (const d of decisions) {
        formatDecision(d);
        console.log();
      }
    });
  });

/**
 * sentry decision create
 */
decisionCommand
  .command('create')
  .description('Create a manual decision')
  .option('-p, --project <id>', 'Project ID')
  .option('-s, --statement <text>', 'Decision statement')
  .option('-r, --rationale <text>', 'Decision rationale')
  .action(async (options) => {
    const projectId = getProjectId(options);
    if (!projectId) {
      error('No project specified');
      return;
    }

    let statement = options.statement;
    let rationale = options.rationale;

    if (!statement) {
      const response = await prompts([
        {
          type: 'text',
          name: 'statement',
          message: 'Decision statement:',
        },
        {
          type: 'text',
          name: 'rationale',
          message: 'Rationale (optional):',
        },
      ]);
      statement = response.statement;
      rationale = response.rationale;
    }

    if (!statement) {
      error('Statement required');
      return;
    }

    const result = await api.createDecision(projectId, statement, rationale);
    if (result.error) {
      error(result.error);
      return;
    }

    success('Decision recorded');
    output(result.data);
  });

/**
 * sentry decision proposals
 */
decisionCommand
  .command('proposals')
  .description('List pending proposals')
  .action(async () => {
    const result = await api.getPendingProposals();
    if (result.error) {
      error(result.error);
      return;
    }

    const proposals = result.data as Array<{
      id: string;
      statement: string;
      confidence: number;
      createdAt: string;
    }>;

    output(proposals, () => {
      header('Pending Proposals');
      if (proposals.length === 0) {
        console.log(chalk.gray('No pending proposals'));
        return;
      }
      for (const p of proposals) {
        formatProposal(p);
        console.log();
      }
    });
  });

/**
 * sentry decision approve
 */
decisionCommand
  .command('approve')
  .description('Approve a proposal')
  .argument('<proposal-id>', 'Proposal ID')
  .option('-p, --project <id>', 'Project ID')
  .action(async (proposalId, options) => {
    const projectId = getProjectId(options);
    if (!projectId) {
      error('No project specified');
      return;
    }

    const result = await api.approveProposal(proposalId, projectId);
    if (result.error) {
      error(result.error);
      return;
    }

    success('Proposal approved and decision recorded');
    output(result.data);
  });

/**
 * sentry decision reject
 */
decisionCommand
  .command('reject')
  .description('Reject a proposal')
  .argument('<proposal-id>', 'Proposal ID')
  .option('-p, --project <id>', 'Project ID')
  .action(async (proposalId, options) => {
    const projectId = getProjectId(options);
    if (!projectId) {
      error('No project specified');
      return;
    }

    const result = await api.rejectProposal(proposalId, projectId);
    if (result.error) {
      error(result.error);
      return;
    }

    success('Proposal rejected');
  });
