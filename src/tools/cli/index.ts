#!/usr/bin/env node

/**
 * CLI tools index file - exports all CLI tools
 */

// Re-export CLI scripts without import statements to avoid TypeScript errors
// These will be copied to the dist directory during build

// Export common types and utilities
export interface CLIToolOptions {
  verbose?: boolean;
  color?: boolean;
  output?: 'json' | 'table' | 'text';
}

// Export a registry of all CLI tools with their names and descriptions
export const cliTools = {
  'list-tools': 'List all available tools in the registry',
  'list-pipelines': 'List all available pipelines',
  'execute-pipeline': 'Execute a pipeline with given inputs',
  'load-example-pipelines': 'Load example pipelines into storage',
  'check-pipeline-status': 'Check the status of a pipeline execution'
}; 