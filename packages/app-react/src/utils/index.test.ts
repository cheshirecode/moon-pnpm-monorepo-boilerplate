/**
 * @vitest-environment node
 */
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
  toUnderscore
} from './';

describe('@/utils', () => {
  it('pascalToSeparatedWords', () => {
    expect(pascalToSeparatedWords('')).toEqual('');
    expect(pascalToSeparatedWords({})).toEqual('[object-object]');
    expect(pascalToSeparatedWords('fontFamily')).toEqual('font-family');
    expect(pascalToSeparatedWords('fontFamilyExtra')).toEqual('font-family-extra');
    expect(pascalToSeparatedWords('FontFamily')).toEqual('font-family');
    expect(pascalToSeparatedWords('fontFamily', '_')).toEqual('font_family');
    expect(pascalToSeparatedWords('font-family', '_')).toEqual('font-family');
  });

  it('splitAlphanumeric', () => {
    expect(splitAlphanumeric('')).toEqual(null);
    expect(splitAlphanumeric([])).toEqual(null);
    expect(splitAlphanumeric({})).toEqual(['[object', 'Object]']);
    expect(splitAlphanumeric('Aa')).toEqual(['Aa']);
    expect(splitAlphanumeric('a1b2')).toEqual(['a', '1', 'b', '2']);
  });

  it('toCamel', () => {
    expect(toCamel('')).toEqual('');
    expect(toCamel('fooBar')).toEqual('fooBar');
    expect(toCamel('-moz-border-radius')).toEqual('MozBorderRadius');
    expect(toCamel('moz-border-radius')).toEqual('mozBorderRadius');
    expect(toCamel('snake_case')).toEqual('snakeCase');
    expect(toCamel('_snake_case')).toEqual('SnakeCase');
  });

  it('toUnderscore', () => {
    expect(toUnderscore('')).toEqual('');
    expect(toUnderscore('1-2--3---4 5  6   7')).toEqual('1_2_3_4_5_6_7');
  });

  it('toHyphen', () => {
    expect(toHyphen('')).toEqual('');
    expect(toHyphen('1_2__3___4 5  6   7')).toEqual('1-2-3-4-5-6-7');
  });

  it('deepFilter', () => {
    expect(deepFilter([])).toEqual([]);
    expect(deepFilter([], '')).toEqual([]);
    expect(deepFilter(['123'], '12')).toEqual(['123']);
    expect(deepFilter(['123', '145', '2'], '1,4,')).toEqual(['145']);
    expect(deepFilter(['123'], '124')).toEqual([]);
    expect(deepFilter(['123', ['1', '2', '3'], ['2', '3']], '1')).toEqual(['123', ['1', '2', '3']]);
    expect(
      deepFilter(
        [
          '123',
          ['1', '2', '3'],
          '23',
          {
            foo: '123'
          },
          {
            bar: ['1', '2', '3']
          },
          {
            deepFoo: {
              foo: '123'
            }
          }
        ],
        '1'
      )
    ).toEqual([
      '123',
      ['1', '2', '3'],
      {
        foo: '123'
      },
      {
        bar: ['1', '2', '3']
      },
      {
        deepFoo: {
          foo: '123'
        }
      }
    ]);

    expect(deepFilter(['os-windows', 'os-mac', 'os-linux'], 'os-linux')).toEqual(['os-linux']);
    expect(deepFilter(['os-windows', 'os-mac', 'os-linux'], 'os')).toEqual([
      'os-windows',
      'os-mac',
      'os-linux'
    ]);
  });

  it('getRoundedToNearest', () => {
    expect(getRoundedToNearest(0)).toEqual(0);
    expect(getRoundedToNearest(12)).toEqual(20);
    expect(getRoundedToNearest(105)).toEqual(200);
    expect(getRoundedToNearest(105, 2)).toEqual(110);
    expect(getRoundedToNearest(105, 4)).toEqual(200);
    expect(getRoundedToNearest(105, 4, false)).toEqual(100);
    expect(getRoundedToNearest(105, 0, false)).toEqual(100);
    expect(getRoundedToNearest(105)).toEqual(200);
    expect(getRoundedToNearest(-12, 2, false)).toEqual(-10);
  });

  it('getIntervals', () => {
    expect(getIntervals([], 0)).toEqual([]);
    expect(getIntervals([1, 10, 20, 50], 11)).toEqual([1, 11]);
    expect(getIntervals([1, 10, 20, 50], 11, 1)).toEqual([11]);
    expect(getIntervals([], 11, 2)).toEqual([5, 11]);
    expect(getIntervals([10, 20, 50], 11)).toEqual([11]);
    expect(getIntervals([1, 10, 20, 50, 100, 250], 51)).toEqual([10, 20, 51]);
    expect(getIntervals([1, 17, 20, 22, 50, 100, 250], 51)).toEqual([17, 22, 51]);
    expect(getIntervals([1, 10, 20, 50, 100, 250], 501)).toEqual([100, 250, 501]);
    expect(getIntervals([10, 20, 250], [0, 501], 2)).toEqual([250, 501]);
    expect(getIntervals([10, 29, 30, 31], 100)).toEqual([10, 31, 100]);
    expect(getIntervals([10, 29, 30, 31], [20, 100])).toEqual([31, 100]);
    expect(getIntervals([], 1)).toEqual([1]);
    expect(getIntervals([], 10)).toEqual([3, 5, 10]);
    expect(getIntervals([], 19)).toEqual([3, 5, 19]);
    expect(getIntervals([], 21)).toEqual([5, 10, 21]);
    expect(getIntervals([], 100)).toEqual([25, 50, 100]);
    expect(getIntervals([], 101)).toEqual([25, 50, 101]);
    expect(getIntervals([], 700)).toEqual([175, 350, 700]);
    expect(getIntervals([], 800)).toEqual([200, 400, 800]);
    expect(getIntervals([], 900)).toEqual([225, 450, 900]);
    expect(getIntervals([], 1000)).toEqual([250, 500, 1000]);
  });

  it('isEmptyObject', () => {
    expect(isEmptyObject(null)).toEqual(false);
    expect(isEmptyObject({})).toEqual(true);
    expect(isEmptyObject({ a: 1 })).toEqual(false);
    expect(isEmptyObject({ a: undefined, b: null })).toEqual(true);
    expect(isEmptyObject({ a: '', b: null }, ['', null])).toEqual(true);
  });
});
