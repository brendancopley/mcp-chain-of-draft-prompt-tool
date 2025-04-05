import { Tool, ToolResult } from './types.js';

// Enhanced types for pipeline functionality
export interface PipelineStepParameter {
  type: 'static' | 'dynamic';
  value?: any; // Optional for dynamic parameters
  source?: string; // ID of source step for dynamic parameters
  outputPath?: string; // JSON path to output value for dynamic parameters
}

export interface PipelineCondition {
  condition: string; // JS expression to evaluate
  target: string; // Step to go to if condition is true
}

export interface LoopControl {
  type: 'while' | 'for' | 'until';
  maxIterations: number;
  condition?: string; // Expression for while/until loops
  counterVariable?: string; // Variable name for for loops
  initialValue?: number; // Starting value for for loops
  increment?: number; // Increment value for for loops
}

export interface PipelineStep {
  id: string;
  toolName: string;
  parameters: Record<string, PipelineStepParameter>;
  next: {
    default?: string; // Default next step
    conditions?: PipelineCondition[];
  };
  waitForHuman?: boolean; // Whether to wait for human input
  humanPrompt?: string; // Prompt to show humans
  maxRetries?: number; // For resilience
  loopControl?: LoopControl; // For loops
  onSuccess?: string; // Step to execute on success (shorthand for condition)
  onFailure?: string; // Step to execute on failure (shorthand for condition)
}

export interface Pipeline {
  id: string;
  name: string;
  description: string;
  startStep: string;
  steps: Record<string, PipelineStep>;
  globalState: Record<string, any>; // Shared state across steps
  onComplete?: string; // Callback function or step ID
  onError?: string; // Error handling function or step ID
  metadata?: Record<string, any>; // Additional pipeline metadata
}

export interface PipelineExecutionState {
  pipelineId: string;
  executionId: string;
  currentStepId: string;
  status: 'running' | 'waiting_for_human' | 'completed' | 'failed';
  results: Record<string, ToolResult>;
  globalState: Record<string, any>;
  humanInput?: any;
  error?: Error;
  startTime: number;
  lastUpdateTime: number;
  loopCounters: Record<string, number>; // Track loops
  executionPath: string[]; // History of executed steps
}

export interface HumanInteractionRequest {
  pipelineId: string;
  executionId: string;
  stepId: string;
  prompt: string;
  currentState: PipelineExecutionState;
  options?: any[];
}

export interface HumanInteractionResponse {
  approved: boolean;
  input?: any;
  modifications?: Record<string, any>;
  notes?: string;
} 