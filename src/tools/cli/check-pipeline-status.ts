#!/usr/bin/env node

import { PipelineStorage } from '../pipeline-storage.js';
import { PipelineExecutor } from '../pipeline-executor.js';
import { ToolRegistry } from '../registry.js';
import chalk from 'chalk';

/**
 * CLI script to check the status of a pipeline execution
 */
async function checkPipelineStatus() {
  try {
    // Parse command line arguments
    const args = process.argv.slice(2);
    
    if (args.length < 1) {
      console.error(chalk.red('Error: Execution ID is required'));
      console.log(chalk.blue('Usage: npm run pipeline:status <executionId>'));
      process.exit(1);
    }
    
    const executionId = args[0];
    
    console.log(chalk.blue(`Checking Pipeline Execution Status: ${executionId}`));
    console.log(chalk.blue('-------------------------------------------'));
    
    // Initialize components
    const storage = new PipelineStorage();
    const registry = new ToolRegistry();
    const executor = new PipelineExecutor(registry, storage);
    
    // Get the execution state
    const state = executor.getExecutionState(executionId);
    
    if (!state) {
      console.error(chalk.red(`No execution found with ID: ${executionId}`));
      
      // List active executions
      const activeExecutions = executor.listActiveExecutions();
      if (activeExecutions.length > 0) {
        console.log(chalk.yellow('\nActive executions:'));
        activeExecutions.forEach(execution => {
          console.log(chalk.white(`- ${execution.executionId} (Pipeline: ${execution.pipelineId}, Status: ${execution.status})`));
        });
      } else {
        console.log(chalk.yellow('\nNo active executions found.'));
      }
      
      process.exit(1);
    }
    
    // Display execution information
    console.log(chalk.green(`\nExecution ID: ${state.executionId}`));
    console.log(chalk.white(`Pipeline ID: ${state.pipelineId}`));
    console.log(chalk.white(`Status: ${state.status}`));
    console.log(chalk.white(`Current Step: ${state.currentStepId}`));
    console.log(chalk.white(`Start Time: ${new Date(state.startTime).toLocaleString()}`));
    console.log(chalk.white(`Last Update: ${new Date(state.lastUpdateTime).toLocaleString()}`));
    console.log(chalk.white(`Duration: ${(state.lastUpdateTime - state.startTime) / 1000} seconds`));
    
    // Show execution path
    console.log(chalk.blue('\nExecution Path:'));
    state.executionPath.forEach((stepId, index) => {
      console.log(chalk.white(`${index + 1}. ${stepId}`));
    });
    
    // Show step results
    console.log(chalk.blue('\nStep Results:'));
    Object.entries(state.results).forEach(([stepId, result]) => {
      console.log(chalk.green(`\nStep: ${stepId}`));
      console.log(chalk.white(`Success: ${result.success}`));
      
      if (result.data) {
        console.log(chalk.white('Data:'));
        console.log(result.data);
      }
      
      if (result.error) {
        console.log(chalk.red('Error:'));
        console.log(result.error);
      }
    });
    
    // Special handling for waiting_for_human status
    if (state.status === 'waiting_for_human') {
      console.log(chalk.yellow('\nWaiting for human input:'));
      console.log(chalk.white(`Step: ${state.currentStepId}`));
      console.log(chalk.blue('\nTo provide human input, use:'));
      console.log(chalk.white(`npm run pipeline:human-response ${state.executionId} <approved> <input>`));
    }
    
  } catch (error) {
    console.error(chalk.red('Error checking pipeline status:'), error);
    process.exit(1);
  }
}

// Execute the command
checkPipelineStatus(); 