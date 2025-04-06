// @ts-nocheck
// tests/vector-database.test.ts
import { jest, describe, beforeEach, test, expect, afterEach } from '@jest/globals';
import { logger } from '../src/utils/logger.js';

// Spy on logger methods
jest.spyOn(logger, 'info');
jest.spyOn(logger, 'devLog');
jest.spyOn(logger, 'warn');
jest.spyOn(logger, 'error');

describe('Vector Database', () => {
  // Import the module inside the test to ensure it gets the mocked dependencies
  let vectorDatabase;
  
  beforeEach(async () => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Import the module
    const module = await import('../src/vector-db/vector-database.js');
    vectorDatabase = module.vectorDatabase;
    
    // Reset the database state
    await vectorDatabase.close();
  });
  
  afterEach(() => {
    jest.clearAllMocks();
  });
  
  test('initializes the mock vector database', async () => {
    // Initialize the database
    await vectorDatabase.initialize();
    
    // Check that logger.info was called
    expect(logger.info).toHaveBeenCalledWith('Initializing mock vector database');
    
    // Calling initialize again should not log again (already initialized)
    logger.info.mockClear();
    await vectorDatabase.initialize();
    expect(logger.info).not.toHaveBeenCalled();
  });
  
  test('stores and retrieves a vector', async () => {
    // Initialize
    await vectorDatabase.initialize();
    
    // Store a vector
    const id = 'test-vector-1';
    const embedding = [0.1, 0.2, 0.3];
    const content = 'Test vector content';
    const metadata = { domain: 'test', timestamp: Date.now() };
    
    const storedId = await vectorDatabase.storeVector(id, embedding, content, metadata);
    
    // The returned ID should match the input ID
    expect(storedId).toBe(id);
    
    // Now retrieve the vector
    const retrieved = await vectorDatabase.getVector(id);
    
    // Check the retrieved vector matches what we stored
    expect(retrieved).toBeDefined();
    expect(retrieved.id).toBe(id);
    expect(retrieved.embedding).toEqual(embedding);
    expect(retrieved.content).toBe(content);
    expect(retrieved.metadata).toEqual(metadata);
  });
  
  test('returns null when getting a non-existent vector', async () => {
    // Initialize
    await vectorDatabase.initialize();
    
    // Try to get a non-existent vector
    const vector = await vectorDatabase.getVector('non-existent-id');
    
    // Should return null
    expect(vector).toBeNull();
  });
  
  test('deletes a vector', async () => {
    // Initialize and store a vector
    await vectorDatabase.initialize();
    const id = 'test-vector-to-delete';
    await vectorDatabase.storeVector(id, [0.5, 0.6, 0.7], 'Vector to delete');
    
    // Verify it exists
    let vector = await vectorDatabase.getVector(id);
    expect(vector).not.toBeNull();
    
    // Delete it
    const deleteResult = await vectorDatabase.deleteVector(id);
    expect(deleteResult).toBe(true);
    
    // Verify it's gone
    vector = await vectorDatabase.getVector(id);
    expect(vector).toBeNull();
    
    // Trying to delete again should return false
    const secondDeleteResult = await vectorDatabase.deleteVector(id);
    expect(secondDeleteResult).toBe(false);
  });
  
  test('searches for similar vectors', async () => {
    // Initialize and store some vectors
    await vectorDatabase.initialize();
    
    for (let i = 0; i < 5; i++) {
      await vectorDatabase.storeVector(
        `vec-${i}`,
        Array(3).fill(0).map(() => Math.random()),
        `Vector ${i}`,
        { index: i }
      );
    }
    
    // Search with a limit of 3
    const results = await vectorDatabase.searchSimilar({
      query_vector: [0.1, 0.2, 0.3],
      limit: 3
    });
    
    // Should get 3 results
    expect(results.length).toBe(3);
    
    // Each result should have the expected structure
    results.forEach(result => {
      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('content');
      expect(result).toHaveProperty('similarity');
      expect(result).toHaveProperty('metadata');
      expect(typeof result.id).toBe('string');
      expect(typeof result.content).toBe('string');
      expect(typeof result.similarity).toBe('number');
    });
  });
  
  test('closes the database and resets state', async () => {
    // Initialize and store a vector
    await vectorDatabase.initialize();
    await vectorDatabase.storeVector('test-id', [0.1, 0.2], 'Test content');
    
    // Close the database
    await vectorDatabase.close();
    
    // The logger should be called
    expect(logger.info).toHaveBeenCalledWith('Closing mock vector database connection');
    
    // The database should be reinitialized to use it again
    const vector = await vectorDatabase.getVector('test-id');
    expect(vector).toBeNull(); // The vector is gone after close
  });
}); 