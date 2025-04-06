// @ts-nocheck
// tests/index.test.ts
import { describe, test, expect } from '@jest/globals';

// Basic test for index.ts module
// This test will dynamically import the index module to ensure it loads without errors

describe('Index Module', () => {
  test('should load index.ts without errors', async () => {
    await expect(import('../src/index.ts')).resolves.toBeDefined();
  });
}); 