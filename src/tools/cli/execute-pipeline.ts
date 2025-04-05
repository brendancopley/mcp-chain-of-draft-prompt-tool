#!/usr/bin/env node

import { PipelineStorage } from '../pipeline-storage.js';
import { PipelineExecutor } from '../pipeline-executor.js';
import { ToolRegistry } from '../registry.js';
import chalk from 'chalk';

/**
 * CLI script to execute a pipeline
 */
async function executePipeline() {
  try {
    // Parse command line arguments
    const args = process.argv.slice(2);
    
    if (args.length < 1) {
      console.error(chalk.red('Error: Pipeline ID is required'));
      console.log(chalk.blue('Usage: npm run pipeline:execute <pipelineId> [inputs]'));
      console.log(chalk.blue('Example: npm run pipeline:execute data-analysis-pipeline \'{"dataSource": "sample.csv"}\''));
      process.exit(1);
    }
    
    const pipelineId = args[0];
    let inputs = {};
    
    // Parse inputs if provided
    if (args.length > 1) {
      try {
        inputs = JSON.parse(args[1]);
      } catch (error) {
        console.error(chalk.red('Error parsing inputs JSON:'), error);
        process.exit(1);
      }
    }
    
    console.log(chalk.blue(`Executing Pipeline: ${pipelineId}`));
    console.log(chalk.blue('------------------------------'));
    
    // Initialize components
    const storage = new PipelineStorage();
    const registry = new ToolRegistry();
    const executor = new PipelineExecutor(registry, storage);
    
    // Get the pipeline
    const pipeline = storage.getPipeline(pipelineId);
    
    if (!pipeline) {
      console.error(chalk.red(`Pipeline not found with ID: ${pipelineId}`));
      process.exit(1);
    }
    
    console.log(chalk.green(`Found pipeline: ${pipeline.name}`));
    console.log(chalk.white(`Description: ${pipeline.description}`));
    console.log(chalk.white(`Steps: ${Object.keys(pipeline.steps).length}`));
    
    if (Object.keys(inputs).length > 0) {
      console.log(chalk.white(`Inputs: ${JSON.stringify(inputs)}`));
    }
    
    console.log(chalk.blue('\nStarting execution...'));
    
    // Execute the pipeline
    const startTime = Date.now();
    const result = await executor.executePipeline(pipeline, inputs);
    const endTime = Date.now();
    
    console.log(chalk.blue('\nExecution completed.'));
    console.log(chalk.white(`Status: ${result.status}`));
    console.log(chalk.white(`Execution time: ${(endTime - startTime) / 1000} seconds`));
    
    if (result.status === 'completed') {
      console.log(chalk.green('\nResults:'));
      // Print step results in execution order
      result.executionPath.forEach(stepId => {
        const stepResult = result.results[stepId];
        if (stepResult) {
          console.log(chalk.white(`\nStep: ${stepId}`));
          console.log(chalk.white(`Success: ${stepResult.success}`));
          if (stepResult.data) {
            console.log(chalk.white('Data:'));
            console.log(stepResult.data);
          }
          if (stepResult.error) {
            console.log(chalk.red('Error:'));
            console.log(stepResult.error);
          }
        }
      });
    } else if (result.status === 'failed') {
      console.log(chalk.red('\nExecution failed:'));
      console.log(result.error);
    } else if (result.status === 'waiting_for_human') {
      console.log(chalk.yellow('\nWaiting for human input:'));
      console.log(chalk.white(`Step: ${result.currentStepId}`));
      console.log(chalk.white(`Execution ID: ${result.executionId}`));
      console.log(chalk.blue('\nTo provide human input, use:'));
      console.log(chalk.white(`npm run pipeline:human-response ${result.executionId} <approved> <input>`));
    }
  } catch (error) {
    console.error(chalk.red('Error executing pipeline:'), error);
    process.exit(1);
  }
}

// Execute the command
executePipeline(); 