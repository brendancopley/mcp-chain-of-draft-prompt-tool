"""
Main server module for the Chain of Draft MCP server.
Implements the MCP server with reasoning tools.
"""

import os
import asyncio
import time
from dotenv import load_dotenv

# Import the FastMCP module for modern MCP API
from mcp.server.fastmcp import FastMCP
from mcp.server.stdio import stdio_server

# Import other modules
from analytics import AnalyticsService
from complexity import ComplexityEstimator
from examples import ExampleDatabase
from format import FormatEnforcer
from reasoning import ReasoningSelector, create_cod_prompt, create_cot_prompt
from client import ChainOfDraftClient

# Load environment variables
load_dotenv()

# Initialize services
analytics = AnalyticsService()
complexity_estimator = ComplexityEstimator()
example_db = ExampleDatabase()
format_enforcer = FormatEnforcer()
cod_client = ChainOfDraftClient()

# Initialize FastMCP server
app = FastMCP("mcp-chain-of-draft-prompt-tool")

@app.tool()
async def chain_of_draft_solve(
    problem: str,
    domain: str = "general",
    max_words_per_step: int = None,
    approach: str = None,
    enforce_format: bool = True,
    adaptive_word_limit: bool = True
) -> str:
    """Solve a reasoning problem using Chain of Draft approach.
    
    Args:
        problem: The problem to solve
        domain: Domain for context (math, logic, code, common-sense, etc.)
        max_words_per_step: Maximum words per reasoning step (default: adaptive)
        approach: Force "CoD" or "CoT" approach (default: auto-select)
        enforce_format: Whether to enforce the word limit (default: True)
        adaptive_word_limit: Adjust word limits based on complexity (default: True)
    """
    # Track execution time
    start_time = time.time()
    
    # Process the request with the client
    result = await cod_client.solve_with_reasoning(
        problem=problem,
        domain=domain,
        max_words_per_step=max_words_per_step,
        approach=approach,
        enforce_format=enforce_format,
        adaptive_word_limit=adaptive_word_limit
    )
    
    # Calculate execution time
    execution_time = (time.time() - start_time) * 1000  # ms
    
    # Format the response
    formatted_response = (
        f"Chain of {result['approach']} reasoning ({result['word_limit']} word limit):\n\n"
        f"{result['reasoning_steps']}\n\n"
        f"Final answer: {result['final_answer']}\n\n"
        f"Stats: {result['token_count']} tokens, {execution_time:.0f}ms, "
        f"complexity score: {result['complexity']}"
    )
    
    return formatted_response

@app.tool()
async def math_solve(
    problem: str,
    approach: str = None,
    max_words_per_step: int = None
) -> str:
    """Solve a math problem using Chain of Draft reasoning.
    
    Args:
        problem: The math problem to solve
        approach: Force "CoD" or "CoT" approach (default: auto-select)
        max_words_per_step: Maximum words per step (default: adaptive)
    """
    return await chain_of_draft_solve(
        problem=problem,
        domain="math",
        approach=approach,
        max_words_per_step=max_words_per_step
    )

@app.tool()
async def code_solve(
    problem: str,
    approach: str = None,
    max_words_per_step: int = None
) -> str:
    """Solve a coding problem using Chain of Draft reasoning.
    
    Args:
        problem: The coding problem to solve
        approach: Force "CoD" or "CoT" approach (default: auto-select)
        max_words_per_step: Maximum words per step (default: adaptive)
    """
    return await chain_of_draft_solve(
        problem=problem,
        domain="code",
        approach=approach,
        max_words_per_step=max_words_per_step
    )

@app.tool()
async def logic_solve(
    problem: str,
    approach: str = None,
    max_words_per_step: int = None
) -> str:
    """Solve a logic problem using Chain of Draft reasoning.
    
    Args:
        problem: The logic problem to solve
        approach: Force "CoD" or "CoT" approach (default: auto-select)
        max_words_per_step: Maximum words per step (default: adaptive)
    """
    return await chain_of_draft_solve(
        problem=problem,
        domain="logic",
        approach=approach,
        max_words_per_step=max_words_per_step
    )

@app.tool()
async def get_performance_stats(
    domain: str = None
) -> str:
    """Get performance statistics for CoD vs CoT approaches.
    
    Args:
        domain: Filter for specific domain (optional)
    """
    stats = await analytics.get_performance_by_domain(domain)
    
    result = "Performance Comparison (CoD vs CoT):\n\n"
    
    if not stats:
        return "No performance data available yet."
    
    for stat in stats:
        result += f"Domain: {stat['domain']}\n"
        result += f"Approach: {stat['approach']}\n"
        result += f"Average tokens: {stat['avg_tokens']:.1f}\n"
        result += f"Average time: {stat['avg_time_ms']:.1f}ms\n"
        
        if stat['accuracy'] is not None:
            result += f"Accuracy: {stat['accuracy'] * 100:.1f}%\n"
        
        result += f"Sample size: {stat['count']}\n\n"
    
    return result

@app.tool()
async def get_token_reduction() -> str:
    """Get token reduction statistics for CoD vs CoT."""
    stats = await analytics.get_token_reduction_stats()
    
    result = "Token Reduction Analysis:\n\n"
    
    if not stats:
        return "No reduction data available yet."
    
    for stat in stats:
        result += f"Domain: {stat['domain']}\n"
        result += f"CoD avg tokens: {stat['cod_avg_tokens']:.1f}\n"
        result += f"CoT avg tokens: {stat['cot_avg_tokens']:.1f}\n"
        result += f"Reduction: {stat['reduction_percentage']:.1f}%\n\n"
    
    return result

@app.tool()
async def analyze_problem_complexity(
    problem: str,
    domain: str = "general"
) -> str:
    """Analyze the complexity of a problem.
    
    Args:
        problem: The problem to analyze
        domain: Problem domain
    """
    analysis = complexity_estimator.analyze_problem(problem, domain)
    
    result = f"Complexity Analysis for {domain} problem:\n\n"
    result += f"Word count: {analysis['word_count']}\n"
    result += f"Sentence count: {analysis['sentence_count']}\n"
    result += f"Words per sentence: {analysis['words_per_sentence']:.1f}\n"
    result += f"Complexity indicators found: {analysis['indicator_count']}\n"
    
    if analysis['found_indicators']:
        result += f"Indicators: {', '.join(analysis['found_indicators'])}\n"
    
    result += f"Question count: {analysis['question_count']}\n"
    result += f"\nEstimated complexity score: {analysis['estimated_complexity']}\n"
    result += f"Recommended word limit per step: {analysis['estimated_complexity']}\n"
    
    return result

async def main():
    """Main entry point for the MCP server."""
    # Initialize example database
    await example_db.get_examples("math")  # This will trigger example loading if needed
    
    # Print startup message
    import sys
    print("Chain of Draft MCP Server starting...", file=sys.stderr)

if __name__ == "__main__":
    import sys
    
    # Print debug information
    print("Python version:", sys.version, file=sys.stderr)
    print("Running in directory:", os.getcwd(), file=sys.stderr)
    print("Environment variables:", dict(os.environ), file=sys.stderr)
    
    try:
        # Run the example initialization
        asyncio.run(main())
        
        # Start the server with stdio transport
        print("Starting FastMCP server with stdio transport...", file=sys.stderr)
        # Cannot use additional options directly, use environment variables instead
        os.environ['MCP_DEBUG'] = '1'
        os.environ['MCP_LOG_TRANSPORT'] = '1'
        app.run(transport="stdio")
    except Exception as e:
        print(f"Error in server startup: {e}", file=sys.stderr)
        import traceback
        traceback.print_exc(file=sys.stderr)
        sys.exit(1)
