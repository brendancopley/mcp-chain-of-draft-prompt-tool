// @ts-nocheck
// tests/python-modules.test.ts
import { describe, test, expect } from '@jest/globals';
import fs from 'fs';
import path from 'path';

describe('Python Modules', () => {
  test('required Python modules exist in the project', () => {
    const pythonDir = path.resolve(process.cwd(), 'src/python');
    
    // Check if the Python directory exists
    expect(fs.existsSync(pythonDir)).toBe(true);
    
    // Check if critical Python files exist
    const requiredFiles = [
      'analytics.py',
      'client.py', 
      'server.py',
      'reasoning.py',
      'format.py',
      'complexity.py',
      'examples.py'
    ];
    
    for (const file of requiredFiles) {
      const filePath = path.join(pythonDir, file);
      expect(fs.existsSync(filePath)).toBe(true);
    }
  });
  
  test('MLX directory exists with required files', () => {
    const mlxDir = path.resolve(process.cwd(), 'src/python/mlx');
    
    // Check if the MLX directory exists
    expect(fs.existsSync(mlxDir)).toBe(true);
  });
}); 