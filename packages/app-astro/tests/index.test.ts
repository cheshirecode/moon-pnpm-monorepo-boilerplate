import { describe, expect, it } from 'vitest';

import { astroDemoContract, astroDemoText } from '../src/demo';

describe('app-astro', () => {
  it('uses the shared contract rendered by the Astro page', () => {
    expect(astroDemoText).toContain('Astro renderer');
    expect(astroDemoContract.slug).toBe('astro-renderer');
    expect(astroDemoContract.url).toContain('renderer=astro-renderer');
  });
});
