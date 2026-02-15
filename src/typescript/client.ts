import { Anthropic } from '@anthropic-ai/sdk';
import { OpenAI } from 'openai';
import MistralClient from '@mistralai/mistralai';
import dotenv from 'dotenv';
import { AnalyticsService } from './analytics';
import { ComplexityEstimator } from './complexity';
import { ExampleDatabase } from './examples';
import { FormatEnforcer } from './format';
import { ReasoningSelector } from './reasoning';
import { createCodPrompt, createCotPrompt } from './prompts';
import { logger } from '../utils/logger';

interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

dotenv.config();
interface ClientSettings {
  maxWordsPerStep: number;
  enforceFormat: boolean;
  adaptiveWordLimit: boolean;
  trackAnalytics: boolean;
  maxTokens: number;
  model?: string;
}
interface ChatResponse {
  content: string;
  usage: { inputTokens: number; outputTokens: number };
}
class UnifiedLLMClient {
  private provider: string;
  private model: string;
  private client: any;
  constructor() {
    this.provider = process.env.LLM_PROVIDER?.toLowerCase() || 'anthropic';
    this.model = process.env.LLM_MODEL || 'claude-3-sonnet-20240229';
    if (this.provider === 'anthropic') {
      if (!process.env.ANTHROPIC_API_KEY) {
        throw new Error('ANTHROPIC_API_KEY is required for Anthropic provider');
      }
      this.client = new Anthropic({
        apiKey: process.env.ANTHROPIC_API_KEY,
        baseURL: process.env.ANTHROPIC_BASE_URL,
      });
    } else if (this.provider === 'openai') {
      if (!process.env.OPENAI_API_KEY) {
        throw new Error('OPENAI_API_KEY is required for OpenAI provider');
      }
      this.client = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
        baseURL: process.env.OPENAI_BASE_URL,
      });
    } else if (this.provider === 'mistral') {
      if (!process.env.MISTRAL_API_KEY) {
        throw new Error('MISTRAL_API_KEY is required for Mistral provider');
      }
      this.client = new MistralClient(process.env.MISTRAL_API_KEY);
    } else if (this.provider === 'ollama') {
      this.client = { baseURL: process.env.OLLAMA_BASE_URL || 'http://localhost:11434' };
    } else {
      throw new Error(`Unsupported LLM provider: ${this.provider}`);
    }
  }
  async getAvailableModels(): Promise<string[]> {
    try {
      if (this.provider === 'anthropic') {
        const response = await this.client.models.list();
        return response.data.map((model: any) => model.id);
      } else if (this.provider === 'openai') {
        const response = await this.client.models.list();
        return response.data.map((model: any) => model.id);
      } else if (this.provider === 'mistral') {
        const response = await this.client.listModels();
        return response.data?.map((model: any) => model.id) || [];
      } else if (this.provider === 'ollama') {
        const response = await fetch(`${this.client.baseURL}/api/tags`);
        const data = await response.json();
        return data.models.map((model: any) => model.name);
      }
      return [];
    } catch (e) {
      logger.error('Error fetching models:', e);
      return [];
    }
  }
  async chat(
    messages: ChatMessage[],
    model?: string,
    maxTokens?: number,
    temperature?: number
  ): Promise<ChatResponse> {
    model = model || this.model;
    try {
      if (this.provider === 'anthropic') {
        const response = await this.client.messages.create({
          model,
          messages: messages.map(msg => ({ role: msg.role, content: msg.content })),
          max_tokens: maxTokens,
          temperature,
        });
        return {
          content: response.content[0].text,
          usage: {
            inputTokens: response.usage.input_tokens,
            outputTokens: response.usage.output_tokens,
          },
        };
      } else if (this.provider === 'openai') {
        const response = await this.client.chat.completions.create({
          model,
          messages,
          max_tokens: maxTokens,
          temperature,
        });
        return {
          content: response.choices[0].message.content,
          usage: {
            inputTokens: response.usage.prompt_tokens,
            outputTokens: response.usage.completion_tokens,
          },
        };
      } else if (this.provider === 'mistral') {
        const response = await this.client.chat({
          model,
          messages: messages.map(msg => ({ role: msg.role, content: msg.content })),
          max_tokens: maxTokens,
          temperature,
        });
        return {
          content: response.choices[0].message.content,
          usage: {
            inputTokens: response.usage.prompt_tokens,
            outputTokens: response.usage.completion_tokens,
          },
        };
      } else if (this.provider === 'ollama') {
        const response = await fetch(`${this.client.baseURL}/api/chat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model,
            messages,
            options: { num_predict: maxTokens, temperature },
          }),
        });
        const data = await response.json();
        return { content: data.message.content, usage: { inputTokens: 0, outputTokens: 0 } };
      }
      throw new Error(`Unsupported provider: ${this.provider}`);
    } catch (e) {
      logger.error('Error in chat:', e);
      throw e;
    }
  }
}
export class ChainOfDraftClient {
  private llmClient: UnifiedLLMClient;
  private analytics: AnalyticsService;
  private complexityEstimator: ComplexityEstimator;
  private exampleDb: ExampleDatabase;
  private formatEnforcer: FormatEnforcer;
  private reasoningSelector: ReasoningSelector;
  private settings: ClientSettings;
  constructor(apiKey?: string, baseUrl?: string, settings: Partial<ClientSettings> = {}) {
    this.llmClient = new UnifiedLLMClient();
    this.analytics = new AnalyticsService();
    this.complexityEstimator = new ComplexityEstimator();
    this.exampleDb = new ExampleDatabase();
    this.formatEnforcer = new FormatEnforcer();
    this.reasoningSelector = new ReasoningSelector(this.analytics);
    this.settings = {
      maxWordsPerStep: 8,
      enforceFormat: true,
      adaptiveWordLimit: true,
      trackAnalytics: true,
      maxTokens: 200000,
      ...settings,
    };
  }
  async completions(model?: string, prompt?: string, options: any = {}): Promise<any> {
    if (!prompt) {
      throw new Error('Prompt is required');
    }
    const problem = prompt;
    const domain = options.domain || 'general';
    const result = await this.solveWithReasoning(problem, domain, {
      model: model || this.settings.model,
      ...options,
    });
    return {
      id: `cod-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      object: 'completion',
      created: Date.now(),
      model: model || this.settings.model,
      choices: [{ text: result.answer, index: 0, logprobs: null, finish_reason: 'stop' }],
      usage: result.usage,
    };
  }
  async chat(model?: string, messages?: ChatMessage[], options: any = {}): Promise<any> {
    if (!messages || !messages.length) {
      throw new Error('Messages are required');
    }
    const lastMessage = messages[messages.length - 1];
    const problem = lastMessage.content;
    const domain = options.domain || 'general';
    const result = await this.solveWithReasoning(problem, domain, {
      model: model || this.settings.model,
      ...options,
    });
    
    // Format messages for Mistral without using Message class
    const formattedMessages = messages.map(msg => ({
      role: msg.role,
      content: msg.content,
    }));
    
    return {
      id: `cod-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      object: 'chat.completion',
      created: Date.now(),
      model: model || this.settings.model,
      choices: [{ message: { role: 'assistant', content: result.answer }, finish_reason: 'stop' }],
      usage: result.usage,
    };
  }
  async solveWithReasoning(
    problem: string,
    domain: string = 'general',
    options: any = {}
  ): Promise<any> {
    const startTime = Date.now();
    const [approach, reason] = await this.reasoningSelector.selectApproach(problem, domain);
    const wordLimit = this.settings.adaptiveWordLimit
      ? await this.complexityEstimator.estimateComplexity(problem, domain)
      : this.settings.maxWordsPerStep;
    const examples = await this.exampleDb.getExamples(domain, approach);
    const prompt =
      approach === 'CoD'
        ? createCodPrompt(problem, domain, wordLimit, examples)
        : createCotPrompt(problem, domain, examples);

    const messages: ChatMessage[] = [
      { role: 'system', content: prompt.system },
      { role: 'user', content: prompt.user }
    ];

    const response = await this.llmClient.chat(
      messages,
      options.model,
      options.maxTokens,
      options.temperature
    );

    let answer = response.content;
    if (this.settings.enforceFormat && approach === 'CoD') {
      answer = this.formatEnforcer.enforceWordLimit(answer, wordLimit);
    }
    const executionTime = Date.now() - startTime;
    if (this.settings.trackAnalytics) {
      await this.analytics.recordInference(
        problem,
        domain,
        approach,
        wordLimit,
        response.usage.inputTokens + response.usage.outputTokens,
        executionTime,
        answer.split('####')[0].trim(),
        answer.split('####')[1]?.trim() || answer,
        options.expectedAnswer,
        { reason, ...options.metadata }
      );
    }
    return {
      answer: answer.split('####')[1]?.trim() || answer,
      reasoning: answer.split('####')[0].trim(),
      approach,
      wordLimit,
      usage: response.usage,
    };
  }
  async getPerformanceStats(domain?: string): Promise<any> {
    return this.analytics.getPerformanceByDomain(domain);
  }
  async getTokenReductionStats(): Promise<any> {
    return this.analytics.getTokenReductionStats();
  }
  updateSettings(settings: Partial<ClientSettings>): void {
    this.settings = { ...this.settings, ...settings };
  }
  public async getAvailableModels(): Promise<string[]> {
    return this.llmClient.getAvailableModels();
  }
}
