#!/usr/bin/env node
/**
 * Chain of Draft Demonstration
 * 
 * This standalone script demonstrates the Chain of Draft approach for structured reasoning.
 * It includes templates for generating prompts and a mock LLM client for testing.
 */

import chalk from 'chalk';

// Templates for different problem types
const TEMPLATES = {
  math: `Solve the following math problem using Chain of Draft reasoning. 
Break down your solution into clear, logical steps with each step building on previous ones.
Keep each step concise - use at most 30 words per step.
Focus on being clear, precise and systematic.

Problem: {{problem}}

Step 1:`,
  
  logic: `Solve the following logic problem using Chain of Draft reasoning.
Break down your solution into clear, logical steps with each step building on previous ones.
Keep each step concise - use at most 30 words per step.
Focus on being clear, precise and systematic.

Problem: {{problem}}

Step 1:`,
  
  code: `Solve the following coding problem using Chain of Draft reasoning.
Break down your solution into clear, logical steps with each step building on previous ones.
Keep each step concise - use at most 40 words per step.
Start with problem understanding, proceed to algorithm design, then implementation.

Problem: {{problem}}

Step 1:`,
  
  general: `Solve the following problem using Chain of Draft reasoning.
Break down your solution into clear, logical steps with each step building on previous ones.
Keep each step concise - use at most 35 words per step.
Focus on being clear, precise and systematic.

Problem: {{problem}}

Step 1:`
};

// Detect the problem type
function detectProblemType(problem: string): "math" | "logic" | "code" | "general" {
  console.log("Detecting problem type for:", problem);
  
  // Check for code problems first since they may contain math terms
  if (problem.match(/function|algorithm|implement|program|class|method|array|string|data structure|write a code|write code/i)) {
    console.log("Detected as code problem");
    return "code";
  } 
  // Then check for math problems
  else if (problem.match(/solve for|equation|x\s*=|y\s*=|calculate|compute|find the value|derivative|integral|graph|function /i)) {
    console.log("Detected as math problem");
    return "math";
  } 
  // Then check for logic problems
  else if (problem.match(/logic|syllogism|conclusion|inference|valid|invalid|argument|if.*then|some|all|none|true|false/i)) {
    console.log("Detected as logic problem");
    return "logic";
  } 
  // Default to general
  else {
    console.log("Detected as general problem");
    return "general";
  }
}

// Generate a prompt for a problem
function generatePrompt(problem: string): { type: string, prompt: string } {
  const type = detectProblemType(problem);
  const template = TEMPLATES[type as keyof typeof TEMPLATES];
  const prompt = template.replace("{{problem}}", problem);
  
  return { type, prompt };
}

// Mock LLM response for different problem types
function mockLLMResponse(problemType: string, problem: string): string {
  if (problemType === "math") {
    return `Step 1: Identify the equation: 2x + 5 = 15.

Step 2: Subtract 5 from both sides of the equation to isolate the term with x.
2x + 5 - 5 = 15 - 5
2x = 10

Step 3: Divide both sides by 2 to solve for x.
2x ÷ 2 = 10 ÷ 2
x = 5

Therefore, x = 5 is the solution to the equation 2x + 5 = 15.`;
  } else if (problemType === "logic") {
    return `Step 1: Identify the given premises.
- All A are B
- Some B are C

Step 2: Visualize the relationships.
All A are within set B, and some members of B are also in C.

Step 3: Determine what we can conclude about A and C.
Since A is a subset of B, and some B overlap with C, it's possible that some A are C.

Step 4: Check if we can make stronger claims.
We can't claim "All A are C" or "No A are C" based on the premises.

Therefore, we can only conclude that some A may be C, but this relationship is not guaranteed.`;
  } else if (problemType === "code") {
    return `Step 1: Understand the problem.
Need to find the longest palindromic substring in a given string.

Step 2: Consider naive approach.
Check every possible substring to see if it's a palindrome. O(n³) time complexity.

Step 3: Consider better approach.
Expand around centers. Each position and between positions can be a center.

Step 4: Define helper function to expand around center.
Function takes string and indices, expands while characters match.

Step 5: Implement complete solution.
${'`'.repeat(3)}
function longestPalindrome(s: string): string {
  if (!s || s.length < 1) return "";
  let start = 0, end = 0;
  
  for (let i = 0; i < s.length; i++) {
    const len1 = expandAroundCenter(s, i, i);
    const len2 = expandAroundCenter(s, i, i+1);
    const len = Math.max(len1, len2);
    
    if (len > end - start) {
      start = i - Math.floor((len - 1) / 2);
      end = i + Math.floor(len / 2);
    }
  }
  
  return s.substring(start, end + 1);
}

function expandAroundCenter(s: string, left: number, right: number): number {
  while (left >= 0 && right < s.length && s[left] === s[right]) {
    left--;
    right++;
  }
  return right - left - 1;
}
${'`'.repeat(3)}

Time complexity: O(n²), space complexity: O(1).`;
  } else {
    return `Step 1: Understand the problem thoroughly.
The problem asks us to determine if climate change is primarily caused by human activities.

Step 2: Examine evidence for human causes.
Rising CO₂ levels correlate with human fossil fuel use since industrial revolution.

Step 3: Consider natural climate variations.
Natural cycles exist but can't explain current rapid warming rate.

Step 4: Review scientific consensus.
Over 97% of climate scientists agree human activities are the primary driver.

Step 5: Evaluate alternative explanations.
Solar activity, volcanic eruptions, and orbital changes have been ruled out as primary causes.

Therefore, the evidence strongly supports that climate change is primarily caused by human activities, particularly greenhouse gas emissions.`;
  }
}

// Format output with colors
function formatOutput(type: string, problem: string, response: string) {
  console.log('\n' + chalk.bgBlue.white.bold(` Chain of Draft Demo `) + '\n');
  
  console.log(chalk.yellow.bold('PROBLEM:'));
  console.log(chalk.yellow(problem) + '\n');
  
  console.log(chalk.cyan.bold('PROBLEM TYPE:'));
  console.log(chalk.cyan(type) + '\n');
  
  console.log(chalk.green.bold('CHAIN OF DRAFT RESPONSE:'));
  console.log(chalk.green(response) + '\n');
  
  console.log(chalk.gray('━'.repeat(50)) + '\n');
}

// Main function
async function main() {
  // Get problem from command line args or use default
  const problem = process.argv.slice(2).join(' ') || 'Solve for x: 2x + 5 = 15';
  
  // Generate prompt
  console.log(chalk.blue('Generating Chain of Draft prompt...'));
  const { type, prompt } = generatePrompt(problem);
  
  // Get response
  console.log(chalk.blue(`Detected problem type: ${type}`));
  console.log(chalk.blue('Generating response...'));
  const response = mockLLMResponse(type, problem);
  
  // Format output
  formatOutput(type, problem, response);
}

// Run the main function
main().catch(error => console.error('Error:', error)); 