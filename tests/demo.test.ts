// @ts-nocheck
// tests/demo.test.ts
import { describe, test, expect } from '@jest/globals';

// Basic test for demo.ts module
// This test will dynamically import the demo module to ensure it loads without errors

describe('Demo Module', () => {
  test('should load demo.ts without errors', async () => {
    await expect(import('../src/demo.ts')).resolves.toBeDefined();
  });
}); 