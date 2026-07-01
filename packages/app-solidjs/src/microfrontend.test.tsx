import { describe, expect, it } from 'vitest';

import { mount } from './microfrontend';

describe('app-solidjs microfrontend', () => {
  it('mounts into an arbitrary container and unmounts', () => {
    const target = document.createElement('div');
    document.body.append(target);

    const unmount = mount(target);

    expect(target.textContent).toContain('SolidJS renderer');
    expect(target.textContent).toContain('solid-js-renderer');

    unmount();

    expect(target.textContent).toBe('');
    target.remove();
  });
});
