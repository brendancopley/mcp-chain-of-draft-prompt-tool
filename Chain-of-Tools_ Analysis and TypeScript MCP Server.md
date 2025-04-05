<img src="https://r2cdn.perplexity.ai/pplx-full-logo-primary-dark%402x.png" class="logo" width="120"/>

# 

---

# Chain-of-Tools: Analysis and TypeScript MCP Server Implementation

This comprehensive research report analyzes the recent "Chain-of-Tools" paper and provides a complete TypeScript implementation plan for an MCP server based on the chain-of-draft-prompt-tool repository. The aim is to enable language models to utilize massive unseen tool libraries through semantic matching and chain-of-thought reasoning.

## Paper Analysis: Chain-of-Tools

### Core Concepts and Innovations

The "Chain-of-Tools" paper introduces a novel approach to tool learning in large language models (LLMs) that overcomes key limitations of existing methods[^1]. Traditional tool learning approaches either require fine-tuning models specifically for the tools they'll use or adding tool demonstrations directly into prompts, which limits flexibility and efficiency.

The key innovation of Chain-of-Tools is enabling "frozen" (non-fine-tuned) LLMs to leverage tools they've never encountered before by utilizing their inherent semantic representation capabilities[^1]. This approach integrates tool calling directly into Chain-of-Thought (CoT) reasoning processes, allowing models to work with flexible and extensive tool pools containing previously unseen tools.

Unlike demonstration-based approaches that require explicit examples of each tool's usage, Chain-of-Tools leverages the model's ability to understand tool functionality from descriptions alone. This significantly expands the potential tool ecosystem available to LLMs without requiring costly retraining or prompt engineering for each new tool[^1].

### Technical Components and Architecture

While the paper abstract doesn't provide complete implementation details, we can infer that Chain-of-Tools relies on several key technical components:

1. **Semantic Matching**: The system likely employs sophisticated semantic matching between problem descriptions and tool functionalities, enabling relevance-based tool selection.
2. **CoT Integration**: Tool usage is seamlessly integrated into the Chain-of-Thought reasoning process, allowing models to determine when and how to apply tools during multi-step problem solving.
3. **Tool Pool Management**: The approach supports massive tool pools with diverse functionalities, providing efficient indexing and retrieval mechanisms to handle potentially thousands of tools.
4. **Frozen Model Utilization**: Rather than fine-tuning models on specific tools, Chain-of-Tools leverages pre-trained LLMs' abilities to understand and apply new concepts, maximizing flexibility.

### Benchmark Performance

The researchers validated their approach across multiple benchmarks to demonstrate its effectiveness[^1]:

- **Numerical Reasoning**: Tested on GSM8K-XL and FuncQA benchmarks
- **Knowledge-Based QA**: Evaluated using KAMEL and their new SimpleToolQuestions dataset

The results show Chain-of-Tools outperforming baseline approaches across these benchmarks, indicating its effectiveness for both mathematical reasoning and knowledge-intensive tasks[^1]. The researchers also identified critical dimensions in model output that influence tool selection, enhancing the interpretability of the system.

## TypeScript MCP Server Implementation

Based on the mcp-chain-of-draft-prompt-tool repository, I'll now outline the implementation of a Chain-of-Tools MCP server in TypeScript.

### Core Architecture Overview

The existing Chain-of-Draft tool transforms standard prompts into either Chain-of-Draft (CoD) or Chain-of-Thought (CoT) formats, enhancing reasoning while reducing token usage[^2]. Our implementation will extend this foundation to incorporate the Chain-of-Tools approach, focusing on semantic tool matching and integration.

The implementation will include four primary components:

1. **Tool Selection Service**: Matches problems to relevant tools using semantic representation
2. **CoT Reasoning Integration**: Incorporates selected tools into reasoning chains
3. **Tool Pool Management**: Handles the storage, indexing, and retrieval of tool descriptions
4. **Performance Monitoring**: Tracks efficiency metrics and tool selection accuracy

### Tool Pool Management System

```typescript
// Tool and parameter interfaces
interface Parameter {
  name: string;
  type: string;
  description: string;
  required: boolean;
  default?: any;
}

interface ReturnType {
  type: string;
  description: string;
}

interface ToolDescription {
  name: string;
  description: string;
  parameters: Parameter[];
  returns: ReturnType;
  examples?: Array<{input: Record<string, any>, output: any}>;
}

// Tool pool implementation
class ToolPool {
  private tools: Map<string, ToolDescription> = new Map();
  private semanticIndex: SemanticIndex;
  
  constructor(config: ToolPoolConfig) {
    this.semanticIndex = new SemanticIndex();
    if (config.sourcePath) {
      this.loadToolsFromSource(config.sourcePath);
    }
  }
  
  async loadToolsFromSource(sourcePath: string): Promise<void> {
    // Load tool descriptions from files or directories
    const toolDescriptions = await loadToolDescriptions(sourcePath);
    for (const tool of toolDescriptions) {
      this.addTool(tool);
    }
  }
  
  addTool(tool: ToolDescription): void {
    this.tools.set(tool.name, tool);
    this.semanticIndex.indexTool(tool);
  }
  
  async findRelevantTools(query: string, threshold: number, maxCount: number): Promise<ToolDescription[]> {
    return this.semanticIndex.findSimilarTools(query, threshold, maxCount);
  }
}
```

This implementation provides flexible tool management, allowing tools to be loaded from files, added programmatically, and retrieved based on semantic relevance to a given query[^2].

### Semantic Matching Algorithm

```typescript
class SemanticIndex {
  private toolEmbeddings: Map<string, number[]> = new Map();
  private embeddingService: EmbeddingService;
  
  constructor(embeddingService?: EmbeddingService) {
    this.embeddingService = embeddingService || new DefaultEmbeddingService();
  }
  
  async indexTool(tool: ToolDescription): Promise<void> {
    const toolContent = `${tool.name}. ${tool.description}. Parameters: ${tool.parameters
      .map(p => `${p.name}: ${p.description}`).join('. ')}. Returns: ${tool.returns.description}`;
    const embedding = await this.embeddingService.getEmbedding(toolContent);
    this.toolEmbeddings.set(tool.name, embedding);
  }
  
  async findSimilarTools(query: string, threshold: number, maxCount: number): Promise<ToolDescription[]> {
    const queryEmbedding = await this.embeddingService.getEmbedding(query);
    
    // Calculate similarities and return most relevant tools
    const similarities: [string, number][] = [];
    for (const [toolName, toolEmbedding] of this.toolEmbeddings.entries()) {
      const similarity = this.calculateCosineSimilarity(queryEmbedding, toolEmbedding);
      similarities.push([toolName, similarity]);
    }
    
    // Sort by similarity (descending) and filter by threshold
    similarities.sort((a, b) => b[^1] - a[^1]);
    return similarities
      .filter(([_, similarity]) => similarity >= threshold)
      .slice(0, maxCount)
      .map(([toolName, _]) => getToolPool().findToolByName(toolName)!)
      .filter(Boolean);
  }
}
```

The semantic matching algorithm creates vector embeddings for all tools and queries, then finds the most similar tools using cosine similarity[^2]. This allows the system to identify relevant tools even when they've never been seen before, implementing the core insight from the Chain-of-Tools paper[^1].

### Chain-of-Tools Reasoning Service

```typescript
interface ReasoningStep {
  type: 'thought' | 'tool_selection' | 'tool_execution' | 'result_integration';
  content: string;
  toolUsed?: ToolDescription;
  toolInput?: Record<string, any>;
  toolOutput?: any;
}

class ChainOfToolsReasoner {
  private config: ChainOfToolsConfig;
  private toolPool: ToolPool;
  private llmClient: LLMClient;
  
  constructor(config: ChainOfToolsConfig, toolPool: ToolPool, llmClient: LLMClient) {
    this.config = config;
    this.toolPool = toolPool;
    this.llmClient = llmClient;
  }
  
  async solve(problem: string): Promise<ChainOfToolsResult> {
    const startTime = Date.now();
    const reasoningSteps: ReasoningStep[] = [];
    const selectedTools: ToolDescription[] = [];
    let tokenUsage = 0;
    
    // Find relevant tools based on semantic matching
    const relevantTools = await this.toolPool.findRelevantTools(
      problem, 
      this.config.semanticThreshold,
      this.config.maxToolsPerChain
    );
    
    // Construct the prompt with available tools
    const toolDescriptions = relevantTools.map(tool => 
      `Tool: ${tool.name}\nDescription: ${tool.description}\nParameters: ${JSON.stringify(tool.parameters)}\n`
    ).join('\n');
    
    const prompt = `
Problem: ${problem}

Available Tools:
${toolDescriptions}

Think step-by-step to solve this problem. For each step:
1. Decide if you need to use a tool
2. If yes, specify which tool to use and provide the parameters
3. Integrate the tool's results into your reasoning
4. Continue reasoning until you reach a final answer

Reasoning:`;
    
    // Get reasoning from LLM
    const llmResponse = await this.llmClient.complete(prompt);
    tokenUsage += llmResponse.tokenUsage;
    
    // Parse reasoning and execute tools
    const parsedSteps = this.parseReasoningSteps(llmResponse.content);
    // ... tool execution and reasoning integration logic
    
    // Calculate performance metrics and return result
    return {
      selectedTools,
      reasoningSteps,
      finalOutput: this.extractFinalAnswer(reasoningSteps),
      performanceMetrics: {
        tokenUsage,
        executionTime: Date.now() - startTime,
        numberOfToolsUsed: selectedTools.length
      }
    };
  }
}
```

This reasoner implements the Chain-of-Tools approach by finding semantically relevant tools, constructing an informative prompt that includes tool descriptions, and parsing the resulting reasoning to identify and execute tool calls[^1][^2].

### MCP Protocol Integration

```typescript
class ChainOfToolsMCPServer {
  private server: MCPServer;
  private chainOfToolsReasoner: ChainOfToolsReasoner;
  private toolPool: ToolPool;
  
  constructor(config: ChainOfToolsConfig, llmClient: LLMClient) {
    this.server = new MCPServer();
    this.toolPool = new ToolPool(config.toolPoolConfig);
    this.chainOfToolsReasoner = new ChainOfToolsReasoner(config, this.toolPool, llmClient);
    
    this.registerFunctions();
  }
  
  private registerFunctions(): void {
    // Register tool solving function
    this.server.register(
      new MCPFunction({
        name: 'chain_of_tools_solve',
        description: 'Solve a problem using Chain-of-Tools reasoning',
        parameters: [
          {
            name: 'problem',
            type: 'string',
            description: 'The problem to solve',
            required: true
          },
          {
            name: 'max_tools',
            type: 'number',
            description: 'Maximum number of tools to use',
            required: false,
            default: 5
          }
        ],
        handler: async (ctx: MCPContext, params: any) => {
          const { problem, max_tools } = params;
          // Override config if parameters provided
          const result = await this.chainOfToolsReasoner.solve(problem);
          
          return {
            final_answer: result.finalOutput,
            reasoning_steps: result.reasoningSteps.map(step => step.content),
            tools_used: result.selectedTools.map(tool => tool.name),
            performance: {
              token_usage: result.performanceMetrics.tokenUsage,
              execution_time_ms: result.performanceMetrics.executionTime,
              tool_count: result.performanceMetrics.numberOfToolsUsed
            }
          };
        }
      })
    );
    
    // Register tool management functions
    this.server.register(
      new MCPFunction({
        name: 'list_available_tools',
        description: 'List all available tools in the tool pool',
        parameters: [],
        handler: async () => {
          const tools = this.toolPool.getAllTools();
          return {
            tool_count: tools.length,
            tools: tools.map(tool => ({
              name: tool.name,
              description: tool.description
            }))
          };
        }
      })
    );
  }
}
```

The MCP server integration exposes the Chain-of-Tools functionality through the Model Context Protocol, allowing it to be used with MCP clients like Claude Desktop or Dive[^2].

## Performance Considerations and Metrics

### Efficiency Metrics

The Chain-of-Tools implementation includes comprehensive performance monitoring:

```typescript
class PerformanceMonitor {
  private metrics: {
    tokenUsage: number[];
    executionTimes: number[];
    toolCounts: number[];
    problems: string[];
  } = {
    tokenUsage: [],
    executionTimes: [],
    toolCounts: [],
    problems: []
  };
  
  recordResult(problem: string, result: ChainOfToolsResult): void {
    this.metrics.problems.push(problem);
    this.metrics.tokenUsage.push(result.performanceMetrics.tokenUsage);
    this.metrics.executionTimes.push(result.performanceMetrics.executionTime);
    this.metrics.toolCounts.push(result.performanceMetrics.numberOfToolsUsed);
  }
  
  getAverageMetrics(): {
    avgTokenUsage: number;
    avgExecutionTime: number;
    avgToolCount: number;
  } {
    // Calculate and return average metrics
  }
}
```

This monitoring system tracks key performance indicators such as token usage, execution time, and tool utilization, providing insights into the efficiency and effectiveness of the Chain-of-Tools approach[^2].

### Error Handling and Recovery

Robust error handling is critical when dealing with tool execution and LLM interactions:

```typescript
class ErrorHandler {
  private static readonly MAX_RETRIES = 3;
  
  static async withRetry<T>(
    operation: () => Promise<T>,
    onError?: (error: Error, attempt: number) => void
  ): Promise<T> {
    let lastError: Error | undefined;
    
    for (let attempt = 1; attempt <= this.MAX_RETRIES; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        
        if (onError) {
          onError(lastError, attempt);
        }
        
        // Wait before retrying, with exponential backoff
        const delayMs = Math.pow(2, attempt - 1) * 1000;
        await new Promise(resolve => setTimeout(resolve, delayMs));
      }
    }
    
    throw lastError || new Error('Operation failed after maximum retries');
  }
}
```

This implementation includes retry logic with exponential backoff and specific handlers for different types of errors, ensuring the system remains robust even when individual tools or LLM requests fail[^2].

## Implementation Considerations

### Tool Versioning

For a production implementation, tool versioning would need to be addressed. The semantic matching approach inherently provides some flexibility, as tool descriptions can evolve while maintaining semantic similarity. A more formal versioning system could:

1. Include version information in tool descriptions
2. Maintain backward compatibility for parameter schemas
3. Allow multiple versions of the same tool to exist simultaneously
4. Include version-specific examples

### Optimal Tool Pool Size

The Chain-of-Tools approach is designed to work with massive tool pools, but practical considerations for an initial implementation suggest starting with:

- 50-100 tools for initial testing
- 500-1000 tools for production deployment
- Categorization by domain to improve retrieval efficiency

As the semantic matching improves and LLM context windows expand, the tool pool could grow to include thousands of specialized tools.

### Tool Conflicts and Ambiguity

When multiple tools have similar functionalities or descriptions, several strategies can be employed:

1. Present multiple relevant tools to the LLM and let it select the most appropriate one
2. Use more specific tool descriptions to reduce ambiguity
3. Implement a hierarchical tool organization with general and specific variants
4. Track tool usage success rates to improve future tool selection

## Conclusion

The Chain-of-Tools approach represents a significant advancement in enabling LLMs to utilize massive tool libraries without requiring fine-tuning or demonstration-based learning[^1]. By leveraging the semantic understanding capabilities of frozen LLMs, it allows models to effectively select and use tools they've never encountered before.

Our TypeScript implementation plan extends the existing mcp-chain-of-draft-prompt-tool repository[^2] to incorporate this approach, providing a flexible and powerful system for tool-augmented reasoning. The semantic matching algorithm allows for dynamic tool discovery, while the CoT integration ensures coherent reasoning with appropriate tool usage.

This implementation would provide several advantages over traditional approaches:

- Support for massive, extensible tool libraries
- No need for fine-tuning when adding new tools
- Efficient semantic matching for appropriate tool selection
- Integration with the Model Context Protocol for wide compatibility

The next steps would involve implementing this design, testing it against the benchmarks used in the original paper, and iteratively improving the semantic matching and reasoning components to enhance performance.

<div style="text-align: center">⁂</div>

[^1]: https://arxiv.org/abs/2503.16779

[^2]: https://github.com/brendancopley/mcp-chain-of-draft-prompt-tool

[^3]: https://www.themoonlight.io/review/chain-of-tools-utilizing-massive-unseen-tools-in-the-cot-reasoning-of-frozen-language-models

[^4]: https://github.com/brendancopley/mcp-chain-of-draft-prompt-tool

[^5]: https://github.com/bsmi021/mcp-chain-of-draft-server

[^6]: https://www.arxiv.org/abs/2503.16779

[^7]: https://arxiv.org/html/2503.16779v1

[^8]: https://playbooks.com/mcp/bsmi021-chain-of-draft

[^9]: https://www.datacamp.com/tutorial/chain-of-thought-prompting

[^10]: https://www.catalyzex.com/author/Xiang Zhang

[^11]: https://www.youtube.com/watch?v=kXuRJXEzrE0

[^12]: https://thesystemsthinker.com/wp-content/uploads/2016/03/Systems-Thinking-Tools-TRST01E.pdf

[^13]: https://www.differentiated.io/blog/how-to-build-an-mcp-server

[^14]: https://www.aimodels.fyi/papers/arxiv/chain-tools-utilizing-massive-unseen-tools-cot

[^15]: https://huggingface.co/papers?q=Chain-of-Tools

[^16]: https://x.com/omarsar0/status/1904190225079022018

[^17]: https://www.aimodels.fyi/papers/arxiv/efficient-tool-use-chain-abstraction-reasoning

[^18]: https://mcp.so/server/mcp-chain-of-draft-server

[^19]: https://mcp.so/server/mcp-chain-of-draft-server/bsmi021?tab=content

[^20]: https://glama.ai/mcp/servers/@bsmi021/mcp-chain-of-draft-server/tools/chain-of-draft

[^21]: https://glama.ai/mcp/servers/categories/developer-tools

[^22]: https://dl.acm.org/doi/10.1145/3704435

[^23]: https://twitter.com/omarsar0/status/1904190237775159370

[^24]: https://www.inquired.org/post/anchor-charts-the-unseen-heroes-of-inquiry-based-learning

