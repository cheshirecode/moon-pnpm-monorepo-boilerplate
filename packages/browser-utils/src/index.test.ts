import { describe, expect, it, vi } from 'vitest';

import {
  buildQueryUrl,
  clearQueryUrl,
  composeValidators,
  createQuerySearchParams,
  createUrlSearchParams,
  deepFilter,
  deleteQueryParams,
  getIntervals,
  getQueryParam,
  getRoundedToNearest,
  isEmptyObject,
  normalizeQueryValue,
  pascalToSeparatedWords,
  replaceQueryUrl,
  splitAlphanumeric,
  toCamel,
  toHyphen,
  toSpaced,
  toUnderscore,
  validateEmail,
  validateMaxLength,
  validateMinLength,
  validateName,
  validatePhone,
  validateRequired
} from './index';

describe('browser utils', () => {
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

  it('validates email addresses', () => {
    expect(validateEmail('user@example.com')).toBeUndefined();
    expect(validateEmail('test.user+tag@domain.co.uk')).toBeUndefined();
    expect(validateEmail('')).toBe('Email is required');
    expect(validateEmail('missing@domain')).toBe(
      'Please enter a valid email address'
    );
  });

  it('validates North American phone-like values', () => {
    expect(validatePhone('1234567890')).toBeUndefined();
    expect(validatePhone('11234567890')).toBeUndefined();
    expect(validatePhone('(123) 456-7890')).toBeUndefined();
    expect(validatePhone('')).toBe('Phone number is required');
    expect(validatePhone('12345')).toBe(
      'Phone number must be at least 10 digits'
    );
    expect(validatePhone('123456789012')).toBe('Phone number is too long');
  });

  it('validates required and length constraints', () => {
    expect(validateRequired('value')).toBeUndefined();
    expect(validateRequired('   ', 'Email')).toBe('Email is required');
    expect(validateMinLength('hello', 5)).toBeUndefined();
    expect(validateMinLength('hi', 5, 'Password')).toBe(
      'Password must be at least 5 characters'
    );
    expect(validateMaxLength('hello', 5)).toBeUndefined();
    expect(validateMaxLength('too long value', 5, 'Bio')).toBe(
      'Bio must be no more than 5 characters'
    );
  });

  it('validates simple person names', () => {
    expect(validateName('Mary-Jane')).toBeUndefined();
    expect(validateName("O'Brien")).toBeUndefined();
    expect(validateName('John123')).toBe(
      'Name can only contain letters, spaces, hyphens, and apostrophes'
    );
    expect(validateName('A', 'Last Name')).toBe(
      'Last Name must be at least 2 characters'
    );
  });

  it('composes validators and stops at the first error', () => {
    let secondValidatorCalled = false;
    const validator = composeValidators(
      () => 'First error',
      () => {
        secondValidatorCalled = true;
        return undefined;
      }
    );

    expect(validator('test')).toBe('First error');
    expect(secondValidatorCalled).toBe(false);
    expect(composeValidators()('anything')).toBeUndefined();
  });

  it('creates native search params with chainable helpers', () => {
    expect(createUrlSearchParams()).toBeInstanceOf(URLSearchParams);
    expect(createUrlSearchParams('').toString()).toBe('');
    expect(createUrlSearchParams('', 'string').toString()).toBe('');
  });

  it('sets, appends, deletes, and serializes bulk params', () => {
    const params = createUrlSearchParams('', { k: 0 });

    expect(params.toString()).toBe('k=0');
    expect(params.setBulk({ k1: {} }).toString()).toBe('k=0&k1=%5Bobject+Object%5D');
    expect(params.setBulk({ k1: 1, k2: 2 }).toString()).toBe('k=0&k1=1&k2=2');
    expect(params.setBulk({ k2: '3' }, true).toString()).toBe(
      'k=0&k1=1&k2=2&k2=3'
    );
    expect(params.setBulk({ k2: '' }).toString()).toBe('k=0&k1=1&k2=');
    expect(params.deleteAll().toString()).toBe('');
    expect(params.appendStr('k=0&k1=1').toString()).toBe('k=0&k1=1');
    expect(params.entriesAsObj()).toStrictEqual({ k: '0', k1: '1' });
  });

  it('preserves existing query values when applying initial params', () => {
    expect(createUrlSearchParams('?k=0', { k1: 1, k2: 2 }).toString()).toBe(
      'k=0&k1=1&k2=2'
    );
  });

  it('normalizes separators in keys while preserving duplicate values', () => {
    const params = createUrlSearchParams('?', {
      'foo-bar': 1,
      'foo--bar': 2
    }).toUnderscoredKeys();

    expect(params.toString()).toBe('foo_bar=1&foo_bar=2');
    expect(params.setBulk({ foo_bar: 3 }, true).toHyphenatedKeys().toString()).toBe(
      'foo-bar=1&foo-bar=2&foo-bar=3'
    );
  });

  it('normalizes primitive query values', () => {
    expect(normalizeQueryValue('value')).toBe('value');
    expect(normalizeQueryValue(12)).toBe('12');
    expect(normalizeQueryValue(false)).toBe('false');
    expect(normalizeQueryValue(null)).toBeUndefined();
    expect(normalizeQueryValue(undefined)).toBeUndefined();
  });

  it('creates query search params from scalar and array values', () => {
    const params = createQuerySearchParams({
      empty: undefined,
      page: 2,
      tag: ['a', 'b']
    });

    expect(params.toString()).toBe('page=2&tag=a&tag=b');
  });

  it('gets query params from strings or URLSearchParams', () => {
    expect(getQueryParam('room', '?room=alpha')).toBe('alpha');
    expect(
      getQueryParam('missing', new URLSearchParams('room=alpha'))
    ).toBeUndefined();
  });

  it('builds updated query URLs without mutating unrelated params', () => {
    expect(
      buildQueryUrl('https://example.test/path?room=old&keep=1', {
        room: 'new'
      })
    ).toBe('https://example.test/path?keep=1&room=new');
    expect(
      buildQueryUrl(
        'https://example.test/path?tag=a',
        { tag: ['b', 'c'] },
        'append'
      )
    ).toBe('https://example.test/path?tag=a&tag=b&tag=c');
    expect(
      buildQueryUrl(
        'https://example.test/path?room=old',
        new URLSearchParams('room=new')
      )
    ).toBe('https://example.test/path?room=new');
  });

  it('deletes query params by name', () => {
    expect(
      deleteQueryParams('https://example.test/path?room=old&keep=1', ['room'])
    ).toBe('https://example.test/path?keep=1');
  });

  it('can replace browser history with injected dependencies', () => {
    const replaceState = vi.fn();
    const nextUrl = replaceQueryUrl(
      { room: 'alpha' },
      {
        history: { replaceState },
        href: 'https://example.test/path?keep=1'
      }
    );

    expect(nextUrl.toString()).toBe(
      'https://example.test/path?keep=1&room=alpha'
    );
    expect(replaceState).toHaveBeenCalledWith(
      {},
      '',
      'https://example.test/path?keep=1&room=alpha'
    );
  });

  it('can clear browser history params with injected dependencies', () => {
    const replaceState = vi.fn();
    const nextUrl = clearQueryUrl(['room'], {
      history: { replaceState },
      href: 'https://example.test/path?room=alpha&keep=1'
    });

    expect(nextUrl.toString()).toBe('https://example.test/path?keep=1');
    expect(replaceState).toHaveBeenCalledWith(
      {},
      '',
      'https://example.test/path?keep=1'
    );
  });
});
