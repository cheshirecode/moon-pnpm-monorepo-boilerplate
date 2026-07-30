import { describe, it, expect } from 'vitest';
import { deepClone, deepMerge, deepEqual, pick, omit } from './index.js';

describe('deepClone', () => {
  it('clones plain objects', () => {
    const obj = { a: 1, b: { c: 2 } };
    const cloned = deepClone(obj);
    expect(cloned).toEqual(obj);
    expect(cloned).not.toBe(obj);
    expect(cloned.b).not.toBe(obj.b);
  });

  it('clones arrays', () => {
    const arr = [1, [2, 3]];
    const cloned = deepClone(arr);
    expect(cloned).toEqual(arr);
    expect(cloned).not.toBe(arr);
    expect(cloned[1]).not.toBe(arr[1]);
  });

  it('clones Date objects', () => {
    const date = new Date('2024-01-01');
    const cloned = deepClone(date);
    expect(cloned).toEqual(date);
    expect(cloned).not.toBe(date);
  });

  it('clones RegExp objects', () => {
    const re = /test/gi;
    const cloned = deepClone(re);
    expect(cloned.toString()).toBe(re.toString());
    expect(cloned).not.toBe(re);
  });

  it('clones Map objects', () => {
    const map = new Map([['a', { b: 1 }]]);
    const cloned = deepClone(map);
    expect(cloned.get('a')).toEqual({ b: 1 });
    expect(cloned.get('a')).not.toBe(map.get('a'));
  });

  it('clones Set objects', () => {
    const set = new Set([{ a: 1 }]);
    const cloned = deepClone(set);
    expect(cloned.size).toBe(1);
    const origVal = [...set][0];
    const clonedVal = [...cloned][0];
    expect(clonedVal).toEqual(origVal);
    expect(clonedVal).not.toBe(origVal);
  });

  it('returns primitives as-is', () => {
    expect(deepClone(42)).toBe(42);
    expect(deepClone('hello')).toBe('hello');
    expect(deepClone(null)).toBe(null);
    expect(deepClone(undefined)).toBe(undefined);
  });
});

describe('deepMerge', () => {
  it('merges nested objects', () => {
    const target = { a: 1, b: { c: 2 } };
    const source = { b: { d: 3 }, e: 4 };
    const result = deepMerge(target, source);
    expect(result).toEqual({ a: 1, b: { c: 2, d: 3 }, e: 4 });
  });

  it('overwrites scalar values', () => {
    const result = deepMerge({ a: 1 }, { a: 2 });
    expect(result).toEqual({ a: 2 });
  });

  it('handles multiple sources', () => {
    const result = deepMerge({ a: 1 }, { b: 2 }, { c: 3 });
    expect(result).toEqual({ a: 1, b: 2, c: 3 });
  });

  it('does not mutate the target reference', () => {
    const target = { a: { b: 1 } };
    const result = deepMerge(target, { a: { c: 2 } });
    expect(target).toEqual({ a: { b: 1 } });
    expect(result).toEqual({ a: { b: 1, c: 2 } });
    expect(result).not.toBe(target);
  });
});

describe('deepEqual', () => {
  it('returns true for equal objects', () => {
    expect(deepEqual({ a: 1, b: { c: 2 } }, { a: 1, b: { c: 2 } })).toBe(true);
  });

  it('returns false for different objects', () => {
    expect(deepEqual({ a: 1 }, { a: 2 })).toBe(false);
  });

  it('compares Dates', () => {
    expect(deepEqual(new Date('2024-01-01'), new Date('2024-01-01'))).toBe(true);
    expect(deepEqual(new Date('2024-01-01'), new Date('2024-02-01'))).toBe(false);
  });

  it('compares Maps', () => {
    expect(deepEqual(new Map([['a', 1]]), new Map([['a', 1]]))).toBe(true);
    expect(deepEqual(new Map([['a', 1]]), new Map([['a', 2]]))).toBe(false);
  });

  it('compares Sets', () => {
    expect(deepEqual(new Set([1, 2]), new Set([1, 2]))).toBe(true);
    expect(deepEqual(new Set([1, 2]), new Set([1, 3]))).toBe(false);
  });

  it('returns true for same reference', () => {
    const obj = { a: 1 };
    expect(deepEqual(obj, obj)).toBe(true);
  });
});

describe('pick', () => {
  it('picks specified keys from an object', () => {
    const obj = { a: 1, b: 2, c: 3 };
    expect(pick(obj, ['a', 'c'])).toEqual({ a: 1, c: 3 });
  });

  it('ignores missing keys', () => {
    const obj = { a: 1 };
    expect(pick(obj, ['a', 'b'])).toEqual({ a: 1 });
  });
});

describe('omit', () => {
  it('omits specified keys from an object', () => {
    const obj = { a: 1, b: 2, c: 3 };
    expect(omit(obj, ['a', 'c'])).toEqual({ b: 2 });
  });

  it('returns all keys when omitting none', () => {
    const obj = { a: 1, b: 2 };
    expect(omit(obj, [])).toEqual({ a: 1, b: 2 });
  });
});