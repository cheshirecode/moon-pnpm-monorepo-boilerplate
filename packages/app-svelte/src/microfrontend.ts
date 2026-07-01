import { mount as mountSvelte, unmount } from 'svelte';

import App from './App.svelte';

export function mount(container: Element): () => void {
  const app = mountSvelte(App, { target: container });

  return () => {
    void unmount(app);
    container.replaceChildren();
  };
}
