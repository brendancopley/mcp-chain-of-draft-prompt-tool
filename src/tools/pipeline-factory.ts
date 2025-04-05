import {
  Pipeline,
  PipelineStep,
  PipelineStepParameter,
  PipelineCondition,
  LoopControl
} from './pipeline-types.js';

/**
 * PipelineStepBuilder provides a fluent API for building pipeline steps
 */
export class PipelineStepBuilder {
  private step: PipelineStep;
  
  constructor(id: string, toolName: string) {
    this.step = {
      id,
      toolName,
      parameters: {},
      next: {}
    };
  }
  
  /**
   * Add a static parameter
   */
  withStaticParam(name: string, value: any): PipelineStepBuilder {
    this.step.parameters[name] = {
      type: 'static',
      value
    };
    return this;
  }
  
  /**
   * Add a dynamic parameter from another step's output
   */
  withDynamicParam(name: string, sourceStepId: string, outputPath: string): PipelineStepBuilder {
    this.step.parameters[name] = {
      type: 'dynamic',
      source: sourceStepId,
      outputPath
    };
    return this;
  }
  
  /**
   * Set the default next step
   */
  withDefaultNext(nextStepId: string): PipelineStepBuilder {
    this.step.next.default = nextStepId;
    return this;
  }
  
  /**
   * Add a conditional branch
   */
  withCondition(condition: string, targetStepId: string): PipelineStepBuilder {
    if (!this.step.next.conditions) {
      this.step.next.conditions = [];
    }
    
    this.step.next.conditions.push({
      condition,
      target: targetStepId
    });
    
    return this;
  }
  
  /**
   * Configure step to wait for human approval
   */
  withHumanInTheLoop(prompt?: string): PipelineStepBuilder {
    this.step.waitForHuman = true;
    if (prompt) {
      this.step.humanPrompt = prompt;
    }
    return this;
  }
  
  /**
   * Configure retry behavior
   */
  withRetries(maxRetries: number): PipelineStepBuilder {
    this.step.maxRetries = maxRetries;
    return this;
  }
  
  /**
   * Configure a for loop
   */
  withForLoop(
    maxIterations: number,
    counterVariable: string,
    initialValue = 0,
    increment = 1
  ): PipelineStepBuilder {
    this.step.loopControl = {
      type: 'for',
      maxIterations,
      counterVariable,
      initialValue,
      increment
    };
    return this;
  }
  
  /**
   * Configure a while loop
   */
  withWhileLoop(condition: string, maxIterations: number): PipelineStepBuilder {
    this.step.loopControl = {
      type: 'while',
      condition,
      maxIterations
    };
    return this;
  }
  
  /**
   * Configure an until loop
   */
  withUntilLoop(condition: string, maxIterations: number): PipelineStepBuilder {
    this.step.loopControl = {
      type: 'until',
      condition,
      maxIterations
    };
    return this;
  }
  
  /**
   * Set the step to execute on success
   */
  onSuccess(stepId: string): PipelineStepBuilder {
    this.step.onSuccess = stepId;
    return this;
  }
  
  /**
   * Set the step to execute on failure
   */
  onFailure(stepId: string): PipelineStepBuilder {
    this.step.onFailure = stepId;
    return this;
  }
  
  /**
   * Get the built step
   */
  build(): PipelineStep {
    return { ...this.step };
  }
}

/**
 * PipelineBuilder provides a fluent API for building pipelines
 */
export class PipelineBuilder {
  private pipeline: Omit<Pipeline, 'id'>;
  private steps: Record<string, PipelineStep> = {};
  
  constructor(name: string, description: string) {
    this.pipeline = {
      name,
      description,
      startStep: '',
      steps: {},
      globalState: {}
    };
  }
  
  /**
   * Set the starting step of the pipeline
   */
  withStartStep(stepId: string): PipelineBuilder {
    this.pipeline.startStep = stepId;
    return this;
  }
  
  /**
   * Add a step to the pipeline
   */
  withStep(step: PipelineStep): PipelineBuilder {
    this.steps[step.id] = step;
    return this;
  }
  
  /**
   * Add global state to the pipeline
   */
  withGlobalState(state: Record<string, any>): PipelineBuilder {
    this.pipeline.globalState = { ...this.pipeline.globalState, ...state };
    return this;
  }
  
  /**
   * Set the completion handler
   */
  withCompletionHandler(handlerId: string): PipelineBuilder {
    this.pipeline.onComplete = handlerId;
    return this;
  }
  
  /**
   * Set the error handler
   */
  withErrorHandler(handlerId: string): PipelineBuilder {
    this.pipeline.onError = handlerId;
    return this;
  }
  
  /**
   * Add metadata to the pipeline
   */
  withMetadata(metadata: Record<string, any>): PipelineBuilder {
    this.pipeline.metadata = { ...this.pipeline.metadata, ...metadata };
    return this;
  }
  
  /**
   * Build the pipeline
   */
  build(): Omit<Pipeline, 'id'> {
    if (!this.pipeline.startStep) {
      throw new Error('Pipeline must have a start step');
    }
    
    if (Object.keys(this.steps).length === 0) {
      throw new Error('Pipeline must have at least one step');
    }
    
    // Ensure all steps are added to the pipeline
    this.pipeline.steps = { ...this.steps };
    
    // Validate step references
    this.validateStepReferences();
    
    return { ...this.pipeline };
  }
  
  /**
   * Validate that all step references point to existing steps
   */
  private validateStepReferences(): void {
    // Get all step IDs
    const stepIds = new Set(Object.keys(this.steps));
    
    // Check if start step exists
    if (!stepIds.has(this.pipeline.startStep)) {
      throw new Error(`Start step "${this.pipeline.startStep}" not found`);
    }
    
    // Check all next references
    for (const [stepId, step] of Object.entries(this.steps)) {
      // Check default next
      if (step.next.default && !stepIds.has(step.next.default) && step.next.default !== 'end') {
        throw new Error(`Step "${stepId}" references non-existent next step "${step.next.default}"`);
      }
      
      // Check conditions
      if (step.next.conditions) {
        for (const condition of step.next.conditions) {
          if (!stepIds.has(condition.target) && condition.target !== 'end') {
            throw new Error(
              `Step "${stepId}" condition references non-existent target step "${condition.target}"`
            );
          }
        }
      }
      
      // Check onSuccess
      if (step.onSuccess && !stepIds.has(step.onSuccess) && step.onSuccess !== 'end') {
        throw new Error(`Step "${stepId}" references non-existent onSuccess step "${step.onSuccess}"`);
      }
      
      // Check onFailure
      if (step.onFailure && !stepIds.has(step.onFailure) && step.onFailure !== 'end') {
        throw new Error(`Step "${stepId}" references non-existent onFailure step "${step.onFailure}"`);
      }
    }
  }
} 