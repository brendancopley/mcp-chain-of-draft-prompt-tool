#!/usr/bin/env node

/**
 * Node.js wrapper for the Chain of Draft Python server
 * This provides better compatibility with Claude Desktop
 */

import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { logger } from './utils/logger.js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();


// Get current file directory in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Path to the Python server script
const serverPath = path.join(__dirname, 'server.py');

logger.devLog('Server initialization', {
  serverPath,
  nodeEnv: process.env.NODE_ENV,
  cwd: process.cwd(),
  pythonPath: process.env.PYTHON_PATH || 'python3'
});

// Error if server.py doesn't exist
if (!fs.existsSync(serverPath)) {
  logger.error(`Server file not found at ${serverPath}`);
  process.exit(1);
}

// Launch the Python process with debugging
logger.debug(`Starting Python process: python3 ${serverPath}`);

const pythonProcess = spawn('python3', [serverPath], {
  env: {
    ...process.env,
    PYTHONUNBUFFERED: '1', // Ensure Python output isn't buffered
    DEBUG: process.env.NODE_ENV === 'development' ? '1' : '0'
  },
  stdio: ['pipe', 'pipe', 'pipe']  // Explicitly define stdio
});

logger.devLog('Python process spawned', {
  pid: pythonProcess.pid,
  spawnargs: pythonProcess.spawnargs,
  env: {
    PYTHONUNBUFFERED: process.env.PYTHONUNBUFFERED,
    DEBUG: process.env.DEBUG
  }
});

// Keep the process alive by sending a dummy input occasionally
const keepAlive = setInterval(() => {
  // Just checking if process is still running
  if (pythonProcess.killed) {
    clearInterval(keepAlive);
    logger.error("Python process was killed, exiting");
    logger.devLog('Python process killed', {
      pid: pythonProcess.pid,
      exitCode: pythonProcess.exitCode,
      signalCode: pythonProcess.signalCode
    });
    process.exit(1);
  }
}, 5000);

// Pass stdin to the Python process
process.stdin.pipe(pythonProcess.stdin);

// Pipe Python's stdout to our stdout
pythonProcess.stdout.pipe(process.stdout);

// Log stderr but don't pipe it to avoid protocol errors
pythonProcess.stderr.on('data', (data: Buffer) => {
  process.stderr.write(data);
  if (process.env.NODE_ENV === 'development') {
    logger.devLog('Python stderr', data.toString());
  }
});

// Handle process termination
pythonProcess.on('close', (code: number | null) => {
  if (code === null) {
    logger.error('Python process was killed, exiting');
    logger.devLog('Python process terminated', {
      pid: pythonProcess.pid,
      exitCode: pythonProcess.exitCode,
      signalCode: pythonProcess.signalCode
    });
  } else {
    logger.error(`Chain of Draft server exited with code ${code}`);
    logger.devLog('Python process exited', {
      pid: pythonProcess.pid,
      code,
      signalCode: pythonProcess.signalCode
    });
  }
  process.exit(code || 1);
});

// Forward termination signals
process.on('SIGINT', () => {
  logger.devLog('Received SIGINT signal');
  pythonProcess.kill('SIGINT');
});

process.on('SIGTERM', () => {
  logger.devLog('Received SIGTERM signal');
  pythonProcess.kill('SIGTERM');
});

export async function startServer() {
  const serverPath = path.join(process.cwd(), 'server.py');

  logger.devLog('Starting server', {
    serverPath,
    nodeEnv: process.env.NODE_ENV,
    development: process.env.NODE_ENV === 'development'
  });

  if (!fs.existsSync(serverPath)) {
    logger.error(`Server file not found at ${serverPath}`);
    process.exit(1);
  }

  logger.debug(`Starting Python process: python3 ${serverPath}`);

  const pythonProcess = spawn('python3', [serverPath], {
    stdio: ['pipe', 'pipe', 'pipe'],
    env: {
      ...process.env,
      PYTHONUNBUFFERED: '1',
      DEBUG: process.env.NODE_ENV === 'development' ? '1' : '0'
    }
  });

  logger.devLog('Server process spawned', {
    pid: pythonProcess.pid,
    spawnargs: pythonProcess.spawnargs
  });

  pythonProcess.stdout.on('data', (data) => {
    process.stdout.write(data);
    if (process.env.NODE_ENV === 'development') {
      logger.devLog('Python stdout', data.toString());
    }
  });

  pythonProcess.stderr.on('data', (data) => {
    process.stderr.write(data);
    if (process.env.NODE_ENV === 'development') {
      logger.devLog('Python stderr', data.toString());
    }
  });

  pythonProcess.on('close', (code) => {
    if (code === null) {
      logger.error('Python process was killed, exiting');
      logger.devLog('Server process killed', {
        pid: pythonProcess.pid,
        exitCode: pythonProcess.exitCode
      });
    } else {
      logger.error(`Chain of Draft server exited with code ${code}`);
      logger.devLog('Server process exited', {
        pid: pythonProcess.pid,
        code
      });
    }
    process.exit(code || 1);
  });

  return pythonProcess;
}
