import { mount, unmount } from 'svelte';
import { afterEach, describe, expect, it } from 'vitest';

import App from './App.svelte';

describe('app-svelte', () => {
  let target: HTMLDivElement | undefined;
  let app: ReturnType<typeof mount> | undefined;

  afterEach(() => {
    if (app) {
      unmount(app);
    }
    target?.remove();
    target = undefined;
    app = undefined;
  });

  it('renders the shared contract', () => {
    target = document.createElement('div');
    document.body.append(target);
    app = mount(App, { target });

    expect(target.textContent).toContain('Svelte renderer');
    expect(target.textContent).toContain('svelte-renderer');
    expect(target.textContent).toContain('https://example.test/demo');
  });
});
