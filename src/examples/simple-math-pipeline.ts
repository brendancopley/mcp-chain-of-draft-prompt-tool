#!/usr/bin/env node

import { PipelineBuilder, PipelineStepBuilder } from '../tools/pipeline-factory.js';
import { PipelineStorage } from '../tools/pipeline-storage.js';
import { PipelineExecutor } from '../tools/pipeline-executor.js';
import { ToolRegistry } from '../tools/registry.js';
import chalk from 'chalk';

/**
 * Example script demonstrating a simple math calculation pipeline
 */
async function runSimpleMathPipeline() {
  try {
    console.log(chalk.blue('Simple Math Pipeline Example'));
    console.log(chalk.blue('----------------------------'));
    
    // Initialize components
    const toolRegistry = new ToolRegistry();
    const pipelineStorage = new PipelineStorage();
    const pipelineExecutor = new PipelineExecutor(toolRegistry, pipelineStorage);
    
    // Parse command line arguments for numbers
    const args = process.argv.slice(2);
    const number1 = args.length > 0 ? parseInt(args[0], 10) : 247;
    const number2 = args.length > 1 ? parseInt(args[1], 10) : 394;
    
    console.log(chalk.white(`Using numbers: ${number1} and ${number2}`));
    
    // Create a pipeline for addition
    const additionPipeline = new PipelineBuilder(
      'Addition Pipeline',
      'A pipeline that adds two numbers using Chain of Draft'
    )
      .withGlobalState({
        number1,
        number2
      })
      .withStep(
        new PipelineStepBuilder('formulate_problem', 'string_formatter')
          .withStaticParam('template', 'Solve: ${state.number1} + ${state.number2} = ?')
          .withDefaultNext('solve_problem')
          .build()
      )
      .withStep(
        new PipelineStepBuilder('solve_problem', 'math_solve')
          .withDynamicParam('problem', 'formulate_problem', 'result')
          .withDefaultNext('end')
          .build()
      )
      .withStartStep('formulate_problem')
      .build();
    
    // Store the pipeline
    const savedPipeline = pipelineStorage.createPipeline(additionPipeline);
    
    console.log(chalk.green(`Created pipeline: ${savedPipeline.name} (${savedPipeline.id})`));
    console.log(chalk.blue('\nExecuting pipeline...'));
    
    // Execute the pipeline
    const startTime = Date.now();
    const result = await pipelineExecutor.executePipeline(savedPipeline);
    const endTime = Date.now();
    
    console.log(chalk.blue('\nExecution completed.'));
    console.log(chalk.white(`Execution time: ${(endTime - startTime) / 1000} seconds`));
    
    if (result.status === 'completed') {
      console.log(chalk.green('\nResults:'));
      
      // Get the math_solve result
      const mathResult = result.results.solve_problem;
      if (mathResult && mathResult.success) {
        console.log(chalk.green(`\nProblem: ${number1} + ${number2} = ?`));
        console.log(chalk.green(`Answer: ${mathResult.data.final_answer}`));
        
        if (mathResult.data.reasoning_steps) {
          console.log(chalk.white('\nReasoning Steps:'));
          mathResult.data.reasoning_steps.forEach((step: string, index: number) => {
            console.log(chalk.white(`${index + 1}. ${step}`));
          });
        }
        
        if (mathResult.data.token_count) {
          console.log(chalk.white(`\nToken Count: ${mathResult.data.token_count}`));
        }
      } else {
        console.log(chalk.red('\nMath calculation failed or returned no result.'));
      }
    } else if (result.status === 'failed') {
      console.log(chalk.red('\nPipeline execution failed:'));
      console.log(result.error);
    }
  } catch (error) {
    console.error(chalk.red('Error running math pipeline:'), error);
    process.exit(1);
  }
}

// Execute the example
runSimpleMathPipeline(); 