import { Anthropic } from '@anthropic-ai/sdk';
import OpenAI from 'openai';
import { Mistral } from '@mistralai/mistralai';
import { Ollama } from 'ollama';
import fetch from 'node-fetch';
import { config } from './config.js';
import { logger } from '../utils/logger.js';
import { LLMMessage, LLMResponse } from '../types.js';

/**
 * Unified LLM client that provides a consistent interface for different LLM providers
 */
export class UnifiedLLMClient {
  private anthropicClient?: Anthropic;
  private openaiClient?: OpenAI;
  private mistralClient?: Mistral;
  private ollamaClient?: Ollama;
  private provider: string;
  private model: string;
  private availableModels: Record<string, string[]> = {
    anthropic: [],
    openai: [],
    mistral: [],
    ollama: []
  };

  constructor() {
    // Load from environment variables with defaults
    this.provider = config.LLM_PROVIDER;
    this.model = config.LLM_MODEL;

    logger.devLog('Initializing LLM client', {
      provider: this.provider,
      model: this.model,
      env: config.NODE_ENV
    });

    // Initialize the appropriate client based on provider
    this.initializeClient();
  }

  /**
   * Initialize the appropriate LLM client based on the configured provider
   */
  private initializeClient() {
    logger.info('Initializing LLM provider:', { provider: this.provider });
    
    switch (this.provider.toLowerCase()) {
      case 'test':
        logger.info('Using test LLM provider');
        // No need to initialize any actual client for testing
        break;
      case 'anthropic':
        if (!config.ANTHROPIC_API_KEY) {
          throw new Error('ANTHROPIC_API_KEY is required for Anthropic provider');
        }
        this.anthropicClient = new Anthropic({
          apiKey: config.ANTHROPIC_API_KEY,
          baseURL: config.ANTHROPIC_BASE_URL
        });
        break;

      case 'openai':
        if (!config.OPENAI_API_KEY) {
          throw new Error('OPENAI_API_KEY is required for OpenAI provider');
        }
        this.openaiClient = new OpenAI({
          apiKey: config.OPENAI_API_KEY,
          baseURL: config.OPENAI_BASE_URL
        });
        break;

      case 'mistral':
        if (!config.MISTRAL_API_KEY) {
          throw new Error('MISTRAL_API_KEY is required for Mistral provider');
        }
        this.mistralClient = new Mistral({
          apiKey: config.MISTRAL_API_KEY
        });
        break;

      case 'ollama':
        this.ollamaClient = new Ollama({
          host: config.OLLAMA_BASE_URL
        });
        break;

      default:
        throw new Error(`Unsupported LLM provider: ${this.provider}`);
    }
    
    // Cache available models
    this.cacheAvailableModels().catch(error => {
      logger.warn('Failed to cache available models', { error });
    });
  }

  /**
   * Cache available models for the current provider
   */
  private async cacheAvailableModels(): Promise<void> {
    try {
      const models = await this.getAvailableModels();
      this.availableModels[this.provider] = models;
      logger.devLog(`Cached ${models.length} models for ${this.provider}`);
    } catch (error) {
      logger.warn('Failed to cache available models', { error });
    }
  }

  /**
   * Get a list of available models for the current provider
   */
  async getAvailableModels(): Promise<string[]> {
    logger.devLog('Fetching available models');
    
    try {
      switch (this.provider) {
        case 'anthropic': {
          const response = await fetch(`${config.ANTHROPIC_BASE_URL}/v1/models`, {
            headers: {
              'x-api-key': config.ANTHROPIC_API_KEY || '',
              'anthropic-version': '2023-06-01'
            }
          });
          
          if (!response.ok) {
            throw new Error(`Failed to fetch Anthropic models: ${response.statusText}`);
          }
          
          const data = await response.json() as { models: Array<{ id: string }> };
          return data.models.map(model => model.id);
        }

        case 'openai':
          if (!this.openaiClient) throw new Error('OpenAI client not initialized');
          const openaiModels = await this.openaiClient.models.list();
          return openaiModels.data.map(model => model.id);

        case 'mistral': {
          if (!this.mistralClient) throw new Error('Mistral client not initialized');
          const response = await this.mistralClient.models.list();
          return (response.data || []).map(model => model.id);
        }

        case 'ollama':
          if (!this.ollamaClient) throw new Error('Ollama client not initialized');
          const ollamaModels = await this.ollamaClient.list();
          return ollamaModels.models.map(model => model.name);

        default:
          return [];
      }
    } catch (error) {
      logger.error('Error fetching models:', { error });
      return [];
    }
  }

  /**
   * Switch the current provider
   */
  async switchProvider(provider: string): Promise<void> {
    if (provider === this.provider) return;
    
    if (!['anthropic', 'openai', 'mistral', 'ollama'].includes(provider)) {
      throw new Error(`Unsupported LLM provider: ${provider}`);
    }
    
    this.provider = provider;
    this.initializeClient();
    
    // Set a default model for the new provider
    const models = await this.getAvailableModels();
    if (models.length > 0) {
      this.model = models[0];
    }
  }

  /**
   * Set the current model
   */
  setModel(model: string): void {
    this.model = model;
  }

  /**
   * Get the current provider
   */
  getProvider(): string {
    return this.provider;
  }

  /**
   * Get the current model
   */
  getModel(): string {
    return this.model;
  }

  /**
   * Check if a model is available
   */
  async isModelAvailable(model: string): Promise<boolean> {
    // Use cached models if available
    if (this.availableModels[this.provider].length > 0) {
      return this.availableModels[this.provider].includes(model);
    }

    // Fetch available models if not cached
    const models = await this.getAvailableModels();
    return models.includes(model);
  }

  /**
   * Send a chat request to the LLM
   */
  async chat(
    messages: LLMMessage[],
    {
      model,
      temperature = 0.7,
      max_tokens = 1024,
      top_p = 0.95,
      top_k,
      stop_sequences
    }: {
      model?: string;
      temperature?: number;
      max_tokens?: number;
      top_p?: number;
      top_k?: number;
      stop_sequences?: string[];
    } = {}): Promise<LLMResponse> {
    const selectedModel = model || this.model;
    const startTime = Date.now();
    
    logger.devLog('Initiating chat:', {
      provider: this.provider,
      model: selectedModel,
      messageCount: messages.length,
      options: { temperature, max_tokens, top_p }
    });

    try {
      // Use test provider if specified
      if (this.provider.toLowerCase() === 'test') {
        logger.info('Using test LLM provider for chat', { messages, options: { model: selectedModel, temperature, max_tokens } });
        
        // Return a mock response for testing
        const mockResponse: LLMResponse = {
          content: "This is a test response for Chain of Draft. The solution is provided step by step with clear reasoning.",
          usage: {
            input_tokens: 100,
            output_tokens: 150
          }
        };
        
        // Simulate a delay for realistic testing
        await new Promise(resolve => setTimeout(resolve, 100));
        
        logger.metrics('llm-client', 'chat', {
          success: true,
          duration_ms: Date.now() - startTime,
          tokens: mockResponse.usage?.input_tokens! + mockResponse.usage?.output_tokens!
        });
        
        return mockResponse;
      }
      
      let response: LLMResponse;
      
      switch (this.provider) {
        case 'anthropic': {
          if (!this.anthropicClient) throw new Error('Anthropic client not initialized');
          
          const anthropicMessages = this.formatAnthropicMessages(messages);
          
          const anthropicResponse = await this.anthropicClient.messages.create({
            model: selectedModel,
            messages: anthropicMessages,
            max_tokens,
            temperature,
            top_p,
            stop_sequences
          });
          
          // Handle different content block types
          let textContent = '';
          if (anthropicResponse.content && anthropicResponse.content.length > 0) {
            const content = anthropicResponse.content[0];
            if (content && typeof content === 'object' && 'text' in content) {
              textContent = content.text as string;
            } else if (typeof content === 'string') {
              textContent = content;
            } else {
              textContent = JSON.stringify(content);
            }
          }
          
          response = {
            content: textContent,
            usage: {
              input_tokens: anthropicResponse.usage?.input_tokens || 0,
              output_tokens: anthropicResponse.usage?.output_tokens || 0
            }
          };
          break;
        }

        case 'openai': {
          if (!this.openaiClient) throw new Error('OpenAI client not initialized');
          
          const openaiResponse = await this.openaiClient.chat.completions.create({
            model: selectedModel,
            messages: messages as any,
            max_tokens,
            temperature,
            top_p,
            stop: stop_sequences
          });
          
          response = {
            content: openaiResponse.choices[0].message.content || '',
            usage: {
              input_tokens: openaiResponse.usage?.prompt_tokens || 0,
              output_tokens: openaiResponse.usage?.completion_tokens || 0
            }
          };
          break;
        }

        case 'mistral': {
          if (!this.mistralClient) throw new Error('Mistral client not initialized');
          
          const mistralResponse = await this.mistralClient.chat.complete({
            model: selectedModel,
            messages: messages.map(m => ({
              role: m.role as 'user' | 'assistant',
              content: m.content
            })),
            maxTokens: max_tokens,
            temperature,
            topP: top_p,
            stop: stop_sequences
          });
          
          let content = '';
          const messageContent = mistralResponse.choices?.[0]?.message?.content;
          
          if (Array.isArray(messageContent)) {
            content = messageContent.map(chunk => 
              typeof chunk === 'string' ? chunk : JSON.stringify(chunk)
            ).join('');
          } else if (typeof messageContent === 'string') {
            content = messageContent;
          } else {
            throw new Error('Invalid content format in Mistral response');
          }
          
          response = {
            content,
            usage: {
              input_tokens: mistralResponse.usage?.promptTokens || 0,
              output_tokens: mistralResponse.usage?.completionTokens || 0
            }
          };
          break;
        }

        case 'ollama': {
          if (!this.ollamaClient) throw new Error('Ollama client not initialized');
          
          const ollamaResponse = await this.ollamaClient.chat({
            model: selectedModel,
            messages,
            options: {
              num_predict: max_tokens,
              temperature,
              top_p,
              stop: stop_sequences
            }
          });
          
          response = {
            content: ollamaResponse.message.content,
            usage: {
              input_tokens: 0, // Ollama doesn't provide token usage statistics
              output_tokens: 0
            }
          };
          break;
        }

        default:
          throw new Error(`Unsupported LLM provider: ${this.provider}`);
      }

      const elapsedTime = Date.now() - startTime;
      
      logger.metrics('LLMClient', 'chat', {
        success: true,
        duration_ms: elapsedTime,
        tokens: (response.usage?.input_tokens || 0) + (response.usage?.output_tokens || 0),
        details: {
          provider: this.provider,
          model: selectedModel,
          input_tokens: response.usage?.input_tokens || 0,
          output_tokens: response.usage?.output_tokens || 0
        }
      });
      
      return response;
    } catch (error) {
      const elapsedTime = Date.now() - startTime;
      
      logger.metrics('LLMClient', 'chat', {
        success: false,
        duration_ms: elapsedTime,
        error: error instanceof Error ? error : String(error),
        details: {
          provider: this.provider,
          model: selectedModel
        }
      });
      
      throw error;
    }
  }

  private formatAnthropicMessages(messages: LLMMessage[]): Array<{ role: 'user' | 'assistant'; content: string }> {
    return messages.map(m => {
      // Ensure role is properly typed as 'user' or 'assistant'
      let role: 'user' | 'assistant';
      
      if (m.role === 'user' || m.role === 'assistant') {
        role = m.role;
      } else if (m.role === 'system') {
        // Handle system messages - add them to the first user message as a system prompt
        // In practice, we'd use a more sophisticated approach
        role = 'user';
      } else {
        // Default to user if role is unexpected
        role = 'user';
      }
      
      return {
        role,
        content: m.content
      };
    });
  }
}

// Export a singleton instance
export const llmClient = new UnifiedLLMClient(); 