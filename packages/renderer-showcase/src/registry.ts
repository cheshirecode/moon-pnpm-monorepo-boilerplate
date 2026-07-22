import {
  createMicrofrontendRegistry,
  type MicrofrontendEntry
} from '@cheshirecode/microfrontend-host';
import { astroDemoContract, astroDemoText } from 'app-astro/demo';

const frameworkMounts: Record<string, () => Promise<(container: Element) => () => void>> = {
  'app-react': () => import('app-react/microfrontend').then(m => m.mount),
  'app-preact': () => import('app-preact/microfrontend').then(m => m.mount),
  'app-vue': () => import('app-vue/microfrontend').then(m => m.mount),
  'app-svelte': () => import('app-svelte/microfrontend').then(m => m.mount),
  'app-solidjs': () => import('app-solidjs/microfrontend').then(m => m.mount)
};

export const rendererShowcasePackageIds = [
  'app-react',
  'app-preact',
  'app-astro',
  'app-vue',
  'app-svelte',
  'app-solidjs'
] as const;

export const rendererShowcaseEntries = createMicrofrontendRegistry([
  {
    id: 'app-react',
    title: 'React renderer',
    description: 'React package embedded through its package-local mount adapter.',
    kind: 'client',
    mount: (container) => {
      let unmount: (() => void) | null = null;
      frameworkMounts['app-react']()
        .then(mountFn => { unmount = mountFn(container); })
        .catch(err => {
          const msg = err instanceof Error ? err.message : String(err);
          container.replaceChildren(createErrorFragment('Mount failed: ' + msg));
        });
      return () => unmount?.();
    }
  },
  {
    id: 'app-preact',
    title: 'Preact renderer',
    description: 'Preact package embedded through its package-local mount adapter.',
    kind: 'client',
    mount: (container) => {
      let unmount: (() => void) | null = null;
      frameworkMounts['app-preact']()
        .then(mountFn => { unmount = mountFn(container); })
        .catch(err => {
          const msg = err instanceof Error ? err.message : String(err);
          container.replaceChildren(createErrorFragment('Mount failed: ' + msg));
        });
      return () => unmount?.();
    }
  },
  {
    id: 'app-astro',
    title: astroDemoContract.title,
    description: 'Astro is represented as a static tile from the shared renderer demo contract.',
    kind: 'static',
    render: () => {
      const fragment = document.createDocumentFragment();
      const summary = document.createElement('p');
      const url = document.createElement('p');

      summary.textContent = astroDemoText;
      url.textContent = astroDemoContract.url;
      fragment.append(summary, url);

      return fragment;
    }
  },
  {
    id: 'app-vue',
    title: 'Vue renderer',
    description: 'Vue package embedded through its package-local mount adapter.',
    kind: 'client',
    mount: (container) => {
      let unmount: (() => void) | null = null;
      frameworkMounts['app-vue']()
        .then(mountFn => { unmount = mountFn(container); })
        .catch(err => {
          const msg = err instanceof Error ? err.message : String(err);
          container.replaceChildren(createErrorFragment('Mount failed: ' + msg));
        });
      return () => unmount?.();
    }
  },
  {
    id: 'app-svelte',
    title: 'Svelte renderer',
    description: 'Svelte package embedded through its package-local mount adapter.',
    kind: 'client',
    mount: (container) => {
      let unmount: (() => void) | null = null;
      frameworkMounts['app-svelte']()
        .then(mountFn => { unmount = mountFn(container); })
        .catch(err => {
          const msg = err instanceof Error ? err.message : String(err);
          container.replaceChildren(createErrorFragment('Mount failed: ' + msg));
        });
      return () => unmount?.();
    }
  },
  {
    id: 'app-solidjs',
    title: 'SolidJS renderer',
    description: 'SolidJS package embedded through its package-local mount adapter.',
    kind: 'client',
    mount: (container) => {
      let unmount: (() => void) | null = null;
      frameworkMounts['app-solidjs']()
        .then(mountFn => { unmount = mountFn(container); })
        .catch(err => {
          const msg = err instanceof Error ? err.message : String(err);
          container.replaceChildren(createErrorFragment('Mount failed: ' + msg));
        });
      return () => unmount?.();
    }
  }
] satisfies readonly MicrofrontendEntry[]);

/** Presentation metadata for each card, keyed by microfrontend id. */
export interface AppCardMeta {
  /** Short framework label shown as the card heading. */
  framework: string;
  /** Key into the injected framework-version map; omitted for the static tile. */
  versionKey?: string;
  /** How the standalone app renders in production. */
  renderMode: string;
  /** Standalone route on the combined Netlify site. */
  href: string;
  /** Per-framework accent (OKLCH), used as the card's top keyline. */
  accent: string;
  /** One-line description shown under the live preview. */
  tagline: string;
}

function createErrorFragment(message: string): DocumentFragment {
  const div = document.createElement('div');
  div.className = 'mount-error';
  div.textContent = message;
  const fragment = document.createDocumentFragment();
  fragment.append(div);
  return fragment;
}

export const appCardMeta: Record<string, AppCardMeta> = {
  'app-react': {
    framework: 'React',
    versionKey: 'react',
    renderMode: 'SSR + hydration',
    href: '/apps/react/',
    accent: 'oklch(0.82 0.11 218)',
    tagline: 'Server-rendered through a Hono function, then hydrated in the browser.'
  },
  'app-preact': {
    framework: 'Preact',
    versionKey: 'preact',
    renderMode: 'Client SPA',
    href: '/apps/preact/',
    accent: 'oklch(0.52 0.18 300)',
    tagline: 'A 3 kB React-compatible renderer mounted client-side.'
  },
  'app-astro': {
    framework: 'Astro',
    renderMode: 'Static (SSG)',
    href: '/apps/astro/',
    accent: 'oklch(0.62 0.2 25)',
    tagline: 'A zero-JavaScript static tile built from the shared demo contract.'
  },
  'app-vue': {
    framework: 'Vue',
    versionKey: 'vue',
    renderMode: 'Client SPA',
    href: '/apps/vue/',
    accent: 'oklch(0.72 0.15 158)',
    tagline: 'Single-file components mounted through the package adapter.'
  },
  'app-svelte': {
    framework: 'Svelte',
    versionKey: 'svelte',
    renderMode: 'Client SPA',
    href: '/apps/svelte/',
    accent: 'oklch(0.64 0.23 32)',
    tagline: 'Compiled components with no runtime framework overhead.'
  },
  'app-solidjs': {
    framework: 'SolidJS',
    versionKey: 'solid-js',
    renderMode: 'Client SPA',
    href: '/apps/solidjs/',
    accent: 'oklch(0.55 0.11 255)',
    tagline: 'Fine-grained reactivity compiled to real DOM updates.'
  }
};
