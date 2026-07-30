import { describe, it, expect } from 'vitest';
import { createMount } from './src/index.mjs';

describe('createMount', () => {
  it('calls renderFn with container', () => {
    const container = {};
    let called = null;
    const mount = createMount((c) => { called = c; return 'cleanup'; });
    const unmount = mount(container);
    expect(called).toBe(container);
    expect(typeof unmount).toBe('function');
  });

  it('calls cleanupFn on unmount', () => {
    let cleaned = null;
    const mount = createMount(
      () => 'result',
      (r) => { cleaned = r; }
    );
    const unmount = mount({});
    unmount();
    expect(cleaned).toBe('result');
  });

  it('works without cleanupFn', () => {
    const mount = createMount(() => {});
    const unmount = mount({});
    expect(typeof unmount).toBe('function');
    unmount(); // should not throw
  });
});