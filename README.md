# MCP Chain of Draft (CoD) Prompt Tool

[![smithery badge](https://smithery.ai/badge/@brendancopley/mcp-chain-of-draft-prompt-tool)](https://smithery.ai/server/@brendancopley/mcp-chain-of-draft-prompt-tool)

## Overview

The MCP Chain of Draft (CoD) Prompt Tool is a powerful Model Context Protocol tool that enhances LLM reasoning by transforming standard prompts into either Chain of Draft (CoD) or Chain of Thought (CoT) format. Here's how it works:

1. **Input Transformation**: Your regular prompt is automatically transformed into a CoD/CoT format
2. **LLM Processing**: The transformed prompt is passed to your chosen LLM (Claude, GPT, Ollama, or local models)
3. **Enhanced Reasoning**: The LLM processes the request using structured reasoning steps
4. **Result Transformation**: The response is transformed back into a clear, concise format

This approach significantly improves reasoning quality while reducing token usage and maintaining high accuracy.

## BYOLLM Support

This tool supports a "Bring Your Own LLM" approach, allowing you to use any language model of your choice:

### Supported LLM Integrations
- **Cloud Services**
  - Anthropic Claude
  - OpenAI GPT models
  - Mistral AI
- **Local Models**
  - Ollama (all models)
  - Local LLama variants
  - Any model supporting chat completion API

### Configuring Your LLM

1. **Cloud Services**
   ```bash
   # For Anthropic Claude
   export ANTHROPIC_API_KEY=your_key_here
   
   # For OpenAI
   export OPENAI_API_KEY=your_key_here
   
   # For Mistral AI
   export MISTRAL_API_KEY=your_key_here
   ```

2. **Local Models with Ollama**
   ```bash
   # First install Ollama
   curl https://ollama.ai/install.sh | sh
   
   # Pull your preferred model
   ollama pull llama2
   # or
   ollama pull mistral
   # or any other model
   
   # Configure the tool to use Ollama
   export MCP_LLM_PROVIDER=ollama
   export MCP_OLLAMA_MODEL=llama2  # or your chosen model
   ```

3. **Custom Local Models**
   ```bash
   # Point to your local model API
   export MCP_LLM_PROVIDER=custom
   export MCP_CUSTOM_LLM_ENDPOINT=http://localhost:your_port
   ```

## Credits

This project implements the Chain of Draft (CoD) reasoning approach as a Model Context Protocol (MCP) prompt tool for Claude. The core Chain of Draft implementation is based on the work by [stat-guy](https://github.com/stat-guy/chain-of-draft). We extend our gratitude for their pioneering work in developing this efficient reasoning approach.

Original Repository: [https://github.com/stat-guy/chain-of-draft](https://github.com/stat-guy/chain-of-draft)

## Key Benefits

- **Efficiency**: Significantly reduced token usage (as little as 7.6% of standard CoT)
- **Speed**: Faster responses due to shorter generation time
- **Cost Savings**: Lower API costs for LLM calls
- **Maintained Accuracy**: Similar or even improved accuracy compared to CoT
- **Flexibility**: Applicable across various reasoning tasks and domains

## Features

1. **Core Chain of Draft Implementation**
   - Concise reasoning steps (typically 5 words or less)
   - Format enforcement
   - Answer extraction

2. **Performance Analytics**
   - Token usage tracking
   - Solution accuracy monitoring
   - Execution time measurement
   - Domain-specific performance metrics

3. **Adaptive Word Limits**
   - Automatic complexity estimation
   - Dynamic adjustment of word limits
   - Domain-specific calibration

4. **Comprehensive Example Database**
   - CoT to CoD transformation 
   - Domain-specific examples (math, code, biology, physics, chemistry, puzzle)
   - Example retrieval based on problem similarity

5. **Format Enforcement**
   - Post-processing to ensure adherence to word limits
   - Step structure preservation
   - Adherence analytics

6. **Hybrid Reasoning Approaches**
   - Automatic selection between CoD and CoT
   - Domain-specific optimization
   - Historical performance-based selection

7. **OpenAI API Compatibility**
   - Drop-in replacement for standard OpenAI clients
   - Support for both completions and chat interfaces
   - Easy integration into existing workflows

## Setup and Installation

### Prerequisites
- Python 3.10+ (for Python implementation)
- Node.js 22+ (for JavaScript implementation)
- Nx (for building Single Executable Applications)

### Python Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
3. Configure API keys in `.env` file:
   ```
   ANTHROPIC_API_KEY=your_api_key_here
   ```
4. Run the server:
   ```bash
   python server.py
   ```

### JavaScript/TypeScript Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Configure API keys in `.env` file:
   ```
   ANTHROPIC_API_KEY=your_api_key_here
   ```
4. Build and run the server:
   ```bash
   # Build TypeScript files using Nx
   npm run nx build

   # Start the server
   npm start

   # For development with auto-reload:
   npm run dev
   ```

Available scripts:
- `npm run nx build`: Compiles TypeScript to JavaScript using Nx build system
- `npm run build:sea`: Creates Single Executable Applications for all platforms
- `npm start`: Runs the compiled server from `dist`
- `npm test`: Runs the test query against the server
- `npm run dev`: Runs the TypeScript server directly using ts-node (useful for development)

The project uses Nx as its build system, providing:
- Efficient caching and incremental builds
- Cross-platform build support
- Integrated SEA generation
- Dependency graph visualization
- Consistent build process across environments

## Single Executable Applications (SEA)

This project supports building Single Executable Applications (SEA) using Node.js 22+ and the [@getlarge/nx-node-sea](https://github.com/getlarge/nx-node-sea) plugin. This allows you to create standalone executables that don't require Node.js to be installed on the target system.

### Building SEA Executables

The project includes several scripts for building SEA executables:

```bash
# Build for all platforms
npm run build:sea

# Build for specific platforms
npm run build:macos   # macOS
npm run build:linux   # Linux
npm run build:windows # Windows
```

### SEA Build Configuration

The project uses Nx for managing the build process. The SEA configuration is handled through the nx-node-sea plugin, which provides a streamlined way to create Node.js single executable applications.

Key features of the SEA build process:
- Cross-platform support (macOS, Linux, Windows)
- Automatic dependency bundling
- Optimized binary size
- No runtime dependencies required

### Using SEA Executables

Once built, the SEA executables can be found in the `dist` directory. These executables:
- Are completely standalone
- Don't require Node.js installation
- Can be distributed and run directly
- Maintain all functionality of the original application

For Claude Desktop integration with SEA executables, update your configuration to use the executable path:

```json
{
    "mcpServers": {
        "chain-of-draft-prompt-tool": {
            "command": "/path/to/mcp-chain-of-draft-prompt-tool",
            "env": {
                "ANTHROPIC_API_KEY": "your_api_key_here"
            }
        }
    }
}
```

## Claude Desktop Integration

To integrate with Claude Desktop:

1. Install Claude Desktop from [claude.ai/download](https://claude.ai/download)
2. Create or edit the Claude Desktop config file:
   ```
   ~/Library/Application Support/Claude/claude_desktop_config.json
   ```
3. Add the tool configuration (Python version):
   ```json
   {
       "mcpServers": {
           "chain-of-draft-prompt-tool": {
               "command": "python3",
               "args": ["/absolute/path/to/cod/server.py"],
               "env": {
                   "ANTHROPIC_API_KEY": "your_api_key_here"
               }
           }
       }
   }
   ```
   
   Or for the JavaScript version:
   ```json
   {
       "mcpServers": {
           "chain-of-draft-prompt-tool": {
               "command": "node",
               "args": ["/absolute/path/to/cod/index.js"],
               "env": {
                   "ANTHROPIC_API_KEY": "your_api_key_here"
               }
           }
       }
   }
   ```
4. Restart Claude Desktop

You can also use the Claude CLI to add the tool:

```bash
# For Python implementation
claude mcp add chain-of-draft-prompt-tool -e ANTHROPIC_API_KEY="your_api_key_here" "python3 /absolute/path/to/cod/server.py"

# For JavaScript implementation
claude mcp add chain-of-draft-prompt-tool -e ANTHROPIC_API_KEY="your_api_key_here" "node /absolute/path/to/cod/index.js"
```

## Using with Dive GUI

[Dive](https://github.com/OpenAgentPlatform/Dive) is an excellent open-source MCP Host Desktop Application that provides a user-friendly GUI for interacting with MCP tools like this one. It supports multiple LLMs including ChatGPT, Anthropic Claude, Ollama, and other OpenAI-compatible models.

### Integrating with Dive

1. Download and install Dive from their [releases page](https://github.com/OpenAgentPlatform/Dive/releases)

2. Configure the Chain of Draft tool in Dive's MCP settings:

```json
{
  "mcpServers": {
    "chain-of-draft-prompt-tool": {
      "command": "/path/to/mcp-chain-of-draft-prompt-tool",
      "enabled": true,
      "env": {
        "ANTHROPIC_API_KEY": "your_api_key_here"
      }
    }
  }
}
```

If you're using the non-SEA version:
```json
{
  "mcpServers": {
    "chain-of-draft-prompt-tool": {
      "command": "node",
      "args": ["/path/to/dist/index.js"],
      "enabled": true,
      "env": {
        "ANTHROPIC_API_KEY": "your_api_key_here"
      }
    }
  }
}
```

### Key Benefits of Using Dive

- 🌐 Universal LLM Support with multiple API key management
- 💻 Cross-platform availability (Windows, MacOS, Linux)
- 🔄 Seamless MCP integration in both stdio and SSE modes
- 🌍 Multi-language interface
- 💡 Custom instructions and system prompts
- 🔄 Automatic updates

Using Dive provides a convenient way to interact with the Chain of Draft tool through a modern, feature-rich interface while maintaining all the benefits of the MCP protocol.

## Testing with MCP Inspector

The project includes integration with the MCP Inspector tool, which provides a visual interface for testing and debugging MCP tools. This is especially useful during development or when you want to inspect the tool's behavior.

### Running the Inspector

You can start the MCP Inspector using the provided npm script:

```bash
# Start the MCP Inspector with the tool
npm run test-inspector

# Or run it manually
npx @modelcontextprotocol/inspector -e ANTHROPIC_API_KEY=$ANTHROPIC_API_KEY -- node dist/index.js
```

This will:
1. Start the MCP server in the background
2. Launch the MCP Inspector interface in your default browser
3. Connect to the running server for testing

### Using the Inspector Interface

The MCP Inspector provides:
- 🔍 Real-time visualization of tool calls and responses
- 📝 Interactive testing of MCP functions
- 🔄 Request/response history
- 🐛 Debug information for each interaction
- 📊 Performance metrics and timing data

This makes it an invaluable tool for:
- Development and debugging
- Understanding tool behavior
- Testing different inputs and scenarios
- Verifying MCP compliance
- Performance optimization

The Inspector will be available at `http://localhost:5173` by default.

## Available Tools

The Chain of Draft server provides the following tools:

| Tool | Description |
|------|-------------|
| `chain_of_draft_solve` | Solve a problem using Chain of Draft reasoning |
| `math_solve` | Solve a math problem with CoD |
| `code_solve` | Solve a coding problem with CoD |
| `logic_solve` | Solve a logic problem with CoD |
| `get_performance_stats` | Get performance stats for CoD vs CoT |
| `get_token_reduction` | Get token reduction statistics |
| `analyze_problem_complexity` | Analyze problem complexity |

## Adding Custom Tools to the Registry

You can extend functionality by adding your own custom tools to the tool registry. Here's how to create and register a new tool:

### 1. Create a Tool Class

Create a new TypeScript file in the `src/tools` directory:

```typescript
// src/tools/my-custom-tool.ts
import { Tool, ToolResult } from './types.js';

export class MyCustomTool implements Tool {
  name = 'my_custom_tool';
  description = 'A custom tool that performs a specific function';
  parameters = [
    {
      name: 'input',
      type: 'string',
      description: 'The input data for processing',
      required: true
    },
    {
      name: 'option',
      type: 'string',
      description: 'Optional processing mode',
      required: false
    }
  ];

  async execute(params: any): Promise<ToolResult> {
    const startTime = Date.now();
    
    try {
      // Validate required parameters
      if (!params.input) {
        throw new Error('Missing required parameter: input');
      }
      
      // Implement your tool's logic here
      const result = `Processed: ${params.input}`;
      
      // Return success with data
      return {
        success: true,
        data: { result },
        metrics: {
          startTime,
          endTime: Date.now(),
          latencyMs: Date.now() - startTime
        }
      };
    } catch (error) {
      // Return error information
      return {
        success: false,
        error: {
          name: 'CustomToolError',
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
}
```

### 2. Register the Tool in the Registry

Add your tool to the registry in one of the following ways:

#### Option 1: Add to defaultChainOfTools in tools/index.ts

Update the `tools/index.ts` file to include your new tool:

```typescript
// src/tools/index.ts
import { MyCustomTool } from './my-custom-tool.js';

// ... existing imports ...

// Export default chain of tools
export const defaultChainOfTools = [
  // ... existing tools ...
  new MyCustomTool(),
  // Add more tools as needed
];
```

#### Option 2: Register Programmatically

Register your tool manually with the ToolRegistry:

```typescript
import { ToolRegistry } from './tools/registry.js';
import { MyCustomTool } from './tools/my-custom-tool.js';

// Initialize the registry
const registry = new ToolRegistry();

// Register your custom tool
registry.registerTool(new MyCustomTool());
```

### 3. Use Your Custom Tool

Once registered, your tool can be accessed through various interfaces:

#### Using in a Pipeline

```typescript
new PipelineStepBuilder('custom_step', 'my_custom_tool')
  .withStaticParam('input', 'Test data')
  .withStaticParam('option', 'advanced')
  .withDefaultNext('next_step')
  .build()
```

#### Calling Directly Through the API

```typescript
// Invoke via MCP
{
  "name": "my_custom_tool",
  "input": "Test data",
  "option": "advanced"
}
```

### 4. Testing Your Custom Tool

Create a test file for your tool:

```typescript
// src/tools/__tests__/my-custom-tool.test.ts
import { describe, it, expect } from '@jest/globals';
import { MyCustomTool } from '../my-custom-tool.js';

describe('MyCustomTool', () => {
  it('should process input successfully', async () => {
    const tool = new MyCustomTool();
    const result = await tool.execute({ input: 'Test data' });
    
    expect(result.success).toBe(true);
    expect(result.data.result).toBe('Processed: Test data');
  });
  
  it('should return error when required parameter is missing', async () => {
    const tool = new MyCustomTool();
    const result = await tool.execute({});
    
    expect(result.success).toBe(false);
    expect(result.error.message).toBe('Missing required parameter: input');
  });
});
```

Run the test with:
```bash
npm run test:tools
```

### Example: Creating a Data Processing Tool

Here's a more practical example of a tool that processes data:

```typescript
// src/tools/data-processor-tool.ts
import { Tool, ToolResult } from './types.js';

export class DataProcessorTool implements Tool {
  name = 'data_processor';
  description = 'Process data with various transformations';
  parameters = [
    {
      name: 'data',
      type: 'array',
      description: 'Array of data items to process',
      required: true
    },
    {
      name: 'operation',
      type: 'string',
      description: 'Operation to perform (sum, average, max, min)',
      required: true
    }
  ];

  async execute(params: any): Promise<ToolResult> {
    const startTime = Date.now();
    
    try {
      // Validate parameters
      if (!params.data || !Array.isArray(params.data)) {
        throw new Error('Parameter "data" must be an array');
      }
      
      if (!params.operation) {
        throw new Error('Parameter "operation" is required');
      }
      
      // Convert all items to numbers
      const numbers = params.data.map((item: any) => Number(item));
      
      // Process based on operation
      let result;
      switch (params.operation.toLowerCase()) {
        case 'sum':
          result = numbers.reduce((sum: number, num: number) => sum + num, 0);
          break;
        case 'average':
          result = numbers.reduce((sum: number, num: number) => sum + num, 0) / numbers.length;
          break;
        case 'max':
          result = Math.max(...numbers);
          break;
        case 'min':
          result = Math.min(...numbers);
          break;
        default:
          throw new Error(`Unknown operation: ${params.operation}`);
      }
      
      return {
        success: true,
        data: { 
          result,
          operation: params.operation,
          itemCount: numbers.length
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
          name: 'DataProcessorError',
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
}
```

## Implementing MCP-Compatible Tools

To ensure your custom tools work properly with MCP clients like Claude Desktop, Cursor, and others, you need to implement them according to the Model Context Protocol specification. Here's a complete guide to implementing MCP-compatible tools:

### Tool Implementation Architecture

The Chain of Draft tool framework implements the MCP protocol, which means your tools need to follow a specific structure to be properly discovered and used by MCP clients:

```
┌─────────────────────────────────────────┐
│              MCP Server                 │
├─────────────────────────────────────────┤
│                                         │
│   ┌─────────────┐    ┌──────────────┐   │
│   │ToolRegistry │◄───┤Custom Tools  │   │
│   └─────┬───────┘    └──────────────┘   │
│         │                               │
│   ┌─────▼───────┐                       │
│   │MCP Protocol │                       │
│   │Handler      │                       │
│   └─────────────┘                       │
│                                         │
└─────────────────────────────────────────┘
           ▲
           │ MCP Protocol
           │ (JSON-RPC)
           ▼
┌─────────────────────────────────────────┐
│             MCP Client                  │
│   (Claude Desktop, Cursor, etc.)        │
└─────────────────────────────────────────┘
```

### Step 1: Create Tool Class Implementing MCP Interface

Create your tool class implementing the required MCP interfaces:

```typescript
// src/tools/mcp-compatible-tool.ts
import { Tool, ToolResult } from './types.js';

export class MCPCompatibleTool implements Tool {
  // The name must follow MCP naming conventions (snake_case)
  name = 'mcp_compatible_tool';
  
  // Clear description of what the tool does
  description = 'An MCP-compatible tool that follows protocol specifications';
  
  // Parameters must be well-defined for MCP discovery
  parameters = [
    {
      name: 'input',
      type: 'string',  // Valid MCP types: string, number, boolean, array, object
      description: 'Input data to process',
      required: true
    },
    {
      name: 'mode',
      type: 'string',
      description: 'Processing mode (basic, advanced)',
      required: false
    }
  ];

  // Execute method must follow MCP result format
  async execute(params: any): Promise<ToolResult> {
    const startTime = Date.now();
    
    try {
      // Parameter validation
      if (!params.input) {
        throw new Error('Missing required parameter: input');
      }
      
      // Tool implementation
      const mode = params.mode || 'basic';
      let result;
      
      if (mode === 'basic') {
        result = `Basic processing: ${params.input}`;
      } else if (mode === 'advanced') {
        result = `Advanced processing: ${params.input.toUpperCase()}`;
      } else {
        throw new Error(`Unsupported mode: ${mode}`);
      }
      
      // MCP-compliant success result
      return {
        success: true,
        data: { 
          result,
          mode,
          processed_at: new Date().toISOString() 
        },
        metrics: {
          startTime,
          endTime: Date.now(),
          latencyMs: Date.now() - startTime
        }
      };
    } catch (error) {
      // MCP-compliant error result
      return {
        success: false,
        error: {
          name: 'MCPToolError',
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
}
```

### Step 2: Register in the Tool Registry

Add your tool to the registry to expose it to the MCP interface:

```typescript
// src/tools/index.ts
import { MCPCompatibleTool } from './mcp-compatible-tool.js';
import { ChainOfDraftTool } from './chain-of-draft-tool.js';
import { MathSolveTool } from './math-solve-tool.js';
import { CodeSolveTool } from './code-solve-tool.js';
import { LogicSolveTool } from './logic-solve-tool.js';
// ... other imports

// Export the array of all available tools
export const defaultChainOfTools = [
  new ChainOfDraftTool(),
  new MathSolveTool(),
  new CodeSolveTool(),
  new LogicSolveTool(),
  new MCPCompatibleTool(),
  // Add your custom tools here
];
```

### Step 3: Update Server Entry Point

Ensure your server entry point properly registers and exposes tools:

```typescript
// src/index.ts
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { defaultChainOfTools } from './tools/index.js';
import { ToolRegistry } from './tools/registry.js';

// Initialize tool registry
const registry = new ToolRegistry();

// Register all tools
defaultChainOfTools.forEach(tool => registry.registerTool(tool));

// Create MCP server
const server = new Server({
  transport: new StdioServerTransport(),
  tools: registry.getAllTools(), // Expose tools to MCP interface
});

// Start server
server.listen();
```

### Step 4: MCP Client Registration in mcp.json

Now your tool will be available when your MCP server is registered in the client's mcp.json file:

```json
{
  "mcpServers": {
    "mcp-chain-of-draft-prompt-tool": {
      "command": "node",
      "args": ["/path/to/dist/index.js"],
      "env": {
        "ANTHROPIC_API_KEY": "your_api_key_here",
        "DEBUG": "true"
      }
    }
  }
}
```

### Step 5: Tool Discovery and Usage

When a user interacts with an MCP client (Claude Desktop or Cursor), they can discover your tool through the standard MCP discovery mechanism:

```
Please list the available tools.
```

And use your tool:

```
Use the mcp_compatible_tool to process "Hello, world!" with mode set to "advanced".
```

### Example of MCP Tool Usage Flow

1. **Tool Registration**: Your tool is registered in the ToolRegistry
2. **MCP Server Setup**: The MCP server exposes the tool via the protocol
3. **Client Configuration**: The client's mcp.json points to your server
4. **Discovery**: The client discovers your tool through the standard MCP protocol
5. **Invocation**: The client invokes your tool with parameters
6. **Execution**: Your tool executes and returns the result
7. **Display**: The client displays the result to the user

### Testing MCP Tool Registration

To test if your tools are properly registered and accessible via MCP:

```bash
# Run MCP server directly
node dist/index.js

# In another terminal, use the MCP inspector to test
npx @modelcontextprotocol/inspector -e ANTHROPIC_API_KEY=your_api_key -- node dist/index.js
```

This will start the inspector in your browser where you can see all registered tools and test them directly.

### Advanced: Custom Middleware for MCP Tools

For more advanced scenarios, you can implement MCP middleware for your tools:

```typescript
// src/tools/middleware/mcp-logger.ts
import { Tool, ToolResult } from '../types.js';

// MCP middleware to log all tool executions
export function createMCPLoggerMiddleware() {
  return (tool: Tool) => {
    const originalExecute = tool.execute;
    
    tool.execute = async (params: any): Promise<ToolResult> => {
      console.log(`[MCP] Executing tool: ${tool.name}`);
      console.log(`[MCP] Parameters:`, params);
      
      const result = await originalExecute.call(tool, params);
      
      console.log(`[MCP] Result:`, result);
      return result;
    };
    
    return tool;
  };
}

// Usage:
// const loggerMiddleware = createMCPLoggerMiddleware();
// const enhancedTool = loggerMiddleware(new MCPCompatibleTool());
// registry.registerTool(enhancedTool);
```

## Registering Tools with MCP Clients

Once you've created and registered your custom tools within the Chain of Draft server, you'll need to ensure your MCP clients can discover and use them. Here's how to configure different MCP clients:

### Configuring Claude Desktop, Cursor, or Other MCP Clients

#### Option 1: Direct Path Configuration

For Claude Desktop, Cursor, and other MCP clients that support direct path configuration, update your MCP configuration file (usually found at `~/.cursor/mcp.json` or similar locations):

```json
{
  "mcpServers": {
    "mcp-chain-of-draft-prompt-tool": {
      "command": "node",
      "args": ["/absolute/path/to/mcp-chain-of-draft-prompt-tool/dist/index.js"],
      "env": {
        "ANTHROPIC_API_KEY": "your_api_key_here"
      }
    }
  }
}
```

#### Option 2: Using npx for Remote Packages

If your Chain of Draft instance is published to npm, you can use npx to run it:

```json
{
  "mcpServers": {
    "mcp-chain-of-draft-prompt-tool": {
      "command": "npx",
      "args": [
        "-y",
        "mcp-chain-of-draft-prompt-tool"
      ],
      "env": {
        "ANTHROPIC_API_KEY": "your_api_key_here"
      }
    }
  }
}
```

#### Option 3: Using a Local Path with npx

You can also use npx with a local path:

```json
{
  "mcpServers": {
    "mcp-chain-of-draft-prompt-tool": {
      "command": "npx",
      "args": ["/absolute/path/to/mcp-chain-of-draft-prompt-tool/dist/index.js"],
      "env": {
        "ANTHROPIC_API_KEY": "your_api_key_here"
      }
    }
  }
}
```

### Using Claude CLI

With the Claude CLI, you can register your MCP server with custom tools using:

```bash
claude mcp add mcp-chain-of-draft-prompt-tool -e ANTHROPIC_API_KEY=your_api_key_here "node /absolute/path/to/mcp-chain-of-draft-prompt-tool/dist/index.js"
```

### Testing Your Tools After Registration

After configuring your MCP client, you can test your custom tools with:

1. **Simple Tool Test:**
   ```
   I'd like to use the my_custom_tool to process some data.
   ```

2. **Test with Parameters:**
   ```
   Please use the data_processor tool to find the average of these numbers: [12, 24, 36, 48, 60].
   ```

3. **Pipeline Test:**
   ```
   Create a pipeline that uses the my_custom_tool and then processes the result with data_processor.
   ```

### Troubleshooting MCP Tool Registration

If your tools aren't showing up in the MCP client:

1. Ensure the MCP server is running with your custom tools registered
2. Check that your MCP client configuration points to the correct server path
3. Verify environment variables are correctly configured
4. Look for any console errors in your MCP server logs
5. Try restarting both the MCP server and client

## Developer Usage

### Python Client

If you want to use the Chain of Draft client directly in your Python code:

```python
from client import ChainOfDraftClient

# Create client with specific LLM provider
cod_client = ChainOfDraftClient(
    llm_provider="ollama",  # or "anthropic", "openai", "mistral", "custom"
    model_name="llama2"     # specify your model
)

# Use directly
result = await cod_client.solve_with_reasoning(
    problem="Solve: 247 + 394 = ?",
    domain="math"
)

print(f"Answer: {result['final_answer']}")
print(f"Reasoning: {result['reasoning_steps']}")
print(f"Tokens used: {result['token_count']}")
```

### JavaScript/TypeScript Client

For TypeScript/Node.js applications:

```typescript
import { ChainOfDraftClient } from './lib/chain-of-draft-client';

// Create client with your preferred LLM
const client = new ChainOfDraftClient({
  provider: 'ollama',           // or 'anthropic', 'openai', 'mistral', 'custom'
  model: 'llama2',             // your chosen model
  endpoint: 'http://localhost:11434'  // for custom endpoints
});

// Use the client
async function solveMathProblem() {
  const result = await client.solveWithReasoning({
    problem: "Solve: 247 + 394 = ?",
    domain: "math",
    max_words_per_step: 5
  });
  
  console.log(`Answer: ${result.final_answer}`);
  console.log(`Reasoning: ${result.reasoning_steps}`);
  console.log(`Tokens used: ${result.token_count}`);
}

solveMathProblem();
```

## Implementation Details

The server is available in both Python and JavaScript implementations, both consisting of several integrated components:

### Python Implementation

1. **AnalyticsService**: Tracks performance metrics across different problem domains and reasoning approaches
2. **ComplexityEstimator**: Analyzes problems to determine appropriate word limits
3. **ExampleDatabase**: Manages and retrieves examples, transforming CoT examples to CoD format
4. **FormatEnforcer**: Ensures reasoning steps adhere to word limits
5. **ReasoningSelector**: Intelligently chooses between CoD and CoT based on problem characteristics

### JavaScript Implementation

1. **analyticsDb**: In-memory database for tracking performance metrics
2. **complexityEstimator**: Analyzes problems to determine complexity and appropriate word limits
3. **formatEnforcer**: Ensures reasoning steps adhere to word limits 
4. **reasoningSelector**: Automatically chooses between CoD and CoT based on problem characteristics and historical performance

Both implementations follow the same core principles and provide identical MCP tools, making them interchangeable for most use cases.

## Pipeline and Tool Call Chaining

The Chain of Draft tool includes a powerful pipeline framework that enables complex workflows by chaining multiple tools together with conditional logic, loops, and human-in-the-loop interactions.

### Creating and Using Pipelines

#### Step-by-Step Installation

1. **Clone the repository and prepare dependencies**
   ```bash
   # Clone the repository
   git clone https://github.com/brendancopley/mcp-chain-of-draft-prompt-tool.git
   cd mcp-chain-of-draft-prompt-tool
   
   # Install dependencies
   npm install
   
   # Configure your LLM (choose one provider)
   export ANTHROPIC_API_KEY=your_api_key_here
   # or
   export OPENAI_API_KEY=your_api_key_here
   # or for local models
   export MCP_LLM_PROVIDER=ollama
   export MCP_OLLAMA_MODEL=llama2
   ```

2. **Build and start the server**
   ```bash
   # Build TypeScript files
   npm run nx build
   
   # Start the server
   npm start
   ```

3. **Install MCP client if needed**
   ```bash
   # Install Claude CLI (optional)
   npm install -g @anthropic-ai/claude-cli
   
   # Or use Dive GUI or Claude Desktop as described in previous sections
   ```

#### Example 1: Creating a Simple Math Calculation Pipeline

```typescript
// Create a simple addition pipeline using JavaScript/TypeScript client
import { PipelineBuilder, PipelineStepBuilder } from './lib/pipeline-factory';
import { PipelineStorage } from './lib/pipeline-storage';
import { PipelineExecutor } from './lib/pipeline-executor';
import { ToolRegistry } from './lib/registry';

// Initialize the components
const toolRegistry = new ToolRegistry();
const pipelineStorage = new PipelineStorage();
const pipelineExecutor = new PipelineExecutor(toolRegistry, pipelineStorage);

// Create a pipeline for addition
const additionPipeline = new PipelineBuilder(
  'Addition Pipeline',
  'A pipeline that adds two numbers using Chain of Draft'
)
  .withGlobalState({
    number1: 247,
    number2: 394
  })
  .withStep(
    new PipelineStepBuilder('formulate_problem', 'string_formatter')
      .withStaticParam('template', 'Solve: ${state.number1} + ${state.number2} = ?')
      .withDefaultNext('solve_problem')
      .build()
  )
  .withStep(
    new PipelineStepBuilder('solve_problem', 'math_solve')
      .withDynamicParam('problem', 'formulate_problem', 'result')
      .withDefaultNext('end')
      .build()
  )
  .withStartStep('formulate_problem')
  .build();

// Store the pipeline
const savedPipeline = pipelineStorage.createPipeline(additionPipeline);

// Execute the pipeline
async function runPipeline() {
  const result = await pipelineExecutor.executePipeline(savedPipeline);
  console.log('Pipeline execution completed');
  console.log('Final answer:', result.results.solve_problem.data.final_answer);
  console.log('Reasoning steps:', result.results.solve_problem.data.reasoning_steps);
}

runPipeline();
```

#### Example 2: Creating a Multi-Step Data Analysis Pipeline with Human Approval

```typescript
// Create a pipeline with branching, conditions, and human approval
const dataPipeline = new PipelineBuilder(
  'Data Analysis Pipeline',
  'Analyzes data and generates reports with human approval'
)
  .withGlobalState({
    dataSource: 'sample_data.csv',
    analysisType: 'regression'
  })
  .withStep(
    new PipelineStepBuilder('load_data', 'data_loader')
      .withStaticParam('source', '${state.dataSource}')
      .withDefaultNext('validate_data')
      .onFailure('handle_error')
      .build()
  )
  .withStep(
    new PipelineStepBuilder('validate_data', 'data_validator')
      .withDynamicParam('data', 'load_data', 'data')
      .withDefaultNext('analyze_data')
      .withCondition('result.rowCount < 10', 'insufficient_data')
      .onFailure('handle_error')
      .build()
  )
  .withStep(
    new PipelineStepBuilder('insufficient_data', 'notification_sender')
      .withStaticParam('message', 'Insufficient data for analysis')
      .withDefaultNext('end')
      .build()
  )
  .withStep(
    new PipelineStepBuilder('analyze_data', 'data_analyzer')
      .withDynamicParam('data', 'validate_data', 'validatedData')
      .withStaticParam('type', '${state.analysisType}')
      .withDefaultNext('human_review')
      .onFailure('handle_error')
      .build()
  )
  .withStep(
    new PipelineStepBuilder('human_review', 'data_analyzer')
      .withDynamicParam('analysis', 'analyze_data', 'result')
      .withHumanInTheLoop('Please review the analysis results before generating the report')
      .withDefaultNext('generate_report')
      .build()
  )
  .withStep(
    new PipelineStepBuilder('generate_report', 'report_generator')
      .withDynamicParam('analysis', 'analyze_data', 'result')
      .withStaticParam('format', 'pdf')
      .withDefaultNext('end')
      .onFailure('handle_error')
      .build()
  )
  .withStep(
    new PipelineStepBuilder('handle_error', 'error_handler')
      .withStaticParam('notifyAdmin', true)
      .withDefaultNext('end')
      .build()
  )
  .withStartStep('load_data')
  .build();

// Execute the pipeline
const execution = await pipelineExecutor.executePipeline(dataPipeline);

// Check for human interaction requirement
if (execution.status === 'waiting_for_human') {
  console.log('Pipeline is waiting for human input at step:', execution.currentStepId);
  
  // Simulate human approval
  const humanResponse = {
    approved: true,
    input: { comments: 'Analysis looks good' },
    modifications: { reportTitle: 'Custom Analysis Report' }
  };
  
  // Resume pipeline execution with human input
  await pipelineExecutor.processHumanResponse(execution.executionId, humanResponse);
}
```

#### Example 3: Creating a Loop-Based Batch Processing Pipeline

```typescript
// Create a pipeline with loops for processing multiple items
const batchPipeline = new PipelineBuilder(
  'Batch Processing Pipeline',
  'Process multiple items in a batch using a loop'
)
  .withGlobalState({
    items: ['item1', 'item2', 'item3', 'item4', 'item5'],
    results: []
  })
  .withStep(
    new PipelineStepBuilder('initialize', 'batch_initializer')
      .withStaticParam('itemCount', '${state.items.length}')
      .withDefaultNext('process_items')
      .build()
  )
  .withStep(
    new PipelineStepBuilder('process_items', 'iterator')
      .withForLoop(10, 'itemIndex', 0, 1)
      .withDefaultNext('process_single_item')
      .withCondition('state.itemIndex >= state.items.length', 'summarize_results')
      .build()
  )
  .withStep(
    new PipelineStepBuilder('process_single_item', 'item_processor')
      .withStaticParam('item', '${state.items[state.itemIndex]}')
      .withDefaultNext('store_result')
      .onFailure('handle_item_error')
      .build()
  )
  .withStep(
    new PipelineStepBuilder('store_result', 'result_collector')
      .withDynamicParam('result', 'process_single_item', 'result')
      .withStaticParam('updateGlobalState', 'state.results.push(result)')
      .withDefaultNext('process_items')
      .build()
  )
  .withStep(
    new PipelineStepBuilder('handle_item_error', 'error_logger')
      .withStaticParam('item', '${state.items[state.itemIndex]}')
      .withStaticParam('severity', 'warning')
      .withDefaultNext('process_items')
      .build()
  )
  .withStep(
    new PipelineStepBuilder('summarize_results', 'result_summarizer')
      .withStaticParam('results', '${state.results}')
      .withDefaultNext('end')
      .build()
  )
  .withStartStep('initialize')
  .build();
```

### MCP Pipeline Tool Usage

When using the MCP server with Claude or other assistants, you can utilize the following pipeline management tools:

| Tool | Description | Parameters |
|------|-------------|------------|
| `pipeline_create` | Create a new pipeline | `name`, `description`, `definition` |
| `pipeline_list` | List available pipelines | `query` (optional) |
| `pipeline_get` | Get details of a specific pipeline | `pipelineId` |
| `pipeline_execute` | Execute a pipeline | `pipelineId`, `inputs` (optional) |
| `pipeline_human_response` | Submit human response to a waiting pipeline | `executionId`, `approved`, `input`, `modifications` |
| `pipeline_status` | Check pipeline execution status | `executionId` |
| `pipeline_load_examples` | Load example pipelines | none |

#### Example MCP Tool Call Sequence

Here's how to use these tools with an MCP-enabled assistant:

1. **Load example pipelines**
   ```json
   {
     "name": "pipeline_load_examples"
   }
   ```

2. **List available pipelines**
   ```json
   {
     "name": "pipeline_list"
   }
   ```

3. **Execute a pipeline**
   ```json
   {
     "name": "pipeline_execute",
     "pipelineId": "pipeline-id-from-list",
     "inputs": {
       "number1": 123,
       "number2": 456
     }
   }
   ```

4. **Check pipeline status**
   ```json
   {
     "name": "pipeline_status",
     "executionId": "execution-id-from-execute"
   }
   ```

5. **Provide human response if needed**
   ```json
   {
     "name": "pipeline_human_response",
     "executionId": "execution-id-from-execute",
     "approved": true,
     "input": {
       "userComment": "Looks good to me"
     },
     "modifications": {
       "reportTitle": "Custom Report"
     }
   }
   ```

### Advanced Pipeline Patterns

#### Conditional Branching

Pipelines support complex conditional branching based on the results of previous steps:

```typescript
new PipelineStepBuilder('decision_step', 'data_analyzer')
  .withDynamicParam('data', 'previous_step', 'data')
  .withDefaultNext('default_path')
  .withCondition('result.confidence > 0.8', 'high_confidence_path')
  .withCondition('result.confidence > 0.5 && result.confidence <= 0.8', 'medium_confidence_path')
  .withCondition('result.confidence <= 0.5', 'low_confidence_path')
  .build()
```

#### Error Handling Patterns

Implement robust error handling with dedicated error steps:

```typescript
new PipelineStepBuilder('process_data', 'data_processor')
  .withDynamicParam('input', 'previous_step', 'data')
  .withDefaultNext('success_step')
  .onFailure('error_handler')
  .maxRetries(3)
  .build()
```

#### Human-in-the-Loop Integration

Involve humans at critical decision points in your pipelines:

```typescript
new PipelineStepBuilder('review_results', 'results_presenter')
  .withDynamicParam('results', 'analyze_data', 'results')
  .withHumanInTheLoop('Please review these results and decide if we should proceed')
  .withDefaultNext('generate_report')
  .build()
```

#### Dynamic Parameter Passing

Pass data between pipeline steps dynamically:

```typescript
// Output from one step
new PipelineStepBuilder('produce_data', 'data_producer')
  .withStaticParam('generate', true)
  .withDefaultNext('consume_data')
  .build()

// Input to another step
new PipelineStepBuilder('consume_data', 'data_consumer')
  .withDynamicParam('input', 'produce_data', 'outputData')
  .withDynamicParam('metadata', 'produce_data', 'metadata')
  .withDefaultNext('end')
  .build()
```

## License

This project is open-source and available under the MIT license.

### Integrating with External MCP Configurations

The Chain of Draft tool framework can also load tools from external MCP configuration files like `mcp.json`. This allows you to create a bidirectional integration between your tool and other MCP-enabled tools:

#### Automatic Tool Loading from mcp.json

The ToolRegistry can automatically load and register tools from an mcp.json configuration file:

```typescript
// src/index.ts
import { ToolRegistry } from './tools/registry.js';

// Initialize registry with automatic mcp.json loading
const registry = new ToolRegistry(true); // Pass true to load mcp.json

// Other tools will still be registered as normal
defaultChainOfTools.forEach(tool => registry.registerTool(tool));
```

#### Manually Loading Tools from mcp.json

You can also manually load tools from mcp.json:

```typescript
// Initialize registry without automatic loading
const registry = new ToolRegistry();

// Load tools from default locations (.cursor/mcp.json, etc.)
const toolsLoaded = registry.loadToolsFromMcpConfig();
console.log(`Loaded ${toolsLoaded} tools from mcp.json`);

// Or specify a custom path
registry.loadToolsFromMcpConfig('/path/to/custom/mcp.json');
```

#### How It Works

The mcp.json integration:

1. Searches for mcp.json in standard locations (e.g., ~/.cursor/mcp.json)
2. Parses the configuration to find MCP servers
3. Creates a proxy tool for each server in the config
4. Registers these proxy tools in the ToolRegistry

This allows your Chain of Draft tool to:
- Discover other MCP tools automatically
- Create tool chains across different MCP servers
- Enable cross-tool pipelines for complex workflows

#### Example mcp.json Integration

With an mcp.json file like:

```json
{
  "mcpServers": {
    "filesystem": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-filesystem", "~/projects/*"]
    },
    "sequential-thinking": {
      "command": "npx",
      "args": ["-y", "@smithery/cli@latest", "run", "sequential-thinking"]
    }
  }
}
```

Your Chain of Draft tool would automatically create:
- `mcp_filesystem` - Proxy tool for the filesystem server
- `mcp_sequential_thinking` - Proxy tool for the sequential-thinking server

These proxy tools allow you to incorporate the capabilities of external MCP servers into your tool chains and pipelines.