#!/usr/bin/env node

/**
 * This script checks if the environment is properly set up to run the Chain of Draft MCP.
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

// Get the directory of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

// ANSI color codes for pretty output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m'
};

console.log(`${colors.cyan}========================================${colors.reset}`);
console.log(`${colors.cyan}  Chain of Draft MCP Environment Check  ${colors.reset}`);
console.log(`${colors.cyan}========================================${colors.reset}`);

let allPassed = true;

// Check if package.json exists
function checkPackageJson() {
  console.log(`\n${colors.magenta}Checking package.json...${colors.reset}`);
  
  const packageJsonPath = path.join(projectRoot, 'package.json');
  if (fs.existsSync(packageJsonPath)) {
    const pkg = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    console.log(`${colors.green}✓ package.json exists${colors.reset}`);
    console.log(`  - Name: ${pkg.name}`);
    console.log(`  - Version: ${pkg.version}`);
    
    // Check if required dependencies are installed
    console.log(`\n${colors.magenta}Checking dependencies...${colors.reset}`);
    const requiredDeps = ['jest', 'ts-jest', 'typescript'];
    const missingDeps = [];
    
    for (const dep of requiredDeps) {
      if (!pkg.dependencies?.[dep] && !pkg.devDependencies?.[dep]) {
        missingDeps.push(dep);
      }
    }
    
    if (missingDeps.length > 0) {
      console.log(`${colors.red}✗ Missing dependencies: ${missingDeps.join(', ')}${colors.reset}`);
      console.log(`  - Run: npm install --save-dev ${missingDeps.join(' ')}`);
      allPassed = false;
    } else {
      console.log(`${colors.green}✓ All required dependencies are installed${colors.reset}`);
    }
  } else {
    console.log(`${colors.red}✗ package.json not found${colors.reset}`);
    allPassed = false;
  }
}

// Check if tsconfig.json exists
function checkTsConfig() {
  console.log(`\n${colors.magenta}Checking TypeScript configuration...${colors.reset}`);
  
  const tsconfigPath = path.join(projectRoot, 'tsconfig.json');
  if (fs.existsSync(tsconfigPath)) {
    console.log(`${colors.green}✓ tsconfig.json exists${colors.reset}`);
  } else {
    console.log(`${colors.red}✗ tsconfig.json not found${colors.reset}`);
    allPassed = false;
  }
}

// Check if dist directory exists
function checkDistDirectory() {
  console.log(`\n${colors.magenta}Checking build output...${colors.reset}`);
  
  const distPath = path.join(projectRoot, 'dist');
  if (fs.existsSync(distPath)) {
    console.log(`${colors.green}✓ dist directory exists${colors.reset}`);
    
    // Check if index.js exists in dist
    const indexPath = path.join(distPath, 'index.js');
    if (fs.existsSync(indexPath)) {
      console.log(`${colors.green}✓ dist/index.js exists${colors.reset}`);
    } else {
      console.log(`${colors.yellow}⚠ dist/index.js not found${colors.reset}`);
      console.log(`  - Run: npm run build`);
      allPassed = false;
    }
  } else {
    console.log(`${colors.yellow}⚠ dist directory not found${colors.reset}`);
    console.log(`  - Run: npm run build`);
    allPassed = false;
  }
}

// Check if tests directory exists
function checkTestsDirectory() {
  console.log(`\n${colors.magenta}Checking tests...${colors.reset}`);
  
  const testsPath = path.join(projectRoot, 'tests');
  if (fs.existsSync(testsPath)) {
    console.log(`${colors.green}✓ tests directory exists${colors.reset}`);
    
    // Check if test files exist
    const testFiles = fs.readdirSync(testsPath).filter(file => file.endsWith('.test.ts'));
    if (testFiles.length > 0) {
      console.log(`${colors.green}✓ Found ${testFiles.length} test files: ${testFiles.join(', ')}${colors.reset}`);
    } else {
      console.log(`${colors.yellow}⚠ No test files found in tests directory${colors.reset}`);
      allPassed = false;
    }
  } else {
    console.log(`${colors.red}✗ tests directory not found${colors.reset}`);
    allPassed = false;
  }
}

// Check if jest.config.js exists
function checkJestConfig() {
  console.log(`\n${colors.magenta}Checking Jest configuration...${colors.reset}`);
  
  const jestConfigPath = path.join(projectRoot, 'jest.config.js');
  if (fs.existsSync(jestConfigPath)) {
    console.log(`${colors.green}✓ jest.config.js exists${colors.reset}`);
  } else {
    console.log(`${colors.red}✗ jest.config.js not found${colors.reset}`);
    allPassed = false;
  }
}

// Run the checks
checkPackageJson();
checkTsConfig();
checkDistDirectory();
checkTestsDirectory();
checkJestConfig();

// Print summary
console.log(`\n${colors.cyan}========================================${colors.reset}`);
console.log(`${colors.cyan}  Environment Check Summary  ${colors.reset}`);
console.log(`${colors.cyan}========================================${colors.reset}`);

if (allPassed) {
  console.log(`\n${colors.green}All checks passed! The environment is ready to run the Chain of Draft MCP.${colors.reset}`);
  console.log(`\nYou can run the following commands:`);
  console.log(`  - ${colors.cyan}npm run build${colors.reset}: Build the project`);
  console.log(`  - ${colors.cyan}npm test${colors.reset}: Run all tests`);
  console.log(`  - ${colors.cyan}npm run test:unit${colors.reset}: Run unit tests only`);
  console.log(`  - ${colors.cyan}npm run test:integration${colors.reset}: Run integration tests only`);
  console.log(`  - ${colors.cyan}node dist/index.js "Your problem here"${colors.reset}: Run the MCP with a problem`);
} else {
  console.log(`\n${colors.red}Some checks failed. Please fix the issues above before running the MCP.${colors.reset}`);
  process.exit(1);
} 