/**
 * Common types and interfaces for tools
 */

/**
 * Tool error interface for error handling
 */
export interface ToolError extends Error {
  code: 'TOOL_NOT_FOUND' | 'INVALID_PARAMETERS' | 'EXECUTION_ERROR';
  details?: any;
}

/**
 * Tool result interface for tool execution
 */
export interface ToolResult {
  success: boolean;
  data?: any;
  error?: ToolError;
  metrics: {
    startTime: number;
    endTime: number;
    latencyMs: number;
  };
}

/**
 * Tool interface for tools registry
 */
export interface Tool {
  name: string;
  description: string;
  parameters: Array<{
    name: string;
    type: string;
    description: string;
    required: boolean;
  }>;
  execute: (params: any) => Promise<ToolResult>;
} 