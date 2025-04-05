import { Tool, ToolResult } from './types.js';
import { PipelineStorage } from './pipeline-storage.js';
import { PipelineExecutor } from './pipeline-executor.js';
import { PipelineBuilder, PipelineStepBuilder } from './pipeline-factory.js';
import { HumanInteractionResponse } from './pipeline-types.js';
import { createExamplePipelines } from './example-pipelines.js';

/**
 * Tool for creating a new pipeline
 */
export class CreatePipelineTool implements Tool {
  name = 'pipeline_create';
  description = 'Create a new pipeline definition';
  parameters = [
    {
      name: 'name',
      type: 'string',
      description: 'Name of the pipeline',
      required: true
    },
    {
      name: 'description',
      type: 'string',
      description: 'Description of the pipeline',
      required: true
    },
    {
      name: 'definition',
      type: 'object',
      description: 'Full pipeline definition or a list of steps',
      required: false
    }
  ];
  
  private pipelineStorage: PipelineStorage;
  
  constructor(pipelineStorage: PipelineStorage) {
    this.pipelineStorage = pipelineStorage;
  }
  
  async execute(params: any): Promise<ToolResult> {
    const startTime = Date.now();
    
    try {
      // If definition provided, import it directly
      if (params.definition) {
        const pipeline = this.pipelineStorage.importPipeline({
          name: params.name,
          description: params.description,
          ...params.definition
        });
        
        if (!pipeline) {
          throw new Error('Failed to import pipeline definition');
        }
        
        return {
          success: true,
          data: {
            pipelineId: pipeline.id,
            name: pipeline.name,
            description: pipeline.description
          },
          metrics: {
            startTime,
            endTime: Date.now(),
            latencyMs: Date.now() - startTime
          }
        };
      }
      
      // Create an empty pipeline
      const pipelineBuilder = new PipelineBuilder(params.name, params.description);
      const pipelineDefinition = pipelineBuilder.build();
      
      // This will throw an error for an empty pipeline, so we'll add a dummy step
      // to create the pipeline and update it later
      try {
        const dummyStep = new PipelineStepBuilder('dummy', 'no_op')
          .withDefaultNext('end')
          .build();
        
        pipelineBuilder.withStep(dummyStep).withStartStep('dummy');
        const pipelineWithDummy = pipelineBuilder.build();
        const pipeline = this.pipelineStorage.createPipeline(pipelineWithDummy);
        
        return {
          success: true,
          data: {
            pipelineId: pipeline.id,
            name: pipeline.name,
            description: pipeline.description,
            message: 'Created empty pipeline with dummy step'
          },
          metrics: {
            startTime,
            endTime: Date.now(),
            latencyMs: Date.now() - startTime
          }
        };
      } catch (error) {
        throw new Error(`Failed to create pipeline: ${error instanceof Error ? error.message : String(error)}`);
      }
    } catch (error) {
      return {
        success: false,
        error: {
          name: 'PipelineCreationError',
          message: error instanceof Error ? error.message : String(error),
          code: 'EXECUTION_ERROR'
        },
        metrics: {
          startTime,
          endTime: Date.now(),
          latencyMs: Date.now() - startTime
        }
      };
    }
  }
}

/**
 * Tool for listing pipelines
 */
export class ListPipelinesTool implements Tool {
  name = 'pipeline_list';
  description = 'List available pipelines';
  parameters = [
    {
      name: 'query',
      type: 'string',
      description: 'Optional search query to filter pipelines',
      required: false
    }
  ];
  
  private pipelineStorage: PipelineStorage;
  
  constructor(pipelineStorage: PipelineStorage) {
    this.pipelineStorage = pipelineStorage;
  }
  
  async execute(params: any): Promise<ToolResult> {
    const startTime = Date.now();
    
    try {
      const query = params.query || '';
      const pipelines = this.pipelineStorage.findPipelines(query);
      
      return {
        success: true,
        data: {
          pipelines: pipelines.map(p => ({
            id: p.id,
            name: p.name,
            description: p.description,
            stepCount: Object.keys(p.steps).length
          })),
          count: pipelines.length
        },
        metrics: {
          startTime,
          endTime: Date.now(),
          latencyMs: Date.now() - startTime
        }
      };
    } catch (error) {
      return {
        success: false,
        error: {
          name: 'PipelineListError',
          message: error instanceof Error ? error.message : String(error),
          code: 'EXECUTION_ERROR'
        },
        metrics: {
          startTime,
          endTime: Date.now(),
          latencyMs: Date.now() - startTime
        }
      };
    }
  }
}

/**
 * Tool for getting pipeline details
 */
export class GetPipelineTool implements Tool {
  name = 'pipeline_get';
  description = 'Get details of a specific pipeline';
  parameters = [
    {
      name: 'pipelineId',
      type: 'string',
      description: 'ID of the pipeline to retrieve',
      required: true
    }
  ];
  
  private pipelineStorage: PipelineStorage;
  
  constructor(pipelineStorage: PipelineStorage) {
    this.pipelineStorage = pipelineStorage;
  }
  
  async execute(params: any): Promise<ToolResult> {
    const startTime = Date.now();
    
    try {
      const pipelineId = params.pipelineId;
      const pipeline = this.pipelineStorage.getPipeline(pipelineId);
      
      if (!pipeline) {
        throw new Error(`Pipeline not found with ID: ${pipelineId}`);
      }
      
      return {
        success: true,
        data: this.pipelineStorage.exportPipeline(pipelineId),
        metrics: {
          startTime,
          endTime: Date.now(),
          latencyMs: Date.now() - startTime
        }
      };
    } catch (error) {
      return {
        success: false,
        error: {
          name: 'PipelineGetError',
          message: error instanceof Error ? error.message : String(error),
          code: 'EXECUTION_ERROR'
        },
        metrics: {
          startTime,
          endTime: Date.now(),
          latencyMs: Date.now() - startTime
        }
      };
    }
  }
}

/**
 * Tool for executing a pipeline
 */
export class ExecutePipelineTool implements Tool {
  name = 'pipeline_execute';
  description = 'Execute a pipeline';
  parameters = [
    {
      name: 'pipelineId',
      type: 'string',
      description: 'ID of the pipeline to execute',
      required: true
    },
    {
      name: 'initialState',
      type: 'object',
      description: 'Initial state to provide to the pipeline',
      required: false
    }
  ];
  
  private pipelineStorage: PipelineStorage;
  private pipelineExecutor: PipelineExecutor;
  
  constructor(pipelineStorage: PipelineStorage, pipelineExecutor: PipelineExecutor) {
    this.pipelineStorage = pipelineStorage;
    this.pipelineExecutor = pipelineExecutor;
  }
  
  async execute(params: any): Promise<ToolResult> {
    const startTime = Date.now();
    
    try {
      const pipelineId = params.pipelineId;
      const initialState = params.initialState || {};
      
      const pipeline = this.pipelineStorage.getPipeline(pipelineId);
      if (!pipeline) {
        throw new Error(`Pipeline not found with ID: ${pipelineId}`);
      }
      
      const executionState = await this.pipelineExecutor.executePipeline(pipeline, initialState);
      
      return {
        success: true,
        data: {
          executionId: executionState.executionId,
          status: executionState.status,
          currentStep: executionState.currentStepId,
          startTime: new Date(executionState.startTime).toISOString(),
          lastUpdateTime: new Date(executionState.lastUpdateTime).toISOString(),
          results: executionState.status === 'completed' ? executionState.results : undefined,
          executionPath: executionState.executionPath,
          waitingForHuman: executionState.status === 'waiting_for_human'
        },
        metrics: {
          startTime,
          endTime: Date.now(),
          latencyMs: Date.now() - startTime
        }
      };
    } catch (error) {
      return {
        success: false,
        error: {
          name: 'PipelineExecutionError',
          message: error instanceof Error ? error.message : String(error),
          code: 'EXECUTION_ERROR'
        },
        metrics: {
          startTime,
          endTime: Date.now(),
          latencyMs: Date.now() - startTime
        }
      };
    }
  }
}

/**
 * Tool for responding to human interaction requests
 */
export class PipelineHumanResponseTool implements Tool {
  name = 'pipeline_human_response';
  description = 'Submit a human response to a pipeline that is waiting for human interaction';
  parameters = [
    {
      name: 'executionId',
      type: 'string',
      description: 'ID of the pipeline execution',
      required: true
    },
    {
      name: 'approved',
      type: 'boolean',
      description: 'Whether the human approves the step',
      required: true
    },
    {
      name: 'input',
      type: 'object',
      description: 'Input data from the human',
      required: false
    },
    {
      name: 'modifications',
      type: 'object',
      description: 'Modifications to the global state',
      required: false
    },
    {
      name: 'notes',
      type: 'string',
      description: 'Notes about the human decision',
      required: false
    }
  ];
  
  private pipelineExecutor: PipelineExecutor;
  
  constructor(pipelineExecutor: PipelineExecutor) {
    this.pipelineExecutor = pipelineExecutor;
  }
  
  async execute(params: any): Promise<ToolResult> {
    const startTime = Date.now();
    
    try {
      const executionId = params.executionId;
      const approved = params.approved === true;
      
      const response: HumanInteractionResponse = {
        approved,
        input: params.input,
        modifications: params.modifications,
        notes: params.notes
      };
      
      const executionState = await this.pipelineExecutor.processHumanResponse(executionId, response);
      
      if (!executionState) {
        throw new Error(`No execution found with ID: ${executionId} or it is not waiting for human input`);
      }
      
      return {
        success: true,
        data: {
          executionId: executionState.executionId,
          status: executionState.status,
          currentStep: executionState.currentStepId,
          message: approved ? 'Human approved, execution continuing' : 'Human rejected, execution failed'
        },
        metrics: {
          startTime,
          endTime: Date.now(),
          latencyMs: Date.now() - startTime
        }
      };
    } catch (error) {
      return {
        success: false,
        error: {
          name: 'HumanResponseError',
          message: error instanceof Error ? error.message : String(error),
          code: 'EXECUTION_ERROR'
        },
        metrics: {
          startTime,
          endTime: Date.now(),
          latencyMs: Date.now() - startTime
        }
      };
    }
  }
}

/**
 * Tool for checking a pipeline execution status
 */
export class PipelineStatusTool implements Tool {
  name = 'pipeline_status';
  description = 'Check the status of a pipeline execution';
  parameters = [
    {
      name: 'executionId',
      type: 'string',
      description: 'ID of the pipeline execution',
      required: true
    }
  ];
  
  private pipelineExecutor: PipelineExecutor;
  
  constructor(pipelineExecutor: PipelineExecutor) {
    this.pipelineExecutor = pipelineExecutor;
  }
  
  async execute(params: any): Promise<ToolResult> {
    const startTime = Date.now();
    
    try {
      const executionId = params.executionId;
      const executionState = this.pipelineExecutor.getExecutionState(executionId);
      
      if (!executionState) {
        throw new Error(`No execution found with ID: ${executionId}`);
      }
      
      return {
        success: true,
        data: {
          executionId: executionState.executionId,
          pipelineId: executionState.pipelineId,
          status: executionState.status,
          currentStep: executionState.currentStepId,
          startTime: new Date(executionState.startTime).toISOString(),
          lastUpdateTime: new Date(executionState.lastUpdateTime).toISOString(),
          executionPath: executionState.executionPath,
          waitingForHuman: executionState.status === 'waiting_for_human',
          executionDuration: executionState.lastUpdateTime - executionState.startTime
        },
        metrics: {
          startTime,
          endTime: Date.now(),
          latencyMs: Date.now() - startTime
        }
      };
    } catch (error) {
      return {
        success: false,
        error: {
          name: 'PipelineStatusError',
          message: error instanceof Error ? error.message : String(error),
          code: 'EXECUTION_ERROR'
        },
        metrics: {
          startTime,
          endTime: Date.now(),
          latencyMs: Date.now() - startTime
        }
      };
    }
  }
}

/**
 * Tool for loading example pipelines
 */
export class LoadExamplePipelinesTool implements Tool {
  name = 'pipeline_load_examples';
  description = 'Load example pipelines into the storage';
  parameters = [];
  
  private pipelineStorage: PipelineStorage;
  
  constructor(pipelineStorage: PipelineStorage) {
    this.pipelineStorage = pipelineStorage;
  }
  
  async execute(params: any): Promise<ToolResult> {
    const startTime = Date.now();
    
    try {
      createExamplePipelines(this.pipelineStorage);
      
      const allPipelines = this.pipelineStorage.listPipelines();
      
      return {
        success: true,
        data: {
          message: 'Example pipelines loaded successfully',
          pipelineCount: allPipelines.length,
          pipelineList: allPipelines.map(p => ({
            id: p.id,
            name: p.name
          }))
        },
        metrics: {
          startTime,
          endTime: Date.now(),
          latencyMs: Date.now() - startTime
        }
      };
    } catch (error) {
      return {
        success: false,
        error: {
          name: 'LoadExamplesError',
          message: error instanceof Error ? error.message : String(error),
          code: 'EXECUTION_ERROR'
        },
        metrics: {
          startTime,
          endTime: Date.now(),
          latencyMs: Date.now() - startTime
        }
      };
    }
  }
} 