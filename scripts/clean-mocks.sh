#!/bin/bash

# Remove duplicate chalk mocks in NX cache directories
echo "Cleaning up duplicate mocks in .nx cache directories..."
find ./.nx/cache -path "*/__mocks__/chalk.*" -delete

# Create the original mock files if they don't exist
mkdir -p ./dist/utils/__mocks__
if [ ! -f ./dist/utils/__mocks__/chalk.js ]; then
  echo "Creating mock chalk.js file..."
  echo "export default {
  blue: jest.fn(text => text),
  green: jest.fn(text => text),
  red: jest.fn(text => text),
  yellow: jest.fn(text => text),
  grey: jest.fn(text => text),
  gray: jest.fn(text => text),
  cyan: jest.fn(text => text),
  magenta: jest.fn(text => text),
  white: jest.fn(text => text),
  black: jest.fn(text => text),
  redBright: jest.fn(text => text),
  greenBright: jest.fn(text => text),
  blueBright: jest.fn(text => text),
  yellowBright: jest.fn(text => text),
  bold: jest.fn(text => text)
};" > ./dist/utils/__mocks__/chalk.js
fi

if [ ! -f ./dist/utils/__mocks__/chalk.d.ts ]; then
  echo "Creating mock chalk.d.ts file..."
  echo "declare const _default: {
  blue: jest.Mock<any, any>;
  green: jest.Mock<any, any>;
  red: jest.Mock<any, any>;
  yellow: jest.Mock<any, any>;
  grey: jest.Mock<any, any>;
  gray: jest.Mock<any, any>;
  cyan: jest.Mock<any, any>;
  magenta: jest.Mock<any, any>;
  white: jest.Mock<any, any>;
  black: jest.Mock<any, any>;
  redBright: jest.Mock<any, any>;
  greenBright: jest.Mock<any, any>;
  blueBright: jest.Mock<any, any>;
  yellowBright: jest.Mock<any, any>;
  bold: jest.Mock<any, any>;
};
export default _default;" > ./dist/utils/__mocks__/chalk.d.ts
fi

echo "Cleanup complete!" 