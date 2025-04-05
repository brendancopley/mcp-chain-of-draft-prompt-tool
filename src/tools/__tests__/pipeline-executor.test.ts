import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { PipelineExecutor } from '../pipeline-executor.js';
import { PipelineStorage } from '../pipeline-storage.js';
import { ToolRegistry } from '../registry.js';
import { PipelineBuilder, PipelineStepBuilder } from '../pipeline-factory.js';
import { HumanInteractionResponse } from '../pipeline-types.js';

// Mock implementations
jest.mock('../registry.js');

describe('PipelineExecutor', () => {
  let pipelineExecutor: PipelineExecutor;
  let pipelineStorage: PipelineStorage;
  let toolRegistry: ToolRegistry;
  
  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Setup mocks
    toolRegistry = new ToolRegistry();
    (toolRegistry.executeTool as jest.Mock).mockImplementation(async (toolName, params) => {
      if (toolName === 'always_success') {
        return { 
          success: true, 
          data: { result: 'success' }, 
          metrics: { startTime: Date.now(), endTime: Date.now(), latencyMs: 10 } 
        };
      }
      if (toolName === 'always_fail') {
        return { 
          success: false, 
          error: { name: 'Error', message: 'Tool failed', code: 'EXECUTION_ERROR' }, 
          metrics: { startTime: Date.now(), endTime: Date.now(), latencyMs: 10 } 
        };
      }
      return { 
        success: true, 
        data: { toolName, params }, 
        metrics: { startTime: Date.now(), endTime: Date.now(), latencyMs: 10 } 
      };
    });
    
    // Create real instances with mocks
    pipelineStorage = new PipelineStorage();
    pipelineExecutor = new PipelineExecutor(toolRegistry, pipelineStorage);
  });
  
  it('should execute a simple pipeline successfully', async () => {
    // Create a simple pipeline
    const pipeline = new PipelineBuilder(
      'Test Pipeline',
      'A simple test pipeline'
    )
      .withStep(
        new PipelineStepBuilder('step1', 'always_success')
          .withStaticParam('foo', 'bar')
          .withDefaultNext('end')
          .build()
      )
      .withStartStep('step1')
      .build();
    
    // Store the pipeline
    const savedPipeline = pipelineStorage.createPipeline(pipeline);
    
    // Execute the pipeline
    const result = await pipelineExecutor.executePipeline(savedPipeline);
    
    // Verify the execution
    expect(result.status).toBe('completed');
    expect(result.results.step1).toBeDefined();
    expect(result.results.step1.success).toBe(true);
    expect(toolRegistry.executeTool).toHaveBeenCalledTimes(1);
  });
  
  it('should handle failing steps', async () => {
    // Create a pipeline with error handling
    const pipeline = new PipelineBuilder(
      'Test Pipeline with Error',
      'A pipeline that tests error handling'
    )
      .withStep(
        new PipelineStepBuilder('step1', 'always_fail')
          .withDefaultNext('end')
          .onFailure('errorHandler')
          .build()
      )
      .withStep(
        new PipelineStepBuilder('errorHandler', 'always_success')
          .withStaticParam('error', 'handled')
          .withDefaultNext('end')
          .build()
      )
      .withStartStep('step1')
      .build();
    
    // Store the pipeline
    const savedPipeline = pipelineStorage.createPipeline(pipeline);
    
    // Execute the pipeline
    const result = await pipelineExecutor.executePipeline(savedPipeline);
    
    // Verify the execution
    expect(result.status).toBe('completed');
    expect(result.results.step1).toBeDefined();
    expect(result.results.step1.success).toBe(false);
    expect(result.results.errorHandler).toBeDefined();
    expect(result.results.errorHandler.success).toBe(true);
    expect(toolRegistry.executeTool).toHaveBeenCalledTimes(2);
  });
  
  it('should handle conditional branches', async () => {
    // Create a pipeline with conditional branches
    const pipeline = new PipelineBuilder(
      'Test Pipeline with Conditions',
      'A pipeline that tests conditional branching'
    )
      .withStep(
        new PipelineStepBuilder('step1', 'always_success')
          .withDefaultNext('step3')
          .withCondition('result.result === "success"', 'step2')
          .build()
      )
      .withStep(
        new PipelineStepBuilder('step2', 'always_success')
          .withStaticParam('condition', 'met')
          .withDefaultNext('end')
          .build()
      )
      .withStep(
        new PipelineStepBuilder('step3', 'always_success')
          .withStaticParam('condition', 'default')
          .withDefaultNext('end')
          .build()
      )
      .withStartStep('step1')
      .build();
    
    // Store the pipeline
    const savedPipeline = pipelineStorage.createPipeline(pipeline);
    
    // Execute the pipeline
    const result = await pipelineExecutor.executePipeline(savedPipeline);
    
    // Verify the execution
    expect(result.status).toBe('completed');
    expect(result.results.step1).toBeDefined();
    expect(result.results.step2).toBeDefined();
    expect(result.results.step3).toBeUndefined();
    expect(toolRegistry.executeTool).toHaveBeenCalledTimes(2);
  });
  
  it('should handle loops', async () => {
    // Create a mock for the tool that increments a counter
    (toolRegistry.executeTool as jest.Mock).mockImplementation(async (toolName, params) => {
      if (toolName === 'counter') {
        const counter = (params as { counter?: number }).counter || 0;
        return { 
          success: true, 
          data: { counter: counter + 1 }, 
          metrics: { startTime: Date.now(), endTime: Date.now(), latencyMs: 10 } 
        };
      }
      return { 
        success: true, 
        data: { toolName, params }, 
        metrics: { startTime: Date.now(), endTime: Date.now(), latencyMs: 10 } 
      };
    });
    
    // Create a pipeline with a loop
    const pipeline = new PipelineBuilder(
      'Test Pipeline with Loop',
      'A pipeline that tests looping'
    )
      .withGlobalState({ counter: 0 })
      .withStep(
        new PipelineStepBuilder('loopStep', 'counter')
          .withStaticParam('counter', 0)
          .withForLoop(3, 'iterationCounter', 0, 1)
          .withDefaultNext('finish')
          .build()
      )
      .withStep(
        new PipelineStepBuilder('finish', 'always_success')
          .withDefaultNext('end')
          .build()
      )
      .withStartStep('loopStep')
      .build();
    
    // Store the pipeline
    const savedPipeline = pipelineStorage.createPipeline(pipeline);
    
    // Execute the pipeline
    const result = await pipelineExecutor.executePipeline(savedPipeline);
    
    // Verify the execution
    expect(result.status).toBe('completed');
    expect(toolRegistry.executeTool).toHaveBeenCalledTimes(4); // 3 loop iterations + finish step
    expect(result.loopCounters).toHaveProperty('loopStep');
    expect(result.loopCounters.loopStep).toBe(3); // Final counter value
  });
  
  it('should handle human interaction', async () => {
    // Create a pipeline with human interaction
    const pipeline = new PipelineBuilder(
      'Test Pipeline with Human Interaction',
      'A pipeline that tests human interaction'
    )
      .withStep(
        new PipelineStepBuilder('step1', 'always_success')
          .withDefaultNext('humanStep')
          .build()
      )
      .withStep(
        new PipelineStepBuilder('humanStep', 'always_success')
          .withDefaultNext('finish')
          .withHumanInTheLoop('Please review this step')
          .build()
      )
      .withStep(
        new PipelineStepBuilder('finish', 'always_success')
          .withDefaultNext('end')
          .build()
      )
      .withStartStep('step1')
      .build();
    
    // Store the pipeline
    const savedPipeline = pipelineStorage.createPipeline(pipeline);
    
    // Start executing the pipeline
    const executionPromise = pipelineExecutor.executePipeline(savedPipeline);
    
    // Wait a bit for execution to reach the human step
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Get the current state
    const executions = pipelineExecutor.listActiveExecutions();
    expect(executions.length).toBe(1);
    
    const executionId = executions[0].executionId;
    const currentState = pipelineExecutor.getExecutionState(executionId);
    
    expect(currentState).toBeDefined();
    expect(currentState?.status).toBe('waiting_for_human');
    expect(currentState?.currentStepId).toBe('humanStep');
    
    // Provide human response
    const humanResponse: HumanInteractionResponse = {
      approved: true,
      input: { userDecision: 'proceed' },
      modifications: { humanReviewed: true }
    };
    
    // Process the response
    await pipelineExecutor.processHumanResponse(executionId, humanResponse);
    
    // Wait for pipeline to complete
    const result = await executionPromise;
    
    // Verify the execution
    expect(result.status).toBe('completed');
    expect(result.results.step1).toBeDefined();
    expect(result.results.humanStep).toBeDefined();
    expect(result.results.finish).toBeDefined();
    expect(result.globalState).toHaveProperty('humanReviewed', true);
    expect(toolRegistry.executeTool).toHaveBeenCalledTimes(3);
  });
  
  it('should handle human rejection', async () => {
    // Create a pipeline with human interaction
    const pipeline = new PipelineBuilder(
      'Test Pipeline with Human Rejection',
      'A pipeline where the human rejects'
    )
      .withStep(
        new PipelineStepBuilder('step1', 'always_success')
          .withDefaultNext('humanStep')
          .build()
      )
      .withStep(
        new PipelineStepBuilder('humanStep', 'always_success')
          .withDefaultNext('finish')
          .withHumanInTheLoop('Please review this step')
          .build()
      )
      .withStep(
        new PipelineStepBuilder('finish', 'always_success')
          .withDefaultNext('end')
          .build()
      )
      .withStartStep('step1')
      .build();
    
    // Store the pipeline
    const savedPipeline = pipelineStorage.createPipeline(pipeline);
    
    // Start executing the pipeline
    const executionPromise = pipelineExecutor.executePipeline(savedPipeline);
    
    // Wait a bit for execution to reach the human step
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Get the current state
    const executions = pipelineExecutor.listActiveExecutions();
    expect(executions.length).toBe(1);
    
    const executionId = executions[0].executionId;
    
    // Provide human rejection
    const humanResponse: HumanInteractionResponse = {
      approved: false,
      notes: 'Rejected by human'
    };
    
    // Process the response
    await pipelineExecutor.processHumanResponse(executionId, humanResponse);
    
    // Wait for pipeline to complete
    const result = await executionPromise;
    
    // Verify the execution
    expect(result.status).toBe('failed');
    expect(result.error).toBeDefined();
    expect(result.error?.message).toContain('Human rejected');
    expect(toolRegistry.executeTool).toHaveBeenCalledTimes(2); // Only step1 and humanStep executed
  });
  
  it('should handle dynamic parameters from previous steps', async () => {
    // Mock tool implementations for dynamic parameter testing
    (toolRegistry.executeTool as jest.Mock).mockImplementation(async (toolName, params) => {
      if (toolName === 'producer') {
        return { 
          success: true, 
          data: { outputValue: 42 }, 
          metrics: { startTime: Date.now(), endTime: Date.now(), latencyMs: 10 } 
        };
      }
      if (toolName === 'consumer') {
        return { 
          success: true, 
          data: { receivedValue: (params as { inputValue: number }).inputValue }, 
          metrics: { startTime: Date.now(), endTime: Date.now(), latencyMs: 10 } 
        };
      }
      return { 
        success: true, 
        data: { toolName, params }, 
        metrics: { startTime: Date.now(), endTime: Date.now(), latencyMs: 10 } 
      };
    });
    
    // Create a pipeline with dynamic parameters
    const pipeline = new PipelineBuilder(
      'Test Pipeline with Dynamic Parameters',
      'A pipeline that passes parameters between steps'
    )
      .withStep(
        new PipelineStepBuilder('producer', 'producer')
          .withDefaultNext('consumer')
          .build()
      )
      .withStep(
        new PipelineStepBuilder('consumer', 'consumer')
          .withDynamicParam('inputValue', 'producer', 'outputValue')
          .withDefaultNext('end')
          .build()
      )
      .withStartStep('producer')
      .build();
    
    // Store the pipeline
    const savedPipeline = pipelineStorage.createPipeline(pipeline);
    
    // Execute the pipeline
    const result = await pipelineExecutor.executePipeline(savedPipeline);
    
    // Verify the execution
    expect(result.status).toBe('completed');
    expect(result.results.producer).toBeDefined();
    expect(result.results.consumer).toBeDefined();
    expect(result.results.consumer.data.receivedValue).toBe(42);
    expect(toolRegistry.executeTool).toHaveBeenCalledTimes(2);
  });
}); 