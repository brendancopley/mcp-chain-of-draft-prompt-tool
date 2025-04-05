import { describe, it, expect, beforeEach } from '@jest/globals';
import { PipelineStorage } from '../pipeline-storage.js';
import { PipelineBuilder, PipelineStepBuilder } from '../pipeline-factory.js';
import { Pipeline } from '../pipeline-types.js';

describe('PipelineStorage', () => {
  let storage: PipelineStorage;
  let samplePipeline: Omit<Pipeline, 'id'>;
  
  beforeEach(() => {
    storage = new PipelineStorage();
    
    // Create a simple pipeline for testing
    samplePipeline = new PipelineBuilder(
      'Test Pipeline',
      'A pipeline for testing storage'
    )
      .withStep(
        new PipelineStepBuilder('step1', 'test_tool')
          .withStaticParam('param1', 'value1')
          .withDefaultNext('end')
          .build()
      )
      .withStartStep('step1')
      .withGlobalState({ testKey: 'testValue' })
      .build();
  });
  
  it('should create a pipeline with unique ID', () => {
    const pipeline = storage.createPipeline(samplePipeline);
    
    // Verify ID was created
    expect(pipeline.id).toBeDefined();
    expect(typeof pipeline.id).toBe('string');
    
    // Verify other properties were copied
    expect(pipeline.name).toBe(samplePipeline.name);
    expect(pipeline.description).toBe(samplePipeline.description);
    expect(pipeline.startStep).toBe(samplePipeline.startStep);
    expect(pipeline.steps).toEqual(samplePipeline.steps);
    expect(pipeline.globalState).toEqual(samplePipeline.globalState);
  });
  
  it('should retrieve a stored pipeline by ID', () => {
    const created = storage.createPipeline(samplePipeline);
    const retrieved = storage.getPipeline(created.id);
    
    expect(retrieved).toBeDefined();
    expect(retrieved).toEqual(created);
  });
  
  it('should return undefined for non-existent pipeline ID', () => {
    const retrieved = storage.getPipeline('non-existent-id');
    expect(retrieved).toBeUndefined();
  });
  
  it('should update an existing pipeline', () => {
    const created = storage.createPipeline(samplePipeline);
    
    const updates = {
      name: 'Updated Pipeline Name',
      description: 'Updated description'
    };
    
    const updated = storage.updatePipeline(created.id, updates);
    
    expect(updated).toBeDefined();
    expect(updated?.name).toBe(updates.name);
    expect(updated?.description).toBe(updates.description);
    
    // Verify ID remains the same
    expect(updated?.id).toBe(created.id);
    
    // Verify other properties are unchanged
    expect(updated?.startStep).toBe(created.startStep);
    expect(updated?.steps).toEqual(created.steps);
  });
  
  it('should return undefined when updating non-existent pipeline', () => {
    const updated = storage.updatePipeline('non-existent-id', { name: 'New Name' });
    expect(updated).toBeUndefined();
  });
  
  it('should delete a pipeline', () => {
    const created = storage.createPipeline(samplePipeline);
    
    // Verify pipeline exists
    expect(storage.getPipeline(created.id)).toBeDefined();
    
    // Delete the pipeline
    const deleted = storage.deletePipeline(created.id);
    expect(deleted).toBe(true);
    
    // Verify pipeline no longer exists
    expect(storage.getPipeline(created.id)).toBeUndefined();
  });
  
  it('should return false when deleting non-existent pipeline', () => {
    const deleted = storage.deletePipeline('non-existent-id');
    expect(deleted).toBe(false);
  });
  
  it('should list all pipelines', () => {
    // Create multiple pipelines
    const pipeline1 = storage.createPipeline(samplePipeline);
    const pipeline2 = storage.createPipeline({
      ...samplePipeline,
      name: 'Another Pipeline',
      description: 'Another test pipeline'
    });
    
    const allPipelines = storage.listPipelines();
    
    expect(Array.isArray(allPipelines)).toBe(true);
    expect(allPipelines.length).toBe(2);
    expect(allPipelines).toContainEqual(pipeline1);
    expect(allPipelines).toContainEqual(pipeline2);
  });
  
  it('should import a pipeline from a definition', () => {
    const definition = {
      name: 'Imported Pipeline',
      description: 'A pipeline imported from definition',
      startStep: 'step1',
      steps: {
        step1: {
          id: 'step1',
          toolName: 'test_tool',
          parameters: {
            param1: {
              type: 'static',
              value: 'imported_value'
            }
          },
          next: {
            default: 'end'
          }
        }
      },
      globalState: {
        importedKey: 'importedValue'
      }
    };
    
    const imported = storage.importPipeline(definition);
    
    expect(imported).toBeDefined();
    expect(imported?.id).toBeDefined();
    expect(imported?.name).toBe(definition.name);
    expect(imported?.description).toBe(definition.description);
    expect(imported?.startStep).toBe(definition.startStep);
    expect(imported?.steps).toEqual(definition.steps);
    expect(imported?.globalState).toEqual(definition.globalState);
  });
  
  it('should reject invalid pipeline definitions', () => {
    // Missing required field
    const invalidDefinition = {
      name: 'Invalid Pipeline'
      // Missing description, startStep, steps
    };
    
    const imported = storage.importPipeline(invalidDefinition);
    expect(imported).toBeUndefined();
  });
  
  it('should export a pipeline to a JSON-compatible object', () => {
    const created = storage.createPipeline(samplePipeline);
    const exported = storage.exportPipeline(created.id);
    
    expect(exported).toBeDefined();
    expect(exported).toEqual(created);
    
    // Verify it's JSON-compatible
    const serialized = JSON.stringify(exported);
    const deserialized = JSON.parse(serialized);
    expect(deserialized).toEqual(exported);
  });
  
  it('should find pipelines by name or description', () => {
    // Create pipelines with different names/descriptions
    storage.createPipeline(samplePipeline);
    storage.createPipeline({
      ...samplePipeline,
      name: 'Data Processing Pipeline',
      description: 'Processes data in multiple steps'
    });
    storage.createPipeline({
      ...samplePipeline,
      name: 'Analysis Pipeline',
      description: 'Analyzes processed data'
    });
    
    // Search by partial name
    const dataResults = storage.findPipelines('data');
    expect(dataResults.length).toBe(1);
    expect(dataResults[0].name).toBe('Data Processing Pipeline');
    
    // Search by partial description
    const processResults = storage.findPipelines('process');
    expect(processResults.length).toBe(1);
    expect(processResults[0].description).toContain('Process');
    
    // Search with no matches
    const noResults = storage.findPipelines('nonexistent');
    expect(noResults.length).toBe(0);
    
    // Empty search returns all pipelines
    const allResults = storage.findPipelines('');
    expect(allResults.length).toBe(3);
  });
}); 