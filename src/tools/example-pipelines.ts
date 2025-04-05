import { PipelineBuilder, PipelineStepBuilder } from './pipeline-factory.js';
import { PipelineStorage } from './pipeline-storage.js';

/**
 * Creates example pipelines and registers them with the pipeline storage
 */
export function createExamplePipelines(pipelineStorage: PipelineStorage): void {
  // Create a simple data analysis pipeline
  const dataAnalysisPipeline = new PipelineBuilder(
    'Data Analysis Pipeline',
    'A pipeline that loads data, analyzes it, and generates a report'
  )
    .withGlobalState({
      dataSource: 'example-data.csv',
      analysisType: 'regression'
    })
    .withStep(
      new PipelineStepBuilder('load_data', 'data_loader')
        .withStaticParam('source', '${state.dataSource}')
        .withDefaultNext('clean_data')
        .withHumanInTheLoop('Review data loading results before proceeding')
        .onFailure('handle_error')
        .build()
    )
    .withStep(
      new PipelineStepBuilder('clean_data', 'data_cleaner')
        .withDynamicParam('data', 'load_data', 'data')
        .withStaticParam('dropNa', true)
        .withDefaultNext('analyze_data')
        .onFailure('handle_error')
        .build()
    )
    .withStep(
      new PipelineStepBuilder('analyze_data', 'data_analyzer')
        .withDynamicParam('data', 'clean_data', 'cleanedData')
        .withStaticParam('analysisType', '${state.analysisType}')
        .withDefaultNext('generate_report')
        .onFailure('handle_error')
        .build()
    )
    .withStep(
      new PipelineStepBuilder('generate_report', 'report_generator')
        .withDynamicParam('analysisResult', 'analyze_data', 'result')
        .withStaticParam('format', 'pdf')
        .withDefaultNext('end')
        .withHumanInTheLoop('Review the report before finalizing')
        .onFailure('handle_error')
        .build()
    )
    .withStep(
      new PipelineStepBuilder('handle_error', 'error_handler')
        .withStaticParam('notifyAdmin', true)
        .withDefaultNext('end')
        .build()
    )
    .withStartStep('load_data')
    .withCompletionHandler('notify_completion')
    .withErrorHandler('log_error')
    .build();
  
  // Create an iterative data processing pipeline with loops
  const iterativeProcessingPipeline = new PipelineBuilder(
    'Iterative Data Processing',
    'Process multiple data sources with iteration and human approval for critical steps'
  )
    .withGlobalState({
      dataSources: ['source1.csv', 'source2.csv', 'source3.csv'],
      processingMode: 'batch'
    })
    .withStep(
      new PipelineStepBuilder('initialize', 'initializer')
        .withStaticParam('mode', '${state.processingMode}')
        .withDefaultNext('process_sources')
        .onFailure('handle_error')
        .build()
    )
    .withStep(
      new PipelineStepBuilder('process_sources', 'iterator')
        .withStaticParam('sources', '${state.dataSources}')
        .withForLoop(100, 'sourceIndex', 0, 1)
        .withDefaultNext('process_single_source')
        .withCondition('state.sourceIndex >= state.dataSources.length', 'finalize')
        .onFailure('handle_error')
        .build()
    )
    .withStep(
      new PipelineStepBuilder('process_single_source', 'data_processor')
        .withStaticParam('source', '${state.dataSources[state.sourceIndex]}')
        .withDefaultNext('validate_result')
        .onFailure('handle_source_error')
        .build()
    )
    .withStep(
      new PipelineStepBuilder('validate_result', 'validator')
        .withDynamicParam('processingResult', 'process_single_source', 'result')
        .withCondition('result.valid === true', 'save_result')
        .withCondition('result.valid === false', 'handle_source_error')
        .onFailure('handle_error')
        .build()
    )
    .withStep(
      new PipelineStepBuilder('save_result', 'data_saver')
        .withDynamicParam('result', 'process_single_source', 'result')
        .withStaticParam('destination', 'processed/${state.dataSources[state.sourceIndex]}')
        .withDefaultNext('process_sources')
        .onFailure('handle_source_error')
        .build()
    )
    .withStep(
      new PipelineStepBuilder('handle_source_error', 'error_handler')
        .withStaticParam('source', '${state.dataSources[state.sourceIndex]}')
        .withStaticParam('severity', 'warning')
        .withDefaultNext('process_sources')
        .build()
    )
    .withStep(
      new PipelineStepBuilder('finalize', 'result_aggregator')
        .withStaticParam('generateSummary', true)
        .withDefaultNext('end')
        .withHumanInTheLoop('Review the final processing summary before completing')
        .onFailure('handle_error')
        .build()
    )
    .withStep(
      new PipelineStepBuilder('handle_error', 'error_handler')
        .withStaticParam('notifyAdmin', true)
        .withStaticParam('severity', 'error')
        .withDefaultNext('end')
        .build()
    )
    .withStartStep('initialize')
    .build();
  
  // Register the example pipelines
  pipelineStorage.createPipeline(dataAnalysisPipeline);
  pipelineStorage.createPipeline(iterativeProcessingPipeline);
} 