import { v4 as uuidv4 } from 'uuid';
import { logger } from '../utils/logger.js';
import { promptGenerator } from './prompt-generator.js';
import { PromptTemplate } from '../types.js';

// Templates for different Chain of Draft problem types
const COD_TEMPLATES = [
  {
    name: 'Math Problem Chain of Draft',
    category: 'math',
    reasoning_type: 'chain-of-draft',
    complexity: 2,
    template: `Solve the following math problem using Chain of Draft reasoning. 
Break down your solution into clear, logical steps with each step building on previous ones.
Keep each step concise - use at most 30 words per step.
Focus on being clear, precise and systematic.

Problem: {{problem}}

Step 1:`,
    parameters: [
      {
        name: 'problem',
        type: 'string',
        description: 'The math problem to solve',
        required: true
      }
    ]
  },
  {
    name: 'Logic Problem Chain of Draft',
    category: 'logic',
    reasoning_type: 'chain-of-draft',
    complexity: 2,
    template: `Solve the following logic problem using Chain of Draft reasoning.
Break down your solution into clear, logical steps with each step building on previous ones.
Keep each step concise - use at most 30 words per step.
Focus on being clear, precise and systematic.

Problem: {{problem}}

Step 1:`,
    parameters: [
      {
        name: 'problem',
        type: 'string',
        description: 'The logic problem to solve',
        required: true
      }
    ]
  },
  {
    name: 'Code Problem Chain of Draft',
    category: 'code',
    reasoning_type: 'chain-of-draft',
    complexity: 3,
    template: `Solve the following coding problem using Chain of Draft reasoning.
Break down your solution into clear, logical steps with each step building on previous ones.
Keep each step concise - use at most 40 words per step.
Start with problem understanding, proceed to algorithm design, then implementation.

Problem: {{problem}}

Step 1:`,
    parameters: [
      {
        name: 'problem',
        type: 'string',
        description: 'The coding problem to solve',
        required: true
      }
    ]
  },
  {
    name: 'General Problem Chain of Draft',
    category: 'general',
    reasoning_type: 'chain-of-draft',
    complexity: 2,
    template: `Solve the following problem using Chain of Draft reasoning.
Break down your solution into clear, logical steps with each step building on previous ones.
Keep each step concise - use at most 35 words per step.
Focus on being clear, precise and systematic.

Problem: {{problem}}

Step 1:`,
    parameters: [
      {
        name: 'problem',
        type: 'string',
        description: 'The problem to solve',
        required: true
      }
    ]
  }
];

// Create each template and store its ID
const createdTemplateIds: string[] = [];

// Initialize by creating all Chain of Draft templates
COD_TEMPLATES.forEach(templateData => {
  const template = promptGenerator.createTemplate(templateData as unknown as Omit<PromptTemplate, 'id' | 'created_at' | 'updated_at'>);
  createdTemplateIds.push(template.id);
  logger.info(`Created Chain of Draft template: ${templateData.name} (${template.id})`);
});

// Export the template IDs for easy reference
export const mathCoDTemplateId = createdTemplateIds[0];
export const logicCoDTemplateId = createdTemplateIds[1];
export const codeCoDTemplateId = createdTemplateIds[2];
export const generalCoDTemplateId = createdTemplateIds[3];

// Export a specialized CoD wrapper around the promptGenerator
export const chainOfDraftGenerator = {
  /**
   * Detect the problem type and use the appropriate template
   */
  generatePrompt(problem: string): ReturnType<typeof promptGenerator.generatePrompt> {
    // Very simple heuristic to guess the problem type
    // In a real implementation, this could use much more sophisticated classification
    if (problem.match(/solve|equation|x\s*=|y\s*=|calculate|compute|find the value|derivative|integral|graph|function/i)) {
      logger.info('Detected math problem');
      return promptGenerator.generatePrompt(mathCoDTemplateId, { problem });
    } else if (problem.match(/logic|syllogism|conclusion|inference|valid|invalid|argument|if.*then|some|all|none|true|false/i)) {
      logger.info('Detected logic problem');
      return promptGenerator.generatePrompt(logicCoDTemplateId, { problem });
    } else if (problem.match(/code|function|algorithm|implement|program|class|method|array|string|data structure/i)) {
      logger.info('Detected coding problem');
      return promptGenerator.generatePrompt(codeCoDTemplateId, { problem });
    } else {
      logger.info('Using general problem template');
      return promptGenerator.generatePrompt(generalCoDTemplateId, { problem });
    }
  }
}; 