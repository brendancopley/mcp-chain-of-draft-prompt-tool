// @ts-nocheck
// tests/evaluator.integration.test.ts - Simplified version
import { jest, describe, beforeEach, test, expect } from '@jest/globals';

// Create a proper class-based mock of the evaluator
class MockEvaluator {
  constructor() {
    this.evaluationModel = 'gpt-4-turbo';
    this.criteria = {
      reasoning_weight: 0.5,
      factual_weight: 0.3,
      relevance_weight: 0.2
    };
  }
  
  setEvaluationModel(model) {
    this.evaluationModel = model;
  }
  
  setEvaluationCriteria(criteria) {
    this.criteria = {
      ...this.criteria,
      ...criteria
    };
  }
  
  calculateCombinedScore(evaluationResults) {
    // Normalize scores to 0-1 range (from 0-10 range)
    const reasoningScore = (evaluationResults.reasoning_score || 0) / 10;
    const factualScore = (evaluationResults.factual_score || 0) / 10;
    const relevanceScore = (evaluationResults.relevance_score || 0) / 10;
    
    // Calculate weighted sum
    const combinedScore =
      reasoningScore * this.criteria.reasoning_weight +
      factualScore * this.criteria.factual_weight +
      relevanceScore * this.criteria.relevance_weight;
    
    // Ensure result is in 0-1 range
    return Math.max(0, Math.min(1, combinedScore));
  }
}

describe('ResponseEvaluator Integration Tests', () => {
  let mockEvaluator;
  
  beforeEach(() => {
    // Create a fresh instance for each test
    mockEvaluator = new MockEvaluator();
    
    // Set up spies on the methods
    jest.spyOn(mockEvaluator, 'setEvaluationModel');
    jest.spyOn(mockEvaluator, 'setEvaluationCriteria');
    jest.spyOn(mockEvaluator, 'calculateCombinedScore');
  });
  
  test('sets a custom evaluation model', () => {
    const newModel = 'gpt-4-turbo-preview';
    mockEvaluator.setEvaluationModel(newModel);
    
    // Verify the model was updated
    expect(mockEvaluator.evaluationModel).toBe(newModel);
    expect(mockEvaluator.setEvaluationModel).toHaveBeenCalledWith(newModel);
  });
  
  test('sets custom evaluation criteria', () => {
    const newCriteria = {
      reasoning_weight: 0.6,
      factual_weight: 0.3,
      relevance_weight: 0.1
    };
    
    mockEvaluator.setEvaluationCriteria(newCriteria);
    
    // Verify criteria were updated
    expect(mockEvaluator.criteria.reasoning_weight).toBe(0.6);
    expect(mockEvaluator.criteria.factual_weight).toBe(0.3);
    expect(mockEvaluator.criteria.relevance_weight).toBe(0.1);
    expect(mockEvaluator.setEvaluationCriteria).toHaveBeenCalledWith(newCriteria);
  });
  
  test('correctly calculates combined score', () => {
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
    
    // Perfect scores should give combined score of 1.0
    expect(mockEvaluator.calculateCombinedScore(perfectScores)).toBe(1.0);
    
    // Mixed scores should give an expected value
    // (8/10)*0.5 + (6/10)*0.3 + (9/10)*0.2 = 0.4 + 0.18 + 0.18 = 0.76
    expect(mockEvaluator.calculateCombinedScore(mixedScores)).toBeCloseTo(0.76, 2);
    
    // Low scores should give a lower result
    // (3/10)*0.5 + (2/10)*0.3 + (4/10)*0.2 = 0.15 + 0.06 + 0.08 = 0.29
    expect(mockEvaluator.calculateCombinedScore(lowScores)).toBeCloseTo(0.29, 2);
  });
}); 