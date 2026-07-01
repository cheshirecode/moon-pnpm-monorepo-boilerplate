import { render } from 'solid-js/web';
import { afterEach, describe, expect, it } from 'vitest';

import { App } from './App';

describe('app-solidjs', () => {
  let target: HTMLDivElement | undefined;
  let dispose: (() => void) | undefined;

  afterEach(() => {
    dispose?.();
    target?.remove();
    target = undefined;
    dispose = undefined;
  });

  it('renders the shared contract', () => {
    target = document.createElement('div');
    document.body.append(target);
    dispose = render(() => <App />, target);

    expect(target.textContent).toContain('SolidJS renderer');
    expect(target.textContent).toContain('solid-js-renderer');
    expect(target.textContent).toContain('https://example.test/demo');
  });
});
