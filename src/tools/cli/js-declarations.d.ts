/**
 * TypeScript declarations for JavaScript CLI files
 */

// Declare module for all JavaScript files in the CLI directory
declare module '*.js' {
  const content: any;
  export default content;
  export * from content;
} 