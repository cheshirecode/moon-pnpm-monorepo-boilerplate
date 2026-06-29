import { describe, expect, it, vi } from 'vitest';

import {
  buildQueryUrl,
  clearQueryUrl,
  createUrlSearchParams,
  deleteQueryParams,
  getQueryParam,
  normalizeQueryValue,
  replaceQueryUrl
} from './index';

describe('url state', () => {
  it('normalizes primitive query values', () => {
    expect(normalizeQueryValue('value')).toBe('value');
    expect(normalizeQueryValue(12)).toBe('12');
    expect(normalizeQueryValue(false)).toBe('false');
    expect(normalizeQueryValue(null)).toBeUndefined();
    expect(normalizeQueryValue(undefined)).toBeUndefined();
  });

  it('creates search params from scalar and array values', () => {
    const params = createUrlSearchParams({
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
