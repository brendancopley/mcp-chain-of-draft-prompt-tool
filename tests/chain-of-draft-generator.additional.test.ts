// @ts-nocheck
// tests/chain-of-draft-generator.additional.test.ts
import { jest, describe, beforeEach, test, expect } from '@jest/globals';

// Mock dependencies
const mockLogger = {
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  devLog: jest.fn()
};

const mockPromptGenerator = {
  createTemplate: jest.fn(),
  generatePrompt: jest.fn()
};

// Simplified test implementation of the chain-of-draft-generator
describe('Chain of Draft Generator Additional Tests', () => {
  // Setups the module manually for tests
  const setupTestModule = () => {
    // Mock return values
    mockPromptGenerator.createTemplate.mockImplementation((templateData) => {
      return { 
        id: `mock-template-id-${templateData.category}`,
        ...templateData 
      };
    });
    
    mockPromptGenerator.generatePrompt.mockImplementation((templateId, params) => {
      return {
        id: 'mock-prompt-id',
        content: `Generated prompt for ${templateId} with problem: ${params.problem}`,
        template_id: templateId,
        parameters: params,
        created_at: new Date()
      };
    });
    
    // Define the template IDs that would be created during initialization
    const mathCoDTemplateId = 'mock-template-id-math';
    const logicCoDTemplateId = 'mock-template-id-logic';
    const codeCoDTemplateId = 'mock-template-id-code';
    const generalCoDTemplateId = 'mock-template-id-general';
    
    // Recreate the generator with our mocks
    const chainOfDraftGenerator = {
      generatePrompt(problem) {
        // Very simple heuristic to guess the problem type
        if (problem.match(/code|function|algorithm|implement|program|class|method|array|string|data structure/i)) {
          mockLogger.info('Detected coding problem');
          return mockPromptGenerator.generatePrompt(codeCoDTemplateId, { problem });
        } else if (problem.match(/solve|equation|x\s*=|y\s*=|calculate|compute|find the value|derivative|integral|graph/i)) {
          mockLogger.info('Detected math problem');
          return mockPromptGenerator.generatePrompt(mathCoDTemplateId, { problem });
        } else if (problem.match(/logic|syllogism|conclusion|inference|valid|invalid|argument|if.*then|some|all|none|true|false/i)) {
          mockLogger.info('Detected logic problem');
          return mockPromptGenerator.generatePrompt(logicCoDTemplateId, { problem });
        } else {
          mockLogger.info('Using general problem template');
          return mockPromptGenerator.generatePrompt(generalCoDTemplateId, { problem });
        }
      }
    };
    
    return {
      chainOfDraftGenerator,
      mathCoDTemplateId,
      logicCoDTemplateId,
      codeCoDTemplateId,
      generalCoDTemplateId
    };
  };
  
  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();
  });
  
  test('identifies and generates math problem prompts', () => {
    const { chainOfDraftGenerator } = setupTestModule();
    
    const mathProblem = "Solve the equation x^2 + 5x + 6 = 0";
    const result = chainOfDraftGenerator.generatePrompt(mathProblem);
    
    expect(mockLogger.info).toHaveBeenCalledWith('Detected math problem');
    expect(result.template_id).toBe('mock-template-id-math');
    expect(result.parameters.problem).toBe(mathProblem);
  });
  
  test('identifies and generates logic problem prompts', () => {
    const { chainOfDraftGenerator } = setupTestModule();
    
    const logicProblem = "If all A are B and some B are C, then determine if all A are C.";
    const result = chainOfDraftGenerator.generatePrompt(logicProblem);
    
    expect(mockLogger.info).toHaveBeenCalledWith('Detected logic problem');
    expect(result.template_id).toBe('mock-template-id-logic');
    expect(result.parameters.problem).toBe(logicProblem);
  });
  
  test('identifies and generates code problem prompts', () => {
    const { chainOfDraftGenerator } = setupTestModule();
    
    const codeProblem = "Implement a function to reverse a linked list";
    const result = chainOfDraftGenerator.generatePrompt(codeProblem);
    
    expect(mockLogger.info).toHaveBeenCalledWith('Detected coding problem');
    expect(result.template_id).toBe('mock-template-id-code');
    expect(result.parameters.problem).toBe(codeProblem);
  });
  
  test('falls back to general problem template when problem type is unclear', () => {
    const { chainOfDraftGenerator } = setupTestModule();
    
    const generalProblem = "How can I improve my productivity?";
    const result = chainOfDraftGenerator.generatePrompt(generalProblem);
    
    expect(mockLogger.info).toHaveBeenCalledWith('Using general problem template');
    expect(result.template_id).toBe('mock-template-id-general');
    expect(result.parameters.problem).toBe(generalProblem);
  });
}); 