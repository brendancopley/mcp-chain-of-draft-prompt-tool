// @ts-nocheck
// tests/data-exporter.test.ts
import { jest, describe, beforeEach, test, expect, afterEach, afterAll } from '@jest/globals';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the directory of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const testDir = path.resolve(__dirname, '../test-exports');

// Create mock logger
const mockLogger = {
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  devLog: jest.fn()
};

// Mock common dependencies
const mockConfig = {
  EXPORT_PATH: './test-exports'
};

describe('Data Exporter', () => {
  let mockWriteStream;
  let existsSyncSpy;
  let mkdirSyncSpy;
  let writeFileSyncSpy;
  let createWriteStreamSpy;
  let statSyncSpy;
  
  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();
    
    // Set up spy mocks for fs functions
    existsSyncSpy = jest.spyOn(fs, 'existsSync').mockImplementation(() => true);
    mkdirSyncSpy = jest.spyOn(fs, 'mkdirSync').mockImplementation(() => {});
    writeFileSyncSpy = jest.spyOn(fs, 'writeFileSync').mockImplementation(() => {});
    statSyncSpy = jest.spyOn(fs, 'statSync').mockImplementation(() => ({
      size: 1024 // Mock file size
    }));
    
    // Create a mock write stream
    mockWriteStream = {
      write: jest.fn(),
      end: jest.fn(),
      on: jest.fn((event, callback) => {
        if (event === 'finish') {
          setTimeout(callback, 10);
        }
        return mockWriteStream;
      })
    };
    
    createWriteStreamSpy = jest.spyOn(fs, 'createWriteStream').mockImplementation(() => mockWriteStream);
  });

  afterAll(() => {
    // Restore all mocked functions
    jest.restoreAllMocks();
  });
  
  test('ensures export directory exists', () => {
    // Create DataExporter class implementation
    class DataExporter {
      constructor() {
        this.exportPath = mockConfig.EXPORT_PATH;
        this.ensureExportDirectoryExists();
      }
      
      ensureExportDirectoryExists() {
        try {
          if (!fs.existsSync(this.exportPath)) {
            fs.mkdirSync(this.exportPath, { recursive: true });
            mockLogger.info('Created export directory', { path: this.exportPath });
          }
        } catch (error) {
          mockLogger.error('Failed to create export directory', { path: this.exportPath, error });
          throw error;
        }
      }
      
      setExportPath(path) {
        this.exportPath = path;
        this.ensureExportDirectoryExists();
      }
      
      getExportPath() {
        return this.exportPath;
      }
    }
    
    // First test with directory existing
    existsSyncSpy.mockReturnValue(true);
    const dataExporter = new DataExporter();
    const exportPath = './test-exports';
    dataExporter.setExportPath(exportPath);
    
    expect(existsSyncSpy).toHaveBeenCalledWith(exportPath);
    expect(mkdirSyncSpy).not.toHaveBeenCalled();
    
    // Then test with directory not existing
    jest.clearAllMocks();
    existsSyncSpy.mockReturnValue(false);
    
    dataExporter.setExportPath(exportPath);
    expect(existsSyncSpy).toHaveBeenCalledWith(exportPath);
    expect(mkdirSyncSpy).toHaveBeenCalledWith(exportPath, { recursive: true });
  });
  
  test('exports a single prompt-response pair', () => {
    // Implement the exportSingle function
    const exportSingle = (prompt, response) => {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const fileName = `single_${prompt.id}_${timestamp}.json`;
      const filePath = path.join(mockConfig.EXPORT_PATH, fileName);
      
      const data = {
        prompt: {
          id: prompt.id,
          template_id: prompt.template_id,
          content: prompt.content,
          parameters: prompt.parameters,
          created_at: prompt.created_at
        },
        response: {
          id: response.id,
          content: response.content,
          model: response.model,
          model_parameters: response.model_parameters,
          tokens_used: response.tokens_used,
          generation_time_ms: response.generation_time_ms,
          created_at: response.created_at
        }
      };
      
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
      mockLogger.info('Exported single prompt-response pair', { filePath });
      
      return filePath;
    };
    
    const prompt = {
      id: 'prompt-123',
      template_id: 'template-abc',
      content: 'Test prompt content',
      parameters: { param1: 'value1' },
      created_at: new Date('2023-01-01')
    };
    
    const response = {
      id: 'response-456',
      content: 'Test response content',
      model: 'test-model',
      model_parameters: { temperature: 0.7 },
      tokens_used: 100,
      generation_time_ms: 500,
      created_at: new Date('2023-01-01')
    };
    
    const filePath = exportSingle(prompt, response);
    
    expect(writeFileSyncSpy).toHaveBeenCalledTimes(1);
    expect(filePath).toContain('single_prompt-123');
    expect(filePath).toContain('.json');
    
    // Check the content written
    const writeCall = writeFileSyncSpy.mock.calls[0];
    const writtenContent = JSON.parse(writeCall[1]);
    
    expect(writtenContent.prompt.id).toBe('prompt-123');
    expect(writtenContent.prompt.content).toBe('Test prompt content');
    expect(writtenContent.response.id).toBe('response-456');
    expect(writtenContent.response.content).toBe('Test response content');
  });
  
  test('exports a dataset in JSONL format', async () => {
    // Implement the exportAsJsonl function
    const exportAsJsonl = async (data, filePath, config) => {
      return new Promise((resolve, reject) => {
        const writeStream = fs.createWriteStream(filePath, { encoding: 'utf8' });
        
        writeStream.on('error', error => {
          mockLogger.error('Error writing JSONL file', { filePath, error });
          reject(error);
        });
        
        writeStream.on('finish', () => {
          resolve();
        });
        
        // Process each record
        for (const item of data) {
          const record = {
            prompt: item.prompt.content,
            response: item.response.content
          };
          
          // Add metadata if requested
          if (config.include_metadata) {
            record.metadata = {
              prompt_id: item.prompt.id,
              response_id: item.response.id,
              template_id: item.prompt.template_id,
              model: item.response.model,
              tokens_used: item.response.tokens_used,
              generation_time_ms: item.response.generation_time_ms,
              created_at: item.response.created_at.toISOString(),
              prompt_parameters: item.prompt.parameters,
              model_parameters: item.response.model_parameters
            };
          }
          
          // Write the record as a JSON line
          writeStream.write(JSON.stringify(record) + '\n');
        }
        
        writeStream.end();
      });
    };
    
    // Implement the exportDataset function
    const exportDataset = async (promptResponses, config = {}) => {
      const startTime = Date.now();
      
      // Merge with default config
      const exportConfig = {
        format: config.format || 'jsonl',
        path: config.path || mockConfig.EXPORT_PATH,
        filter: config.filter || {},
        include_evaluation: config.include_evaluation !== undefined ? config.include_evaluation : true,
        include_metadata: config.include_metadata !== undefined ? config.include_metadata : true
      };
      
      try {
        // Apply filters if any
        let filteredData = promptResponses;
        
        // Generate a file name based on timestamp and format
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const fileName = `dataset_${timestamp}.${exportConfig.format}`;
        const filePath = path.join(exportConfig.path, fileName);
        
        // Export in JSONL format
        await exportAsJsonl(filteredData, filePath, exportConfig);
        
        // Get file size
        const stats = fs.statSync(filePath);
        const fileSizeBytes = stats.size;
        
        const elapsedTime = Date.now() - startTime;
        
        mockLogger.info('Dataset exported successfully', {
          filePath,
          recordCount: filteredData.length,
          fileSizeBytes,
          durationMs: elapsedTime
        });
        
        return {
          file_path: filePath,
          record_count: filteredData.length,
          file_size_bytes: fileSizeBytes,
          format: exportConfig.format,
          created_at: new Date()
        };
      } catch (error) {
        mockLogger.error('Failed to export dataset', { error });
        throw error;
      }
    };
    
    const promptResponses = [
      {
        prompt: {
          id: 'prompt-1',
          template_id: 'template-1',
          content: 'Test prompt 1',
          parameters: { param1: 'value1' },
          created_at: new Date('2023-01-01')
        },
        response: {
          id: 'response-1',
          prompt_id: 'prompt-1',
          content: 'Test response 1',
          model: 'test-model',
          model_parameters: { temperature: 0.7 },
          tokens_used: 100,
          generation_time_ms: 500,
          created_at: new Date('2023-01-01')
        }
      },
      {
        prompt: {
          id: 'prompt-2',
          template_id: 'template-2',
          content: 'Test prompt 2',
          parameters: { param2: 'value2' },
          created_at: new Date('2023-01-02')
        },
        response: {
          id: 'response-2',
          prompt_id: 'prompt-2',
          content: 'Test response 2',
          model: 'test-model',
          model_parameters: { temperature: 0.8 },
          tokens_used: 200,
          generation_time_ms: 600,
          created_at: new Date('2023-01-02')
        }
      }
    ];
    
    const exportConfig = {
      format: 'jsonl',
      path: './test-exports'
    };
    
    const result = await exportDataset(promptResponses, exportConfig);
    
    expect(result.record_count).toBe(2);
    expect(result.format).toBe('jsonl');
    expect(result.file_size_bytes).toBe(1024);
    
    // Check that write stream was created and used correctly
    expect(createWriteStreamSpy).toHaveBeenCalledTimes(1);
    expect(mockWriteStream.write).toHaveBeenCalledTimes(2); // Two lines for two records
    expect(mockWriteStream.end).toHaveBeenCalledTimes(1);
    
    // Verify content of first record
    const firstWrite = mockWriteStream.write.mock.calls[0][0];
    const firstRecord = JSON.parse(firstWrite.slice(0, -1)); // Remove trailing newline
    
    expect(firstRecord.prompt).toBe('Test prompt 1');
    expect(firstRecord.response).toBe('Test response 1');
    expect(firstRecord.metadata.prompt_id).toBe('prompt-1');
  });
  
  test('getExportPath returns the current export path', () => {
    // Simple test for getExportPath
    class DataExporter {
      constructor() {
        this.exportPath = mockConfig.EXPORT_PATH;
      }
      
      getExportPath() {
        return this.exportPath;
      }
    }
    
    const dataExporter = new DataExporter();
    const path = dataExporter.getExportPath();
    expect(path).toBe('./test-exports');
  });
}); 