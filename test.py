"""
Test script for the Chain of Draft client.
"""

import asyncio
import os
from dotenv import load_dotenv
# Use absolute import since this file might be run directly
from client import ChainOfDraftClient

# Load environment variables
load_dotenv()

async def main():
    """Run a simple test of the Chain of Draft client."""
    # Create client
    client = ChainOfDraftClient()
    
    # Test problems
    test_problems = [
        {
            "problem": "Jason had 20 lollipops. He gave Denny some lollipops. Now Jason has 12 lollipops. How many lollipops did Jason give to Denny?",
            "domain": "math"
        },
        {
            "problem": "A coin is heads up. John flips the coin. Mary flips the coin. Paul flips the coin. Susan does not flip the coin. Is the coin still heads up?",
            "domain": "logic"
        },
        {
            "problem": "Write a function to find the nth Fibonacci number.",
            "domain": "code"
        }
    ]
    
    # Run tests with both CoD and CoT
    for approach in ["CoD", "CoT"]:
        print(f"\n===== Testing with {approach} approach =====\n")
        
        for test in test_problems:
            print(f"Problem ({test['domain']}): {test['problem']}")
            
            # Solve with specified approach
            result = await client.solve_with_reasoning(
                problem=test['problem'],
                domain=test['domain'],
                approach=approach
            )
            
            print(f"\nReasoning:\n{result['reasoning_steps']}")
            print(f"\nAnswer: {result['final_answer']}")
            print(f"Tokens: {result['token_count']}")
            print(f"Word limit: {result['word_limit']}")
            print(f"Complexity: {result['complexity']}")
            print("\n" + "-" * 50 + "\n")
    
    # Get performance stats
    print("\n===== Performance Statistics =====\n")
    stats = await client.get_performance_stats()
    
    for stat in stats:
        print(f"Domain: {stat['domain']}")
        print(f"Approach: {stat['approach']}")
        print(f"Average tokens: {stat['avg_tokens']}")
        print(f"Average time: {stat['avg_time_ms']}")
        
        if stat['accuracy'] is not None:
            print(f"Accuracy: {stat['accuracy'] * 100:.1f}%")
            
        print(f"Sample size: {stat['count']}")
        print()
    
    # Get token reduction stats
    reduction_stats = await client.get_token_reduction_stats()
    
    if reduction_stats:
        print("\n===== Token Reduction =====\n")
        
        for stat in reduction_stats:
            print(f"Domain: {stat['domain']}")
            print(f"CoD avg tokens: {stat['cod_avg_tokens']:.1f}")
            print(f"CoT avg tokens: {stat['cot_avg_tokens']:.1f}")
            print(f"Reduction: {stat['reduction_percentage']:.1f}%")
            print()

if __name__ == "__main__":
    asyncio.run(main())
