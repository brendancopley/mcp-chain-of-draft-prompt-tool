import { PrismaClient } from '@prisma/client';
// interface InferenceRecord {
//   id: number;
//   timestamp: Date;
//   problemId: string;
//   problemText: string;
//   domain: string;
//   approach: string;
//   wordLimit: number;
//   tokensUsed: number;
//   executionTimeMs: number;
//   reasoningSteps: string;
//   answer: string;
//   expectedAnswer?: string;
//   isCorrect?: number;
//   metaData?: any;
// }
interface PerformanceStats {
  domain: string;
  approach: string;
  avgTokens: number;
  avgTimeMs: number;
  accuracy: number | null;
  count: number;
}
interface TokenReductionStats {
  domain: string;
  codAvgTokens: number;
  cotAvgTokens: number;
  reductionPercentage: number;
}
interface AccuracyComparison {
  domain: string;
  codAccuracy: number | null;
  cotAccuracy: number | null;
  accuracyDifference: number | null;
}
export class AnalyticsService {
  private prisma: PrismaClient;
  constructor(dbUrl?: string) {
    this.prisma = new PrismaClient({
      datasources: {
        db: { url: dbUrl || process.env.COD_DB_URL || 'postgresql://localhost:5432/cod_analytics' },
      },
    });
  }
  async recordInference(
    problem: string,
    domain: string,
    approach: string,
    wordLimit: number,
    tokensUsed: number,
    executionTime: number,
    reasoning: string,
    answer: string,
    expectedAnswer?: string,
    metadata?: any
  ): Promise<number> {
    const problemId = Math.abs(
      problem.split('').reduce((acc, char) => {
        return (acc * 31 + char.charCodeAt(0)) >>> 0;
      }, 0) %
        10 ** 10
    ).toString();
    const record = await this.prisma.inferenceRecord.create({
      data: {
        problemId,
        problemText: problem,
        domain,
        approach,
        wordLimit,
        tokensUsed,
        executionTimeMs: executionTime,
        reasoningSteps: reasoning,
        answer,
        expectedAnswer,
        isCorrect: expectedAnswer ? this.checkCorrectness(answer, expectedAnswer) : null,
        metaData: metadata,
      },
    });
    return record.id;
  }
  private checkCorrectness(answer: string, expectedAnswer: string): number | null {
    if (!answer || !expectedAnswer) {
      return null;
    }
    return answer.trim().toLowerCase() === expectedAnswer.trim().toLowerCase() ? 1 : 0;
  }
  async getPerformanceByDomain(domain?: string): Promise<PerformanceStats[]> {
    const records = await this.prisma.inferenceRecord.groupBy({
      by: ['domain', 'approach'],
      _avg: { tokensUsed: true, executionTimeMs: true, isCorrect: true },
      _count: { id: true },
      where: domain ? { domain } : undefined,
    });
    return records.map(r => ({
      domain: r.domain,
      approach: r.approach,
      avgTokens: r._avg.tokensUsed || 0,
      avgTimeMs: r._avg.executionTimeMs || 0,
      accuracy: r._avg.isCorrect,
      count: r._count.id,
    }));
  }
  async getTokenReductionStats(): Promise<TokenReductionStats[]> {
    const domains = await this.prisma.inferenceRecord.findMany({
      distinct: ['domain'],
      select: { domain: true },
    });
    const results: TokenReductionStats[] = [];
    for (const { domain } of domains) {
      const [codAvg, cotAvg] = await Promise.all([
        this.prisma.inferenceRecord.aggregate({
          where: { domain, approach: 'CoD' },
          _avg: { tokensUsed: true },
        }),
        this.prisma.inferenceRecord.aggregate({
          where: { domain, approach: 'CoT' },
          _avg: { tokensUsed: true },
        }),
      ]);
      const codAvgTokens = codAvg._avg.tokensUsed || 0;
      const cotAvgTokens = cotAvg._avg.tokensUsed || 0;
      const reductionPercentage = cotAvgTokens > 0 ? (1 - codAvgTokens / cotAvgTokens) * 100 : 0;
      results.push({ domain, codAvgTokens, cotAvgTokens, reductionPercentage });
    }
    return results;
  }
  async getAccuracyComparison(): Promise<AccuracyComparison[]> {
    const domains = await this.prisma.inferenceRecord.findMany({
      distinct: ['domain'],
      select: { domain: true },
    });
    const results: AccuracyComparison[] = [];
    for (const { domain } of domains) {
      const [codAccuracy, cotAccuracy] = await Promise.all([
        this.prisma.inferenceRecord.aggregate({
          where: { domain, approach: 'CoD', isCorrect: { not: null } },
          _avg: { isCorrect: true },
        }),
        this.prisma.inferenceRecord.aggregate({
          where: { domain, approach: 'CoT', isCorrect: { not: null } },
          _avg: { isCorrect: true },
        }),
      ]);
      const codAcc = codAccuracy._avg.isCorrect;
      const cotAcc = cotAccuracy._avg.isCorrect;
      results.push({
        domain,
        codAccuracy: codAcc,
        cotAccuracy: cotAcc,
        accuracyDifference: codAcc !== null && cotAcc !== null ? codAcc - cotAcc : null,
      });
    }
    return results;
  }
}
