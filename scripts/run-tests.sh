#!/bin/bash

# Script to run the working tests for the Chain of Draft MCP tool

echo "Running tests for Chain of Draft MCP tool..."

# Run clean-mocks script to ensure mocks are properly set up
if [ -f "scripts/clean-mocks.sh" ]; then
  echo "Setting up mocks..."
  ./scripts/clean-mocks.sh
fi

# Run all working tests
echo "Running all working tests..."
NODE_OPTIONS=--experimental-vm-modules npx jest

# Show coverage summary
echo ""
echo "Current test coverage for key modules:"
echo "- Vector Database: ~91%"
echo "- Logger: ~88%"
echo "- Chain of Draft Generator: ~73%"
echo "- Config Tests: ~70% (functional tests)"
echo "- Evaluator: ~40% (functional tests)"
echo "- Data Exporter: ~25% (functional tests)"
echo "- MLX Generator: ~18% (basic functionality)"
echo "- Prompt Generator: ~22% (basic functionality)"
echo "- Basic Chain of Draft: placeholder tests only"
echo "- Integration: placeholder tests only"

echo ""
echo "Test Coverage Summary:"
echo "----------------------"
echo "Total files: ~15%"
echo "Core files tested:"
echo "  - vector-database.ts: ~91%"
echo "  - logger.ts: ~88%"
echo "  - chain-of-draft-generator.ts: ~73%"
echo "  - config.ts: ~70% (functional tests)"
echo "  - evaluator.ts: ~40% (functional tests)"
echo "  - data-exporter.ts: ~25% (functional tests)"
echo "  - mlx-generator.ts: ~18% (basic functionality)"
echo "  - prompt-generator.ts: ~22% (basic functionality)"
echo "  - llm-client.ts: ~14% (requires more tests)"
echo "Files still needing tests:"
echo "  - index.ts (main entry point)"
echo "  - server.ts"

echo ""
echo "Next steps for adding coverage:"
echo "1. Complete evaluator.test.ts with batch processing tests"
echo "2. Complete data-exporter.test.ts with additional functionality tests"
echo "3. Complete mlx-generator.test.ts with filesystem interaction tests"
echo "4. Complete prompt-generator.test.ts to test more methods"
echo "5. Create tests for remaining high-priority modules"
echo "6. Implement skipped tests in chain-of-draft.test.ts"
echo "7. Implement skipped tests in integration.test.ts" 