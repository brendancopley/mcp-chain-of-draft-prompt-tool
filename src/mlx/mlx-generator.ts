import { v4 as uuidv4 } from 'uuid';
import { spawn } from 'child_process';
import * as path from 'path';
import * as fs from 'fs';
import { logger } from '../utils/logger.js';
import { config } from '../core/config.js';
import {
  GeneratedPrompt,
  GeneratedResponse,
  MLXModelConfig,
  MLXGenerationResult,
  ModelParameters
} from '../types.js';

/**
 * MLX-based response generator for Apple Silicon
 */
export class MLXGenerator {
  private modelConfig: MLXModelConfig;
  private pythonPath: string;
  private mlxScriptPath: string;
  private initialized: boolean = false;
  
  constructor() {
    this.pythonPath = process.env.PYTHON_PATH || 'python3';
    this.mlxScriptPath = path.join(process.cwd(), 'src', 'python', 'mlx', 'generate.py');
    
    this.modelConfig = {
      model_path: config.MLX_MODEL_PATH,
      lora_path: config.MLX_LORA_PATH,
      quantized: config.MLX_QUANTIZE,
      model_type: this.detectModelType(config.MLX_MODEL_PATH)
    };
    
    logger.info('Initialized MLX generator', {
      modelPath: this.modelConfig.model_path,
      modelType: this.modelConfig.model_type,
      quantized: this.modelConfig.quantized
    });
  }
  
  /**
   * Initialize the MLX generator
   */
  async initialize(): Promise<boolean> {
    if (this.initialized) return true;
    
    try {
      // Check if running on Apple Silicon
      const isAppleSilicon = await this.checkIsAppleSilicon();
      if (!isAppleSilicon) {
        logger.warn('MLX requires Apple Silicon (M1/M2/M3), running on unsupported hardware');
        return false;
      }
      
      // Check if Python MLX script exists
      if (!fs.existsSync(this.mlxScriptPath)) {
        logger.error('MLX Python script not found', { path: this.mlxScriptPath });
        return false;
      }
      
      // Create MLX Python script if it doesn't exist
      await this.ensureMLXScriptExists();
      
      this.initialized = true;
      logger.info('MLX generator initialized successfully');
      return true;
    } catch (error) {
      logger.error('Failed to initialize MLX generator', { error });
      return false;
    }
  }
  
  /**
   * Generate a response to a prompt using MLX
   */
  async generateResponse(
    prompt: GeneratedPrompt,
    params: ModelParameters = {
      temperature: 0.7,
      top_p: 0.9,
      max_tokens: 1024
    }
  ): Promise<GeneratedResponse> {
    const startTime = Date.now();
    
    if (!this.initialized) {
      const initialized = await this.initialize();
      if (!initialized) {
        throw new Error('MLX generator not initialized');
      }
    }
    
    try {
      logger.devLog('Generating response with MLX', {
        promptId: prompt.id,
        modelPath: this.modelConfig.model_path,
        temperature: params.temperature,
        max_tokens: params.max_tokens
      });
      
      const result = await this.runMLXGeneration(prompt.content, params);
      const elapsedTime = Date.now() - startTime;
      
      const response: GeneratedResponse = {
        id: uuidv4(),
        prompt_id: prompt.id,
        content: result.text,
        model: path.basename(this.modelConfig.model_path),
        model_parameters: params,
        tokens_used: result.tokens_generated,
        generation_time_ms: result.generation_time_ms,
        created_at: new Date()
      };
      
      logger.metrics('MLXGenerator', 'generateResponse', {
        success: true,
        duration_ms: elapsedTime,
        tokens: result.tokens_generated,
        details: {
          promptId: prompt.id,
          responseId: response.id,
          model: this.modelConfig.model_path,
          generation_time_ms: result.generation_time_ms
        }
      });
      
      return response;
    } catch (error) {
      const elapsedTime = Date.now() - startTime;
      
      logger.metrics('MLXGenerator', 'generateResponse', {
        success: false,
        duration_ms: elapsedTime,
        error: error instanceof Error ? error : String(error),
        details: {
          promptId: prompt.id,
          model: this.modelConfig.model_path
        }
      });
      
      throw error;
    }
  }
  
  /**
   * Batch generate responses to multiple prompts
   */
  async batchGenerate(
    prompts: GeneratedPrompt[],
    params: ModelParameters = {
      temperature: 0.7,
      top_p: 0.9,
      max_tokens: 1024
    }
  ): Promise<GeneratedResponse[]> {
    const results: GeneratedResponse[] = [];
    const startTime = Date.now();
    
    logger.info('Starting batch generation', {
      count: prompts.length,
      model: this.modelConfig.model_path
    });
    
    if (!this.initialized) {
      const initialized = await this.initialize();
      if (!initialized) {
        throw new Error('MLX generator not initialized');
      }
    }
    
    // Process generation in sequence
    for (const prompt of prompts) {
      try {
        const response = await this.generateResponse(prompt, params);
        results.push(response);
      } catch (error) {
        logger.error('Failed to generate response in batch', {
          promptId: prompt.id,
          error
        });
      }
    }
    
    const elapsedTime = Date.now() - startTime;
    
    logger.info('Completed batch generation', {
      count: prompts.length,
      successCount: results.length,
      duration_ms: elapsedTime
    });
    
    return results;
  }
  
  /**
   * Run the MLX Python script for text generation
   */
  private async runMLXGeneration(
    prompt: string,
    params: ModelParameters
  ): Promise<MLXGenerationResult> {
    return new Promise((resolve, reject) => {
      // Create a temporary file for the prompt
      const promptFile = path.join(os.tmpdir(), `mlx_prompt_${Date.now()}.txt`);
      fs.writeFileSync(promptFile, prompt, 'utf8');
      
      // Create a temporary file for the output
      const outputFile = path.join(os.tmpdir(), `mlx_output_${Date.now()}.json`);
      
      // Prepare command arguments
      const args = [
        this.mlxScriptPath,
        '--model-path', this.modelConfig.model_path,
        '--prompt-file', promptFile,
        '--output-file', outputFile,
        '--temperature', params.temperature.toString(),
        '--top-p', params.top_p.toString(),
        '--max-tokens', params.max_tokens.toString()
      ];
      
      // Add optional arguments
      if (this.modelConfig.lora_path) {
        args.push('--lora-path', this.modelConfig.lora_path);
      }
      
      if (this.modelConfig.quantized) {
        args.push('--quantize');
      }
      
      if (params.top_k) {
        args.push('--top-k', params.top_k.toString());
      }
      
      logger.devLog('Running MLX command', { command: this.pythonPath, args });
      
      // Spawn Python process
      const process = spawn(this.pythonPath, args);
      
      let stdoutData = '';
      let stderrData = '';
      
      process.stdout.on('data', (data) => {
        stdoutData += data.toString();
      });
      
      process.stderr.on('data', (data) => {
        stderrData += data.toString();
        logger.warn('MLX stderr', { stderr: data.toString() });
      });
      
      process.on('close', (code) => {
        try {
          // Clean up temporary prompt file
          if (fs.existsSync(promptFile)) {
            fs.unlinkSync(promptFile);
          }
          
          if (code !== 0) {
            logger.error('MLX process exited with non-zero code', {
              code,
              stdout: stdoutData,
              stderr: stderrData
            });
            reject(new Error(`MLX generation failed with code ${code}: ${stderrData}`));
            return;
          }
          
          // Read and parse output file
          if (!fs.existsSync(outputFile)) {
            reject(new Error('MLX output file not found'));
            return;
          }
          
          const outputData = JSON.parse(fs.readFileSync(outputFile, 'utf8'));
          
          // Clean up temporary output file
          fs.unlinkSync(outputFile);
          
          resolve({
            text: outputData.text,
            tokens_generated: outputData.tokens_generated,
            generation_time_ms: outputData.generation_time_ms
          });
        } catch (error) {
          logger.error('Error processing MLX output', { error });
          reject(error);
        }
      });
      
      process.on('error', (error) => {
        logger.error('MLX process error', { error });
        reject(error);
      });
    });
  }
  
  /**
   * Check if running on Apple Silicon
   */
  private async checkIsAppleSilicon(): Promise<boolean> {
    return new Promise((resolve) => {
      const process = spawn('uname', ['-m']);
      
      let stdout = '';
      
      process.stdout.on('data', (data) => {
        stdout += data.toString();
      });
      
      process.on('close', () => {
        const architecture = stdout.trim();
        const isAppleSilicon = architecture === 'arm64';
        
        logger.info('Hardware architecture check', {
          architecture,
          isAppleSilicon
        });
        
        resolve(isAppleSilicon);
      });
      
      process.on('error', () => {
        logger.warn('Failed to determine architecture, assuming not Apple Silicon');
        resolve(false);
      });
    });
  }
  
  /**
   * Create the MLX Python script if it doesn't exist
   */
  private async ensureMLXScriptExists(): Promise<void> {
    const scriptDir = path.dirname(this.mlxScriptPath);
    
    if (!fs.existsSync(scriptDir)) {
      fs.mkdirSync(scriptDir, { recursive: true });
      logger.info('Created MLX script directory', { path: scriptDir });
    }
    
    if (!fs.existsSync(this.mlxScriptPath)) {
      const scriptContent = this.getMLXScriptContent();
      fs.writeFileSync(this.mlxScriptPath, scriptContent, 'utf8');
      logger.info('Created MLX Python script', { path: this.mlxScriptPath });
    }
  }
  
  /**
   * Get the MLX Python script content
   */
  private getMLXScriptContent(): string {
    return `#!/usr/bin/env python3
"""
MLX text generation script for efficient inference on Apple Silicon.
This script loads a model and generates text based on a prompt.
"""

import os
import sys
import json
import time
import argparse
from typing import Dict, List, Optional, Union, Any
import mlx.core as mx
import mlx.nn as nn

def parse_args():
    """Parse command line arguments"""
    parser = argparse.ArgumentParser(description="MLX text generation")
    parser.add_argument(
        "--model-path", 
        type=str, 
        required=True, 
        help="Path to the model directory or HF repo ID"
    )
    parser.add_argument(
        "--lora-path", 
        type=str, 
        help="Path to the LoRA adapter directory"
    )
    parser.add_argument(
        "--prompt-file", 
        type=str, 
        required=True, 
        help="Path to the prompt file"
    )
    parser.add_argument(
        "--output-file", 
        type=str, 
        required=True, 
        help="Path to write the output JSON"
    )
    parser.add_argument(
        "--temperature", 
        type=float, 
        default=0.7, 
        help="Sampling temperature"
    )
    parser.add_argument(
        "--top-k", 
        type=int, 
        default=50, 
        help="Top-k sampling parameter"
    )
    parser.add_argument(
        "--top-p", 
        type=float, 
        default=0.9, 
        help="Top-p sampling parameter"
    )
    parser.add_argument(
        "--max-tokens", 
        type=int, 
        default=1024, 
        help="Maximum number of tokens to generate"
    )
    parser.add_argument(
        "--quantize", 
        action="store_true", 
        help="Quantize model to INT8"
    )
    return parser.parse_args()

def load_model(args):
    """Load the model based on the model type"""
    try:
        # Import the appropriate model based on model name
        if "llama" in args.model_path.lower():
            from mlx_lm.models.llama import Llama
            model_class = Llama
        elif "mistral" in args.model_path.lower():
            from mlx_lm.models.mistral import Mistral
            model_class = Mistral
        elif "gemma" in args.model_path.lower():
            from mlx_lm.models.gemma import Gemma
            model_class = Gemma
        else:
            # Default to Llama for unknown models
            from mlx_lm.models.llama import Llama
            model_class = Llama
            
        # Load model from local path or HF repo
        model, tokenizer = model_class.from_pretrained(args.model_path)
        
        # Quantize if requested
        if args.quantize:
            model = model.quantize()
            
        # Apply LoRA adapter if specified
        if args.lora_path:
            model.load_weights(os.path.join(args.lora_path, "weights.npz"))
            
        return model, tokenizer
    except Exception as e:
        print(f"Error loading model: {e}", file=sys.stderr)
        sys.exit(1)

def generate_text(model, tokenizer, prompt, args):
    """Generate text based on prompt"""
    try:
        # Tokenize the prompt
        tokens = tokenizer.encode(prompt)
        
        # Record start time
        start_time = time.time()
        
        # Set up generation parameters
        gen_config = {
            "max_tokens": args.max_tokens,
            "temperature": args.temperature,
            "top_p": args.top_p,
            "top_k": args.top_k
        }
        
        # Generate tokens
        outputs = model.generate(
            tokens,
            max_length=args.max_tokens,
            temperature=args.temperature,
            top_p=args.top_p,
            top_k=args.top_k
        )
        
        # Decode generated tokens
        generated_text = tokenizer.decode(outputs)
        
        # Calculate generation time and token count
        generation_time_ms = int((time.time() - start_time) * 1000)
        tokens_generated = len(outputs) - len(tokens)
        
        return {
            "text": generated_text,
            "tokens_generated": tokens_generated,
            "generation_time_ms": generation_time_ms
        }
    except Exception as e:
        print(f"Error generating text: {e}", file=sys.stderr)
        sys.exit(1)

def main():
    """Main function"""
    args = parse_args()
    
    # Load model and tokenizer
    model, tokenizer = load_model(args)
    
    # Read prompt from file
    with open(args.prompt_file, "r", encoding="utf-8") as f:
        prompt = f.read()
    
    # Generate text
    result = generate_text(model, tokenizer, prompt, args)
    
    # Write result to output file
    with open(args.output_file, "w", encoding="utf-8") as f:
        json.dump(result, f, ensure_ascii=False, indent=2)
    
    print(f"Generation complete. Output written to {args.output_file}")

if __name__ == "__main__":
    main()
`;
  }
  
  /**
   * Detect the model type from the model path
   */
  private detectModelType(modelPath: string): 'llama' | 'mistral' | 'deepseek' | 'gemma' | 'other' {
    const lowerPath = modelPath.toLowerCase();
    
    if (lowerPath.includes('llama')) {
      return 'llama';
    } else if (lowerPath.includes('mistral')) {
      return 'mistral';
    } else if (lowerPath.includes('deepseek')) {
      return 'deepseek';
    } else if (lowerPath.includes('gemma')) {
      return 'gemma';
    } else {
      return 'other';
    }
  }
  
  /**
   * Update model configuration
   */
  updateModelConfig(config: Partial<MLXModelConfig>): void {
    this.modelConfig = {
      ...this.modelConfig,
      ...config
    };
    
    logger.info('Updated MLX model configuration', { config: this.modelConfig });
  }
  
  /**
   * Get the current model configuration
   */
  getModelConfig(): MLXModelConfig {
    return { ...this.modelConfig };
  }
}

// Import OS module for temporary directory
import * as os from 'os';

// Export singleton instance
export const mlxGenerator = new MLXGenerator(); 