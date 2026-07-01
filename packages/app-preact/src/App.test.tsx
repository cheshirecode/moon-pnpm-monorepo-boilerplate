/** @jsxImportSource preact */
import { render } from 'preact';
import { afterEach, describe, expect, it } from 'vitest';

import { App } from './App';

describe('app-preact', () => {
  let target: HTMLDivElement | undefined;

  afterEach(() => {
    if (target) {
      render(null, target);
      target.remove();
      target = undefined;
    }
  });

  it('renders the shared contract and compat badge', () => {
    target = document.createElement('div');
    document.body.append(target);

    render(<App />, target);

    expect(target.textContent).toContain('Preact renderer');
    expect(target.textContent).toContain('preact-renderer');
    expect(target.textContent).toContain('preact-compat');
  });
});
