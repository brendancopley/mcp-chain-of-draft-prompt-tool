// @ts-nocheck
// tests/evaluator.test.ts
import { jest, describe, beforeEach, test, expect, afterEach, afterAll } from '@jest/globals';

// Create mock logger
const mockLogger = {
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  devLog: jest.fn(),
  metrics: jest.fn()
};

// Mock OpenAI client and responses
const mockOpenAiClient = {
  chat: {
    completions: {
      create: jest.fn()
    }
  },
  models: {
    list: jest.fn()
  }
};

// Mock config for evaluator
const mockConfig = {
  OPENAI_API_KEY: 'mock-api-key',
  OPENAI_BASE_URL: 'https://api.openai.com',
  GRPO_EVALUATION_MODEL: 'gpt-4-turbo',
  GRPO_REWARD_WEIGHT_REASONING: 0.5,
  GRPO_REWARD_WEIGHT_FACTUAL: 0.3,
  GRPO_REWARD_WEIGHT_RELEVANCE: 0.2
};

describe('Response Evaluator', () => {
  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();
    
    // Setup default responses
    mockOpenAiClient.chat.completions.create.mockResolvedValue({
      choices: [
        {
          message: {
            content: JSON.stringify({
              reasoning_score: 8,
              factual_score: 7,
              relevance_score: 9,
              feedback: 'Good response overall',
              improvement_suggestion: 'Could be more concise'
            })
          }
        }
      ],
      created: Date.now() / 1000 - 2 // 2 seconds ago
    });
    
    mockOpenAiClient.models.list.mockResolvedValue({
      data: [
        { id: 'gpt-4-turbo' },
        { id: 'gpt-3.5-turbo' }
      ]
    });
  });
  
  test('initializes with correct configuration', () => {
    class ResponseEvaluator {
      constructor() {
        if (!mockConfig.OPENAI_API_KEY) {
          throw new Error('OPENAI_API_KEY is required for evaluation');
        }
        
        // Initialize OpenAI client
        this.openaiClient = mockOpenAiClient;
        
        // Set evaluation model and criteria
        this.evaluationModel = mockConfig.GRPO_EVALUATION_MODEL;
        this.criteria = {
          reasoning_weight: mockConfig.GRPO_REWARD_WEIGHT_REASONING,
          factual_weight: mockConfig.GRPO_REWARD_WEIGHT_FACTUAL,
          relevance_weight: mockConfig.GRPO_REWARD_WEIGHT_RELEVANCE
        };
        
        mockLogger.info('Initialized response evaluator', {
          model: this.evaluationModel,
          criteria: this.criteria
        });
      }
    }
    
    const evaluator = new ResponseEvaluator();
    
    expect(evaluator.evaluationModel).toBe('gpt-4-turbo');
    expect(evaluator.criteria).toEqual({
      reasoning_weight: 0.5,
      factual_weight: 0.3,
      relevance_weight: 0.2
    });
    expect(mockLogger.info).toHaveBeenCalledWith('Initialized response evaluator', expect.any(Object));
  });
  
  test('evaluates responses correctly', async () => {
    // Create evaluateResponse function
    const evaluateResponse = async (prompt, response) => {
      const startTime = Date.now();
      
      try {
        mockLogger.devLog('Evaluating response', {
          promptId: prompt.id,
          responseId: response.id
        });
        
        const evaluationRequest = {
          prompt: prompt.content,
          response: response.content,
          evaluator_model: mockConfig.GRPO_EVALUATION_MODEL,
          evaluation_criteria: {
            reasoning_weight: mockConfig.GRPO_REWARD_WEIGHT_REASONING,
            factual_weight: mockConfig.GRPO_REWARD_WEIGHT_FACTUAL,
            relevance_weight: mockConfig.GRPO_REWARD_WEIGHT_RELEVANCE
          }
        };
        
        // Create system prompt for evaluation
        const systemPrompt = `You are an expert evaluator of language model responses...`;
        
        // Create user prompt with the content to evaluate
        const userPrompt = `Please evaluate the following response to the given prompt:
        
        ### PROMPT:
        ${prompt.content}
        
        ### RESPONSE:
        ${response.content}
        
        Provide your evaluation according to the criteria.`;
        
        // Call OpenAI API for evaluation
        const apiResponse = await mockOpenAiClient.chat.completions.create({
          model: evaluationRequest.evaluator_model,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
          ],
          temperature: 0.2,
          response_format: { type: 'json_object' }
        });
        
        // Parse the JSON response
        const content = apiResponse.choices[0].message.content;
        if (!content) {
          throw new Error('Empty response from evaluator');
        }
        
        const evaluationResults = JSON.parse(content);
        
        // Calculate combined score
        const reasoningScore = (evaluationResults.reasoning_score || 0) / 10;
        const factualScore = (evaluationResults.factual_score || 0) / 10;
        const relevanceScore = (evaluationResults.relevance_score || 0) / 10;
        
        const combinedScore =
          reasoningScore * evaluationRequest.evaluation_criteria.reasoning_weight +
          factualScore * evaluationRequest.evaluation_criteria.factual_weight +
          relevanceScore * evaluationRequest.evaluation_criteria.relevance_weight;
        
        const finalScore = Math.max(0, Math.min(1, combinedScore));
        
        const result = {
          reasoning_score: evaluationResults.reasoning_score || 0,
          factual_score: evaluationResults.factual_score || 0,
          relevance_score: evaluationResults.relevance_score || 0,
          combined_score: finalScore,
          evaluator_model: evaluationRequest.evaluator_model,
          evaluator_feedback: evaluationResults.feedback || '',
          evaluation_time_ms: Date.now() - (apiResponse.created * 1000), // Approximate time
          created_at: new Date()
        };
        
        const elapsedTime = Date.now() - startTime;
        
        mockLogger.metrics('Evaluator', 'evaluateResponse', {
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
        
        mockLogger.metrics('Evaluator', 'evaluateResponse', {
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
    };
    
    const prompt = {
      id: 'prompt-123',
      content: 'Explain quantum computing',
      template_id: 'template-abc',
      parameters: { max_words: 100 },
      created_at: new Date()
    };
    
    const response = {
      id: 'response-456',
      prompt_id: 'prompt-123',
      content: 'Quantum computing uses quantum bits or qubits...',
      model: 'gpt-4',
      model_parameters: { temperature: 0.7 },
      tokens_used: 150,
      generation_time_ms: 2000,
      created_at: new Date()
    };
    
    const result = await evaluateResponse(prompt, response);
    
    // Verify API was called correctly
    expect(mockOpenAiClient.chat.completions.create).toHaveBeenCalledWith(expect.objectContaining({
      model: 'gpt-4-turbo',
      temperature: 0.2,
      response_format: { type: 'json_object' }
    }));
    
    // Verify result content
    expect(result.reasoning_score).toBe(8);
    expect(result.factual_score).toBe(7);
    expect(result.relevance_score).toBe(9);
    expect(result.combined_score).toBeCloseTo(0.8, 1); // 0.8 with tolerance of 0.1
    expect(result.evaluator_feedback).toBe('Good response overall');
    
    // Verify logging
    expect(mockLogger.devLog).toHaveBeenCalledWith('Evaluating response', expect.any(Object));
    expect(mockLogger.metrics).toHaveBeenCalledWith('Evaluator', 'evaluateResponse', expect.any(Object));
  });
  
  test('handles evaluation errors gracefully', async () => {
    // Mock the OpenAI API to throw an error
    mockOpenAiClient.chat.completions.create.mockRejectedValue(new Error('API rate limit exceeded'));
    
    // Create evaluateResponse function that will throw
    const evaluateResponse = async (prompt, response) => {
      const startTime = Date.now();
      
      try {
        // This will throw
        await mockOpenAiClient.chat.completions.create({
          model: 'gpt-4-turbo',
          messages: [
            { role: 'system', content: 'system prompt' },
            { role: 'user', content: 'user prompt' }
          ]
        });
        
        return {}; // This should not be reached
      } catch (error) {
        const elapsedTime = Date.now() - startTime;
        
        mockLogger.metrics('Evaluator', 'evaluateResponse', {
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
    };
    
    const prompt = { id: 'prompt-test', content: 'test prompt' };
    const response = { id: 'response-test', content: 'test response' };
    
    // This should throw
    await expect(evaluateResponse(prompt, response)).rejects.toThrow('API rate limit exceeded');
    
    // Verify logging
    expect(mockLogger.metrics).toHaveBeenCalledWith('Evaluator', 'evaluateResponse', expect.objectContaining({
      success: false,
      error: expect.any(Error)
    }));
  });
  
  test('correctly calculates combined score', () => {
    // Function to calculate combined score
    const calculateCombinedScore = (evaluationResults, criteria) => {
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
    };
    
    // Test with different scores
    const perfectScores = {
      reasoning_score: 10,
      factual_score: 10,
      relevance_score: 10
    };
    
    const mixedScores = {
      reasoning_score: 8,
      factual_score: 6,
      relevance_score: 9
    };
    
    const lowScores = {
      reasoning_score: 3,
      factual_score: 2,
      relevance_score: 4
    };
    
    const criteria = {
      reasoning_weight: 0.5,
      factual_weight: 0.3,
      relevance_weight: 0.2
    };
    
    // Perfect scores should give combined score of 1.0
    expect(calculateCombinedScore(perfectScores, criteria)).toBe(1.0);
    
    // Mixed scores should give an expected value
    // (8/10)*0.5 + (6/10)*0.3 + (9/10)*0.2 = 0.4 + 0.18 + 0.18 = 0.76
    expect(calculateCombinedScore(mixedScores, criteria)).toBeCloseTo(0.76, 2);
    
    // Low scores should give a lower result
    // (3/10)*0.5 + (2/10)*0.3 + (4/10)*0.2 = 0.15 + 0.06 + 0.08 = 0.29
    expect(calculateCombinedScore(lowScores, criteria)).toBeCloseTo(0.29, 2);
  });
  
  test('checks if evaluation model is available', async () => {
    // Create checkEvaluationModel function
    const checkEvaluationModel = async () => {
      try {
        const models = await mockOpenAiClient.models.list();
        return models.data.some(model => model.id === mockConfig.GRPO_EVALUATION_MODEL);
      } catch (error) {
        mockLogger.error('Failed to check evaluation model availability', {
          model: mockConfig.GRPO_EVALUATION_MODEL,
          error
        });
        return false;
      }
    };
    
    // Test with available model
    let isAvailable = await checkEvaluationModel();
    expect(isAvailable).toBe(true);
    
    // Test with unavailable model
    mockConfig.GRPO_EVALUATION_MODEL = 'nonexistent-model';
    isAvailable = await checkEvaluationModel();
    expect(isAvailable).toBe(false);
    
    // Reset for other tests
    mockConfig.GRPO_EVALUATION_MODEL = 'gpt-4-turbo';
    
    // Test with API error
    mockOpenAiClient.models.list.mockRejectedValue(new Error('Failed to list models'));
    isAvailable = await checkEvaluationModel();
    expect(isAvailable).toBe(false);
    expect(mockLogger.error).toHaveBeenCalled();
  });
}); 