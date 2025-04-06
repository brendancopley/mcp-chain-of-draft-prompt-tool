import * as winston from 'winston';
import chalk from 'chalk';

// Insert MetricsData interface
export interface MetricsData {
  duration_ms?: number;
  success?: boolean;
  tokens?: number;
  error?: Error | string;
  details?: any;
}

// Add a new interface for the codOutput property
export interface CodOutput {
  header: (text: string) => void;
  problem: (text: string) => void;
  steps: (text: string) => void;
  answer: (text: string) => void;
  stats: (stats: any) => void;
}

// Update the logger interface to include codOutput
export interface Logger {
  error: (message: string, meta?: any) => void;
  warn: (message: string, meta?: any) => void;
  info: (message: string, meta?: any) => void;
  debug: (message: string, meta?: any) => void;
  trace: (message: string, meta?: any) => void;
  devLog: (message: string, meta?: any) => void;
  metrics: (component: string, operation: string, metrics: MetricsData) => void;
  log: (level: string, message: string, meta?: any) => void;
  codOutput?: CodOutput;
}

// Configure log levels and colors
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  debug: 3,
  trace: 4
};

const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  debug: 'blue',
  trace: 'magenta'
};

winston.addColors(colors);

// Create the logger instance
const winstonLogger = winston.createLogger({
  levels,
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.timestamp(),
        winston.format.printf((info: winston.Logform.TransformableInfo) => `${info.timestamp} ${info.level}: ${info.message}`)
      )
    })
  ]
});

// Helper functions for specialized logging
const consoleLog = (level: string, message: string, meta?: any) => {
  const timestamp = new Date().toISOString();
  const colorFn = level === 'error' ? chalk.red :
                  level === 'warn' ? chalk.yellow :
                  level === 'info' ? chalk.green :
                  level === 'debug' ? chalk.blue :
                  level === 'trace' ? chalk.magenta : chalk.white;
                  
  const formattedMeta = meta ? `\n${JSON.stringify(meta, null, 2)}` : '';
  process.env.NODE_ENV !== 'production' && 
    console.log(colorFn(`[${timestamp}] [${level.toUpperCase()}] ${message}${formattedMeta}`));
  
  winstonLogger.log(level as any, message, meta);
};

// Enhanced logger with metrics
const logMetrics = (
  component: string,
  operation: string,
  metrics: MetricsData
) => {
  const message = `[${component}] ${operation} - ${metrics.success ? 'Success' : 'Failed'}`;
  const level = metrics.success ? 'info' : 'error';
  
  const meta = {
    component,
    operation,
    ...metrics,
    error: metrics.error ? 
      (metrics.error instanceof Error ? 
        { name: metrics.error.name, message: metrics.error.message, stack: metrics.error.stack } : 
        metrics.error) : 
      undefined
  };
  
  consoleLog(level, message, meta);
};

// Specialized logger for dev-only logs
const devLog = (message: string, meta?: any) => {
  if (process.env.NODE_ENV !== 'production' && process.env.DEBUG === 'true') {
    consoleLog('debug', `[DEV] ${message}`, meta);
  }
};

// Create an enhanced logger with all needed methods
export const logger: Logger = {
  error: (message: string, meta?: any) => consoleLog('error', message, meta),
  warn: (message: string, meta?: any) => consoleLog('warn', message, meta),
  info: (message: string, meta?: any) => consoleLog('info', message, meta),
  debug: (message: string, meta?: any) => consoleLog('debug', message, meta),
  trace: (message: string, meta?: any) => consoleLog('trace', message, meta),
  devLog: (message: string, meta?: any) => devLog(message, meta),
  metrics: (component: string, operation: string, metrics: MetricsData) => logMetrics(component, operation, metrics),
  log: (level: string, message: string, meta?: any) => winstonLogger.log(level as any, message, meta),
  codOutput: {
    header: (text: string) => console.log(text),
    problem: (text: string) => console.log(text),
    steps: (text: string) => console.log(text),
    answer: (text: string) => console.log(text),
    stats: (stats: any) => console.log(stats)
  }
}; 