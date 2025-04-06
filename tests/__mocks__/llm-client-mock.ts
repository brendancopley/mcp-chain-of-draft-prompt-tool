// tests/__mocks__/llm-client-mock.ts
import { jest } from '@jest/globals';

// Mock llmClient implementation
export const llmClient = {
  chat: jest.fn().mockResolvedValue({
    content: "This is a test response that simulates a Chain of Draft reasoning.",
    usage: {
      input_tokens: 100,
      output_tokens: 150
    }
  }),
  getProvider: jest.fn().mockReturnValue('test'),
  getModel: jest.fn().mockReturnValue('test-model'),
  getAvailableModels: jest.fn().mockResolvedValue(['test-model']),
  isModelAvailable: jest.fn().mockResolvedValue(true),
  setModel: jest.fn(),
  switchProvider: jest.fn()
}; 