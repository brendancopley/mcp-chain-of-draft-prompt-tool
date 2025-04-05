#!/usr/bin/env node

/**
 * CLI script to list available tools
 */
console.log('Available Tools:');
console.log('----------------');

// In a real implementation, this would fetch tools from the registry
console.log('\nmath_solve');
console.log('Description: Solve a math problem with Chain of Draft');
console.log('Parameters:');
console.log('  - problem (required): The math problem to solve');
console.log('  - max_words_per_step (optional): Maximum words per step');

console.log('\ncode_solve');
console.log('Description: Solve a coding problem with Chain of Draft');
console.log('Parameters:');
console.log('  - problem (required): The coding problem to solve');
console.log('  - max_words_per_step (optional): Maximum words per step');

console.log('\nlogic_solve');
console.log('Description: Solve a logic problem with Chain of Draft');
console.log('Parameters:');
console.log('  - problem (required): The logic problem to solve');
console.log('  - max_words_per_step (optional): Maximum words per step');

console.log('\nTotal tools: 3'); 