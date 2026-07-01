import { describe, expect, it } from 'vitest';

import {
  deepFilter,
  getIntervals,
  getRoundedToNearest,
  isEmptyObject,
  pascalToSeparatedWords,
  splitAlphanumeric,
  toCamel,
  toHyphen,
  toSpaced,
  toUnderscore
} from './index';

describe('app utils', () => {
  it('converts string cases', () => {
    expect(pascalToSeparatedWords('fontFamily')).toBe('font-family');
    expect(pascalToSeparatedWords('FontFamily')).toBe('font-family');
    expect(pascalToSeparatedWords('fontFamily', '_')).toBe('font_family');
    expect(toCamel('moz-border-radius')).toBe('mozBorderRadius');
    expect(toCamel('_snake_case')).toBe('SnakeCase');
    expect(toUnderscore('1-2--3 4')).toBe('1_2_3_4');
    expect(toHyphen('1_2__3 4')).toBe('1-2-3-4');
    expect(toSpaced('1_2--3 4')).toBe('1 2 3 4');
  });

  it('splits alphanumeric segments', () => {
    expect(splitAlphanumeric('')).toBeNull();
    expect(splitAlphanumeric('a1b2')).toEqual(['a', '1', 'b', '2']);
  });

  it('deeply filters nested values by search terms', () => {
    expect(deepFilter(['123', '145', '2'], '1,4,')).toEqual(['145']);
    expect(deepFilter(['os-windows', 'os-mac', 'os-linux'], 'os-linux')).toEqual([
      'os-linux'
    ]);
    expect(
      deepFilter(
        [
          '123',
          ['1', '2', '3'],
          '23',
          { foo: '123' },
          { bar: ['1', '2', '3'] },
          { deepFoo: { foo: '123' } }
        ],
        '1'
      )
    ).toEqual([
      '123',
      ['1', '2', '3'],
      { foo: '123' },
      { bar: ['1', '2', '3'] },
      { deepFoo: { foo: '123' } }
    ]);
  });

  it('rounds integers to useful buckets', () => {
    expect(getRoundedToNearest(0)).toBe(0);
    expect(getRoundedToNearest(12)).toBe(20);
    expect(getRoundedToNearest(105, 2)).toBe(110);
    expect(getRoundedToNearest(105, 4, false)).toBe(100);
    expect(getRoundedToNearest(-12, 2, false)).toBe(-10);
  });

  it('creates sorted clamped intervals', () => {
    expect(getIntervals([], 0)).toEqual([]);
    expect(getIntervals([1, 10, 20, 50], 11)).toEqual([1, 11]);
    expect(getIntervals([], 100)).toEqual([25, 50, 100]);
    expect(getIntervals([1, 10, 20, 50, 100, 250], 501)).toEqual([
      100,
      250,
      501
    ]);
  });

  it('detects objects with only configured empty values', () => {
    expect(isEmptyObject(null)).toBe(false);
    expect(isEmptyObject({})).toBe(true);
    expect(isEmptyObject({ a: 1 })).toBe(false);
    expect(isEmptyObject({ a: undefined, b: null })).toBe(true);
    expect(isEmptyObject({ a: '', b: null }, ['', null])).toBe(true);
  });
});
