import chalk from 'chalk';

export const logger = {
  info: (message: string, ...args: any[]) => {
    console.log(chalk.blue('ℹ'), chalk.blue(message), ...args);
  },
  
  success: (message: string, ...args: any[]) => {
    console.log(chalk.green('✓'), chalk.green(message), ...args);
  },
  
  warning: (message: string, ...args: any[]) => {
    console.warn(chalk.yellow('⚠'), chalk.yellow(message), ...args);
  },
  
  error: (message: string, ...args: any[]) => {
    console.error(chalk.red('✖'), chalk.red(message), ...args);
  },
  
  debug: (message: string, ...args: any[]) => {
    console.log(chalk.gray('🔍'), chalk.gray(message), ...args);
  },
  
  highlight: (message: string, ...args: any[]) => {
    console.log(chalk.cyan('→'), chalk.cyan(message), ...args);
  },

  devLog: (message: string, ...args: any[]) => {
    if (process.env.NODE_ENV === 'development') {
      console.log(chalk.gray('[DEV]'), chalk.gray(message), ...args);
    }
  },

  // Special formatting for Chain of Draft outputs
  codOutput: {
    header: (text: string) => console.log(chalk.bold.magenta('\n=== ' + text + ' ===\n')),
    problem: (text: string) => console.log(chalk.yellow('Problem: ') + text),
    steps: (steps: string) => console.log(chalk.cyan('Reasoning Steps:\n') + steps),
    answer: (text: string) => console.log(chalk.green('\nFinal Answer: ') + text),
    stats: (stats: Record<string, any>) => {
      console.log(chalk.blue('\nStats:'));
      Object.entries(stats).forEach(([key, value]) => {
        console.log(chalk.blue(`- ${key}: `) + chalk.white(value));
      });
    }
  }
}; 