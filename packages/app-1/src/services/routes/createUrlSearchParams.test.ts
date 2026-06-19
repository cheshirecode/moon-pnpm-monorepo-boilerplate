import { describe, expect, it } from 'vitest';

import createUrlSearchParams from './createUrlSearchParams';

describe('services/routes/createUrlSearchParams', () => {
  it('createUrlSearchParams', () => {
    history.pushState(null, '', `${location.origin}/foo?bar=1`);

    expect(createUrlSearchParams()).toBeInstanceOf(URLSearchParams);
    expect(createUrlSearchParams('').toString()).toBe('');
    expect(createUrlSearchParams('', 'string').toString()).toBe('');
    const qs = createUrlSearchParams('', { k: 0 });
    expect(qs.toString()).toBe('k=0');
    expect(qs.setBulk({ k1: {} }).toString()).toBe('k=0&k1=%5Bobject+Object%5D');
    expect(qs.setBulk({ k1: 1, k2: 2 }).toString()).toBe('k=0&k1=1&k2=2');
    expect(qs.setBulk({ k2: '3' }, true).toString()).toBe('k=0&k1=1&k2=2&k2=3');
    expect(qs.setBulk({ k2: '' }).toString()).toBe('k=0&k1=1&k2=');
    expect(qs.deleteAll().toString()).toBe('');
    expect(qs.appendStr('k=0&k1=1').toString()).toBe('k=0&k1=1');
    expect(qs.entriesAsObj()).toStrictEqual({
      k: '0',
      k1: '1'
    });
    expect(createUrlSearchParams('?k=0', { k1: 1, k2: 2 }).toString()).toBe('k=0&k1=1&k2=2');
    const qs1 = createUrlSearchParams('?', { 'foo-bar': 1, 'foo--bar': 2 }).toUnderscoredKeys();
    expect(qs1.toString()).toBe('foo_bar=1&foo_bar=2');
    expect(qs1.setBulk({ foo_bar: 3 }, true).toHyphenatedKeys().toString()).toBe(
      'foo-bar=1&foo-bar=2&foo-bar=3'
    );
  });
});
