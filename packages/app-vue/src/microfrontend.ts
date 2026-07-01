import { createApp } from 'vue';

import App from './App.vue';

export function mount(container: Element): () => void {
  const app = createApp(App);

  app.mount(container);

  return () => app.unmount();
}
