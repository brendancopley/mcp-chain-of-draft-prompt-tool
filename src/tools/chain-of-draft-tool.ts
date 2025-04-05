import { Tool, ToolResult, ToolError } from './types.js';
import { chainOfDraftClient } from '../index.js';
import { ChainOfDraftParams, ChainOfDraftResult } from '../types.js';

export class ChainOfDraftTool implements Tool {
  name = 'chain-of-draft';
  description = 'Transforms prompts using chain-of-draft reasoning';
  parameters = [
    {
      name: 'problem',
      type: 'string',
      description: 'The problem to solve',
      required: true
    },
    {
      name: 'domain',
      type: 'string',
      description: 'Domain for context (math, logic, code, common-sense, etc.)',
      required: false
    },
    {
      name: 'max_words_per_step',
      type: 'number',
      description: 'Maximum words per reasoning step',
      required: false
    },
    {
      name: 'approach',
      type: 'string',
      description: "Force 'CoD' or 'CoT' approach",
      required: false
    },
    {
      name: 'enforce_format',
      type: 'boolean',
      description: 'Whether to enforce the word limit',
      required: false
    },
    {
      name: 'adaptive_word_limit',
      type: 'boolean',
      description: 'Adjust word limits based on complexity',
      required: false
    }
  ];

  async execute(params: ChainOfDraftParams): Promise<ToolResult> {
    const startTime = Date.now();

    // Validate required parameters
    if (!params.problem) {
      const error = new Error('Missing required parameter: problem') as ToolError;
      error.code = 'INVALID_PARAMETERS';
      return {
        success: false,
        error,
        metrics: {
          startTime,
          endTime: Date.now(),
          latencyMs: Date.now() - startTime
        }
      };
    }

    try {
      const result = await chainOfDraftClient.solveWithReasoning(params);

      return {
        success: true,
        data: result,
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
          name: 'ChainOfDraftError',
          message: error instanceof Error ? error.message : 'Unknown error occurred',
          code: 'EXECUTION_ERROR',
          details: error
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