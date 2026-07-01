import { describe, expect, it } from 'vitest';

import { mount } from './microfrontend';

describe('app-svelte microfrontend', () => {
  it('mounts into an arbitrary container and unmounts', () => {
    const target = document.createElement('div');
    document.body.append(target);

    const unmount = mount(target);

    expect(target.textContent).toContain('Svelte renderer');
    expect(target.textContent).toContain('svelte-renderer');

    unmount();

    expect(target.textContent).toBe('');
    target.remove();
  });
});
