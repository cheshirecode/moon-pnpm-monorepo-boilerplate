import { describe, expect, it } from 'vitest';
import { waitFor } from '@testing-library/dom';

import {
  mountMicrofrontends,
  renderHostShell
} from '@cheshirecode/microfrontend-host';

import { rendererShowcaseEntries } from './registry';

const FRAMEWORK_SLUGS = ['preact-renderer', 'astro-renderer', 'vue-renderer', 'solid-js-renderer'];

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

    for (const slug of FRAMEWORK_SLUGS) {
      await waitFor(() => {
        expect(root.textContent).toContain(slug);
      });
    }
  });
});