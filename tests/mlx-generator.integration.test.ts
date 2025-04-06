// @ts-nocheck
// tests/mlx-generator.integration.test.ts
import { jest, describe, beforeEach, test, expect, afterEach, beforeAll } from '@jest/globals';
import path from 'path';
import os from 'os';

// Mock modules manually
const spawnMock = jest.fn();
jest.mock('child_process', () => ({
  spawn: spawnMock
}));

// Create manual mocks for fs functions
const fsMock = {
  existsSync: jest.fn().mockReturnValue(true),
  mkdirSync: jest.fn(),
  writeFileSync: jest.fn(),
  readFileSync: jest.fn().mockImplementation(() => 
    JSON.stringify({
      text: 'Generated text response',
      tokens_generated: 42,
      generation_time_ms: 1500
    })
  ),
  unlinkSync: jest.fn()
};

jest.mock('fs', () => fsMock);

jest.mock('../src/utils/logger.js', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    devLog: jest.fn(),
    metrics: jest.fn()
  }
}));

// Mock config
jest.mock('../src/core/config.js', () => ({
  config: {
    MLX_MODEL_PATH: '/path/to/mistral-7b',
    MLX_LORA_PATH: './lora_adapters',
    MLX_QUANTIZE: true,
    PYTHON_PATH: 'python3'
  }
}));

// Mock uuid
jest.mock('uuid', () => ({
  v4: jest.fn().mockReturnValue('mock-uuid')
}));

// Now import the module
import { mlxGenerator } from '../src/mlx/mlx-generator.js';

describe('MLX Generator Integration Tests', () => {
  let mockProcess;
  
  beforeAll(() => {
    // Mock process.cwd()
    jest.spyOn(process, 'cwd').mockReturnValue('/mock/cwd');
  });
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Create mock process
    mockProcess = {
      stdout: {
        on: jest.fn((event, callback) => {
          if (event === 'data') {
            callback(Buffer.from('arm64')); // For Apple Silicon check
          }
          return mockProcess.stdout;
        })
      },
      stderr: {
        on: jest.fn(() => mockProcess.stderr)
      },
      on: jest.fn((event, callback) => {
        if (event === 'close') {
          setTimeout(() => callback(0), 10); // Success exit code
        }
        return mockProcess;
      })
    };
    
    // Set up spawn mock
    spawnMock.mockReturnValue(mockProcess);
  });
  
  afterEach(() => {
    jest.restoreAllMocks();
  });
  
  test('detects model type correctly', () => {
    expect(mlxGenerator.detectModelType('/path/to/llama-2-7b')).toBe('llama');
    expect(mlxGenerator.detectModelType('/models/Mistral-7B-Instruct')).toBe('mistral');
    expect(mlxGenerator.detectModelType('/opt/deepseek-coder')).toBe('deepseek');
    expect(mlxGenerator.detectModelType('/models/gemma-2b')).toBe('gemma');
    expect(mlxGenerator.detectModelType('/models/unknown-model')).toBe('other');
  });
  
  test('updates model configuration', () => {
    // Store the original lora_path
    const originalLoraPath = mlxGenerator.modelConfig.lora_path;
    
    const newConfig = {
      model_path: '/path/to/new-model',
      quantized: false
    };
    
    mlxGenerator.updateModelConfig(newConfig);
    
    expect(mlxGenerator.modelConfig.model_path).toBe('/path/to/new-model');
    expect(mlxGenerator.modelConfig.quantized).toBe(false);
    // Other properties should remain unchanged
    expect(mlxGenerator.modelConfig.lora_path).toBe(originalLoraPath);
  });
  
  test('gets model configuration', () => {
    const config = mlxGenerator.getModelConfig();
    
    expect(config).toEqual(mlxGenerator.modelConfig);
    expect(config).not.toBe(mlxGenerator.modelConfig); // Should be a copy, not a reference
  });
}); 