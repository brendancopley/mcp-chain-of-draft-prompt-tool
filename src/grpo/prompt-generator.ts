import { v4 as uuidv4 } from 'uuid';
import { logger } from '../utils/logger.js';
import { config, loadPromptsConfig, type PromptsConfig } from '../core/config.js';
import { PromptTemplate, PromptParameter, GeneratedPrompt } from '../types.js';
import { vectorDatabase } from '../vector-db/vector-database.js';

/**
 * Handles prompt generation and evolution using GRPO methodology
 */
export class PromptGenerator {
  private promptsConfig: PromptsConfig;
  private templates: Map<string, PromptTemplate> = new Map();
  private templatePerformance: Map<string, number> = new Map();
  private evolutionRate: number;
  
  constructor() {
    this.promptsConfig = loadPromptsConfig();
    this.evolutionRate = config.GRPO_PROMPT_EVOLUTION_RATE;
    this.initializeTemplates();
  }
  
  /**
   * Initialize templates from configuration
   */
  private initializeTemplates() {
    try {
      logger.info('Initializing prompt templates');
      
      // Load templates from config
      for (const [id, template] of Object.entries(this.promptsConfig.templates)) {
        const templateData = template as any;
        
        const promptTemplate: PromptTemplate = {
          id,
          template: templateData.template,
          category: templateData.category || 'general',
          reasoning_type: templateData.reasoning_type || 'default',
          complexity: templateData.complexity || 1,
          parameters: templateData.parameters || [],
          examples: templateData.examples || [],
          performance_score: templateData.performance_score || 0.5,
          created_at: new Date(),
          updated_at: new Date()
        };
        
        this.templates.set(id, promptTemplate);
        this.templatePerformance.set(id, promptTemplate.performance_score || 0.5);
      }
      
      logger.info(`Initialized ${this.templates.size} prompt templates`);
    } catch (error) {
      logger.error('Failed to initialize prompt templates', { error });
      throw new Error(`Template initialization failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  /**
   * Get all available template IDs
   */
  getTemplateIds(): string[] {
    return Array.from(this.templates.keys());
  }
  
  /**
   * Get a template by ID
   */
  getTemplate(id: string): PromptTemplate | undefined {
    return this.templates.get(id);
  }
  
  /**
   * Get templates by category
   */
  getTemplatesByCategory(category: string): PromptTemplate[] {
    return Array.from(this.templates.values()).filter(t => t.category === category);
  }
  
  /**
   * Get templates by reasoning type
   */
  getTemplatesByReasoningType(reasoningType: string): PromptTemplate[] {
    return Array.from(this.templates.values()).filter(t => t.reasoning_type === reasoningType);
  }
  
  /**
   * Create a new template
   */
  createTemplate(template: Omit<PromptTemplate, 'id' | 'created_at' | 'updated_at'>): PromptTemplate {
    const id = uuidv4();
    const now = new Date();
    
    const newTemplate: PromptTemplate = {
      ...template,
      id,
      created_at: now,
      updated_at: now
    };
    
    this.templates.set(id, newTemplate);
    this.templatePerformance.set(id, newTemplate.performance_score || 0.5);
    
    logger.info('Created new template', { id, category: template.category });
    
    return newTemplate;
  }
  
  /**
   * Update an existing template
   */
  updateTemplate(id: string, template: Partial<PromptTemplate>): PromptTemplate | null {
    const existingTemplate = this.templates.get(id);
    
    if (!existingTemplate) {
      logger.warn('Template not found for update', { id });
      return null;
    }
    
    const updatedTemplate: PromptTemplate = {
      ...existingTemplate,
      ...template,
      id, // Ensure ID doesn't change
      updated_at: new Date()
    };
    
    this.templates.set(id, updatedTemplate);
    
    if (template.performance_score !== undefined) {
      this.templatePerformance.set(id, template.performance_score);
    }
    
    logger.info('Updated template', { id });
    
    return updatedTemplate;
  }
  
  /**
   * Delete a template
   */
  deleteTemplate(id: string): boolean {
    if (!this.templates.has(id)) {
      logger.warn('Template not found for deletion', { id });
      return false;
    }
    
    this.templates.delete(id);
    this.templatePerformance.delete(id);
    
    logger.info('Deleted template', { id });
    
    return true;
  }
  
  /**
   * Generate a prompt from a template
   */
  generatePrompt(templateId: string, parameterValues?: Record<string, any>): GeneratedPrompt {
    const template = this.templates.get(templateId);
    
    if (!template) {
      throw new Error(`Template not found: ${templateId}`);
    }
    
    // Start with the template text
    let promptContent = template.template;
    
    // Parameter values to store with the generated prompt
    const usedParameters: Record<string, any> = {};
    
    // Replace parameter placeholders
    for (const param of template.parameters) {
      const paramValue = this.resolveParameterValue(param, parameterValues);
      usedParameters[param.name] = paramValue;
      
      // Replace all occurrences of the parameter in the template
      const paramPlaceholder = `{{${param.name}}}`;
      promptContent = promptContent.split(paramPlaceholder).join(String(paramValue));
    }
    
    // Add examples if they exist
    if (template.examples && template.examples.length > 0) {
      const exampleCount = Math.min(template.examples.length, 3); // Use at most 3 examples
      const selectedExamples = this.selectRandomExamples(template.examples, exampleCount);
      
      // Add examples at the end of the prompt
      promptContent += '\n\nHere are some examples:\n\n';
      promptContent += selectedExamples.join('\n\n');
    }
    
    const generatedPrompt: GeneratedPrompt = {
      id: uuidv4(),
      template_id: templateId,
      content: promptContent,
      parameters: usedParameters,
      created_at: new Date()
    };
    
    logger.devLog('Generated prompt', { 
      promptId: generatedPrompt.id,
      templateId,
      paramCount: Object.keys(usedParameters).length
    });
    
    return generatedPrompt;
  }
  
  /**
   * Generate multiple prompts with parameter variations
   */
  generatePromptBatch(templateId: string, count: number): GeneratedPrompt[] {
    const result: GeneratedPrompt[] = [];
    
    for (let i = 0; i < count; i++) {
      try {
        const prompt = this.generatePrompt(templateId);
        result.push(prompt);
      } catch (error) {
        logger.error('Failed to generate prompt in batch', { templateId, error });
      }
    }
    
    return result;
  }
  
  /**
   * Generate prompts from multiple templates
   */
  generatePromptVariety(count: number, categories?: string[], reasoningTypes?: string[]): GeneratedPrompt[] {
    const result: GeneratedPrompt[] = [];
    
    // Filter templates by category and reasoning type if specified
    let eligibleTemplates = Array.from(this.templates.values());
    
    if (categories && categories.length > 0) {
      eligibleTemplates = eligibleTemplates.filter(t => categories.includes(t.category));
    }
    
    if (reasoningTypes && reasoningTypes.length > 0) {
      eligibleTemplates = eligibleTemplates.filter(t => reasoningTypes.includes(t.reasoning_type));
    }
    
    if (eligibleTemplates.length === 0) {
      logger.warn('No eligible templates found for prompt variety generation');
      return [];
    }
    
    // Generate prompts, distributing across templates
    for (let i = 0; i < count; i++) {
      const template = this.selectTemplateWeighted(eligibleTemplates);
      
      try {
        const prompt = this.generatePrompt(template.id);
        result.push(prompt);
      } catch (error) {
        logger.error('Failed to generate prompt in variety batch', { templateId: template.id, error });
      }
    }
    
    return result;
  }
  
  /**
   * Update a template's performance score based on evaluation results
   */
  updateTemplatePerformance(templateId: string, evaluationScore: number): boolean {
    const template = this.templates.get(templateId);
    
    if (!template) {
      logger.warn('Template not found for performance update', { templateId });
      return false;
    }
    
    // Get current performance score
    const currentScore = template.performance_score || 0.5;
    
    // Calculate new score using weighted average
    const newScore = currentScore * (1 - this.evolutionRate) + evaluationScore * this.evolutionRate;
    
    // Update template and performance map
    template.performance_score = newScore;
    template.updated_at = new Date();
    
    this.templates.set(templateId, template);
    this.templatePerformance.set(templateId, newScore);
    
    logger.devLog('Updated template performance', { 
      templateId, 
      previousScore: currentScore,
      newScore,
      evaluationScore
    });
    
    return true;
  }
  
  /**
   * Evolve a template based on its performance
   */
  evolveTemplate(templateId: string): PromptTemplate | null {
    const template = this.templates.get(templateId);
    
    if (!template) {
      logger.warn('Template not found for evolution', { templateId });
      return null;
    }
    
    // Only evolve templates with sufficient data
    const currentScore = template.performance_score;
    if (currentScore === undefined) {
      logger.info('Template has no performance score, skipping evolution', { templateId });
      return null;
    }
    
    // Clone the template
    const evolvedTemplate: PromptTemplate = {
      ...template,
      id: uuidv4(),
      template: template.template, // Will be modified later
      parameters: [...template.parameters], // Clone parameters array
      performance_score: 0.5, // Reset performance score
      created_at: new Date(),
      updated_at: new Date()
    };
    
    // Add evolution marker to category
    evolvedTemplate.category = `${template.category}_evolved`;
    
    // Modify template text (simple example)
    if (Math.random() < 0.5) {
      // Add more explicit reasoning guidance
      evolvedTemplate.template += '\n\nMake sure to explain your reasoning step by step, being explicit about each logical connection.';
    } else {
      // Add structure guidance
      evolvedTemplate.template += '\n\nOrganize your answer as follows:\n1. Identify the key elements\n2. Apply relevant principles\n3. Draw conclusions based on your analysis';
    }
    
    // Randomly modify one parameter
    if (evolvedTemplate.parameters.length > 0) {
      const paramIndex = Math.floor(Math.random() * evolvedTemplate.parameters.length);
      const param = evolvedTemplate.parameters[paramIndex];
      
      // Add variation to the parameter description
      param.description = `${param.description} (evolved)`;
      
      // Adjust default value if it's a number
      if (param.type === 'number' && typeof param.default_value === 'number') {
        const variation = param.default_value * 0.2; // 20% variation
        param.default_value = param.default_value + (Math.random() > 0.5 ? variation : -variation);
      }
    }
    
    // Add the evolved template
    this.templates.set(evolvedTemplate.id, evolvedTemplate);
    this.templatePerformance.set(evolvedTemplate.id, 0.5); // Start with neutral performance
    
    logger.info('Evolved new template', { 
      originalId: templateId, 
      newId: evolvedTemplate.id,
      originalScore: currentScore
    });
    
    return evolvedTemplate;
  }
  
  /**
   * Store a generated prompt in the vector database
   */
  async storePromptVector(prompt: GeneratedPrompt, vector: number[]): Promise<void> {
    // Store the prompt vector in the database
    try {
      await vectorDatabase.initialize();
      
      // Create metadata
      const metadata = {
        template_id: prompt.template_id,
        parameters: prompt.parameters,
        created_at: prompt.created_at.toISOString()
      };
      
      // Store in vector database
      await vectorDatabase.storeVector(prompt.id, vector, prompt.content, metadata);
      
      // Update the prompt with the vector
      prompt.vector_embedding = vector;
      
      logger.devLog('Stored prompt vector', { promptId: prompt.id });
    } catch (error) {
      logger.error('Failed to store prompt vector', { promptId: prompt.id, error });
      throw error;
    }
  }
  
  /**
   * Find similar prompts using vector search
   */
  async findSimilarPrompts(vector: number[], limit: number = 5): Promise<GeneratedPrompt[]> {
    try {
      await vectorDatabase.initialize();
      
      const results = await vectorDatabase.searchSimilar({
        query_vector: vector,
        limit,
        min_similarity: 0.7
      });
      
      // Convert search results to GeneratedPrompt objects
      return results.map(result => ({
        id: result.id,
        template_id: result.metadata.template_id,
        content: result.content,
        parameters: result.metadata.parameters,
        vector_embedding: vector, // Use the query vector
        created_at: new Date(result.metadata.created_at)
      }));
    } catch (error) {
      logger.error('Failed to find similar prompts', { error });
      return [];
    }
  }
  
  /**
   * Select random examples from the example pool
   */
  private selectRandomExamples(examples: string[], count: number): string[] {
    if (examples.length <= count) {
      return [...examples]; // Return all examples if we have fewer than requested
    }
    
    // Fisher-Yates shuffle and select first 'count' elements
    const shuffled = [...examples];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    
    return shuffled.slice(0, count);
  }
  
  /**
   * Select a template using weighted random selection based on performance scores
   */
  private selectTemplateWeighted(templates: PromptTemplate[]): PromptTemplate {
    if (templates.length === 0) {
      throw new Error('No templates available for selection');
    }
    
    if (templates.length === 1) {
      return templates[0];
    }
    
    // Extract performance scores (use default if not set)
    const scores = templates.map(t => t.performance_score || 0.5);
    
    // Convert scores to weights (higher scores = higher probability)
    const weights = scores.map(score => Math.max(score, 0.1)); // Ensure minimum weight
    
    // Calculate sum of weights
    const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
    
    // Generate random value between 0 and totalWeight
    const randomValue = Math.random() * totalWeight;
    
    // Find the template corresponding to the random value
    let cumulativeWeight = 0;
    for (let i = 0; i < templates.length; i++) {
      cumulativeWeight += weights[i];
      if (randomValue <= cumulativeWeight) {
        return templates[i];
      }
    }
    
    // Fallback to the last template (should rarely happen)
    return templates[templates.length - 1];
  }
  
  /**
   * Resolve the value for a parameter
   */
  private resolveParameterValue(
    parameter: PromptParameter,
    providedValues?: Record<string, any>
  ): any {
    // Use provided value if available
    if (providedValues && providedValues[parameter.name] !== undefined) {
      return providedValues[parameter.name];
    }
    
    // Use default value if available
    if (parameter.default_value !== undefined) {
      return parameter.default_value;
    }
    
    // Generate a value based on parameter type
    switch (parameter.type) {
      case 'string':
        return 'generated_value';
        
      case 'number':
        return Math.random() * 10; // Generate a random number between 0 and 10
        
      case 'boolean':
        return Math.random() > 0.5;
        
      default:
        return null;
    }
  }
}

// Export singleton instance
export const promptGenerator = new PromptGenerator(); 