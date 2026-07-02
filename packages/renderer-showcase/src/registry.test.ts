import { describe, expect, it } from 'vitest';

import {
  rendererShowcaseEntries,
  rendererShowcasePackageIds
} from './registry';

describe('renderer showcase registry', () => {
  it('contains exactly the renderer demo app packages', () => {
    expect(rendererShowcasePackageIds).toEqual([
      'app-react',
      'app-preact',
      'app-astro',
      'app-vue',
      'app-svelte',
      'app-solidjs'
    ]);
    expect(rendererShowcaseEntries.map((entry) => entry.id)).toEqual(
      rendererShowcasePackageIds
    );
  });

  it('keeps utility and host packages out of the embeddable set', () => {
    expect(rendererShowcaseEntries.map((entry) => entry.id)).not.toContain(
      'browser-utils'
    );
    expect(rendererShowcaseEntries.map((entry) => entry.id)).not.toContain(
      'renderer-showcase'
    );
  });
});
