#!/usr/bin/env node

import { PipelineStorage } from '../pipeline-storage.js';
import chalk from 'chalk';

/**
 * CLI script to list all available pipelines
 */
async function listPipelines() {
  try {
    console.log(chalk.blue('Available Pipelines:'));
    console.log(chalk.blue('-------------------'));

    const storage = new PipelineStorage();
    const pipelines = storage.findPipelines('');

    if (pipelines.length === 0) {
      console.log(chalk.yellow('No pipelines found.'));
      return;
    }

    // Display pipelines in a table format
    pipelines.forEach((pipeline) => {
      console.log(chalk.green(`\n${pipeline.name} (${pipeline.id})`));
      console.log(chalk.white(`Description: ${pipeline.description}`));
      console.log(chalk.white(`Steps: ${Object.keys(pipeline.steps).length}`));
      console.log(chalk.white(`Start Step: ${pipeline.startStep}`));
    });

    console.log(`\n${chalk.blue('Total pipelines:')} ${pipelines.length}`);
  } catch (error) {
    console.error(chalk.red('Error listing pipelines:'), error);
    process.exit(1);
  }
}

// Execute the command
listPipelines(); 