import { ChainOfDraftClient } from '../client';
import { AnalyticsService } from '../analytics';
import { ComplexityEstimator } from '../complexity';
describe('ChainOfDraftClient', () => {
  let client: ChainOfDraftClient;
  beforeEach(() => {
    client = new ChainOfDraftClient();
  });
  test('should solve a simple math problem', async () => {
    const result = await client.completions('test-model', 'What is 2+2?', { domain: 'math' });
    expect(result.choices[0].text).toBeDefined();
  });
  test('should handle chat completions', async () => {
    const result = await client.chat('test-model', [{ role: 'user', content: 'What is 2+2?' }], {
      domain: 'math',
    });
    expect(result.choices[0].message.content).toBeDefined();
  });
});
describe('ComplexityEstimator', () => {
  let estimator: ComplexityEstimator;
  beforeEach(() => {
    estimator = new ComplexityEstimator();
  });
  test('should estimate problem complexity', async () => {
    const complexity = await estimator.estimateComplexity('What is 2+2?', 'math');
    expect(complexity).toBeGreaterThanOrEqual(3);
    expect(complexity).toBeLessThanOrEqual(10);
  });
});
describe('AnalyticsService', () => {
  let analytics: AnalyticsService;
  beforeEach(() => {
    analytics = new AnalyticsService('postgresql://test:test@localhost:5432/test_db');
  });
  test('should record inference', async () => {
    const id = await analytics.recordInference(
      'What is 2+2?',
      'math',
      'CoD',
      5,
      100,
      500,
      'Step 1: Add numbers',
      '4'
    );
    expect(id).toBeDefined();
  });
});
