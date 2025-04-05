import { Tool, ToolError, ToolResult } from './types.js';
import fs from 'fs';
import path from 'path';
import os from 'os';

// Type definitions for mcp.json configuration
interface MCPServerConfig {
  command: string;
  args?: string[];
  env?: Record<string, string>;
  enabled?: boolean;
}

interface MCPConfig {
  mcpServers: Record<string, MCPServerConfig>;
}

export class ToolRegistry {
  private tools = new Map<string, Tool>();
  private metrics = new Map<string, {
    totalCalls: number;
    successfulCalls: number;
    totalLatency: number;
  }>();

  constructor(loadMcpConfig = false) {
    if (loadMcpConfig) {
      this.loadToolsFromMcpConfig();
    }
  }

  registerTool(tool: Tool): void {
    this.tools.set(tool.name, tool);
    this.metrics.set(tool.name, {
      totalCalls: 0,
      successfulCalls: 0,
      totalLatency: 0
    });
  }

  getAllTools(): Tool[] {
    return Array.from(this.tools.values());
  }

  /**
   * Load tools from an mcp.json configuration file
   * @param configPath Path to mcp.json file (optional, defaults to standard locations)
   * @returns Number of tools loaded
   */
  loadToolsFromMcpConfig(configPath?: string): number {
    try {
      // Try to find mcp.json in standard locations if not provided
      if (!configPath) {
        const possiblePaths = [
          path.join(os.homedir(), '.cursor', 'mcp.json'),
          path.join(os.homedir(), '.config', 'cursor', 'mcp.json'),
          path.join(os.homedir(), '.claude', 'mcp.json'),
          path.join(os.homedir(), 'Library', 'Application Support', 'Claude', 'mcp.json'),
          path.join(os.homedir(), 'AppData', 'Roaming', 'Claude', 'mcp.json'),
          './mcp.json'
        ];

        for (const potentialPath of possiblePaths) {
          if (fs.existsSync(potentialPath)) {
            configPath = potentialPath;
            break;
          }
        }
      }

      if (!configPath || !fs.existsSync(configPath)) {
        console.warn('No mcp.json configuration file found');
        return 0;
      }

      // Read and parse mcp.json
      const rawConfig = fs.readFileSync(configPath, 'utf-8');
      const config = JSON.parse(rawConfig) as MCPConfig;

      if (!config.mcpServers || typeof config.mcpServers !== 'object') {
        console.warn('No mcpServers defined in mcp.json');
        return 0;
      }

      // Count of tools loaded
      let toolsLoaded = 0;

      // Process each server configuration
      for (const [serverId, serverConfig] of Object.entries(config.mcpServers)) {
        // Skip if disabled
        if (serverConfig.enabled === false) {
          continue;
        }

        // Generate a tool for this MCP server
        const toolName = `mcp_${serverId.replace(/[^a-z0-9_]/gi, '_').toLowerCase()}`;
        
        // Create a proxy tool that will forward the request to the MCP server
        const mcpProxyTool: Tool = {
          name: toolName,
          description: `MCP Tool Proxy for ${serverId}`,
          parameters: [
            {
              name: 'tool',
              type: 'string',
              description: 'The tool to call on the MCP server',
              required: true
            },
            {
              name: 'params',
              type: 'object',
              description: 'Parameters to pass to the tool',
              required: false
            }
          ],
          execute: async (params: any): Promise<ToolResult> => {
            const startTime = Date.now();
            
            try {
              // This proxy simply returns metadata about the MCP server
              // In a real implementation, you would connect to the MCP server
              // and forward the request
              return {
                success: true,
                data: {
                  serverId,
                  command: serverConfig.command,
                  args: serverConfig.args || [],
                  env: Object.keys(serverConfig.env || {}).map(key => key.replace(/^ANTHROPIC_API_KEY$/, 'ANTHROPIC_API_KEY=***')),
                  message: `This is a proxy tool for the MCP server '${serverId}'. In a real implementation, it would forward the request to the actual server.`
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
                  name: 'MCPProxyError',
                  message: error instanceof Error ? error.message : 'Unknown error',
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
        };

        // Register the proxy tool
        this.registerTool(mcpProxyTool);
        toolsLoaded++;
        
        console.log(`Registered MCP proxy tool for server: ${serverId}`);
      }

      return toolsLoaded;
    } catch (error) {
      console.error('Error loading tools from mcp.json:', error);
      return 0;
    }
  }

  private createError(code: ToolError['code'], message: string, details?: any): ToolError {
    const error = new Error(message) as ToolError;
    error.code = code;
    error.details = details;
    return error;
  }

  private validateParams(tool: Tool, params: any): void {
    const missingParams = tool.parameters
      .filter(p => p.required && !(p.name in params))
      .map(p => p.name);

    if (missingParams.length > 0) {
      throw this.createError(
        'INVALID_PARAMETERS',
        `Missing required parameters: ${missingParams.join(', ')}`
      );
    }
  }

  async executeTool(name: string, params: any): Promise<ToolResult> {
    const startTime = Date.now();
    
    try {
      const tool = this.tools.get(name);
      if (!tool) {
        throw this.createError('TOOL_NOT_FOUND', `Tool ${name} not found`);
      }

      // Validate parameters
      this.validateParams(tool, params);

      // Execute tool
      const result = await tool.execute(params);
      
      // Update metrics
      this.updateMetrics(name, true, Date.now() - startTime);

      return {
        ...result,
        metrics: {
          startTime,
          endTime: Date.now(),
          latencyMs: Date.now() - startTime
        }
      };

    } catch (error) {
      this.updateMetrics(name, false, Date.now() - startTime);
      
      const toolError = error instanceof Error ? 
        this.createError('EXECUTION_ERROR', error.message, error) :
        this.createError('EXECUTION_ERROR', 'Unknown error occurred', error);

      return {
        success: false,
        error: toolError,
        metrics: {
          startTime,
          endTime: Date.now(),
          latencyMs: Date.now() - startTime
        }
      };
    }
  }

  private updateMetrics(toolName: string, success: boolean, latency: number): void {
    const current = this.metrics.get(toolName) || { 
      totalCalls: 0, 
      successfulCalls: 0, 
      totalLatency: 0 
    };
    
    this.metrics.set(toolName, {
      totalCalls: current.totalCalls + 1,
      successfulCalls: current.successfulCalls + (success ? 1 : 0),
      totalLatency: current.totalLatency + latency
    });
  }

  getMetrics(toolName?: string): Record<string, any> {
    if (toolName) {
      const metrics = this.metrics.get(toolName);
      if (!metrics) return {};
      return {
        [toolName]: {
          ...metrics,
          averageLatency: metrics.totalCalls > 0 ? 
            metrics.totalLatency / metrics.totalCalls : 0,
          successRate: metrics.totalCalls > 0 ? 
            metrics.successfulCalls / metrics.totalCalls : 0
      }};
    }

    const allMetrics: Record<string, any> = {};
    this.metrics.forEach((metrics, name) => {
      allMetrics[name] = {
        ...metrics,
        averageLatency: metrics.totalCalls > 0 ? 
          metrics.totalLatency / metrics.totalCalls : 0,
        successRate: metrics.totalCalls > 0 ? 
          metrics.successfulCalls / metrics.totalCalls : 0
      };
    });
    return allMetrics;
  }
} 