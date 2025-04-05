#!/usr/bin/env node

/**
 * CLI script to list available pipelines
 */
console.log('Available Pipelines:');
console.log('-------------------');

// In a real implementation, this would use PipelineStorage
// to list actual pipelines from storage
console.log('Example Data Analysis Pipeline');
console.log('Description: A pipeline that loads data, analyzes it, and generates a report');
console.log('Steps: 5');

console.log('\nExample Batch Processing Pipeline');
console.log('Description: Process multiple items in a batch using a loop');
console.log('Steps: 6');

console.log('\nTotal pipelines: 2'); 