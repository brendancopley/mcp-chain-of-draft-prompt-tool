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
2. Install dependencies using yarn (recommended) or npm:
   ```bash
   # Using yarn (recommended)
   yarn install

   # Using npm
   npm install
   ```
3. Configure API keys in `.env` file:
   ```
   ANTHROPIC_API_KEY=your_api_key_here
   ```
4. Build and run the server:
   ```bash
   # Build TypeScript files using Nx
   yarn nx build
   # or npm run nx build

   # Start the server
   yarn start
   # or npm start

   # For development with auto-reload:
   yarn dev
   # or npm run dev
   ```

Available scripts:
- `yarn nx build`: Compiles TypeScript to JavaScript using Nx build system
- `yarn build:sea`: Creates Single Executable Applications for all platforms
- `yarn start`: Runs the compiled server from `dist`
- `yarn test`: Runs the test query against the server
- `yarn dev`: Runs the TypeScript server directly using ts-node (useful for development)

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
yarn build:sea

# Build for specific platforms
yarn build:macos   # macOS
yarn build:linux   # Linux
yarn build:windows # Windows
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

## License

This project is open-source and available under the MIT license.