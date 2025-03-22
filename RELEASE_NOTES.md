# Release Notes - v1.1.0

## MCP Chain of Draft Prompt Tool

We're excited to announce version 1.1.0 of the MCP Chain of Draft Prompt Tool! This release introduces BYOLLM support and improves documentation clarity.

### What's New

- **BYOLLM Support**: Added support for multiple LLM providers:
  - Cloud services (Claude, GPT, Mistral)
  - Local models via Ollama
  - Custom local LLM endpoints
- Enhanced documentation to better explain the tool's core functionality
- Improved README with clearer explanation of the transformation process
- Updated Smithery.ai integration and badges

### Core Functionality Highlight

The MCP Chain of Draft Prompt Tool serves as an intelligent prompt transformer that:

1. Takes your standard prompts
2. Automatically transforms them into Chain of Draft (CoD) or Chain of Thought (CoT) format
3. Processes them through your chosen LLM (cloud or local)
4. Returns enhanced, structured responses

This process significantly improves reasoning quality while reducing token usage.

### LLM Integration

The tool now supports multiple LLM providers:

#### Cloud Services
- Anthropic Claude
- OpenAI GPT models
- Mistral AI

#### Local Models
- Ollama integration (supporting all Ollama models)
- Custom local LLM endpoints
- Any model supporting chat completion API

### Integration

The tool is now available on Smithery.ai:
https://smithery.ai/server/@brendancopley/mcp-chain-of-draft-prompt-tool

### Getting Started

To get started with the new version:

```bash
npm install mcp-chain-of-draft-prompt-tool@1.1.0
```

Or update your existing installation:

```bash
npm update mcp-chain-of-draft-prompt-tool
```

Configure your preferred LLM:

```bash
# For Ollama
export MCP_LLM_PROVIDER=ollama
export MCP_OLLAMA_MODEL=llama2

# For cloud services
export ANTHROPIC_API_KEY=your_key_here
# or
export OPENAI_API_KEY=your_key_here
# or
export MISTRAL_API_KEY=your_key_here
```

### Feedback

We welcome your feedback and contributions! Please visit our GitHub repository or Smithery.ai page to share your thoughts and experiences. 