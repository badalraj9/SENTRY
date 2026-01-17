/**
 * CLI Output Utilities
 * Handles formatted output for human and JSON modes
 */

import chalk from 'chalk';
import { getOutputFormat } from './config.js';

export function output(data: unknown, humanFormat?: () => void): void {
  const format = getOutputFormat();

  if (format === 'json') {
    console.log(JSON.stringify(data, null, 2));
  } else if (humanFormat) {
    humanFormat();
  } else {
    console.log(data);
  }
}

export function success(message: string): void {
  if (getOutputFormat() === 'human') {
    console.log(chalk.green('✓'), message);
  }
}

export function error(message: string): void {
  console.error(chalk.red('✗'), message);
}

export function warn(message: string): void {
  if (getOutputFormat() === 'human') {
    console.log(chalk.yellow('⚠'), message);
  }
}

export function info(message: string): void {
  if (getOutputFormat() === 'human') {
    console.log(chalk.blue('ℹ'), message);
  }
}

export function header(text: string): void {
  if (getOutputFormat() === 'human') {
    console.log();
    console.log(chalk.bold.underline(text));
    console.log();
  }
}

export function table(rows: Record<string, unknown>[], columns: string[]): void {
  if (getOutputFormat() === 'json') {
    console.log(JSON.stringify(rows, null, 2));
    return;
  }

  if (rows.length === 0) {
    console.log(chalk.gray('No items'));
    return;
  }

  // Calculate column widths
  const widths: Record<string, number> = {};
  for (const col of columns) {
    widths[col] = Math.max(
      col.length,
      ...rows.map(r => String(r[col] || '').length)
    );
  }

  // Header
  const headerLine = columns
    .map(col => chalk.bold(col.toUpperCase().padEnd(widths[col])))
    .join('  ');
  console.log(headerLine);
  console.log(chalk.gray('─'.repeat(headerLine.length)));

  // Rows
  for (const row of rows) {
    const line = columns
      .map(col => String(row[col] || '-').padEnd(widths[col]))
      .join('  ');
    console.log(line);
  }
}

export function decision(d: {
  id: string;
  statement: string;
  rationale?: string;
  confidence?: number;
  createdAt: string | Date;
}): void {
  if (getOutputFormat() === 'json') {
    console.log(JSON.stringify(d, null, 2));
    return;
  }

  console.log(chalk.bold(d.statement));
  if (d.rationale) {
    console.log(chalk.gray(`  ${d.rationale}`));
  }
  console.log(
    chalk.dim(`  ID: ${d.id.slice(0, 8)} | `) +
    chalk.dim(`Confidence: ${((d.confidence || 1) * 100).toFixed(0)}% | `) +
    chalk.dim(`Created: ${new Date(d.createdAt).toLocaleDateString()}`)
  );
}

export function proposal(p: {
  id: string;
  statement: string;
  confidence: number;
  createdAt: string | Date;
}): void {
  if (getOutputFormat() === 'json') {
    console.log(JSON.stringify(p, null, 2));
    return;
  }

  console.log(chalk.yellow('●'), chalk.bold(p.statement));
  console.log(
    chalk.dim(`  ID: ${p.id.slice(0, 8)} | `) +
    chalk.cyan(`Confidence: ${(p.confidence * 100).toFixed(0)}% | `) +
    chalk.dim(`Proposed: ${new Date(p.createdAt).toLocaleDateString()}`)
  );
}
