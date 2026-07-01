import { renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { NoCacheWrapper } from '@/services/test/helper';

import { multipathMatcher, queryString } from './';

const fn = (url: string) => history.pushState(null, '', url);

describe('services/routes', () => {
  it('multipathMatcher', () => {
    expect(multipathMatcher(['/foo'], '/foo'), '/foo -> { }').toStrictEqual([true, {}]);
    expect(multipathMatcher(['/foo:rest*'], '/foobar'), `/foobar -> { rest: 'bar' }`).toStrictEqual(
      [true, { rest: 'bar' }]
    );
    expect(multipathMatcher(['/foo:rest*'], '/foo/bar'), '/foo/bar -> null').toStrictEqual([
      false,
      null
    ]);
    expect(
      multipathMatcher(['/foo:rest*', '/foo/:rest*'], '/foo/bar'),
      `/foo/bar -> { rest: 'bar' }`
    ).toStrictEqual([true, { rest: 'bar' }]);
    expect(multipathMatcher(['/foo/:rest*'], '/foo?var=1'), `/foo?var=1 -> null`).toStrictEqual([
      false,
      null
    ]);
    expect(
      multipathMatcher(['/foo/:rest*', '/foo?:rest*'], '/foo?var1=1&var2=2'),
      `/foo?var1=1&var2=2 -> { rest: 'var1=1&var2=2' }`
    ).toStrictEqual([true, { rest: 'var1=1&var2=2' }]);
  });

  it('queryString', async () => {
    history.pushState(null, '', `${location.origin}/foo?bar=1`);

    expect(queryString.get('bar', location.href), '?bar=1').toEqual('1');
    expect(
      queryString.createAppendedUrl('k=0', location.href).searchParams.get('k'),
      '?bar=1&k=0'
    ).toEqual('0');

    const { result: setQsParam } = renderHook(
      () => queryString.useSetQsParam(location.href, fn),
      {
        wrapper: NoCacheWrapper
      }
    );
    setQsParam.current('bar', 2);
    await waitFor(() => {
      expect(queryString.get('bar', location.href), '?bar=2').toEqual('2');
    });

    setQsParam.current('newVar', 1);
    await waitFor(() => {
      expect(queryString.get('newVar', location.href), '?newVar=1').toEqual('1');
    });

    setQsParam.current('newVar', '');
    await waitFor(() => {
      expect(queryString.get('newVar', location.href), '?newVar=').toEqual('');
    });

    const { result: setQsParams } = renderHook(
      () => queryString.useSetQsParams(location.href, fn),
      {
        wrapper: NoCacheWrapper
      }
    );
    setQsParams.current({ k: 0 });
    await waitFor(() => {
      expect(queryString.get('k', location.href), 'k=0').toEqual('0');
    });

    const { result: useSetQs } = renderHook(
      () => queryString.useSetQs(location.href, fn),
      {
        wrapper: NoCacheWrapper
      }
    );
    useSetQs.current('?l=0');
    await waitFor(() => {
      expect(queryString.get('l', location.href), 'l=0').toEqual('0');
    });
  });
});
