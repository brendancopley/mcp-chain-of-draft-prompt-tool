#!/usr/bin/env node

import { ToolRegistry } from '../registry.js';
import { Tool } from '../types.js';
import chalk from 'chalk';

/**
 * CLI script to list all available tools in the registry
 */
async function listTools() {
  try {
    console.log(chalk.blue('Available Tools:'));
    console.log(chalk.blue('----------------'));

    const registry = new ToolRegistry();
    // Get all tools from the registry
    const tools = registry.getAllTools();

    if (tools.length === 0) {
      console.log(chalk.yellow('No tools found in registry.'));
      return;
    }

    // Display tools in a table format
    tools.forEach((tool: Tool) => {
      console.log(chalk.green(`\n${tool.name}`));
      console.log(chalk.white(`Description: ${tool.description}`));
      
      if (tool.parameters.length > 0) {
        console.log(chalk.white('Parameters:'));
        tool.parameters.forEach(param => {
          const required = param.required ? chalk.red('(required)') : chalk.gray('(optional)');
          console.log(`  - ${param.name} ${required}: ${param.description}`);
        });
      } else {
        console.log(chalk.white('Parameters: None'));
      }
    });

    console.log(`\n${chalk.blue('Total tools:')} ${tools.length}`);
  } catch (error) {
    console.error(chalk.red('Error listing tools:'), error);
    process.exit(1);
  }
}

// Execute the command
listTools(); 