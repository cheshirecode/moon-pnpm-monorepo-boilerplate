import { describe, expect, it } from 'vitest';

import {
  createMicrofrontendRegistry,
  microfrontendMountId,
  mountMicrofrontends,
  renderHostShell
} from './index';

describe('microfrontend host helpers', () => {
  it('validates duplicate and malformed registry ids', () => {
    expect(() =>
      createMicrofrontendRegistry([
        { id: 'app-react', title: 'React', kind: 'static', render: () => 'React' },
        { id: 'app-react', title: 'React copy', kind: 'static', render: () => 'React' }
      ])
    ).toThrow('Duplicate microfrontend id: app-react');

    expect(() =>
      createMicrofrontendRegistry([
        { id: 'App React', title: 'React', kind: 'static', render: () => 'React' }
      ])
    ).toThrow('Invalid microfrontend id: App React');
  });

  it('renders host mount points and mounts client and static entries', () => {
    const root = document.createElement('main');
    const events: string[] = [];
    const registry = createMicrofrontendRegistry([
      {
        id: 'app-react',
        title: 'React renderer',
        kind: 'client',
        mount(container) {
          container.textContent = 'mounted react';
          events.push('mount react');
          return () => {
            events.push('unmount react');
            container.replaceChildren();
          };
        }
      },
      {
        id: 'app-astro',
        title: 'Astro renderer',
        kind: 'static',
        render: () => 'static astro'
      }
    ]);

    renderHostShell(root, registry);

    expect(root.querySelector(`#${microfrontendMountId('app-react')}`)).not.toBeNull();
    expect(root.textContent).toContain('React renderer');

    const mounted = mountMicrofrontends(root, registry);

    expect(root.textContent).toContain('mounted react');
    expect(root.textContent).toContain('static astro');
    expect(events).toEqual(['mount react']);

    for (const entry of mounted) {
      entry.unmount();
    }

    expect(events).toEqual(['mount react', 'unmount react']);
    expect(root.querySelector(`#${microfrontendMountId('app-astro')}`)?.textContent).toBe('');
  });
});
