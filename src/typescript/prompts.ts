interface Example {
  problem: string;
  reasoning: string;
  answer: string;
  domain: string;
  approach: string;
}

interface Prompt {
  system: string;
  user: string;
}

export function createCodPrompt(
  problem: string,
  domain: string,
  wordLimit: number,
  examples: Example[] = []
): Prompt {
  const systemPrompt = `You are a Chain of Draft (CoD) reasoning assistant. Break down problems into clear, concise steps.
Each step should be no more than ${wordLimit} words.
Domain: ${domain}`;

  const userPrompt = `Problem: ${problem}

${examples.length > 0 ? formatExamples(examples) : ''}
Please solve this step by step, keeping each step under ${wordLimit} words.
End with a clear final answer after "####".`;

  return {
    system: systemPrompt,
    user: userPrompt,
  };
}

export function createCotPrompt(
  problem: string,
  domain: string,
  examples: Example[] = []
): Prompt {
  const systemPrompt = `You are a Chain of Thought (CoT) reasoning assistant. Break down problems into clear steps.
Domain: ${domain}`;

  const userPrompt = `Problem: ${problem}

${examples.length > 0 ? formatExamples(examples) : ''}
Let's solve this step by step.
End with a clear final answer after "####".`;

  return {
    system: systemPrompt,
    user: userPrompt,
  };
}

function formatExamples(examples: Example[]): string {
  return examples.map(ex => 
    `Example:
Problem: ${ex.problem}
Reasoning:
${ex.reasoning}
Answer: ${ex.answer}
---`
  ).join('\n\n');
} 