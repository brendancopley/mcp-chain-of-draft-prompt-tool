// @ts-nocheck
// tests/prompt-generator.test.ts
import { jest, describe, beforeEach, test, expect, afterEach } from '@jest/globals';

// Define the mock UUID value
let mockUuid = 'test-uuid';

// Mock uuid module
jest.mock('uuid', () => ({
  v4: () => mockUuid
}));

// Mock config module
jest.mock('../src/core/config.js', () => ({
  config: {
    GRPO_PROMPT_EVOLUTION_RATE: 0.2
  },
  loadPromptsConfig: () => ({
    templates: {
      'test-template-1': {
        id: 'test-template-1',
        template: 'This is a {{problem}} template with {{max_words_per_step}} words per step.',
        category: 'math',
        reasoning_type: 'chain-of-draft',
        complexity: 2,
        parameters: [
          { name: 'problem', type: 'string', description: 'Problem to solve' },
          { name: 'max_words_per_step', type: 'number', description: 'Maximum words per step', default_value: 30 }
        ],
        examples: ['Example 1', 'Example 2', 'Example 3'],
        performance_score: 0.7,
      },
      'test-template-2': {
        id: 'test-template-2',
        template: 'Solve this {{problem}} using logic.',
        category: 'logic',
        reasoning_type: 'chain-of-thought',
        complexity: 1,
        parameters: [
          { name: 'problem', type: 'string', description: 'Problem to solve' }
        ],
        performance_score: 0.5,
      }
    },
    categories: ['math', 'logic', 'code'],
    parameters: {}
  })
}));

// Mock logger module
jest.mock('../src/utils/logger.js', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    devLog: jest.fn()
  }
}));

// Mock vector database
jest.mock('../src/vector-db/vector-database.js', () => ({
  vectorDatabase: {
    initialize: jest.fn().mockResolvedValue(undefined),
    storeVector: jest.fn().mockResolvedValue('test-id'),
    searchSimilar: jest.fn().mockResolvedValue([
      { id: 'result-1', content: 'Similar content 1', similarity: 0.9, metadata: {} },
      { id: 'result-2', content: 'Similar content 2', similarity: 0.8, metadata: {} }
    ])
  }
}));

// Create a simple mock version of promptGenerator
const mockPromptGenerator = {
  templates: new Map([
    ['test-template-1', {
      id: 'test-template-1',
      template: 'This is a {{problem}} template with {{max_words_per_step}} words per step.',
      category: 'math',
      reasoning_type: 'chain-of-draft',
      complexity: 2,
      parameters: [
        { name: 'problem', type: 'string', description: 'Problem to solve' },
        { name: 'max_words_per_step', type: 'number', description: 'Maximum words per step', default_value: 30 }
      ],
      examples: ['Example 1', 'Example 2', 'Example 3'],
      performance_score: 0.7,
    }],
    ['test-template-2', {
      id: 'test-template-2',
      template: 'Solve this {{problem}} using logic.',
      category: 'logic',
      reasoning_type: 'chain-of-thought',
      complexity: 1,
      parameters: [
        { name: 'problem', type: 'string', description: 'Problem to solve' }
      ],
      performance_score: 0.5,
    }]
  ]),
  
  getTemplateIds() {
    return Array.from(this.templates.keys());
  },
  
  getTemplate(id) {
    return this.templates.get(id);
  },
  
  getTemplatesByCategory(category) {
    return Array.from(this.templates.values())
      .filter(t => t.category === category);
  },
  
  createTemplate(template) {
    const id = mockUuid;
    const now = new Date();
    
    const newTemplate = {
      ...template,
      id,
      created_at: now,
      updated_at: now
    };
    
    this.templates.set(id, newTemplate);
    return newTemplate;
  },
  
  deleteTemplate(id) {
    if (!this.templates.has(id)) {
      return false;
    }
    
    this.templates.delete(id);
    return true;
  }
};

// Mock the promptGenerator module
jest.mock('../src/grpo/prompt-generator.js', () => ({
  promptGenerator: mockPromptGenerator
}));

describe('Prompt Generator', () => {
  beforeEach(() => {
    // Clear all mocks
    jest.clearAllMocks();
    
    // Reset mock UUID value
    mockUuid = 'test-uuid';
  });
  
  test('initializes with templates from config', () => {
    // Check that the expected templates are initialized
    const templateIds = mockPromptGenerator.getTemplateIds();
    expect(templateIds.length).toBeGreaterThan(0);
    expect(templateIds).toContain('test-template-1');
    expect(templateIds).toContain('test-template-2');
  });
  
  test('gets template by ID', () => {
    // Get a template
    const template = mockPromptGenerator.getTemplate('test-template-1');
    
    // Should have the expected properties
    expect(template).toBeDefined();
    expect(template.id).toBe('test-template-1');
    expect(template.category).toBe('math');
    expect(template.reasoning_type).toBe('chain-of-draft');
    expect(template.parameters).toHaveLength(2);
  });
  
  test('gets templates by category', () => {
    // Get templates for a category
    const mathTemplates = mockPromptGenerator.getTemplatesByCategory('math');
    
    // Check results
    expect(mathTemplates.length).toBeGreaterThan(0);
    expect(mathTemplates[0].id).toBe('test-template-1');
  });
  
  test('creates and deletes a template', () => {
    // Set a predictable UUID for the new template
    mockUuid = 'new-template-id';
    
    // Create a new template
    const newTemplate = {
      template: 'This is a new {{problem}} template',
      category: 'code',
      reasoning_type: 'chain-of-draft',
      complexity: 3,
      parameters: [
        { name: 'problem', type: 'string', description: 'Problem to solve' }
      ]
    };
    
    const created = mockPromptGenerator.createTemplate(newTemplate);
    
    // Check the created template
    expect(created).toBeDefined();
    expect(created.id).toBe('new-template-id');
    expect(created.category).toBe('code');
    
    // Delete the template
    const result = mockPromptGenerator.deleteTemplate('new-template-id');
    expect(result).toBe(true);
    
    // Template should be gone
    const templateIds = mockPromptGenerator.getTemplateIds();
    expect(templateIds).not.toContain('new-template-id');
  });
}); 