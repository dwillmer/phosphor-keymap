// Type definitions for clear-cut 2.0.1
// Project: https://github.com/atom/clear-cut
// Definitions by: S. Chris Colbert <https://github.com/sccolbert>
declare module 'clear-cut' {
  export function calculateSpecificity(selector: string): number;
  export function isSelectorValid(selector: string): boolean;
  export function validateSelector(selector: string): void;
}
