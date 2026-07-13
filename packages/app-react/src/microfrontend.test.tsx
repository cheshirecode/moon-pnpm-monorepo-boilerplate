import { waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { mount } from './entry-microfrontend';

describe('app-react microfrontend', () => {
  it('mounts into an arbitrary container and unmounts', async () => {
    const target = document.createElement('div');
    document.body.append(target);

    const unmount = mount(target);

    await waitFor(() =>
      expect(target.textContent).toContain('@moon-pnpm-monorepo-boilerplate/app-react')
    );

    unmount();

    expect(target.textContent).toBe('');
    target.remove();
  });
});
