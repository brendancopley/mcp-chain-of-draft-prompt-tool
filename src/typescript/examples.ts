import { PrismaClient } from '@prisma/client';
interface Example {
  id: number;
  problem: string;
  reasoning: string;
  answer: string;
  domain: string;
  approach: string;
  metaData?: any;
}
interface ExampleCount {
  domain: string;
  approach: string;
  count: number;
}
export class ExampleDatabase {
  private prisma: PrismaClient;
  constructor(dbPath?: string) {
    this.prisma = new PrismaClient({
      datasources: {
        db: {
          url: dbPath || process.env.COD_EXAMPLES_DB || 'postgresql://localhost:5432/cod_examples',
        },
      },
    });
    this.ensureExamplesExist();
  }
  private async ensureExamplesExist(): Promise<void> {
    const count = await this.prisma.example.count();
    if (count === 0) {
      await this.loadInitialExamples();
    }
  }
  private async loadInitialExamples(): Promise<void> {
    const examples = [
      {
        problem:
          'Jason had 20 lollipops. He gave Denny some lollipops. Now Jason has 12 lollipops. How many lollipops did Jason give to Denny?',
        reasoning:
          "Let'\s think through this step by step:\n1. Initially, Jason had 20 lollipops.\n2. After giving some to Denny, Jason now has 12 lollipops.\n3. To find out how many lollipops Jason gave to Denny, we need to calculate the difference between the initial number of lollipops and the remaining number.\n4. We can set up a simple subtraction problem: Initial number of lollipops - Remaining number of lollipops = Lollipops given to Denny\n5. Putting in the numbers: 20 - 12 = Lollipops given to Denny\n6. Solving the subtraction: 20 - 12 = 8",
        answer: '8 lollipops',
        domain: 'math',
        approach: 'CoT',
      },
      {
        problem:
          'Jason had 20 lollipops. He gave Denny some lollipops. Now Jason has 12 lollipops. How many lollipops did Jason give to Denny?',
        reasoning: 'Initial: 20 lollipops\nRemaining: 12 lollipops\nGave away: 20-12=8 lollipops',
        answer: '8 lollipops',
        domain: 'math',
        approach: 'CoD',
      },
      {
        problem:
          'A coin is heads up. John flips the coin. Mary flips the coin. Paul flips the coin. Susan does not flip the coin. Is the coin still heads up?',
        reasoning:
          "Let'\s track the state of the coin through each flip:\n1. Initially, the coin is heads up.\n2. John flips the coin, so it changes from heads to tails.\n3. Mary flips the coin, so it changes from tails to heads.\n4. Paul flips the coin, so it changes from heads to tails.\n5. Susan does not flip the coin, so it remains tails.\nTherefore, the coin is tails up, which means it is not still heads up.",
        answer: 'No',
        domain: 'logic',
        approach: 'CoT',
      },
      {
        problem:
          'A coin is heads up. John flips the coin. Mary flips the coin. Paul flips the coin. Susan does not flip the coin. Is the coin still heads up?',
        reasoning: 'H→J flips→T\nT→M flips→H\nH→P flips→T\nT→S no flip→T\nFinal: tails',
        answer: 'No',
        domain: 'logic',
        approach: 'CoD',
      },
      {
        problem:
          'A car accelerates from 0 to 60 mph in 5 seconds. What is its acceleration in mph/s?',
        reasoning:
          "Let'\s solve this problem step by step:\n1. We know the initial velocity is 0 mph.\n2. The final velocity is 60 mph.\n3. The time taken is 5 seconds.\n4. Acceleration is the rate of change of velocity with respect to time.\n5. Using the formula: acceleration = (final velocity - initial velocity) / time\n6. Substituting the values: acceleration = (60 mph - 0 mph) / 5 seconds\n7. Simplifying: acceleration = 60 mph / 5 seconds = 12 mph/s",
        answer: '12 mph/s',
        domain: 'physics',
        approach: 'CoT',
      },
      {
        problem:
          'A car accelerates from 0 to 60 mph in 5 seconds. What is its acceleration in mph/s?',
        reasoning: 'a = Δv/Δt\na = (60-0)/5\na = 12 mph/s',
        answer: '12 mph/s',
        domain: 'physics',
        approach: 'CoD',
      },
    ];
    await this.prisma.example.createMany({ data: examples });
  }
  async getExamples(
    domain: string,
    approach: string = 'CoD',
    limit: number = 3
  ): Promise<Example[]> {
    const examples = await this.prisma.example.findMany({
      where: { domain, approach },
      take: limit,
    });
    return examples.map(ex => ({
      id: ex.id,
      problem: ex.problem,
      reasoning: ex.reasoning,
      answer: ex.answer,
      domain: ex.domain,
      approach: ex.approach,
    }));
  }
  async addExample(
    problem: string,
    reasoning: string,
    answer: string,
    domain: string,
    approach: string = 'CoD',
    metadata?: any
  ): Promise<number> {
    const example = await this.prisma.example.create({
      data: { problem, reasoning, answer, domain, approach, metaData: metadata },
    });
    return example.id;
  }
  async transformCotToCod(cotExample: Example, maxWordsPerStep: number = 5): Promise<Example> {
    const steps = this.extractReasoningSteps(cotExample.reasoning);
    const codSteps = steps.map(step => this.summarizeStep(step, maxWordsPerStep));
    return { ...cotExample, reasoning: codSteps.join('\n'), approach: 'CoD' };
  }
  private extractReasoningSteps(reasoning: string): string[] {
    if (/\d+\./.test(reasoning)) {
      return reasoning
        .split(/\d+\./)
        .filter(s => s.trim())
        .map(s => s.trim());
    } else {
      return reasoning.split('\n').filter(s => s.trim());
    }
  }
  private summarizeStep(step: string, maxWords: number): string {
    const words = step.split(/\s+/);
    return words.length <= maxWords ? step : words.slice(0, maxWords).join(' ');
  }
  async getExampleCountByDomain(): Promise<ExampleCount[]> {
    const results = await this.prisma.example.groupBy({
      by: ['domain', 'approach'],
      _count: { id: true },
    });
    return results.map(r => ({ domain: r.domain, approach: r.approach, count: r._count.id }));
  }
}
