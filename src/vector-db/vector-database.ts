import { logger } from '../utils/logger.js';
import { VectorSearchResult, VectorSearchParams } from '../types.js';

/**
 * In-memory mock vector database for testing
 */
class MockVectorDatabase {
  private initialized = false;
  private vectors: Map<string, {
    id: string;
    content: string;
    embedding: number[];
    metadata: Record<string, any>;
  }> = new Map();

  /**
   * Initialize the vector database
   */
  async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }
    
    logger.info('Initializing mock vector database');
    this.initialized = true;
    
    return Promise.resolve();
  }

  /**
   * Store a vector in the database
   */
  async storeVector(
    id: string,
    embedding: number[],
    content: string,
    metadata: Record<string, any> = {}
  ): Promise<string> {
    if (!this.initialized) {
      await this.initialize();
    }
    
    this.vectors.set(id, {
      id,
      content,
      embedding,
      metadata
    });
    
    logger.devLog('Stored vector in mock database', { id });
    
    return id;
  }

  /**
   * Search for similar vectors
   */
  async searchSimilar(params: VectorSearchParams): Promise<VectorSearchResult[]> {
    if (!this.initialized) {
      await this.initialize();
    }
    
    // In a real implementation, we'd use a proper vector similarity search
    // For mock purposes, just return some mock results
    
    const results: VectorSearchResult[] = Array.from(this.vectors.values())
      .slice(0, params.limit)
      .map(vector => ({
        id: vector.id,
        content: vector.content,
        similarity: 0.9, // Mock similarity score
        metadata: vector.metadata
      }));
    
    logger.devLog('Mock vector search', { 
      queryLength: params.query_vector.length,
      limit: params.limit,
      resultCount: results.length
    });
    
    return results;
  }

  /**
   * Get a vector by ID
   */
  async getVector(id: string): Promise<{
    id: string;
    content: string;
    embedding: number[];
    metadata: Record<string, any>;
  } | null> {
    if (!this.initialized) {
      await this.initialize();
    }
    
    const vector = this.vectors.get(id);
    
    if (!vector) {
      logger.devLog('Vector not found in mock database', { id });
      return null;
    }
    
    return vector;
  }

  /**
   * Delete a vector by ID
   */
  async deleteVector(id: string): Promise<boolean> {
    if (!this.initialized) {
      await this.initialize();
    }
    
    const deleted = this.vectors.delete(id);
    
    logger.devLog('Deleted vector from mock database', { id, success: deleted });
    
    return deleted;
  }

  /**
   * Close the database connection
   */
  async close(): Promise<void> {
    logger.info('Closing mock vector database connection');
    this.vectors.clear();
    this.initialized = false;
    
    return Promise.resolve();
  }
}

// Export singleton instance
export const vectorDatabase = new MockVectorDatabase(); 