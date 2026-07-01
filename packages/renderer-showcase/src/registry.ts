import {
  createMicrofrontendRegistry,
  type MicrofrontendEntry
} from '@cheshirecode/microfrontend-host';
import { astroDemoContract, astroDemoText } from 'app-astro/demo';
import { mount as mountPreact } from 'app-preact/microfrontend';
import { mount as mountReact } from 'app-react/microfrontend';
import { mount as mountSolidJS } from 'app-solidjs/microfrontend';
import { mount as mountSvelte } from 'app-svelte/microfrontend';
import { mount as mountVue } from 'app-vue/microfrontend';

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
    mount: mountReact
  },
  {
    id: 'app-preact',
    title: 'Preact renderer',
    description: 'Preact package embedded through its package-local mount adapter.',
    kind: 'client',
    mount: mountPreact
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
    mount: mountVue
  },
  {
    id: 'app-svelte',
    title: 'Svelte renderer',
    description: 'Svelte package embedded through its package-local mount adapter.',
    kind: 'client',
    mount: mountSvelte
  },
  {
    id: 'app-solidjs',
    title: 'SolidJS renderer',
    description: 'SolidJS package embedded through its package-local mount adapter.',
    kind: 'client',
    mount: mountSolidJS
  }
] satisfies readonly MicrofrontendEntry[]);
