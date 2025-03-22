# Chain of Draft MCP Server

## Overview
- This repository implements a Chain of Draft (CoD) reasoning server
- CoD is a method for efficient reasoning with LLMs using minimal word steps

## Dependencies
- Required packages are in `requirements.txt`
- Install with `pip install -r requirements.txt`
- Requires an Anthropic API key in `.env` file

## Running the Server
- Start the server with `python server.py`
- Alternatively, configure in Claude Desktop config

## Testing
- Run tests with `python test.py`

## Claude Desktop Integration
- Add to `~/Library/Application Support/Claude/claude_desktop_config.json`
- Point to the absolute path of server.py
- Include your Anthropic API key in the environment
- Restart Claude Desktop after configuration

## Available Tools
- `chain_of_draft_solve`: General problem solver with CoD
- `math_solve`: Specifically for math problems
- `code_solve`: For coding problems
- `logic_solve`: For logic problems
- `get_performance_stats`: View statistics on CoD vs CoT
- `get_token_reduction`: Analyze token usage reduction
- `analyze_problem_complexity`: Evaluate problem difficulty

## Pushing to GitHub
- Use `./push.sh` to push changes to GitHub
- Use `./commit.sh` to commit changes