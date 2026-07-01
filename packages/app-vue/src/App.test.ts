import { createApp } from 'vue';
import { afterEach, describe, expect, it } from 'vitest';

import App from './App.vue';

describe('app-vue', () => {
  let target: HTMLDivElement | undefined;

  afterEach(() => {
    target?.remove();
    target = undefined;
  });

  it('renders the shared contract', () => {
    target = document.createElement('div');
    document.body.append(target);

    createApp(App).mount(target);

    expect(target.textContent).toContain('Vue renderer');
    expect(target.textContent).toContain('vue-renderer');
    expect(target.textContent).toContain('https://example.test/demo');
  });
});
