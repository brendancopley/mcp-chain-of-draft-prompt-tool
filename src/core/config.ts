import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { logger } from '../utils/logger.js';
import { z } from 'zod';

// Load environment variables
dotenv.config();

// Define configuration schema using Zod
const configSchema = z.object({
  // Node environment
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  
  // LLM Configuration
  LLM_PROVIDER: z.enum(['anthropic', 'openai', 'mistral', 'ollama', 'test']).default('anthropic'),
  LLM_MODEL: z.string().default('claude-3-7-sonnet-latest'),
  
  // API Keys and URLs
  ANTHROPIC_API_KEY: z.string().optional(),
  ANTHROPIC_BASE_URL: z.string().default('https://api.anthropic.com'),
  OPENAI_API_KEY: z.string().optional(),
  OPENAI_BASE_URL: z.string().default('https://api.openai.com'),
  MISTRAL_API_KEY: z.string().optional(),
  OLLAMA_BASE_URL: z.string().default('http://localhost:11434'),
  
  // GRPO Configuration
  GRPO_PROMPT_EVOLUTION_RATE: z.coerce.number().min(0).max(1).default(0.2),
  GRPO_EVALUATION_MODEL: z.string().default('gpt-4-turbo'),
  GRPO_REWARD_WEIGHT_REASONING: z.coerce.number().min(0).max(1).default(0.5),
  GRPO_REWARD_WEIGHT_FACTUAL: z.coerce.number().min(0).max(1).default(0.3),
  GRPO_REWARD_WEIGHT_RELEVANCE: z.coerce.number().min(0).max(1).default(0.2),
  
  // MLX Configuration
  MLX_ENABLED: z.coerce.boolean().default(true),
  MLX_MODEL_PATH: z.string().default('mlx-community/Llama-3-8B-Instruct-mlx'),
  MLX_LORA_PATH: z.string().default('./lora_adapters'),
  MLX_QUANTIZE: z.coerce.boolean().default(true),
  
  // Vector Database Configuration
  VECTOR_DB_TYPE: z.enum(['postgres', 'chromadb']).default('postgres'),
  POSTGRES_CONNECTION_STRING: z.string().default('postgresql://postgres:postgres@localhost:5432/grpo_synthetic_data'),
  CHROMADB_PATH: z.string().default('./chromadb'),
  
  // Export Configuration
  EXPORT_FORMAT: z.enum(['jsonl', 'csv', 'parquet']).default('jsonl'),
  EXPORT_PATH: z.string().default('./exports'),
  
  // System Settings
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'debug', 'trace']).default('info'),
  BATCH_SIZE: z.coerce.number().positive().default(8),
  
  // Path to prompts.json configuration
  PROMPTS_CONFIG_PATH: z.string().default('./promptsConfig.json'),
});

// Define the config type
type Config = z.infer<typeof configSchema>;

// Parse and validate configuration
const parseConfig = (): Config => {
  try {
    // Collect all environment variables
    const env: Record<string, any> = { ...process.env };
    
    // Convert string booleans to actual booleans for validation
    const booleanKeys = ['MLX_ENABLED', 'MLX_QUANTIZE'];
    booleanKeys.forEach(key => {
      if (env[key] !== undefined) {
        const value = env[key]?.toLowerCase();
        if (value === 'true' || value === '1' || value === 'yes') {
          env[key] = true;
        } else if (value === 'false' || value === '0' || value === 'no') {
          env[key] = false;
        }
      }
    });
    
    // Parse numeric values
    const numericKeys = [
      'GRPO_PROMPT_EVOLUTION_RATE', 
      'GRPO_REWARD_WEIGHT_REASONING', 
      'GRPO_REWARD_WEIGHT_FACTUAL', 
      'GRPO_REWARD_WEIGHT_RELEVANCE',
      'BATCH_SIZE'
    ];
    numericKeys.forEach(key => {
      if (env[key] !== undefined) {
        env[key] = Number(env[key]);
      }
    });
    
    return configSchema.parse(env);
  } catch (error) {
    logger.error('Configuration validation failed', { error });
    throw new Error(`Configuration error: ${error instanceof Error ? error.message : String(error)}`);
  }
};

// Create the config object
const config = parseConfig();

// Load the prompts configuration
interface PromptsConfig {
  templates: Record<string, any>;
  categories: string[];
  parameters: Record<string, any>;
}

let promptsConfig: PromptsConfig | null = null;

const loadPromptsConfig = (): PromptsConfig => {
  if (promptsConfig) return promptsConfig;
  
  try {
    const configPath = path.resolve(process.cwd(), config.PROMPTS_CONFIG_PATH);
    logger.devLog(`Loading prompts config from ${configPath}`);
    
    if (!fs.existsSync(configPath)) {
      logger.warn(`Prompts config file not found at ${configPath}`);
      return { templates: {}, categories: [], parameters: {} };
    }
    
    const fileContents = fs.readFileSync(configPath, 'utf8');
    promptsConfig = JSON.parse(fileContents) as PromptsConfig;
    logger.info(`Loaded prompts config with ${Object.keys(promptsConfig.templates).length} templates`);
    
    return promptsConfig;
  } catch (error) {
    logger.error('Failed to load prompts config', { error });
    return { templates: {}, categories: [], parameters: {} };
  }
};

// Export configuration
export { config, loadPromptsConfig, type Config, type PromptsConfig }; 