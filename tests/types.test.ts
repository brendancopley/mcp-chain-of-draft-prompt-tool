// @ts-nocheck
// tests/types.test.ts
import { describe, test, expect } from '@jest/globals';

// Basic test for types.ts module
// This test will dynamically import the types module to ensure it loads without errors

describe('Types Module', () => {
  test('should load types.ts without errors', async () => {
    await expect(import('../src/types.ts')).resolves.toBeDefined();
  });
}); 