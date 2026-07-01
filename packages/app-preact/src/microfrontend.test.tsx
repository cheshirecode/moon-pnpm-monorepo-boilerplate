/** @jsxImportSource preact */
import { describe, expect, it } from 'vitest';

import { mount } from './microfrontend';

describe('app-preact microfrontend', () => {
  it('mounts into an arbitrary container and unmounts', () => {
    const target = document.createElement('div');
    document.body.append(target);

    const unmount = mount(target);

    expect(target.textContent).toContain('Preact renderer');
    expect(target.textContent).toContain('preact-compat');

    unmount();

    expect(target.textContent).toBe('');
    target.remove();
  });
});
