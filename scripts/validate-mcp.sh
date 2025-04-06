#!/bin/bash
set -e

echo "==== MCP Chain of Draft Validator ===="
echo "This script validates that the Chain of Draft MCP works correctly."
echo

# Make the script folder the working directory
cd "$(dirname "$0")"
cd ..

echo "Building the project..."
npm run build

echo
echo "Running the tests..."
npm run test

echo
echo "===== Manual Validation ====="
echo "Running the MCP with a sample math problem..."
echo "This will use the test LLM provider to avoid making real API calls."
echo

# Set up the test environment
export LLM_PROVIDER=test
export NODE_ENV=test
export DEBUG=true

# Run the MCP with a sample problem
echo "Solve for x: 2x + 5 = 15" | node dist/index.js

echo
echo "===== Validation Complete ====="
echo "If you see a test response above and no errors, the MCP is working correctly!"
echo "To run with a real LLM provider, unset the LLM_PROVIDER environment variable." 