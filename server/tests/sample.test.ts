import { describe, it, expect } from 'vitest';

describe('Sample Test', () => {
  it('should pass', () => {
    expect(true).toBe(true);
  });

  it('should add numbers correctly', () => {
    const add = (a: number, b: number) => a + b;
    expect(add(2, 3)).toBe(5);
  });
});
