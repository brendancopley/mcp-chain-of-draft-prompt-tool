import { Anthropic } from '@anthropic-ai/sdk';

export interface AnalyticsRecord {
  problem_id: string;
  problem_text: string;
  domain: string;
  approach: string;
  word_limit: number;
  tokens_used: number;
  execution_time_ms: number;
  reasoning_steps: string;
  answer: string;
  timestamp?: Date;
}

export interface PerformanceStats {
  domain: string;
  approach: string;
  avg_tokens: number;
  avg_time_ms: number;
  accuracy: number | null;
  count: number;
}

export interface TokenReductionStats {
  domain: string;
  cod_avg_tokens: number;
  cot_avg_tokens: number;
  reduction_percentage: number;
}

export interface ComplexityAnalysis {
  word_count: number;
  sentence_count: number;
  words_per_sentence: number;
  indicator_count: number;
  found_indicators: string[];
  question_count: number;
  estimated_complexity: number;
}

export interface DomainPreferences {
  complexity_threshold: number;
  accuracy_threshold: number;
}

export interface ChainOfDraftParams {
  problem: string;
  domain?: string;
  max_words_per_step?: number | null;
  approach?: string;
  enforce_format?: boolean;
  adaptive_word_limit?: boolean;
}

export interface ChainOfDraftResult {
  approach: string;
  reasoning_steps: string;
  final_answer: string;
  token_count: number;
  word_limit: number;
  complexity: number;
  execution_time_ms: number;
}

export interface AnalyticsDatabase {
  records: AnalyticsRecord[];
  addRecord(record: AnalyticsRecord): number;
  getPerformanceByDomain(domain?: string): PerformanceStats[];
  getTokenReductionStats(): TokenReductionStats[];
}

export interface ComplexityEstimator {
  domainBaseLimits: { [key: string]: number };
  complexityIndicators: { [key: string]: string[] };
  analyzeProblem(problem: string, domain: string): ComplexityAnalysis;
}

export interface FormatEnforcer {
  enforceWordLimit(reasoning: string, maxWordsPerStep: number | null): string;
  analyzeAdherence(reasoning: string, maxWordsPerStep: number): {
    step_count: number;
    total_words: number;
    avg_words_per_step: number;
    over_limit_steps: number;
    adherence_percentage: number;
  };
}

export interface ReasoningSelector {
  defaultPreferences: { [key: string]: DomainPreferences };
  selectApproach(domain: string, complexity: number, performanceStats: PerformanceStats[]): string;
}

export interface ChainOfDraftClient {
  solveWithReasoning(params: ChainOfDraftParams): Promise<ChainOfDraftResult>;
}

export interface ToolArguments {
  problem?: string;
  domain?: string;
  max_words_per_step?: number;
  approach?: string;
  enforce_format?: boolean;
  adaptive_word_limit?: boolean;
} 