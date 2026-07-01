import { describe, expect, it } from 'vitest';

import { createUrlSearchParams } from './index';

describe('url search params', () => {
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
});
