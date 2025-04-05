import { v4 as uuidv4 } from 'uuid';
import { ToolResult } from './types.js';
import { ToolRegistry } from './registry.js';
import { PipelineStorage } from './pipeline-storage.js';
import { 
  Pipeline, 
  PipelineExecutionState, 
  PipelineStep,
  HumanInteractionRequest,
  HumanInteractionResponse
} from './pipeline-types.js';

// Utility to evaluate dynamic expressions
function evaluateExpression(expression: string, context: Record<string, any>): any {
  // Create a safe evaluation function
  const evaluator = new Function(...Object.keys(context), `return ${expression};`);
  return evaluator(...Object.values(context));
}

// Get value from object using dot notation path
function getValueByPath(obj: any, path: string): any {
  return path.split('.').reduce((o, p) => o?.[p], obj);
}

export class PipelineExecutor {
  private toolRegistry: ToolRegistry;
  private pipelineStorage: PipelineStorage;
  private activeExecutions: Map<string, PipelineExecutionState>;
  private humanInteractionHandlers: Map<string, (response: HumanInteractionResponse) => void>;
  
  constructor(toolRegistry: ToolRegistry, pipelineStorage: PipelineStorage) {
    this.toolRegistry = toolRegistry;
    this.pipelineStorage = pipelineStorage;
    this.activeExecutions = new Map();
    this.humanInteractionHandlers = new Map();
  }
  
  async executePipeline(
    pipeline: Pipeline, 
    initialState: Record<string, any> = {}
  ): Promise<PipelineExecutionState> {
    const executionId = uuidv4();
    
    // Initialize execution state
    const state: PipelineExecutionState = {
      pipelineId: pipeline.id,
      executionId,
      currentStepId: pipeline.startStep,
      status: 'running',
      results: {},
      globalState: { ...pipeline.globalState, ...initialState },
      startTime: Date.now(),
      lastUpdateTime: Date.now(),
      loopCounters: {},
      executionPath: [pipeline.startStep]
    };
    
    this.activeExecutions.set(executionId, state);
    
    try {
      // Start execution
      return await this.executeStep(executionId, pipeline);
    } catch (error) {
      state.status = 'failed';
      state.error = error instanceof Error ? error : new Error(String(error));
      state.lastUpdateTime = Date.now();
      return state;
    }
  }
  
  private async executeStep(
    executionId: string, 
    pipeline: Pipeline
  ): Promise<PipelineExecutionState> {
    const state = this.activeExecutions.get(executionId);
    if (!state) {
      throw new Error(`No active execution found with ID: ${executionId}`);
    }
    
    // Check if waiting for human
    if (state.status === 'waiting_for_human') {
      return state;
    }
    
    // Check if completed
    if (state.status === 'completed' || state.status === 'failed') {
      return state;
    }
    
    // Get current step
    const currentStep = pipeline.steps[state.currentStepId];
    if (!currentStep) {
      throw new Error(`Step not found: ${state.currentStepId}`);
    }
    
    // Handle loop control if present
    if (currentStep.loopControl) {
      const { loopControl } = currentStep;
      
      // Initialize loop counter if not exists
      if (!state.loopCounters[currentStep.id]) {
        state.loopCounters[currentStep.id] = loopControl.initialValue || 0;
      }
      
      // Check loop condition
      let shouldContinueLoop = false;
      
      if (loopControl.type === 'for') {
        // For loop: check if counter < maxIterations
        shouldContinueLoop = state.loopCounters[currentStep.id] < loopControl.maxIterations;
      } else if (loopControl.type === 'while' && loopControl.condition) {
        // While loop: evaluate condition
        shouldContinueLoop = evaluateExpression(
          loopControl.condition, 
          { state: state.globalState, results: state.results }
        );
      } else if (loopControl.type === 'until' && loopControl.condition) {
        // Until loop: evaluate condition and negate
        shouldContinueLoop = !evaluateExpression(
          loopControl.condition, 
          { state: state.globalState, results: state.results }
        );
      }
      
      // Exit loop if condition not met
      if (!shouldContinueLoop) {
        // Move to next step
        state.currentStepId = currentStep.next.default || '';
        state.lastUpdateTime = Date.now();
        state.executionPath.push(state.currentStepId);
        
        if (!state.currentStepId) {
          // End of pipeline
          state.status = 'completed';
          return state;
        }
        
        // Continue with next step
        return this.executeStep(executionId, pipeline);
      }
      
      // Increment counter for for-loops
      if (loopControl.type === 'for') {
        state.loopCounters[currentStep.id] += loopControl.increment || 1;
      }
    }
    
    // Resolve parameters
    const resolvedParams: Record<string, any> = {};
    
    for (const [paramName, paramConfig] of Object.entries(currentStep.parameters)) {
      if (paramConfig.type === 'static') {
        resolvedParams[paramName] = paramConfig.value;
      } else if (paramConfig.type === 'dynamic' && paramConfig.source && paramConfig.outputPath) {
        // Get value from previous step result
        const sourceResult = state.results[paramConfig.source];
        if (sourceResult && sourceResult.success) {
          resolvedParams[paramName] = getValueByPath(sourceResult.data, paramConfig.outputPath);
        }
      }
    }
    
    // Add global state to parameters (makes available to all tools)
    resolvedParams.globalState = state.globalState;
    
    // Check if human interaction is required
    if (currentStep.waitForHuman) {
      state.status = 'waiting_for_human';
      state.lastUpdateTime = Date.now();
      
      const humanRequest: HumanInteractionRequest = {
        pipelineId: pipeline.id,
        executionId,
        stepId: currentStep.id,
        prompt: currentStep.humanPrompt || `Review step ${currentStep.id} execution`,
        currentState: { ...state },
        options: []
      };
      
      // Request human interaction
      this.requestHumanInteraction(humanRequest);
      
      return state;
    }
    
    // Execute the tool
    try {
      let result: ToolResult;
      
      // Add retry logic
      const maxRetries = currentStep.maxRetries || 0;
      let attempts = 0;
      
      do {
        attempts++;
        result = await this.toolRegistry.executeTool(currentStep.toolName, resolvedParams);
        
        // Break if successful
        if (result.success) break;
        
      } while (attempts <= maxRetries);
      
      // Store result
      state.results[currentStep.id] = result;
      
      // Update global state if tool execution was successful
      if (result.success && result.data) {
        state.globalState.lastResult = result.data;
      }
      
      // Determine next step
      let nextStepId = '';
      
      // Check onSuccess/onFailure shorthand
      if (result.success && currentStep.onSuccess) {
        nextStepId = currentStep.onSuccess;
      } else if (!result.success && currentStep.onFailure) {
        nextStepId = currentStep.onFailure;
      } else if (currentStep.next.conditions && currentStep.next.conditions.length > 0) {
        // Evaluate conditions
        const context = { 
          result: result.data, 
          state: state.globalState, 
          success: result.success,
          error: result.error
        };
        
        for (const condition of currentStep.next.conditions) {
          try {
            if (evaluateExpression(condition.condition, context)) {
              nextStepId = condition.target;
              break;
            }
          } catch (error) {
            console.error(`Error evaluating condition: ${condition.condition}`, error);
          }
        }
      }
      
      // Use default if no conditions matched
      if (!nextStepId && currentStep.next.default) {
        nextStepId = currentStep.next.default;
      }
      
      // Check for loop (same step)
      if (nextStepId === currentStep.id) {
        // For loops, increment counter
        if (currentStep.loopControl?.type === 'for') {
          state.loopCounters[currentStep.id] = 
            (state.loopCounters[currentStep.id] || 0) + (currentStep.loopControl.increment || 1);
        }
      } else if (nextStepId) {
        // Update to next step
        state.currentStepId = nextStepId;
        state.executionPath.push(nextStepId);
      } else {
        // End of pipeline
        state.status = 'completed';
      }
      
      state.lastUpdateTime = Date.now();
      
      // Continue execution if not completed or waiting
      if (state.status === 'running') {
        return this.executeStep(executionId, pipeline);
      }
      
      return state;
      
    } catch (error) {
      state.status = 'failed';
      state.error = error instanceof Error ? error : new Error(String(error));
      state.lastUpdateTime = Date.now();
      return state;
    }
  }
  
  // Handle human interaction
  requestHumanInteraction(request: HumanInteractionRequest): void {
    // This would be implemented by the specific platform integration
    console.log('Human interaction requested', request);
    
    // In a real implementation, this would send the request to a UI or API
    // For now, we'll just log it and provide a callback registration mechanism
  }
  
  // Register a callback for human interaction responses
  registerHumanInteractionHandler(
    executionId: string,
    callback: (response: HumanInteractionResponse) => void
  ): void {
    this.humanInteractionHandlers.set(executionId, callback);
  }
  
  // Process human response and continue execution
  processHumanResponse(
    executionId: string,
    response: HumanInteractionResponse
  ): Promise<PipelineExecutionState> | null {
    const state = this.activeExecutions.get(executionId);
    if (!state || state.status !== 'waiting_for_human') {
      return null;
    }
    
    // Handle the response
    state.humanInput = response.input;
    
    // Apply modifications to global state if any
    if (response.modifications) {
      state.globalState = { ...state.globalState, ...response.modifications };
    }
    
    // Update state
    if (response.approved) {
      state.status = 'running';
    } else {
      state.status = 'failed';
      state.error = new Error('Human rejected execution');
    }
    
    state.lastUpdateTime = Date.now();
    
    // Notify handler if registered
    const handler = this.humanInteractionHandlers.get(executionId);
    if (handler) {
      handler(response);
      this.humanInteractionHandlers.delete(executionId);
    }
    
    // Continue execution if approved
    if (response.approved) {
      const pipeline = this.getPipeline(state.pipelineId);
      if (pipeline) {
        return this.executeStep(executionId, pipeline);
      }
    }
    
    return Promise.resolve(state);
  }
  
  // Updated method to get pipeline from storage
  private getPipeline(pipelineId: string): Pipeline | null {
    return this.pipelineStorage.getPipeline(pipelineId) || null;
  }
  
  // Get the current state of an execution
  getExecutionState(executionId: string): PipelineExecutionState | undefined {
    return this.activeExecutions.get(executionId);
  }
  
  // List all active executions
  listActiveExecutions(): PipelineExecutionState[] {
    return Array.from(this.activeExecutions.values());
  }
} 