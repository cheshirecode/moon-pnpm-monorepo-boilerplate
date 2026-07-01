declare module 'app-react/microfrontend' {
  export function mount(container: Element): () => void;
}

declare module 'app-preact/microfrontend' {
  export function mount(container: Element): () => void;
}

declare module 'app-vue/microfrontend' {
  export function mount(container: Element): () => void;
}

declare module 'app-svelte/microfrontend' {
  export function mount(container: Element): () => void;
}

declare module 'app-solidjs/microfrontend' {
  export function mount(container: Element): () => void;
}

declare module 'app-astro/demo' {
  import type { RendererDemoContract } from '@cheshirecode/demo-contract';

  export const astroDemoContract: RendererDemoContract;
  export const astroDemoText: string;
}
