import { render } from 'solid-js/web';

import { App } from './App';

export function mount(container: Element): () => void {
  return render(() => <App />, container);
}
