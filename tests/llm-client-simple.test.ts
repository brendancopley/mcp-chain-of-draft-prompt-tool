// @ts-nocheck
// tests/llm-client-simple.test.ts
import { describe, test, expect } from '@jest/globals';
import { UnifiedLLMClient } from '../src/core/llm-client.js';

describe('UnifiedLLMClient - Additional Tests', () => {
  // Test additional getters/setters
  test('should allow getting the current provider', () => {
    const client = new UnifiedLLMClient();
    const provider = client.getProvider();
    
    // Just verify it's not empty 
    expect(provider).toBeTruthy();
    expect(typeof provider).toBe('string');
  });
}); 