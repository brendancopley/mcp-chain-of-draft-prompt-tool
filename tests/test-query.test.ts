// @ts-nocheck
// tests/test-query.test.ts
import { describe, test, expect, jest, beforeEach } from '@jest/globals';
import { isChainOfDraftResponse, ChainOfDraftResponse } from '../src/test-query.js';

// We'll override testChainOfDraft in our tests
let mockFetch;

// Mock environment
jest.mock('../src/utils/logger.js', () => ({
  logger: {
    error: jest.fn(),
    codOutput: {
      header: jest.fn(),
      problem: jest.fn(),
      steps: jest.fn(),
      answer: jest.fn(),
      stats: jest.fn()
    }
  }
}));

describe('Test-Query Module', () => {
  beforeEach(() => {
    // Reset mocks between tests
    jest.clearAllMocks();
    
    // Set up fetch mock before each test
    mockFetch = jest.fn();
    global.fetch = mockFetch;
  });

  test('isChainOfDraftResponse should correctly validate responses', () => {
    // Valid response
    const validResponse = {
      reasoning_steps: 'Step 1...',
      final_answer: '42',
      approach: 'CoD',
      stats: {
        word_limit: 50,
        token_count: 100,
        execution_time_ms: 1500,
        complexity: 3
      }
    };
    
    // Invalid responses
    const missingReasoningSteps = { ...validResponse };
    delete missingReasoningSteps.reasoning_steps;
    
    const missingFinalAnswer = { ...validResponse };
    delete missingFinalAnswer.final_answer;
    
    const missingApproach = { ...validResponse };
    delete missingApproach.approach;
    
    const missingStats = { ...validResponse };
    delete missingStats.stats;
    
    const nullValue = null;
    const stringValue = 'not an object';
    
    // Test validation
    expect(isChainOfDraftResponse(validResponse)).toBe(true);
    expect(isChainOfDraftResponse(missingReasoningSteps)).toBe(false);
    expect(isChainOfDraftResponse(missingFinalAnswer)).toBe(false);
    expect(isChainOfDraftResponse(missingApproach)).toBe(false);
    expect(isChainOfDraftResponse(missingStats)).toBe(false);
    expect(isChainOfDraftResponse(nullValue)).toBe(false);
    expect(isChainOfDraftResponse(stringValue)).toBe(false);
  });

  test('testChainOfDraft function makes correct fetch calls', async () => {
    // Import testChainOfDraft directly in the test
    const { testChainOfDraft } = await import('../src/test-query.js');

    // Setup mock response
    const mockResponse = {
      reasoning_steps: 'Step 1: Identify prime numbers...',
      final_answer: 'The sum is 129',
      approach: 'CoD',
      stats: {
        word_limit: 50,
        token_count: 150,
        execution_time_ms: 1200,
        complexity: 2
      }
    };

    // Mock implementation for fetch
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: jest.fn().mockResolvedValueOnce(mockResponse)
    });

    // Verify that our mock is working
    expect(global.fetch).not.toHaveBeenCalled();

    // Call the function
    const result = await testChainOfDraft();
    
    // Check that the function returns success
    expect(result).toBe(true);

    // Verify the fetch call
    expect(mockFetch).toHaveBeenCalledWith(
      'http://localhost:3000/solve',
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: expect.any(String)
      })
    );

    // Parse the body to verify its contents
    const body = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(body).toEqual({
      problem: "What is the sum of the first 10 prime numbers?",
      domain: 'math',
      approach: 'CoD'
    });
  });
  
  test('testChainOfDraft handles connection failures gracefully', async () => {
    // Import testChainOfDraft directly in the test
    const { testChainOfDraft } = await import('../src/test-query.js');
    
    // Mock implementation for fetch to simulate a connection error
    mockFetch.mockRejectedValueOnce(new Error('Connection refused'))
             .mockRejectedValueOnce(new Error('Connection refused'))
             .mockRejectedValueOnce(new Error('Connection refused'));
    
    // Call the function
    const result = await testChainOfDraft();
    
    // Check that the function returns failure
    expect(result).toBe(false);
    
    // Verify the fetch call was attempted the correct number of times
    expect(mockFetch).toHaveBeenCalledTimes(3);
  });
}); 