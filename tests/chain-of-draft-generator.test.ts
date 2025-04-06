// @ts-nocheck
// tests/chain-of-draft-generator.test.ts
import { describe, test, expect } from '@jest/globals';
import {
  chainOfDraftGenerator,
  mathCoDTemplateId,
  logicCoDTemplateId,
  codeCoDTemplateId,
  generalCoDTemplateId
} from '../src/grpo/chain-of-draft-generator.js';
import { promptGenerator } from '../src/grpo/prompt-generator.js';

describe('Chain of Draft Generator', () => {
  // Test the exported template IDs
  test('should export template IDs', () => {
    expect(mathCoDTemplateId).toBeDefined();
    expect(logicCoDTemplateId).toBeDefined();
    expect(codeCoDTemplateId).toBeDefined();
    expect(generalCoDTemplateId).toBeDefined();
  });
  
  // Test the template selection logic
  test('should return the prompt from promptGenerator', () => {
    const origGeneratePrompt = promptGenerator.generatePrompt;
    const expectedResult = {
      id: 'test-prompt-id',
      content: 'Test prompt content',
      parameters: { problem: 'Test problem' }
    };
    
    try {
      // Override the function to return our test value
      promptGenerator.generatePrompt = function() {
        return expectedResult;
      };
      
      const result = chainOfDraftGenerator.generatePrompt('Test problem');
      expect(result).toEqual(expectedResult);
    } finally {
      // Restore the original function
      promptGenerator.generatePrompt = origGeneratePrompt;
    }
  });
  
  // Test overall classification for general problems
  test('should use general template for unclassified problems', () => {
    const origGeneratePrompt = promptGenerator.generatePrompt;
    let templateIdUsed;
    
    try {
      promptGenerator.generatePrompt = function(templateId, params) {
        templateIdUsed = templateId;
        return { id: templateId, content: 'test', parameters: params };
      };
      
      // A problem with no mathematical, logical, or coding keywords
      const generalProblem = 'What is the capital of France?';
      chainOfDraftGenerator.generatePrompt(generalProblem);
      
      // Should use the general template ID
      expect(templateIdUsed).toBe(generalCoDTemplateId);
    } finally {
      promptGenerator.generatePrompt = origGeneratePrompt;
    }
  });
}); 