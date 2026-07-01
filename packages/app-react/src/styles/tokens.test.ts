import { describe, expect, it } from 'vitest';

import { colors, matchColorToCode } from './tokens';

describe('@/tokens', () => {
  it('matchColorToCode', () => {
    expect(matchColorToCode('')).toEqual('');
    expect(matchColorToCode('current')).toEqual('currentColor');
    expect(matchColorToCode('current')).toEqual('currentColor');
    expect(matchColorToCode('white')).toEqual('#fff');
    expect(matchColorToCode('rose-1')).toEqual('#ffe4e6');
    expect(matchColorToCode('purple-100')).toEqual('#f3e8ff');
    expect(matchColorToCode('unknownColor')).toEqual('');
    expect(matchColorToCode('purple-unknownshade')).toEqual('');
  });
  it('colors', () => {
    expect(colors).toMatchObject<{ blue: Record<string, string>; black: string }>({
      blue: { '1': expect.any(String) },
      black: expect.any(String)
    });
    expect(colors?.blue).toMatchObject({ '1': expect.any(String) });
  });
});
