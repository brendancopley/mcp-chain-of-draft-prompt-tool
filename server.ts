#!/usr/bin/env node

/**
 * Node.js wrapper for the Chain of Draft Python server
 * This provides better compatibility with Claude Desktop
 */

import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

// Get current file directory in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Path to the Python server script
const serverPath = path.join(__dirname, 'server.py');

// Error if server.py doesn't exist
if (!fs.existsSync(serverPath)) {
  console.error(`Error: Server file not found at ${serverPath}`);
  process.exit(1);
}

// Launch the Python process with debugging
console.error(`Starting Python process: python3 ${serverPath}`);
const pythonProcess = spawn('python3', [serverPath], {
  env: {
    ...process.env,
    PYTHONUNBUFFERED: '1', // Ensure Python output isn't buffered
    DEBUG: '1'
  },
  stdio: ['pipe', 'pipe', 'pipe']  // Explicitly define stdio
});

// Keep the process alive by sending a dummy input occasionally
const keepAlive = setInterval(() => {
  // Just checking if process is still running
  if (pythonProcess.killed) {
    clearInterval(keepAlive);
    console.error("Python process was killed, exiting");
    process.exit(1);
  }
}, 5000);

// Pass stdin to the Python process
process.stdin.pipe(pythonProcess.stdin);

// Pipe Python's stdout to our stdout
pythonProcess.stdout.pipe(process.stdout);

// Log stderr but don't pipe it to avoid protocol errors
pythonProcess.stderr.on('data', (data: Buffer) => {
  console.error(`[COD Server]: ${data}`);
});

// Handle process termination
pythonProcess.on('close', (code: number | null) => {
  console.error(`Chain of Draft server exited with code ${code}`);
  process.exit(code || 1);
});

// Forward termination signals
process.on('SIGINT', () => {
  pythonProcess.kill('SIGINT');
});

process.on('SIGTERM', () => {
  pythonProcess.kill('SIGTERM');
}); 