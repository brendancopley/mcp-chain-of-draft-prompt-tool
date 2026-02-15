interface DomainBaseLimits {
  [key: string]: number;
}
interface ComplexityIndicators {
  [key: string]: string[];
}
interface ProblemAnalysis {
  domain: string;
  baseLimit: number;
  wordCount: number;
  lengthFactor: number;
  indicatorCount: number;
  foundIndicators: string[];
  indicatorFactor: number;
  questionCount: number;
  questionFactor: number;
  sentenceCount: number;
  wordsPerSentence: number;
  sentenceComplexityFactor: number;
  estimatedComplexity: number;
}
export class ComplexityEstimator {
  private domainBaseLimits: DomainBaseLimits = {
    math: 6,
    logic: 5,
    common_sense: 4,
    physics: 7,
    chemistry: 6,
    biology: 5,
    code: 8,
    puzzle: 5,
    general: 5,
  };
  private complexityIndicators: ComplexityIndicators = {
    math: [
      'integral',
      'derivative',
      'equation',
      'proof',
      'theorem',
      'calculus',
      'matrix',
      'vector',
      'linear algebra',
      'probability',
      'statistics',
      'geometric series',
      'differential',
      'polynomial',
      'factorial',
    ],
    logic: [
      'if and only if',
      'necessary condition',
      'sufficient',
      'contradiction',
      'syllogism',
      'premise',
      'fallacy',
      'converse',
      'counterexample',
      'logical equivalence',
      'negation',
      'disjunction',
      'conjunction',
    ],
    code: [
      'recursion',
      'algorithm',
      'complexity',
      'optimization',
      'function',
      'class',
      'object',
      'inheritance',
      'polymorphism',
      'data structure',
      'binary tree',
      'hash table',
      'graph',
      'dynamic programming',
    ],
    physics: [
      'quantum',
      'relativity',
      'momentum',
      'force',
      'acceleration',
      'energy',
      'thermodynamics',
      'electric field',
      'magnetic field',
      'potential',
      'entropy',
      'wavelength',
      'frequency',
    ],
    chemistry: [
      'reaction',
      'molecule',
      'compound',
      'element',
      'equilibrium',
      'acid',
      'base',
      'oxidation',
      'reduction',
      'catalyst',
      'isomer',
    ],
    biology: [
      'gene',
      'protein',
      'enzyme',
      'cell',
      'tissue',
      'organ',
      'system',
      'metabolism',
      'photosynthesis',
      'respiration',
      'homeostasis',
    ],
    puzzle: [
      'constraint',
      'sequence',
      'pattern',
      'rules',
      'probability',
      'combination',
      'permutation',
      'optimal',
      'strategy',
    ],
  };
  async estimateComplexity(problem: string, domain: string = 'general'): Promise<number> {
    const baseLimit = this.domainBaseLimits[domain.toLowerCase()] || 5;
    const lengthFactor = Math.min(problem.split(' ').length / 50, 2);
    let indicatorCount = 0;
    const indicators = this.complexityIndicators[domain.toLowerCase()] || [];
    for (const indicator of indicators) {
      if (problem.toLowerCase().includes(indicator.toLowerCase())) {
        indicatorCount++;
      }
    }
    const indicatorFactor = Math.min(1 + indicatorCount * 0.2, 1.8);
    const questionFactor = 1 + (problem.split('?').length - 1) * 0.2;
    const sentences = problem.split('.').filter(s => s.trim());
    const wordsPerSentence = problem.split(' ').length / Math.max(sentences.length, 1);
    const sentenceComplexityFactor = Math.min(wordsPerSentence / 15, 1.5);
    let domainFactor = 1.0;
    if (
      domain.toLowerCase() === 'math' &&
      ['prove', 'proof', 'theorem'].some(term => problem.toLowerCase().includes(term))
    ) {
      domainFactor = 1.3;
    } else if (
      domain.toLowerCase() === 'code' &&
      ['implement', 'function', 'algorithm'].some(term => problem.toLowerCase().includes(term))
    ) {
      domainFactor = 1.2;
    }
    const impactFactor = Math.max(
      lengthFactor,
      indicatorFactor,
      questionFactor,
      sentenceComplexityFactor,
      domainFactor
    );
    const adjustedLimit = Math.round(baseLimit * impactFactor);
    return Math.max(3, Math.min(adjustedLimit, 10));
  }
  analyzeProblem(problem: string, domain: string = 'general'): ProblemAnalysis {
    const baseLimit = this.domainBaseLimits[domain.toLowerCase()] || 5;
    const wordCount = problem.split(' ').length;
    const lengthFactor = Math.min(wordCount / 50, 2);
    const indicators = this.complexityIndicators[domain.toLowerCase()] || [];
    const foundIndicators = indicators.filter(ind =>
      problem.toLowerCase().includes(ind.toLowerCase())
    );
    const indicatorCount = foundIndicators.length;
    const indicatorFactor = Math.min(1 + indicatorCount * 0.2, 1.8);
    const questionCount = problem.split('?').length - 1;
    const questionFactor = 1 + questionCount * 0.2;
    const sentences = problem.split('.').filter(s => s.trim());
    const wordsPerSentence = wordCount / Math.max(sentences.length, 1);
    const sentenceComplexityFactor = Math.min(wordsPerSentence / 15, 1.5);
    return {
      domain,
      baseLimit,
      wordCount,
      lengthFactor,
      indicatorCount,
      foundIndicators,
      indicatorFactor,
      questionCount,
      questionFactor,
      sentenceCount: sentences.length,
      wordsPerSentence,
      sentenceComplexityFactor,
      estimatedComplexity: Math.max(
        3,
        Math.min(
          Math.round(
            baseLimit *
              Math.max(lengthFactor, indicatorFactor, questionFactor, sentenceComplexityFactor)
          ),
          10
        )
      ),
    };
  }
}
