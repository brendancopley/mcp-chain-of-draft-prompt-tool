// @ts-nocheck
// tests/logger.test.ts
import { jest, describe, beforeEach, test, expect, afterEach } from '@jest/globals';

// Mock console.log
console.log = jest.fn();

// Mock Winston
jest.mock('winston', () => ({
  format: {
    combine: jest.fn().mockReturnValue({}),
    timestamp: jest.fn().mockReturnValue({}),
    json: jest.fn().mockReturnValue({}),
    colorize: jest.fn().mockReturnValue({}),
    printf: jest.fn().mockImplementation(formatter => formatter),
  },
  createLogger: jest.fn().mockReturnValue({
    log: jest.fn(),
  }),
  addColors: jest.fn(),
  transports: {
    Console: jest.fn(),
  }
}));

// Store original env
const originalEnv = process.env;

describe('Logger Module', () => {
  // Set up test environment before each test
  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();
    
    // Reset environment
    process.env = { ...originalEnv };
    
    // Set debug mode for testing
    process.env.DEBUG = 'true';
    process.env.NODE_ENV = 'development';
  });
  
  // Restore environment after tests
  afterEach(() => {
    process.env = originalEnv;
  });
  
  test('logger.info logs a message with info level', async () => {
    // Import logger after setting up mocks
    const { logger } = await import('../src/utils/logger.js');
    
    // Call the method
    logger.info('Test info message');
    
    // Check console.log was called
    expect(console.log).toHaveBeenCalled();
    
    // The console.log call should contain the level and message
    const call = console.log.mock.calls[0][0];
    expect(call).toContain('[INFO]');
    expect(call).toContain('Test info message');
  });
  
  test('logger.error logs a message with error level', async () => {
    // Import logger
    const { logger } = await import('../src/utils/logger.js');
    
    // Call the method
    logger.error('Test error message');
    
    // Check console.log was called
    expect(console.log).toHaveBeenCalled();
    
    // The console.log call should contain the level and message
    const call = console.log.mock.calls[0][0];
    expect(call).toContain('[ERROR]');
    expect(call).toContain('Test error message');
  });
  
  test('logger.devLog only logs in debug mode', async () => {
    // Import logger
    const { logger } = await import('../src/utils/logger.js');
    
    // Call the method
    logger.devLog('Test dev message');
    
    // Check console.log was called
    expect(console.log).toHaveBeenCalled();
    
    // The console.log call should contain [DEV] and the message
    const call = console.log.mock.calls[0][0];
    expect(call).toContain('[DEV]');
    expect(call).toContain('Test dev message');
    
    // Now test with debug mode off
    console.log.mockClear();
    process.env.DEBUG = 'false';
    
    // Call the method again
    logger.devLog('Test dev message that should not be logged');
    
    // Check console.log was not called
    expect(console.log).not.toHaveBeenCalled();
  });
  
  test('logger.metrics logs metric data correctly', async () => {
    // Import logger
    const { logger } = await import('../src/utils/logger.js');
    
    // Create some metrics
    const metrics = {
      duration_ms: 500,
      success: true,
      tokens: 100,
      details: { test: 'data' }
    };
    
    // Call the method
    logger.metrics('TestComponent', 'testOperation', metrics);
    
    // Check console.log was called
    expect(console.log).toHaveBeenCalled();
    
    // The console.log call should contain component, operation and success
    const call = console.log.mock.calls[0][0];
    expect(call).toContain('[TestComponent]');
    expect(call).toContain('testOperation');
    expect(call).toContain('Success');
    
    // The formatted JSON should include our metrics
    expect(call).toContain('test');
    expect(call).toContain('500');
    expect(call).toContain('100');
  });
  
  test('logger has the codOutput property for specialized output', async () => {
    // Import logger
    const { logger } = await import('../src/utils/logger.js');
    
    // Check that codOutput exists
    expect(logger.codOutput).toBeDefined();
    
    // Call each method
    logger.codOutput.header('Test Header');
    logger.codOutput.problem('Test Problem');
    logger.codOutput.steps('Test Steps');
    logger.codOutput.answer('Test Answer');
    logger.codOutput.stats({ test: 'stats' });
    
    // Each should call console.log
    expect(console.log).toHaveBeenCalledTimes(5);
    
    // Check each call
    expect(console.log).toHaveBeenCalledWith('Test Header');
    expect(console.log).toHaveBeenCalledWith('Test Problem');
    expect(console.log).toHaveBeenCalledWith('Test Steps');
    expect(console.log).toHaveBeenCalledWith('Test Answer');
    expect(console.log).toHaveBeenCalledWith({ test: 'stats' });
  });
}); 