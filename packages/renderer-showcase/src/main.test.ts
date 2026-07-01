import { describe, expect, it } from 'vitest';

import {
  mountMicrofrontends,
  renderHostShell
} from '@cheshirecode/microfrontend-host';

import { rendererShowcaseEntries } from './registry';

describe('renderer showcase host', () => {
  it('renders and mounts every renderer entry in a single document', () => {
    const root = document.createElement('main');

    renderHostShell(root, rendererShowcaseEntries);
    const mounted = mountMicrofrontends(root, rendererShowcaseEntries);

    for (const entry of rendererShowcaseEntries) {
      expect(root.textContent).toContain(entry.title);
    }

    expect(root.textContent).toContain('react');
    expect(root.textContent).toContain('preact-renderer');
    expect(root.textContent).toContain('astro-renderer');
    expect(root.textContent).toContain('vue-renderer');
    expect(root.textContent).toContain('svelte-renderer');
    expect(root.textContent).toContain('solid-js-renderer');

    for (const entry of mounted) {
      entry.unmount();
    }
  });
});
