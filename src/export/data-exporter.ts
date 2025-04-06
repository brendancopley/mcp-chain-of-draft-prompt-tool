import * as fs from 'fs';
import * as path from 'path';
import { createWriteStream } from 'fs';
import { pipeline } from 'stream';
import { promisify } from 'util';
import { logger } from '../utils/logger.js';
import { config } from '../core/config.js';
import {
  ExportConfig,
  ExportResult,
  GeneratedPrompt,
  GeneratedResponse,
  EvaluationDetails
} from '../types.js';

const pipelineAsync = promisify(pipeline);

/**
 * Data exporter for generated prompts and responses
 */
export class DataExporter {
  private exportPath: string;
  
  constructor() {
    this.exportPath = config.EXPORT_PATH;
    this.ensureExportDirectoryExists();
  }
  
  /**
   * Ensure the export directory exists
   */
  private ensureExportDirectoryExists(): void {
    try {
      if (!fs.existsSync(this.exportPath)) {
        fs.mkdirSync(this.exportPath, { recursive: true });
        logger.info('Created export directory', { path: this.exportPath });
      }
    } catch (error) {
      logger.error('Failed to create export directory', { path: this.exportPath, error });
      throw error;
    }
  }
  
  /**
   * Export a dataset of prompt-response pairs
   */
  async exportDataset(
    promptResponses: Array<{
      prompt: GeneratedPrompt;
      response: GeneratedResponse;
      evaluation?: EvaluationDetails;
    }>,
    config: Partial<ExportConfig> = {}
  ): Promise<ExportResult> {
    const startTime = Date.now();
    
    // Merge with default config
    const exportConfig: ExportConfig = {
      format: config.format || 'jsonl',
      path: config.path || this.exportPath,
      filter: config.filter || {},
      include_evaluation: config.include_evaluation !== undefined ? config.include_evaluation : true,
      include_metadata: config.include_metadata !== undefined ? config.include_metadata : true
    };
    
    try {
      // Apply filters if any
      let filteredData = promptResponses;
      if (Object.keys(exportConfig.filter || {}).length > 0) {
        filteredData = this.applyFilters(promptResponses, exportConfig.filter || {});
      }
      
      logger.info('Exporting dataset', {
        totalCount: promptResponses.length,
        filteredCount: filteredData.length,
        format: exportConfig.format,
        path: exportConfig.path
      });
      
      // Generate a file name based on timestamp and format
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const fileName = `dataset_${timestamp}.${exportConfig.format}`;
      const filePath = path.join(exportConfig.path, fileName);
      
      // Export the data in the specified format
      switch (exportConfig.format) {
        case 'jsonl':
          await this.exportAsJsonl(filteredData, filePath, exportConfig);
          break;
        
        case 'csv':
          await this.exportAsCsv(filteredData, filePath, exportConfig);
          break;
          
        case 'parquet':
          await this.exportAsParquet(filteredData, filePath, exportConfig);
          break;
          
        default:
          throw new Error(`Unsupported export format: ${exportConfig.format}`);
      }
      
      // Get file size
      const stats = fs.statSync(filePath);
      const fileSizeBytes = stats.size;
      
      const elapsedTime = Date.now() - startTime;
      
      logger.info('Dataset exported successfully', {
        filePath,
        recordCount: filteredData.length,
        fileSizeBytes,
        durationMs: elapsedTime
      });
      
      return {
        file_path: filePath,
        record_count: filteredData.length,
        file_size_bytes: fileSizeBytes,
        format: exportConfig.format,
        created_at: new Date()
      };
    } catch (error) {
      logger.error('Failed to export dataset', { error });
      throw error;
    }
  }
  
  /**
   * Apply filters to the dataset
   */
  private applyFilters(
    data: Array<{
      prompt: GeneratedPrompt;
      response: GeneratedResponse;
      evaluation?: EvaluationDetails;
    }>,
    filters: Record<string, any>
  ): Array<{
    prompt: GeneratedPrompt;
    response: GeneratedResponse;
    evaluation?: EvaluationDetails;
  }> {
    return data.filter(item => {
      for (const [key, value] of Object.entries(filters)) {
        // Check prompt fields
        if (key.startsWith('prompt.')) {
          const promptField = key.substring(7);
          if (promptField === 'parameters') {
            // Special handling for prompt parameters
            const paramFilters = value as Record<string, any>;
            for (const [paramKey, paramValue] of Object.entries(paramFilters)) {
              if (item.prompt.parameters[paramKey] !== paramValue) {
                return false;
              }
            }
          } else if ((item.prompt as any)[promptField] !== value) {
            return false;
          }
        }
        // Check response fields
        else if (key.startsWith('response.')) {
          const responseField = key.substring(9);
          if (responseField === 'model_parameters') {
            // Special handling for model parameters
            const paramFilters = value as Record<string, any>;
            for (const [paramKey, paramValue] of Object.entries(paramFilters)) {
              if ((item.response.model_parameters as any)[paramKey] !== paramValue) {
                return false;
              }
            }
          } else if ((item.response as any)[responseField] !== value) {
            return false;
          }
        }
        // Check evaluation fields
        else if (key.startsWith('evaluation.') && item.evaluation) {
          const evaluationField = key.substring(11);
          if ((item.evaluation as any)[evaluationField] !== value) {
            return false;
          }
        }
      }
      return true;
    });
  }
  
  /**
   * Export data as JSONL format
   */
  private async exportAsJsonl(
    data: Array<{
      prompt: GeneratedPrompt;
      response: GeneratedResponse;
      evaluation?: EvaluationDetails;
    }>,
    filePath: string,
    config: ExportConfig
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      const writeStream = fs.createWriteStream(filePath, { encoding: 'utf8' });
      
      writeStream.on('error', error => {
        logger.error('Error writing JSONL file', { filePath, error });
        reject(error);
      });
      
      writeStream.on('finish', () => {
        resolve();
      });
      
      // Process each record
      for (const item of data) {
        const record: Record<string, any> = {
          prompt: item.prompt.content,
          response: item.response.content
        };
        
        // Add metadata if requested
        if (config.include_metadata) {
          record.metadata = {
            prompt_id: item.prompt.id,
            response_id: item.response.id,
            template_id: item.prompt.template_id,
            model: item.response.model,
            tokens_used: item.response.tokens_used,
            generation_time_ms: item.response.generation_time_ms,
            created_at: item.response.created_at.toISOString(),
            prompt_parameters: item.prompt.parameters,
            model_parameters: item.response.model_parameters
          };
        }
        
        // Add evaluation if available and requested
        if (config.include_evaluation && item.evaluation) {
          record.evaluation = {
            reasoning_score: item.evaluation.reasoning_score,
            factual_score: item.evaluation.factual_score,
            relevance_score: item.evaluation.relevance_score,
            combined_score: item.evaluation.combined_score,
            feedback: item.evaluation.evaluator_feedback
          };
        }
        
        // Write the record as a JSON line
        writeStream.write(JSON.stringify(record) + '\n');
      }
      
      writeStream.end();
    });
  }
  
  /**
   * Export data as CSV format
   */
  private async exportAsCsv(
    data: Array<{
      prompt: GeneratedPrompt;
      response: GeneratedResponse;
      evaluation?: EvaluationDetails;
    }>,
    filePath: string,
    config: ExportConfig
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      const writeStream = fs.createWriteStream(filePath, { encoding: 'utf8' });
      
      writeStream.on('error', error => {
        logger.error('Error writing CSV file', { filePath, error });
        reject(error);
      });
      
      writeStream.on('finish', () => {
        resolve();
      });
      
      // Define headers based on included fields
      const headers = ['prompt', 'response'];
      
      if (config.include_metadata) {
        headers.push(
          'prompt_id',
          'response_id',
          'template_id',
          'model',
          'tokens_used',
          'generation_time_ms',
          'created_at'
        );
      }
      
      if (config.include_evaluation) {
        headers.push(
          'reasoning_score',
          'factual_score',
          'relevance_score',
          'combined_score'
        );
      }
      
      // Write CSV header
      writeStream.write(headers.join(',') + '\n');
      
      // Process each record
      for (const item of data) {
        const values: string[] = [
          this.escapeCsvField(item.prompt.content),
          this.escapeCsvField(item.response.content)
        ];
        
        if (config.include_metadata) {
          values.push(
            this.escapeCsvField(item.prompt.id),
            this.escapeCsvField(item.response.id),
            this.escapeCsvField(item.prompt.template_id),
            this.escapeCsvField(item.response.model),
            String(item.response.tokens_used),
            String(item.response.generation_time_ms),
            this.escapeCsvField(item.response.created_at.toISOString())
          );
        }
        
        if (config.include_evaluation && item.evaluation) {
          values.push(
            String(item.evaluation.reasoning_score),
            String(item.evaluation.factual_score),
            String(item.evaluation.relevance_score),
            String(item.evaluation.combined_score)
          );
        } else if (config.include_evaluation) {
          // Add empty values if evaluation is not available
          values.push('', '', '', '');
        }
        
        // Write the CSV record
        writeStream.write(values.join(',') + '\n');
      }
      
      writeStream.end();
    });
  }
  
  /**
   * Escape CSV field
   */
  private escapeCsvField(value: string): string {
    // If value contains commas, quotes, or newlines, enclose in quotes and escape internal quotes
    if (/[",\n\r]/.test(value)) {
      return `"${value.replace(/"/g, '""')}"`;
    }
    return value;
  }
  
  /**
   * Export data as Parquet format (simplified implementation)
   */
  private async exportAsParquet(
    data: Array<{
      prompt: GeneratedPrompt;
      response: GeneratedResponse;
      evaluation?: EvaluationDetails;
    }>,
    filePath: string,
    config: ExportConfig
  ): Promise<void> {
    // As a fallback, export as JSONL with .parquet extension
    logger.warn('Parquet export is not fully implemented, falling back to JSONL format');
    await this.exportAsJsonl(data, filePath.replace(/\.parquet$/, '.jsonl'), config);
  }
  
  /**
   * Export a single prompt-response pair for debugging
   */
  async exportSingle(
    prompt: GeneratedPrompt,
    response: GeneratedResponse,
    evaluation?: EvaluationDetails
  ): Promise<string> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const fileName = `single_${prompt.id}_${timestamp}.json`;
    const filePath = path.join(this.exportPath, fileName);
    
    const data = {
      prompt: {
        id: prompt.id,
        template_id: prompt.template_id,
        content: prompt.content,
        parameters: prompt.parameters,
        created_at: prompt.created_at
      },
      response: {
        id: response.id,
        content: response.content,
        model: response.model,
        model_parameters: response.model_parameters,
        tokens_used: response.tokens_used,
        generation_time_ms: response.generation_time_ms,
        created_at: response.created_at
      }
    };
    
    if (evaluation) {
      (data as any).evaluation = {
        reasoning_score: evaluation.reasoning_score,
        factual_score: evaluation.factual_score,
        relevance_score: evaluation.relevance_score,
        combined_score: evaluation.combined_score,
        evaluator_model: evaluation.evaluator_model,
        evaluator_feedback: evaluation.evaluator_feedback,
        created_at: evaluation.created_at
      };
    }
    
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
    logger.info('Exported single prompt-response pair', { filePath });
    
    return filePath;
  }
  
  /**
   * Update the export path
   */
  setExportPath(path: string): void {
    this.exportPath = path;
    this.ensureExportDirectoryExists();
  }
  
  /**
   * Get the current export path
   */
  getExportPath(): string {
    return this.exportPath;
  }
}

// Export singleton instance
export const dataExporter = new DataExporter(); 