import { describe, expect, it } from 'vitest';

import { createRendererDemoContract, formatRendererDemo } from './index.js';

describe('createRendererDemoContract', () => {
  it('builds a framework-neutral contract from shared packages', () => {
    const contract = createRendererDemoContract('Vue');

    expect(contract).toEqual({
      renderer: 'Vue',
      title: 'Vue renderer',
      slug: 'vue-renderer',
      emailValidation: 'valid',
      requiredValidation: 'valid',
      query: 'renderer=vue-renderer&contract=shared',
      url: 'https://example.test/demo?renderer=vue-renderer&contract=shared'
    });
  });

  it('formats the rendered summary', () => {
    expect(formatRendererDemo(createRendererDemoContract('SolidJS'))).toBe(
      'SolidJS renderer :: solid-js-renderer :: valid :: valid'
    );
  });
});
