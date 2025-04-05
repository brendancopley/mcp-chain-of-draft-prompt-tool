import { v4 as uuidv4 } from 'uuid';
import { Pipeline } from './pipeline-types.js';

/**
 * Service to manage pipeline definitions
 */
export class PipelineStorage {
  private pipelines: Map<string, Pipeline>;
  
  constructor() {
    this.pipelines = new Map();
  }
  
  /**
   * Create a new pipeline
   */
  createPipeline(pipeline: Omit<Pipeline, 'id'>): Pipeline {
    const id = uuidv4();
    const newPipeline: Pipeline = {
      ...pipeline,
      id
    };
    
    this.pipelines.set(id, newPipeline);
    return newPipeline;
  }
  
  /**
   * Get a pipeline by ID
   */
  getPipeline(id: string): Pipeline | undefined {
    return this.pipelines.get(id);
  }
  
  /**
   * Update an existing pipeline
   */
  updatePipeline(id: string, pipeline: Partial<Pipeline>): Pipeline | undefined {
    const existing = this.pipelines.get(id);
    if (!existing) {
      return undefined;
    }
    
    const updated: Pipeline = {
      ...existing,
      ...pipeline,
      id // Ensure ID doesn't change
    };
    
    this.pipelines.set(id, updated);
    return updated;
  }
  
  /**
   * Delete a pipeline
   */
  deletePipeline(id: string): boolean {
    return this.pipelines.delete(id);
  }
  
  /**
   * List all pipelines
   */
  listPipelines(): Pipeline[] {
    return Array.from(this.pipelines.values());
  }
  
  /**
   * Import a pipeline from a JSON definition
   */
  importPipeline(definition: any): Pipeline | undefined {
    try {
      // Basic validation
      if (
        typeof definition !== 'object' ||
        !definition.name ||
        !definition.description ||
        !definition.startStep ||
        !definition.steps ||
        Object.keys(definition.steps).length === 0
      ) {
        return undefined;
      }
      
      // Generate new ID
      const id = uuidv4();
      
      const pipeline: Pipeline = {
        id,
        name: definition.name,
        description: definition.description,
        startStep: definition.startStep,
        steps: definition.steps,
        globalState: definition.globalState || {},
        onComplete: definition.onComplete,
        onError: definition.onError,
        metadata: definition.metadata
      };
      
      this.pipelines.set(id, pipeline);
      return pipeline;
    } catch (error) {
      console.error('Error importing pipeline', error);
      return undefined;
    }
  }
  
  /**
   * Export a pipeline to a JSON definition
   */
  exportPipeline(id: string): any | undefined {
    const pipeline = this.pipelines.get(id);
    if (!pipeline) {
      return undefined;
    }
    
    return JSON.parse(JSON.stringify(pipeline));
  }
  
  /**
   * Find pipelines by name or description (fuzzy search)
   */
  findPipelines(query: string): Pipeline[] {
    if (!query || query.trim() === '') {
      return this.listPipelines();
    }
    
    const normalizedQuery = query.toLowerCase();
    
    return Array.from(this.pipelines.values()).filter(pipeline => {
      return (
        pipeline.name.toLowerCase().includes(normalizedQuery) ||
        pipeline.description.toLowerCase().includes(normalizedQuery)
      );
    });
  }
} 