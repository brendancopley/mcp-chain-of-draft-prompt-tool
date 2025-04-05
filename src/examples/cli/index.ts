#!/usr/bin/env node

/**
 * Example CLI tools index file
 */

// Re-export CLI scripts without import statements to avoid TypeScript errors
// These will be copied to the dist directory during build

// Define example pipeline configurations for reference
export const examplePipelines = {
  'math-pipeline': {
    name: 'Math Pipeline',
    description: 'A pipeline that adds two numbers using Chain of Draft',
    steps: ['formulate_problem', 'solve_problem']
  },
  'data-analysis-pipeline': {
    name: 'Data Analysis Pipeline',
    description: 'A pipeline that loads data, analyzes it, and generates a report',
    steps: ['load_data', 'clean_data', 'analyze_data', 'generate_report', 'handle_error']
  },
  'batch-processing-pipeline': {
    name: 'Batch Processing Pipeline',
    description: 'Process multiple items in a batch using a loop',
    steps: ['initialize', 'process_items', 'process_single_item', 'validate_result', 'save_result', 'handle_source_error']
  }
}; 