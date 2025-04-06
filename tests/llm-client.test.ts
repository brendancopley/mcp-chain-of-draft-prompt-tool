// @ts-nocheck
// tests/llm-client.test.ts
import { describe, test, expect, jest, beforeEach } from '@jest/globals';
import { UnifiedLLMClient } from '../src/core/llm-client.js';

describe('UnifiedLLMClient', () => {
  // Test only the basic functionality without relying on mocks
  test('should set and get model correctly', () => {
    const client = new UnifiedLLMClient();
    const initialModel = client.getModel();
    
    // Set a new model
    client.setModel('new-test-model');
    
    // Verify the model was updated
    expect(client.getModel()).toBe('new-test-model');
    expect(client.getModel()).not.toBe(initialModel);
  });
  
  // Test provider getter
  test('should return a valid provider string', () => {
    const client = new UnifiedLLMClient();
    const provider = client.getProvider();
    
    // Just verify it returns a string
    expect(typeof provider).toBe('string');
    // Provider should be one of the supported types
    expect(['anthropic', 'openai', 'mistral', 'ollama', 'test']).toContain(provider);
  });
}); 