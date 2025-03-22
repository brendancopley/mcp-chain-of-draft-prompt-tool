import fetch from 'node-fetch';

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

function isChainOfDraftResponse(obj: any): obj is ChainOfDraftResponse {
  return (
    typeof obj === 'object' &&
    typeof obj.reasoning_steps === 'string' &&
    typeof obj.final_answer === 'string' &&
    typeof obj.approach === 'string' &&
    typeof obj.stats === 'object' &&
    typeof obj.stats.word_limit === 'number' &&
    typeof obj.stats.token_count === 'number' &&
    typeof obj.stats.execution_time_ms === 'number' &&
    typeof obj.stats.complexity === 'number'
  );
}

async function testChainOfDraft(): Promise<void> {
  const problem = "What is the sum of the first 50 even numbers?";
  
  try {
    const response = await fetch('http://localhost:3000/math', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        problem: problem,
        approach: 'CoD',  // Force Chain of Draft approach
        max_words_per_step: 6  // Set strict word limit
      })
    });
    
    const rawData = await response.json();
    
    if (!isChainOfDraftResponse(rawData)) {
      throw new Error('Invalid response format from server');
    }
    
    const data: ChainOfDraftResponse = rawData;
    console.log("=== Chain of Draft Demo ===");
    console.log(`Problem: ${problem}`);
    console.log("\nReasoning Steps:");
    console.log(data.reasoning_steps);
    console.log(`\nFinal Answer: ${data.final_answer}`);
    console.log("\nStats:");
    console.log(`- Approach: ${data.approach}`);
    console.log(`- Word limit: ${data.stats.word_limit}`);
    console.log(`- Tokens used: ${data.stats.token_count}`);
    console.log(`- Execution time: ${data.stats.execution_time_ms}ms`);
    console.log(`- Complexity score: ${data.stats.complexity}`);
  } catch (error) {
    console.error("Error testing Chain of Draft:", error);
  }
}

testChainOfDraft(); 