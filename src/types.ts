import { Anthropic } from '@anthropic-ai/sdk';
import OpenAI from 'openai';

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

// Basic message and response types
export interface LLMMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface LLMResponse {
  content: string;
  usage?: {
    input_tokens: number;
    output_tokens: number;
  };
}

// GRPO Core Types
export interface PromptTemplate {
  id: string;
  template: string;
  category: string;
  reasoning_type: string;
  complexity: number;
  parameters: PromptParameter[];
  examples?: string[];
  performance_score?: number;
  created_at: Date;
  updated_at: Date;
}

export interface PromptParameter {
  name: string;
  type: 'string' | 'number' | 'boolean';
  description: string;
  default_value?: string | number | boolean;
}

export interface GeneratedPrompt {
  id: string;
  template_id: string;
  content: string;
  parameters: Record<string, any>;
  vector_embedding?: number[];
  created_at: Date;
}

export interface GeneratedResponse {
  id: string;
  prompt_id: string;
  content: string;
  model: string;
  model_parameters: ModelParameters;
  vector_embedding?: number[];
  tokens_used: number;
  generation_time_ms: number;
  evaluation_score?: number;
  evaluation_details?: EvaluationDetails;
  created_at: Date;
}

// MLX Model Types
export interface ModelParameters {
  temperature: number;
  top_p: number;
  top_k?: number;
  max_tokens: number;
  stop_sequences?: string[];
  frequency_penalty?: number;
  presence_penalty?: number;
}

export interface MLXModelConfig {
  model_path: string;
  lora_path?: string;
  quantized: boolean;
  model_type: 'llama' | 'mistral' | 'deepseek' | 'gemma' | 'other';
}

export interface MLXGenerationResult {
  text: string;
  tokens_generated: number;
  generation_time_ms: number;
}

// Evaluation Types
export interface EvaluationDetails {
  reasoning_score: number;
  factual_score: number;
  relevance_score: number;
  combined_score: number;
  evaluator_model: string;
  evaluator_feedback: string;
  evaluation_time_ms: number;
  created_at: Date;
}

export interface EvaluationRequest {
  prompt: string;
  response: string;
  reference_answer?: string;
  evaluator_model: string;
  evaluation_criteria: EvaluationCriteria;
}

export interface EvaluationCriteria {
  reasoning_weight: number;
  factual_weight: number;
  relevance_weight: number;
  custom_criteria?: Record<string, number>;
}

// Vector Database Types
export interface VectorDatabaseConfig {
  type: 'postgres' | 'chromadb';
  connection_string?: string;
  path?: string;
}

export interface VectorSearchResult {
  id: string;
  content: string;
  similarity: number;
  metadata: Record<string, any>;
}

export interface VectorSearchParams {
  query_vector: number[];
  limit: number;
  min_similarity?: number;
  filter?: Record<string, any>;
}

// Data Export Types
export interface ExportConfig {
  format: 'jsonl' | 'csv' | 'parquet';
  path: string;
  filter?: Record<string, any>;
  include_evaluation?: boolean;
  include_metadata?: boolean;
}

export interface ExportResult {
  file_path: string;
  record_count: number;
  file_size_bytes: number;
  format: string;
  created_at: Date;
}

// Batch Processing Types
export interface BatchProcessingConfig {
  batch_size: number;
  parallel_processing: boolean;
  max_concurrent: number;
}

export interface BatchProcessingStats {
  total_items: number;
  processed_items: number;
  successful_items: number;
  failed_items: number;
  start_time: Date;
  end_time?: Date;
  average_item_time_ms: number;
}

// GRPO Analytics Types
export interface PromptPerformanceAnalytics {
  template_id: string;
  average_evaluation_score: number;
  generation_count: number;
  parameter_influence: Record<string, number>;
  trend_over_time: Array<{date: Date, score: number}>;
}

export interface ModelPerformanceAnalytics {
  model_id: string;
  average_evaluation_score: number;
  generation_count: number;
  tokens_per_response: number;
  generation_time_ms: number;
  performance_by_prompt_category: Record<string, number>;
}

// Training Types
export interface TrainingConfig {
  model_id: string;
  dataset_path: string;
  output_dir: string;
  lora_rank: number;
  batch_size: number;
  learning_rate: number;
  epochs: number;
  warmup_steps: number;
  save_steps: number;
  eval_steps: number;
}

export interface TrainingResult {
  model_id: string;
  adapter_path: string;
  training_loss: number;
  eval_loss: number;
  training_time_ms: number;
  dataset_size: number;
  epochs_completed: number;
  steps_completed: number;
}

// Command line tool arguments
export interface GRPOToolArguments {
  prompt?: string;
  prompt_template_id?: string;
  model?: string;
  output_format?: string;
  num_samples?: number;
  evaluation?: boolean;
  export?: boolean;
  export_path?: string;
  train?: boolean;
  training_config?: string;
} 