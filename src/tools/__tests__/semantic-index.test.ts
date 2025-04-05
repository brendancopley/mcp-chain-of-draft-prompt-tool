import { describe, it, expect, beforeEach } from '@jest/globals';
import { SemanticIndex } from '../semantic-index.js';
import { Tool } from '../types.js';

describe('Semantic Index', () => {
  let index: SemanticIndex;
  let calculatorTool: Tool;
  let weatherTool: Tool;
  let draftTool: Tool;

  beforeEach(() => {
    index = new SemanticIndex();
    
    // Define sample tools
    calculatorTool = {
      name: 'calculator',
      description: 'Performs basic math operations like add, subtract, multiply and divide',
      parameters: [
        {
          name: 'operation',
          type: 'string',
          description: 'The operation to perform (add, subtract, multiply, divide)',
          required: true
        },
        {
          name: 'numbers',
          type: 'array',
          description: 'The numbers to operate on',
          required: true
        }
      ],
      execute: async () => ({ success: true, data: {}, metrics: { startTime: 0, endTime: 0, latencyMs: 0 } })
    };
    
    weatherTool = {
      name: 'weather',
      description: 'Gets current weather information for a location',
      parameters: [
        {
          name: 'location',
          type: 'string',
          description: 'The city or location to get weather for',
          required: true
        }
      ],
      execute: async () => ({ success: true, data: {}, metrics: { startTime: 0, endTime: 0, latencyMs: 0 } })
    };
    
    draftTool = {
      name: 'chain-of-draft',
      description: 'Transforms prompts using chain-of-draft reasoning',
      parameters: [
        {
          name: 'problem',
          type: 'string',
          description: 'The problem to solve with chain of thought',
          required: true
        }
      ],
      execute: async () => ({ success: true, data: {}, metrics: { startTime: 0, endTime: 0, latencyMs: 0 } })
    };
    
    // Index the tools
    index.indexTool(calculatorTool);
    index.indexTool(weatherTool);
    index.indexTool(draftTool);
  });

  it('should find the calculator tool for math queries', () => {
    const matchingTools = index.findMatchingTools('calculator 5 plus 3');
    expect(matchingTools).toContainEqual(calculatorTool);
  });

  it('should find the weather tool for weather queries', () => {
    const matchingTools = index.findMatchingTools('what is the weather in New York');
    expect(matchingTools).toContainEqual(weatherTool);
  });

  it('should find the chain-of-draft tool for reasoning queries', () => {
    const matchingTools = index.findMatchingTools('solve this problem with chain of thought');
    expect(matchingTools).toContainEqual(draftTool);
  });

  it('should limit results to the specified maximum', () => {
    const matchingTools = index.findMatchingTools('calculate and reason', 1);
    expect(matchingTools.length).toBeLessThanOrEqual(1);
  });
}); 