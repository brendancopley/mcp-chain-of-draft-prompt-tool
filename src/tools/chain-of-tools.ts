import { Tool, ToolResult } from './types.js';
import { ToolRegistry } from './registry.js';
import { SemanticIndex } from './semantic-index.js';

interface ChainOfToolsConfig {
  maxToolsPerQuery: number;
  useSemanticMatching: boolean;
}

export class ChainOfTools {
  private registry: ToolRegistry;
  private semanticIndex: SemanticIndex;
  private config: ChainOfToolsConfig;

  constructor(config?: Partial<ChainOfToolsConfig>) {
    this.registry = new ToolRegistry();
    this.semanticIndex = new SemanticIndex();
    this.config = {
      maxToolsPerQuery: 3,
      useSemanticMatching: true,
      ...config
    };
  }

  registerTool(tool: Tool): void {
    this.registry.registerTool(tool);
    this.semanticIndex.indexTool(tool);
  }

  getRegisteredTools(): Tool[] {
    return this.registry.getAllTools();
  }

  async findAndExecuteTools(query: string, params: any = {}): Promise<ToolResult[]> {
    const startTime = Date.now();
    
    try {
      // Find matching tools
      const matchingTools = this.config.useSemanticMatching
        ? this.semanticIndex.findMatchingTools(query, this.config.maxToolsPerQuery)
        : []; // Fallback if semantic matching is disabled
      
      if (matchingTools.length === 0) {
        throw new Error(`No tools found matching query: ${query}`);
      }
      
      // Execute each matching tool
      const results = await Promise.all(
        matchingTools.map(tool => 
          this.registry.executeTool(tool.name, { ...params, problem: query })
        )
      );
      
      return results;
      
    } catch (error) {
      const errorResult: ToolResult = {
        success: false,
        error: {
          name: 'ChainOfToolsError',
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
      
      return [errorResult];
    }
  }

  getMetrics(toolName?: string): Record<string, any> {
    return this.registry.getMetrics(toolName);
  }
} 