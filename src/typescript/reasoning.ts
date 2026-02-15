import { ComplexityEstimator } from './complexity';
import { AnalyticsService } from './analytics';
interface DomainPreferences {
  complexityThreshold: number;
  accuracyThreshold: number;
}
interface Preferences {
  [key: string]: DomainPreferences;
}
export class ReasoningSelector {
  private analytics: AnalyticsService;
  private defaultPreferences: Preferences = {
    math: { complexityThreshold: 7, accuracyThreshold: 0.85 },
    code: { complexityThreshold: 8, accuracyThreshold: 0.9 },
    physics: { complexityThreshold: 7, accuracyThreshold: 0.85 },
    chemistry: { complexityThreshold: 7, accuracyThreshold: 0.85 },
    biology: { complexityThreshold: 6, accuracyThreshold: 0.85 },
    logic: { complexityThreshold: 6, accuracyThreshold: 0.9 },
    puzzle: { complexityThreshold: 7, accuracyThreshold: 0.85 },
    default: { complexityThreshold: 6, accuracyThreshold: 0.8 },
  };
  constructor(analyticsService: AnalyticsService) {
    this.analytics = analyticsService;
  }
  async selectApproach(
    problem: string,
    domain: string,
    complexityScore?: number
  ): Promise<[string, string]> {
    const prefs = this.defaultPreferences[domain.toLowerCase()] || this.defaultPreferences.default;
    if (complexityScore === undefined) {
      const estimator = new ComplexityEstimator();
      complexityScore = await estimator.estimateComplexity(problem, domain);
    }
    if (complexityScore > prefs.complexityThreshold) {
      return [
        'CoT',
        `Problem complexity (${complexityScore}) exceeds threshold (${prefs.complexityThreshold})`,
      ];
    }
    const domainPerformance = await this.analytics.getPerformanceByDomain(domain);
    const codAccuracy = domainPerformance.find(p => p.approach === 'CoD')?.accuracy || null;
    if (codAccuracy !== null && codAccuracy < prefs.accuracyThreshold) {
      return [
        'CoT',
        `Historical accuracy with CoD (${codAccuracy.toFixed(2)}) below threshold (${prefs.accuracyThreshold})`,
      ];
    }
    return ['CoD', 'Default to Chain-of-Draft for efficiency'];
  }
  updatePreferences(
    domain: string,
    complexityThreshold?: number,
    accuracyThreshold?: number
  ): void {
    if (!(domain in this.defaultPreferences)) {
      this.defaultPreferences[domain] = { ...this.defaultPreferences.default };
    }
    if (complexityThreshold !== undefined) {
      this.defaultPreferences[domain].complexityThreshold = complexityThreshold;
    }
    if (accuracyThreshold !== undefined) {
      this.defaultPreferences[domain].accuracyThreshold = accuracyThreshold;
    }
  }
  getPreferences(domain?: string): DomainPreferences | Preferences {
    return domain
      ? this.defaultPreferences[domain] || this.defaultPreferences.default
      : this.defaultPreferences;
  }
}
interface Example {
  problem: string;
  reasoning: string;
  answer: string;
}
export function createCodPrompt(
  problem: string,
  domain: string,
  maxWordsPerStep: number,
  examples?: Example[]
): { system: string; user: string } {
  let systemPrompt = `You are an expert problem solver using Chain of Draft reasoning. Think step by step, but only keep a minimum draft for each thinking step, with ${maxWordsPerStep} words at most per step. Return the answer at the end after "####".`;
  if (domain.toLowerCase() === 'math') {
    systemPrompt += '\nUse mathematical notation to keep steps concise.';
  } else if (domain.toLowerCase() === 'code') {
    systemPrompt += '\nUse pseudocode or short code snippets when appropriate.';
  } else if (domain.toLowerCase() === 'physics') {
    systemPrompt += '\nUse equations and physical quantities with units.';
  }
  let exampleText = '';
  if (examples) {
    for (const example of examples) {
      exampleText += `\nProblem: ${example.problem}\nSolution:\n${example.reasoning}\n####\n${example.answer}\n`;
    }
  }
  const userPrompt = `Problem: ${problem}`;
  return { system: systemPrompt, user: exampleText ? `${exampleText}\n${userPrompt}` : userPrompt };
}
export function createCotPrompt(
  problem: string,
  domain: string,
  examples?: Example[]
): { system: string; user: string } {
  let systemPrompt = `Think step by step to answer the following question. Return the answer at the end of the response after a separator ####.`;
  if (domain.toLowerCase() === 'math') {
    systemPrompt += '\nMake sure to show all mathematical operations clearly.';
  } else if (domain.toLowerCase() === 'code') {
    systemPrompt += '\nBe detailed about algorithms and implementation steps.';
  } else if (domain.toLowerCase() === 'physics') {
    systemPrompt += '\nExplain physical principles and equations in detail.';
  }
  let exampleText = '';
  if (examples) {
    for (const example of examples) {
      exampleText += `\nProblem: ${example.problem}\nSolution:\n${example.reasoning}\n####\n${example.answer}\n`;
    }
  }
  const userPrompt = `Problem: ${problem}`;
  return { system: systemPrompt, user: exampleText ? `${exampleText}\n${userPrompt}` : userPrompt };
}
