// @ts-nocheck
// tests/data-exporter.integration.test.ts
import { jest, describe, beforeEach, test, expect, afterEach, afterAll } from '@jest/globals';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { dataExporter } from '../src/export/data-exporter.js';

// Mock dependencies
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
    EXPORT_PATH: path.join(os.tmpdir(), 'mcp-test-exports')
  }
}));

describe('DataExporter Integration Tests', () => {
  const testExportDir = path.join(os.tmpdir(), 'mcp-test-exports');
  
  beforeEach(() => {
    // Setup test directory
    if (!fs.existsSync(testExportDir)) {
      fs.mkdirSync(testExportDir, { recursive: true });
    }
    
    // Reset mocks
    jest.clearAllMocks();
  });
  
  afterEach(() => {
    // Clean up test files after each test
    try {
      const files = fs.readdirSync(testExportDir);
      for (const file of files) {
        fs.unlinkSync(path.join(testExportDir, file));
      }
    } catch (error) {
      // Ignore errors during cleanup
    }
  });
  
  afterAll(() => {
    // Remove test directory after all tests
    try {
      if (fs.existsSync(testExportDir)) {
        fs.rmdirSync(testExportDir);
      }
    } catch (error) {
      // Ignore errors during cleanup
    }
  });
  
  test('exports a single prompt-response pair', async () => {
    const prompt = {
      id: 'test-prompt-id',
      template_id: 'test-template-id',
      content: 'Test prompt content',
      parameters: { param1: 'value1' },
      created_at: new Date()
    };
    
    const response = {
      id: 'test-response-id',
      content: 'Test response content',
      model: 'test-model',
      model_parameters: { temperature: 0.7 },
      tokens_used: 100,
      generation_time_ms: 500,
      created_at: new Date()
    };
    
    const filePath = await dataExporter.exportSingle(prompt, response);
    
    // Verify file was created
    expect(fs.existsSync(filePath)).toBe(true);
    
    // Verify file content
    const fileContent = fs.readFileSync(filePath, 'utf8');
    const data = JSON.parse(fileContent);
    
    expect(data.prompt.id).toBe(prompt.id);
    expect(data.prompt.content).toBe(prompt.content);
    expect(data.response.id).toBe(response.id);
    expect(data.response.content).toBe(response.content);
  });
  
  test('exports a dataset in JSONL format', async () => {
    const promptResponses = [
      {
        prompt: {
          id: 'prompt-1',
          template_id: 'template-1',
          content: 'Test prompt 1',
          parameters: { param1: 'value1' },
          created_at: new Date()
        },
        response: {
          id: 'response-1',
          prompt_id: 'prompt-1',
          content: 'Test response 1',
          model: 'test-model',
          model_parameters: { temperature: 0.7 },
          tokens_used: 100,
          generation_time_ms: 500,
          created_at: new Date()
        }
      },
      {
        prompt: {
          id: 'prompt-2',
          template_id: 'template-2',
          content: 'Test prompt 2',
          parameters: { param2: 'value2' },
          created_at: new Date()
        },
        response: {
          id: 'response-2',
          prompt_id: 'prompt-2',
          content: 'Test response 2',
          model: 'test-model',
          model_parameters: { temperature: 0.8 },
          tokens_used: 200,
          generation_time_ms: 600,
          created_at: new Date()
        }
      }
    ];
    
    const result = await dataExporter.exportDataset(promptResponses, {
      format: 'jsonl',
      include_metadata: true
    });
    
    // Verify result
    expect(result.record_count).toBe(2);
    expect(result.format).toBe('jsonl');
    expect(fs.existsSync(result.file_path)).toBe(true);
    
    // Read file content and verify
    const fileContent = fs.readFileSync(result.file_path, 'utf8');
    const lines = fileContent.trim().split('\n');
    
    expect(lines.length).toBe(2);
    
    const firstRecord = JSON.parse(lines[0]);
    expect(firstRecord.prompt).toBe('Test prompt 1');
    expect(firstRecord.response).toBe('Test response 1');
    expect(firstRecord.metadata.prompt_id).toBe('prompt-1');
  });
  
  test('exports a dataset in CSV format', async () => {
    const promptResponses = [
      {
        prompt: {
          id: 'prompt-1',
          template_id: 'template-1',
          content: 'Test prompt 1',
          parameters: { param1: 'value1' },
          created_at: new Date()
        },
        response: {
          id: 'response-1',
          prompt_id: 'prompt-1',
          content: 'Test response 1',
          model: 'test-model',
          model_parameters: { temperature: 0.7 },
          tokens_used: 100,
          generation_time_ms: 500,
          created_at: new Date()
        }
      }
    ];
    
    const result = await dataExporter.exportDataset(promptResponses, {
      format: 'csv',
      include_metadata: true
    });
    
    // Verify result
    expect(result.record_count).toBe(1);
    expect(result.format).toBe('csv');
    expect(fs.existsSync(result.file_path)).toBe(true);
    
    // Read file content and verify
    const fileContent = fs.readFileSync(result.file_path, 'utf8');
    const lines = fileContent.trim().split('\n');
    
    expect(lines.length).toBe(2); // Header + 1 data row
    expect(lines[0]).toContain('prompt,response');
  });
  
  test('applies filters when exporting dataset', async () => {
    const promptResponses = [
      {
        prompt: {
          id: 'prompt-1',
          template_id: 'template-1',
          content: 'Test prompt 1',
          parameters: { domain: 'math' },
          created_at: new Date()
        },
        response: {
          id: 'response-1',
          prompt_id: 'prompt-1',
          content: 'Test response 1',
          model: 'gpt-4',
          model_parameters: { temperature: 0.7 },
          tokens_used: 100,
          generation_time_ms: 500,
          created_at: new Date()
        }
      },
      {
        prompt: {
          id: 'prompt-2',
          template_id: 'template-2',
          content: 'Test prompt 2',
          parameters: { domain: 'logic' },
          created_at: new Date()
        },
        response: {
          id: 'response-2',
          prompt_id: 'prompt-2',
          content: 'Test response 2',
          model: 'claude-3',
          model_parameters: { temperature: 0.8 },
          tokens_used: 200,
          generation_time_ms: 600,
          created_at: new Date()
        }
      }
    ];
    
    const result = await dataExporter.exportDataset(promptResponses, {
      format: 'jsonl',
      filter: {
        'prompt.parameters': { domain: 'math' }
      }
    });
    
    // Verify only one record was exported
    expect(result.record_count).toBe(1);
    
    // Read file content and verify
    const fileContent = fs.readFileSync(result.file_path, 'utf8');
    const lines = fileContent.trim().split('\n');
    
    expect(lines.length).toBe(1);
    
    const record = JSON.parse(lines[0]);
    expect(record.prompt).toBe('Test prompt 1');
  });
  
  test('handles errors during export', async () => {
    // Mock the implementation of exportAsJsonl to throw an error
    const originalExportDataset = dataExporter.exportDataset;
    dataExporter.exportAsJsonl = jest.fn().mockImplementation(() => {
      throw new Error('Mock export error');
    });
    
    const promptResponses = [
      {
        prompt: {
          id: 'prompt-1',
          template_id: 'template-1',
          content: 'Test prompt',
          parameters: {},
          created_at: new Date()
        },
        response: {
          id: 'response-1',
          content: 'Test response',
          model: 'test-model',
          model_parameters: {},
          tokens_used: 100,
          generation_time_ms: 500,
          created_at: new Date()
        }
      }
    ];
    
    await expect(dataExporter.exportDataset(promptResponses)).rejects.toThrow('Mock export error');
    
    // Restore original methods
    dataExporter.exportAsJsonl = undefined; // Let it be recreated in the next test
  });
}); 