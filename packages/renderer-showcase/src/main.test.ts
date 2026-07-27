import { describe, expect, it } from 'vitest';
import { waitFor } from '@testing-library/dom';

import {
  mountMicrofrontends,
  renderHostShell
} from '@cheshirecode/microfrontend-host';

import { rendererShowcaseEntries } from './registry';

describe('renderer showcase host', () => {
  it('renders and mounts every renderer entry in a single document', async () => {
    const root = document.createElement('main');

    renderHostShell(root, rendererShowcaseEntries);
    mountMicrofrontends(root, rendererShowcaseEntries);

    for (const entry of rendererShowcaseEntries) {
      await waitFor(() => {
        expect(root.textContent).toContain(entry.title);
      });
    }

    // Verify static tile renders its slug (always synchronous)
    const astro = rendererShowcaseEntries.find(e => e.id === 'app-astro');
    if (astro && astro.kind === 'static') {
      expect(root.textContent).toContain('astro-renderer');
    }
  });
});
