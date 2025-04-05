import { describe, it, expect, beforeEach } from '@jest/globals';
import { ChainOfDraftTool } from '../chain-of-draft-tool.js';
import { ToolRegistry } from '../registry.js';

describe('Chain-of-Draft Tool', () => {
  let registry: ToolRegistry;
  let tool: ChainOfDraftTool;

  beforeEach(() => {
    registry = new ToolRegistry();
    tool = new ChainOfDraftTool();
    registry.registerTool(tool);
  });

  it('should transform a simple problem using CoD', async () => {
    const result = await registry.executeTool('chain-of-draft', {
      problem: 'What is 2 + 2?',
      domain: 'math',
      approach: 'CoD'
    });

    expect(result.success).toBe(true);
    expect(result.data).toBeDefined();
    expect(result.data?.approach).toBe('CoD');
    expect(result.metrics).toHaveProperty('latencyMs');
  });

  it('should handle invalid parameters', async () => {
    const result = await registry.executeTool('chain-of-draft', {
      // Missing required 'problem' parameter
      domain: 'math'
    });

    expect(result.success).toBe(false);
    expect(result.error?.code).toBe('EXECUTION_ERROR');
  });

  it('should track performance metrics', async () => {
    const result = await registry.executeTool('chain-of-draft', {
      problem: 'What is 3 * 4?',
      domain: 'math'
    });

    const metrics = registry.getMetrics('chain-of-draft');
    expect(metrics['chain-of-draft']).toBeDefined();
    expect(metrics['chain-of-draft'].totalCalls).toBe(1);
    expect(metrics['chain-of-draft'].averageLatency).toBeGreaterThan(0);
  });
}); 