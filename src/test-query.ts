import fetch from 'node-fetch';
import { logger } from './utils/logger.js';
import chalk from 'chalk';

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

// Add CoD output formatting to logger if it's not already there
if (!('codOutput' in logger)) {
  (logger as any).codOutput = {
    header: (text: string) => {
      console.log('\n' + chalk.bgBlue.white.bold(` ${text} `) + '\n');
    },
    problem: (text: string) => {
      console.log(chalk.yellow.bold('PROBLEM:'));
      console.log(chalk.yellow(text) + '\n');
    },
    steps: (text: string) => {
      console.log(chalk.cyan.bold('REASONING STEPS:'));
      console.log(chalk.cyan(text) + '\n');
    },
    answer: (text: string) => {
      console.log(chalk.green.bold('FINAL ANSWER:'));
      console.log(chalk.green(text) + '\n');
    },
    stats: (stats: any) => {
      console.log(chalk.magenta.bold('STATS:'));
      console.log(chalk.magenta(`Approach: ${stats.approach}`));
      console.log(chalk.magenta(`Word Limit: ${stats.word_limit}`));
      console.log(chalk.magenta(`Tokens Used: ${stats.token_count}`));
      console.log(chalk.magenta(`Time: ${stats.execution_time_ms}ms`));
      console.log('\n' + chalk.gray('━'.repeat(50)) + '\n');
    }
  };
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
    logger.codOutput!.header('Chain of Draft Demo');
    logger.codOutput!.problem(problem);
    logger.codOutput!.steps(data.reasoning_steps);
    logger.codOutput!.answer(data.final_answer);
    logger.codOutput!.stats({
      approach: data.approach,
      word_limit: data.stats.word_limit,
      token_count: data.stats.token_count,
      execution_time_ms: data.stats.execution_time_ms
    });

  } catch (error) {
    logger.error('Error testing Chain of Draft:', error);
  }
}

testChainOfDraft(); 