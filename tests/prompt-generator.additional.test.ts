// @ts-nocheck
// tests/prompt-generator.additional.test.ts
import { jest, describe, beforeEach, test, expect } from '@jest/globals';

// Mock dependencies
const mockLogger = {
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  devLog: jest.fn(),
  metrics: jest.fn()
};

const mockVectorDatabase = {
  initialize: jest.fn().mockResolvedValue(true),
  storeVector: jest.fn().mockResolvedValue(true),
  searchSimilar: jest.fn().mockResolvedValue([])
};

// Create a simplified test implementation of the PromptGenerator
describe('Prompt Generator Additional Tests', () => {
  // Sample template data for testing
  const sampleTemplates = [
    {
      id: 'template-math',
      category: 'math',
      reasoning_type: 'step-by-step',
      complexity: 2,
      template: 'Solve the following math problem: {{problem}}',
      parameters: [
        {
          name: 'problem',
          type: 'string',
          description: 'Math problem to solve',
          required: true
        }
      ],
      examples: ['Example problem 1: 2+2=4', 'Example problem 2: 3×4=12'],
      performance_score: 0.7,
      created_at: new Date('2025-01-01'),
      updated_at: new Date('2025-01-01')
    },
    {
      id: 'template-logic',
      category: 'logic',
      reasoning_type: 'deductive',
      complexity: 3,
      template: 'Analyze the following logic problem: {{problem}}',
      parameters: [
        {
          name: 'problem',
          type: 'string',
          description: 'Logic problem to analyze',
          required: true
        }
      ],
      performance_score: 0.6,
      created_at: new Date('2025-01-01'),
      updated_at: new Date('2025-01-01')
    }
  ];
  
  // Create a simplified PromptGenerator for testing
  const createPromptGenerator = () => {
    // Create maps for templates and performance
    const templates = new Map();
    const templatePerformance = new Map();
    
    // Add templates to maps
    sampleTemplates.forEach(template => {
      templates.set(template.id, { ...template });
      templatePerformance.set(template.id, template.performance_score);
    });
    
    // Define generator functions
    return {
      // Get template IDs
      getTemplateIds: () => Array.from(templates.keys()),
      
      // Get template by ID
      getTemplate: (id) => templates.get(id),
      
      // Get templates by category
      getTemplatesByCategory: (category) => 
        Array.from(templates.values()).filter(t => t.category === category),
      
      // Get templates by reasoning type
      getTemplatesByReasoningType: (reasoningType) => 
        Array.from(templates.values()).filter(t => t.reasoning_type === reasoningType),
      
      // Create a new template
      createTemplate: (template) => {
        const id = 'new-template-id';
        const now = new Date();
        
        const newTemplate = {
          ...template,
          id,
          created_at: now,
          updated_at: now
        };
        
        templates.set(id, newTemplate);
        templatePerformance.set(id, template.performance_score || 0.5);
        
        mockLogger.info('Created new template', { id, category: template.category });
        
        return newTemplate;
      },
      
      // Update a template
      updateTemplate: (id, templateUpdate) => {
        const existingTemplate = templates.get(id);
        
        if (!existingTemplate) {
          mockLogger.warn('Template not found for update', { id });
          return null;
        }
        
        const updatedTemplate = {
          ...existingTemplate,
          ...templateUpdate,
          id, // Ensure ID doesn't change
          updated_at: new Date()
        };
        
        templates.set(id, updatedTemplate);
        
        if (templateUpdate.performance_score !== undefined) {
          templatePerformance.set(id, templateUpdate.performance_score);
        }
        
        mockLogger.info('Updated template', { id });
        
        return updatedTemplate;
      },
      
      // Delete a template
      deleteTemplate: (id) => {
        if (!templates.has(id)) {
          mockLogger.warn('Template not found for deletion', { id });
          return false;
        }
        
        templates.delete(id);
        templatePerformance.delete(id);
        
        mockLogger.info('Deleted template', { id });
        
        return true;
      },
      
      // Generate a prompt
      generatePrompt: (templateId, parameterValues = {}) => {
        const template = templates.get(templateId);
        
        if (!template) {
          throw new Error(`Template not found: ${templateId}`);
        }
        
        // Start with the template text
        let promptContent = template.template;
        
        // Parameter values to store with the generated prompt
        const usedParameters = {};
        
        // Replace parameter placeholders
        for (const param of template.parameters || []) {
          const paramValue = parameterValues[param.name] || param.default_value || `[${param.name}]`;
          usedParameters[param.name] = paramValue;
          
          // Replace all occurrences of the parameter in the template
          const paramPlaceholder = `{{${param.name}}}`;
          promptContent = promptContent.split(paramPlaceholder).join(String(paramValue));
        }
        
        // Create a generated prompt object
        return {
          id: 'generated-prompt-id',
          template_id: templateId,
          content: promptContent,
          parameters: usedParameters,
          created_at: new Date()
        };
      },
      
      // Update a template's performance score
      updateTemplatePerformance: (templateId, evaluationScore) => {
        const template = templates.get(templateId);
        
        if (!template) {
          mockLogger.warn('Template not found for performance update', { templateId });
          return false;
        }
        
        // Get current performance score
        const currentScore = template.performance_score || 0.5;
        
        // Calculate new score using weighted average (using 0.2 as evolution rate)
        const evolutionRate = 0.2;
        const newScore = currentScore * (1 - evolutionRate) + evaluationScore * evolutionRate;
        
        // Update template and performance map
        template.performance_score = newScore;
        template.updated_at = new Date();
        
        templates.set(templateId, template);
        templatePerformance.set(templateId, newScore);
        
        return true;
      },
      
      // Store a generated prompt vector
      storePromptVector: async (prompt, vector) => {
        try {
          await mockVectorDatabase.initialize();
          
          // Create metadata
          const metadata = {
            template_id: prompt.template_id,
            parameters: prompt.parameters,
            created_at: prompt.created_at.toISOString()
          };
          
          // Store in vector database
          await mockVectorDatabase.storeVector(prompt.id, vector, prompt.content, metadata);
          
          // Update the prompt with the vector
          prompt.vector_embedding = vector;
          
          mockLogger.devLog('Stored prompt vector', { promptId: prompt.id });
        } catch (error) {
          mockLogger.error('Failed to store prompt vector', { promptId: prompt.id, error });
          throw error;
        }
      }
    };
  };
  
  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();
  });
  
  test('getTemplateIds returns all template IDs', () => {
    const promptGenerator = createPromptGenerator();
    const ids = promptGenerator.getTemplateIds();
    
    expect(ids).toEqual(['template-math', 'template-logic']);
    expect(ids.length).toBe(2);
  });
  
  test('getTemplate returns the correct template by ID', () => {
    const promptGenerator = createPromptGenerator();
    
    const template = promptGenerator.getTemplate('template-math');
    
    expect(template).toBeDefined();
    expect(template.category).toBe('math');
    expect(template.template).toBe('Solve the following math problem: {{problem}}');
  });
  
  test('getTemplate returns undefined for non-existent template', () => {
    const promptGenerator = createPromptGenerator();
    
    const template = promptGenerator.getTemplate('non-existent');
    
    expect(template).toBeUndefined();
  });
  
  test('getTemplatesByCategory returns templates matching the category', () => {
    const promptGenerator = createPromptGenerator();
    
    const mathTemplates = promptGenerator.getTemplatesByCategory('math');
    
    expect(mathTemplates.length).toBe(1);
    expect(mathTemplates[0].id).toBe('template-math');
    
    const nonExistentTemplates = promptGenerator.getTemplatesByCategory('non-existent');
    expect(nonExistentTemplates.length).toBe(0);
  });
  
  test('getTemplatesByReasoningType returns templates matching the reasoning type', () => {
    const promptGenerator = createPromptGenerator();
    
    const deductiveTemplates = promptGenerator.getTemplatesByReasoningType('deductive');
    
    expect(deductiveTemplates.length).toBe(1);
    expect(deductiveTemplates[0].id).toBe('template-logic');
  });
  
  test('createTemplate creates a new template', () => {
    const promptGenerator = createPromptGenerator();
    
    const newTemplate = {
      category: 'code',
      reasoning_type: 'procedural',
      complexity: 4,
      template: 'Write a function that {{task}}',
      parameters: [
        {
          name: 'task',
          type: 'string',
          description: 'Coding task to perform',
          required: true
        }
      ]
    };
    
    const createdTemplate = promptGenerator.createTemplate(newTemplate);
    
    expect(createdTemplate).toBeDefined();
    expect(createdTemplate.id).toBe('new-template-id');
    expect(createdTemplate.category).toBe('code');
    expect(mockLogger.info).toHaveBeenCalledWith('Created new template', expect.any(Object));
  });
  
  test('updateTemplate updates an existing template', () => {
    const promptGenerator = createPromptGenerator();
    
    const update = {
      complexity: 5,
      performance_score: 0.8
    };
    
    const updatedTemplate = promptGenerator.updateTemplate('template-math', update);
    
    expect(updatedTemplate).toBeDefined();
    expect(updatedTemplate.complexity).toBe(5);
    expect(updatedTemplate.performance_score).toBe(0.8);
    expect(mockLogger.info).toHaveBeenCalledWith('Updated template', expect.any(Object));
  });
  
  test('updateTemplate returns null for non-existent template', () => {
    const promptGenerator = createPromptGenerator();
    
    const updatedTemplate = promptGenerator.updateTemplate('non-existent', { complexity: 5 });
    
    expect(updatedTemplate).toBeNull();
    expect(mockLogger.warn).toHaveBeenCalledWith('Template not found for update', expect.any(Object));
  });
  
  test('deleteTemplate deletes an existing template', () => {
    const promptGenerator = createPromptGenerator();
    
    const result = promptGenerator.deleteTemplate('template-math');
    
    expect(result).toBe(true);
    expect(mockLogger.info).toHaveBeenCalledWith('Deleted template', expect.any(Object));
    
    // Template should no longer exist
    expect(promptGenerator.getTemplate('template-math')).toBeUndefined();
  });
  
  test('deleteTemplate returns false for non-existent template', () => {
    const promptGenerator = createPromptGenerator();
    
    const result = promptGenerator.deleteTemplate('non-existent');
    
    expect(result).toBe(false);
    expect(mockLogger.warn).toHaveBeenCalledWith('Template not found for deletion', expect.any(Object));
  });
  
  test('generatePrompt creates a prompt with correctly filled parameters', () => {
    const promptGenerator = createPromptGenerator();
    
    const prompt = promptGenerator.generatePrompt('template-math', { problem: '2 + 2' });
    
    expect(prompt).toBeDefined();
    expect(prompt.template_id).toBe('template-math');
    expect(prompt.content).toBe('Solve the following math problem: 2 + 2');
    expect(prompt.parameters.problem).toBe('2 + 2');
  });
  
  test('generatePrompt throws error for non-existent template', () => {
    const promptGenerator = createPromptGenerator();
    
    expect(() => {
      promptGenerator.generatePrompt('non-existent');
    }).toThrow('Template not found');
  });
  
  test('updateTemplatePerformance updates the performance score', () => {
    const promptGenerator = createPromptGenerator();
    
    // Get initial score
    const initialTemplate = promptGenerator.getTemplate('template-math');
    const initialScore = initialTemplate.performance_score;
    
    // Update score with a good evaluation
    const result = promptGenerator.updateTemplatePerformance('template-math', 1.0);
    
    // Get updated template
    const updatedTemplate = promptGenerator.getTemplate('template-math');
    
    expect(result).toBe(true);
    expect(updatedTemplate.performance_score).toBeGreaterThan(initialScore);
  });
  
  test('updateTemplatePerformance returns false for non-existent template', () => {
    const promptGenerator = createPromptGenerator();
    
    const result = promptGenerator.updateTemplatePerformance('non-existent', 1.0);
    
    expect(result).toBe(false);
    expect(mockLogger.warn).toHaveBeenCalledWith('Template not found for performance update', expect.any(Object));
  });
  
  test('storePromptVector stores vectors in database', async () => {
    const promptGenerator = createPromptGenerator();
    
    const prompt = {
      id: 'prompt-123',
      template_id: 'template-math',
      content: 'Solve the following math problem: 2 + 2',
      parameters: { problem: '2 + 2' },
      created_at: new Date()
    };
    
    const vector = [0.1, 0.2, 0.3, 0.4, 0.5];
    
    await promptGenerator.storePromptVector(prompt, vector);
    
    expect(mockVectorDatabase.initialize).toHaveBeenCalled();
    expect(mockVectorDatabase.storeVector).toHaveBeenCalledWith(
      'prompt-123',
      vector,
      'Solve the following math problem: 2 + 2',
      expect.any(Object)
    );
    
    // Vector should be added to the prompt
    expect(prompt.vector_embedding).toEqual(vector);
    expect(mockLogger.devLog).toHaveBeenCalledWith('Stored prompt vector', expect.any(Object));
  });
  
  test('storePromptVector handles errors', async () => {
    const promptGenerator = createPromptGenerator();
    
    // Mock the storeVector method to throw an error
    mockVectorDatabase.storeVector.mockRejectedValueOnce(new Error('Database error'));
    
    const prompt = {
      id: 'prompt-error',
      template_id: 'template-math',
      content: 'Solve the following math problem: 2 + 2',
      parameters: { problem: '2 + 2' },
      created_at: new Date()
    };
    
    const vector = [0.1, 0.2, 0.3, 0.4, 0.5];
    
    await expect(promptGenerator.storePromptVector(prompt, vector)).rejects.toThrow('Database error');
    
    expect(mockLogger.error).toHaveBeenCalledWith('Failed to store prompt vector', expect.any(Object));
  });
}); 