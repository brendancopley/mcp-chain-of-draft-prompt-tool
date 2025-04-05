// Export all tool-related components
export * from './types.js';
export * from './registry.js';
export * from './semantic-index.js';
export * from './chain-of-draft-tool.js';
export * from './chain-of-tools.js';
export * from './pipeline-types.js';
export * from './pipeline-storage.js';
export * from './pipeline-executor.js';
export * from './pipeline-factory.js';
export * from './pipeline-tools.js';
export * from './example-pipelines.js';

// Create and export instances
import { ChainOfTools } from './chain-of-tools.js';
import { ChainOfDraftTool } from './chain-of-draft-tool.js';
import { ToolRegistry } from './registry.js';
import { PipelineStorage } from './pipeline-storage.js';
import { PipelineExecutor } from './pipeline-executor.js';
import {
  CreatePipelineTool,
  ListPipelinesTool,
  GetPipelineTool,
  ExecutePipelineTool,
  PipelineHumanResponseTool,
  PipelineStatusTool,
  LoadExamplePipelinesTool
} from './pipeline-tools.js';

// Create shared instances
const toolRegistry = new ToolRegistry();
const defaultChainOfTools = new ChainOfTools();
const pipelineStorage = new PipelineStorage();
const pipelineExecutor = new PipelineExecutor(toolRegistry, pipelineStorage);

// Register core tools
const chainOfDraftTool = new ChainOfDraftTool();
toolRegistry.registerTool(chainOfDraftTool);
defaultChainOfTools.registerTool(chainOfDraftTool);

// Register pipeline tools
const createPipelineTool = new CreatePipelineTool(pipelineStorage);
const listPipelinesTool = new ListPipelinesTool(pipelineStorage);
const getPipelineTool = new GetPipelineTool(pipelineStorage);
const executePipelineTool = new ExecutePipelineTool(pipelineStorage, pipelineExecutor);
const pipelineHumanResponseTool = new PipelineHumanResponseTool(pipelineExecutor);
const pipelineStatusTool = new PipelineStatusTool(pipelineExecutor);
const loadExamplePipelinesTool = new LoadExamplePipelinesTool(pipelineStorage);

toolRegistry.registerTool(createPipelineTool);
toolRegistry.registerTool(listPipelinesTool);
toolRegistry.registerTool(getPipelineTool);
toolRegistry.registerTool(executePipelineTool);
toolRegistry.registerTool(pipelineHumanResponseTool);
toolRegistry.registerTool(pipelineStatusTool);
toolRegistry.registerTool(loadExamplePipelinesTool);

// Export instances
export {
  toolRegistry,
  defaultChainOfTools,
  pipelineStorage,
  pipelineExecutor,
  createPipelineTool,
  listPipelinesTool,
  getPipelineTool,
  executePipelineTool,
  pipelineHumanResponseTool,
  pipelineStatusTool,
  loadExamplePipelinesTool
}; 