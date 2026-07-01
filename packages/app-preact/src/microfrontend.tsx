/** @jsxImportSource preact */
import { render } from 'preact';

import { App } from './App';

export function mount(container: Element): () => void {
  render(<App />, container);

  return () => render(null, container);
}
