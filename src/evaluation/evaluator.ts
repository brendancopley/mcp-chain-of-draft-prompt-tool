import { v4 as uuidv4 } from 'uuid';
import OpenAI from 'openai';
import { logger } from '../utils/logger.js';
import { config } from '../core/config.js';
import {
  EvaluationDetails,
  EvaluationRequest,
  EvaluationCriteria,
  GeneratedPrompt,
  GeneratedResponse
} from '../types.js';

/**
 * Response evaluator using OpenAI API
 */
export class ResponseEvaluator {
  private openaiClient: OpenAI;
  private evaluationModel: string;
  private criteria: EvaluationCriteria;
  
  constructor() {
    if (!config.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY is required for evaluation');
    }
    
    // Initialize OpenAI client
    this.openaiClient = new OpenAI({
      apiKey: config.OPENAI_API_KEY,
      baseURL: config.OPENAI_BASE_URL
    });
    
    // Set evaluation model and criteria
    this.evaluationModel = config.GRPO_EVALUATION_MODEL;
    this.criteria = {
      reasoning_weight: config.GRPO_REWARD_WEIGHT_REASONING,
      factual_weight: config.GRPO_REWARD_WEIGHT_FACTUAL,
      relevance_weight: config.GRPO_REWARD_WEIGHT_RELEVANCE
    };
    
    logger.info('Initialized response evaluator', {
      model: this.evaluationModel,
      criteria: this.criteria
    });
  }
  
  /**
   * Evaluate a response to a prompt
   */
  async evaluateResponse(
    prompt: GeneratedPrompt,
    response: GeneratedResponse
  ): Promise<EvaluationDetails> {
    const startTime = Date.now();
    
    try {
      logger.devLog('Evaluating response', {
        promptId: prompt.id,
        responseId: response.id
      });
      
      const evaluationRequest: EvaluationRequest = {
        prompt: prompt.content,
        response: response.content,
        evaluator_model: this.evaluationModel,
        evaluation_criteria: this.criteria
      };
      
      const result = await this.performEvaluation(evaluationRequest);
      const elapsedTime = Date.now() - startTime;
      
      logger.metrics('Evaluator', 'evaluateResponse', {
        success: true,
        duration_ms: elapsedTime,
        details: {
          promptId: prompt.id,
          responseId: response.id,
          reasoningScore: result.reasoning_score,
          factualScore: result.factual_score,
          relevanceScore: result.relevance_score,
          combinedScore: result.combined_score
        }
      });
      
      return result;
    } catch (error) {
      const elapsedTime = Date.now() - startTime;
      
      logger.metrics('Evaluator', 'evaluateResponse', {
        success: false,
        duration_ms: elapsedTime,
        error: error instanceof Error ? error : String(error),
        details: {
          promptId: prompt.id,
          responseId: response.id
        }
      });
      
      throw error;
    }
  }
  
  /**
   * Perform the actual evaluation by calling OpenAI API
   */
  private async performEvaluation(request: EvaluationRequest): Promise<EvaluationDetails> {
    // Create system prompt for evaluation
    const systemPrompt = this.createEvaluationSystemPrompt(request.evaluation_criteria);
    
    // Create user prompt with the content to evaluate
    const userPrompt = this.createEvaluationUserPrompt(request.prompt, request.response);
    
    try {
      // Call OpenAI API for evaluation
      const response = await this.openaiClient.chat.completions.create({
        model: request.evaluator_model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.2,
        response_format: { type: 'json_object' }
      });
      
      // Parse the JSON response
      const content = response.choices[0].message.content;
      if (!content) {
        throw new Error('Empty response from evaluator');
      }
      
      const evaluationResults = JSON.parse(content);
      
      // Calculate combined score
      const combinedScore = this.calculateCombinedScore(
        evaluationResults,
        request.evaluation_criteria
      );
      
      return {
        reasoning_score: evaluationResults.reasoning_score || 0,
        factual_score: evaluationResults.factual_score || 0,
        relevance_score: evaluationResults.relevance_score || 0,
        combined_score: combinedScore,
        evaluator_model: request.evaluator_model,
        evaluator_feedback: evaluationResults.feedback || '',
        evaluation_time_ms: Date.now() - (response.created * 1000), // Approximate time
        created_at: new Date()
      };
    } catch (error) {
      logger.error('Evaluation API call failed', { error });
      throw new Error(`Evaluation failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  /**
   * Create the system prompt for evaluation
   */
  private createEvaluationSystemPrompt(criteria: EvaluationCriteria): string {
    return `You are an expert evaluator of language model responses. Your task is to evaluate the quality of a response to a given prompt based on the following criteria:

1. Reasoning Quality (${criteria.reasoning_weight * 100}% of total score):
   - Assess the logical structure and coherence of the reasoning
   - Check if the response follows a clear step-by-step approach
   - Evaluate whether conclusions are properly supported by premises
   - Score from 0 (completely flawed reasoning) to 10 (excellent reasoning)

2. Factual Accuracy (${criteria.factual_weight * 100}% of total score):
   - Assess whether the information provided is correct
   - Check for any contradictions or inconsistencies
   - Evaluate whether the response aligns with established knowledge
   - Score from 0 (completely incorrect) to 10 (perfectly accurate)

3. Relevance (${criteria.relevance_weight * 100}% of total score):
   - Assess how well the response addresses the prompt
   - Check if all parts of the prompt are addressed
   - Evaluate whether the response includes unnecessary information
   - Score from 0 (completely irrelevant) to 10 (perfectly relevant)

You must provide:
1. A score for each criterion (reasoning_score, factual_score, relevance_score)
2. Brief feedback explaining your evaluation
3. At least one specific suggestion for improvement

Format your response as a JSON object with the following structure:
{
  "reasoning_score": <score>,
  "factual_score": <score>,
  "relevance_score": <score>,
  "feedback": "<your detailed feedback>",
  "improvement_suggestion": "<specific suggestion>"
}

Be objective and consistent in your evaluations.`;
  }
  
  /**
   * Create the user prompt for evaluation
   */
  private createEvaluationUserPrompt(prompt: string, response: string): string {
    return `Please evaluate the following response to the given prompt:

### PROMPT:
${prompt}

### RESPONSE:
${response}

Provide your evaluation according to the criteria.`;
  }
  
  /**
   * Calculate the combined score based on weights
   */
  private calculateCombinedScore(
    evaluationResults: Record<string, any>,
    criteria: EvaluationCriteria
  ): number {
    // Normalize scores to 0-1 range (from 0-10 range)
    const reasoningScore = (evaluationResults.reasoning_score || 0) / 10;
    const factualScore = (evaluationResults.factual_score || 0) / 10;
    const relevanceScore = (evaluationResults.relevance_score || 0) / 10;
    
    // Calculate weighted sum
    const combinedScore =
      reasoningScore * criteria.reasoning_weight +
      factualScore * criteria.factual_weight +
      relevanceScore * criteria.relevance_weight;
    
    // Ensure result is in 0-1 range
    return Math.max(0, Math.min(1, combinedScore));
  }
  
  /**
   * Batch evaluate multiple responses
   */
  async batchEvaluate(
    promptResponsePairs: Array<{ prompt: GeneratedPrompt; response: GeneratedResponse }>
  ): Promise<Map<string, EvaluationDetails>> {
    const results = new Map<string, EvaluationDetails>();
    const startTime = Date.now();
    
    logger.info('Starting batch evaluation', {
      count: promptResponsePairs.length
    });
    
    // Process evaluations in sequence to avoid rate limiting
    for (const pair of promptResponsePairs) {
      try {
        const evaluation = await this.evaluateResponse(pair.prompt, pair.response);
        results.set(pair.response.id, evaluation);
      } catch (error) {
        logger.error('Failed to evaluate response in batch', {
          promptId: pair.prompt.id,
          responseId: pair.response.id,
          error
        });
      }
    }
    
    const elapsedTime = Date.now() - startTime;
    
    logger.info('Completed batch evaluation', {
      count: promptResponsePairs.length,
      successCount: results.size,
      duration_ms: elapsedTime
    });
    
    return results;
  }
  
  /**
   * Check if the evaluation model is available
   */
  async checkEvaluationModel(): Promise<boolean> {
    try {
      const models = await this.openaiClient.models.list();
      return models.data.some(model => model.id === this.evaluationModel);
    } catch (error) {
      logger.error('Failed to check evaluation model availability', {
        model: this.evaluationModel,
        error
      });
      return false;
    }
  }
  
  /**
   * Set a custom evaluation model
   */
  setEvaluationModel(model: string): void {
    this.evaluationModel = model;
    logger.info('Updated evaluation model', { model });
  }
  
  /**
   * Set custom evaluation criteria
   */
  setEvaluationCriteria(criteria: EvaluationCriteria): void {
    this.criteria = {
      ...this.criteria,
      ...criteria
    };
    
    logger.info('Updated evaluation criteria', { criteria });
  }
}

// Export singleton instance
export const responseEvaluator = new ResponseEvaluator(); 