import fetch from 'node-fetch';
import { logger } from './utils/logger.js';

interface ChainOfDraftResponse {
  reasoning_steps: string;
  final_answer: string;
  approach: string;
  stats: {
    word_limit: number;
    token_count: number;
    execution_time_ms: number;
    complexity: number;
  };
}

function isChainOfDraftResponse(data: unknown): data is ChainOfDraftResponse {
  return (
    typeof data === 'object' &&
    data !== null &&
    'reasoning_steps' in data &&
    'final_answer' in data &&
    'approach' in data &&
    'stats' in data
  );
}

async function testChainOfDraft() {
  try {
    const problem = "What is the sum of the first 10 prime numbers?";
    const response = await fetch('http://localhost:3000/solve', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        problem,
        domain: 'math',
        approach: 'CoD'
      })
    });

    const rawData = await response.json();
    
    if (!isChainOfDraftResponse(rawData)) {
      throw new Error('Invalid response format from server');
    }
    
    const data: ChainOfDraftResponse = rawData;
    logger.codOutput.header('Chain of Draft Demo');
    logger.codOutput.problem(problem);
    logger.codOutput.steps(data.reasoning_steps);
    logger.codOutput.answer(data.final_answer);
    logger.codOutput.stats({
      'Approach': data.approach,
      'Word limit': data.stats.word_limit,
      'Tokens used': data.stats.token_count,
      'Execution time': `${data.stats.execution_time_ms}ms`,
      'Complexity score': data.stats.complexity
    });

  } catch (error) {
    logger.error('Error testing Chain of Draft:', error);
  }
}

testChainOfDraft(); 