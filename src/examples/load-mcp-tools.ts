#!/usr/bin/env node

/**
 * Example of loading tools from mcp.json
 * This demonstrates how to use the ToolRegistry to load tools from external MCP servers
 */
import { ToolRegistry } from '../tools/registry.js';
import chalk from 'chalk';

async function demonstrateMcpToolsLoading() {
  console.log(chalk.blue('MCP Tools Loading Example'));
  console.log(chalk.blue('-------------------------'));
  
  // Create registry with automatic MCP config loading
  console.log(chalk.green('\n1. Creating registry with automatic MCP config loading:'));
  const registryAuto = new ToolRegistry(true);
  const toolsAuto = registryAuto.getAllTools();
  console.log(chalk.white(`Loaded ${toolsAuto.length} tools`));
  
  // Create registry and manually load MCP config
  console.log(chalk.green('\n2. Creating registry and manually loading MCP config:'));
  const registryManual = new ToolRegistry();
  const loadedCount = registryManual.loadToolsFromMcpConfig();
  console.log(chalk.white(`Loaded ${loadedCount} tools from MCP config`));
  
  // Try loading from a custom path
  console.log(chalk.green('\n3. Loading from custom path:'));
  try {
    // This will likely fail unless the file exists
    const customPath = './custom-mcp.json';
    const customCount = registryManual.loadToolsFromMcpConfig(customPath);
    console.log(chalk.white(`Loaded ${customCount} tools from custom MCP config`));
  } catch (error) {
    console.log(chalk.yellow('Failed to load from custom path (expected)'));
  }
  
  // Show loaded tools
  console.log(chalk.green('\nLoaded MCP Tools:'));
  const tools = registryManual.getAllTools();
  
  if (tools.length === 0) {
    console.log(chalk.yellow('No MCP tools were loaded. This is expected if no mcp.json was found.'));
    console.log(chalk.yellow('To test this feature, create an mcp.json file in one of the standard locations:'));
    console.log(chalk.yellow('  - ~/.cursor/mcp.json'));
    console.log(chalk.yellow('  - ~/.claude/mcp.json'));
    console.log(chalk.yellow('  - ./mcp.json'));
  } else {
    tools.forEach(tool => {
      console.log(chalk.green(`\n${tool.name}`));
      console.log(chalk.white(`Description: ${tool.description}`));
      
      if (tool.parameters.length > 0) {
        console.log(chalk.white('Parameters:'));
        tool.parameters.forEach(param => {
          const required = param.required ? chalk.red('(required)') : chalk.gray('(optional)');
          console.log(`  - ${param.name} ${required}: ${param.description}`);
        });
      } else {
        console.log(chalk.white('Parameters: None'));
      }
    });
  }
  
  // Create an example mcp.json file if none exists
  console.log(chalk.green('\nCreating example mcp.json file for reference:'));
  const fs = await import('fs');
  const exampleConfig = {
    mcpServers: {
      "chain-of-draft-prompt-tool": {
        command: "node",
        args: ["./dist/index.js"],
        env: {
          ANTHROPIC_API_KEY: "your_api_key_here"
        }
      },
      "filesystem": {
        command: "npx",
        args: [
          "-y",
          "@modelcontextprotocol/server-filesystem",
          "~/*"
        ]
      }
    }
  };
  
  fs.writeFileSync('example-mcp.json', JSON.stringify(exampleConfig, null, 2));
  console.log(chalk.white('Created example-mcp.json file in current directory'));
  console.log(chalk.yellow('To use it, run: mv example-mcp.json mcp.json'));
}

// Run the example
demonstrateMcpToolsLoading(); 