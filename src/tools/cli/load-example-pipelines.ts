#!/usr/bin/env node

import { PipelineStorage } from '../pipeline-storage.js';
import { createExamplePipelines } from '../example-pipelines.js';
import chalk from 'chalk';

/**
 * CLI script to load example pipelines
 */
async function loadExamplePipelines() {
  try {
    console.log(chalk.blue('Loading Example Pipelines:'));
    console.log(chalk.blue('------------------------'));

    const storage = new PipelineStorage();
    
    // Get the current count of pipelines
    const beforeCount = storage.findPipelines('').length;
    
    // Load example pipelines
    createExamplePipelines(storage);
    
    // Get the updated count
    const afterCount = storage.findPipelines('').length;
    const newCount = afterCount - beforeCount;
    
    if (newCount > 0) {
      console.log(chalk.green(`Successfully loaded ${newCount} example pipelines!`));
      
      // List the loaded pipelines
      console.log(chalk.white('\nAvailable pipelines:'));
      const pipelines = storage.findPipelines('');
      pipelines.forEach((pipeline) => {
        console.log(chalk.green(`- ${pipeline.name} (${pipeline.id})`));
      });
    } else {
      console.log(chalk.yellow('No new example pipelines were loaded.'));
    }
  } catch (error) {
    console.error(chalk.red('Error loading example pipelines:'), error);
    process.exit(1);
  }
}

// Execute the command
loadExamplePipelines(); 