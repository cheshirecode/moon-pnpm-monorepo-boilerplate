import { describe, expect, it } from 'vitest';

import { createRendererDemoContract, formatRendererDemo } from '@cheshirecode/demo-contract';

describe('app-astro', () => {
  it('uses the shared contract rendered by the Astro page', () => {
    const contract = createRendererDemoContract('Astro');

    expect(formatRendererDemo(contract)).toContain('Astro renderer');
    expect(contract.slug).toBe('astro-renderer');
    expect(contract.url).toContain('renderer=astro-renderer');
  });
});
