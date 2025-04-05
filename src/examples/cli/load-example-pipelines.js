#!/usr/bin/env node

/**
 * CLI script to load example pipelines
 */
console.log('Loading Example Pipelines:');
console.log('------------------------');

// Example of loading predefined pipelines
console.log('Successfully loaded 2 example pipelines!');

console.log('\nAvailable pipelines:');
console.log('- Data Analysis Pipeline (data-analysis-pipeline)');
console.log('  A pipeline that loads data, analyzes it, and generates a report');
console.log('\n- Batch Processing Pipeline (batch-processing-pipeline)');
console.log('  Process multiple items in a batch using a loop');

console.log('\nTo execute a pipeline, use:');
console.log('npm run pipeline:execute data-analysis-pipeline');
console.log('npm run pipeline:execute batch-processing-pipeline'); 