// @ts-nocheck
// tests/server.test.ts
import { describe, test, expect } from '@jest/globals';

// Basic test for server.ts module
// This test will dynamically import the server module to ensure it loads without errors

describe('Server Module', () => {
  test('should load server.ts without errors', async () => {
    await expect(import('../src/server.ts')).resolves.toBeDefined();
  });
}); 