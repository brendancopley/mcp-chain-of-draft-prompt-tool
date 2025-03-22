interface AdherenceMetrics {
  totalSteps: number;
  stepsWithinLimit: number;
  averageWordsPerStep: number;
  maxWordsInAnyStep: number;
  adherenceRate: number;
  stepCounts: number[];
}
export class FormatEnforcer {
  private stepPattern: RegExp;
  constructor() {
    this.stepPattern = new RegExp(
      '(\d+\.\s*|Step\s+\d+:|\n-\s+|\n\*\s+|•\s+|^\s*-\s+|^\s*\*\s+)',
      'm'
    );
  }
  enforceWordLimit(reasoning: string, maxWordsPerStep: number): string {
    const steps = this.splitIntoSteps(reasoning);
    const enforcedSteps = steps.map(step => this.enforceStep(step, maxWordsPerStep));
    return enforcedSteps.join('\n');
  }
  private splitIntoSteps(reasoning: string): string[] {
    if (this.stepPattern.test(reasoning)) {
      const parts: string[] = [];
      let currentPart = '';
      const lines = reasoning.split('\n');
      for (const line of lines) {
        if (this.stepPattern.test(line) || /^\s*\d+\./.test(line)) {
          if (currentPart) {
            parts.push(currentPart);
          }
          currentPart = line;
        } else {
          if (currentPart) {
            currentPart += '\n' + line;
          } else {
            currentPart = line;
          }
        }
      }
      if (currentPart) {
        parts.push(currentPart);
      }
      return parts.length ? parts : [reasoning];
    } else {
      return reasoning
        .split('\n')
        .map(line => line.trim())
        .filter(Boolean);
    }
  }
  private enforceStep(step: string, maxWords: number): string {
    const words = step.split(/\s+/);
    if (words.length <= maxWords) {
      return step;
    }
    const match = step.match(/^(\d+\.\s*|Step\s+\d+:|\s*-\s+|\s*\*\s+|•\s+)/);
    const marker = match ? match[0] : '';
    const content = marker ? step.slice(marker.length).trim() : step;
    const contentWords = content.split(/\s+/);
    const truncated = contentWords.slice(0, maxWords).join(' ');
    return `${marker}${truncated}`;
  }
  analyzeAdherence(reasoning: string, maxWordsPerStep: number): AdherenceMetrics {
    const steps = this.splitIntoSteps(reasoning);
    const stepCounts = steps.map(step => {
      const match = step.match(/^(\d+\.\s*|Step\s+\d+:|\s*-\s+|\s*\*\s+|•\s+)/);
      const marker = match ? match[0] : '';
      const content = marker ? step.slice(marker.length).trim() : step;
      return content.split(/\s+/).length;
    });
    const totalSteps = steps.length;
    const stepsWithinLimit = stepCounts.filter(count => count <= maxWordsPerStep).length;
    const averageWordsPerStep = totalSteps ? stepCounts.reduce((a, b) => a + b, 0) / totalSteps : 0;
    const maxWordsInAnyStep = stepCounts.length ? Math.max(...stepCounts) : 0;
    const adherenceRate = totalSteps ? stepsWithinLimit / totalSteps : 1.0;
    return {
      totalSteps,
      stepsWithinLimit,
      averageWordsPerStep,
      maxWordsInAnyStep,
      adherenceRate,
      stepCounts,
    };
  }
  formatToNumberedSteps(reasoning: string): string {
    const steps = this.splitIntoSteps(reasoning);
    return steps
      .map((step, i) => {
        const match = step.match(/^(\d+\.\s*|Step\s+\d+:|\s*-\s+|\s*\*\s+|•\s+)/);
        const content = match ? step.slice(match[0].length).trim() : step.trim();
        return `${i + 1}. ${content}`;
      })
      .join('\n');
  }
}
