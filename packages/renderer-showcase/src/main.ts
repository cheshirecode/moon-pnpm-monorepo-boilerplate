import { mountMicrofrontends } from '@cheshirecode/microfrontend-host';

import { rendererShowcaseEntries } from './registry';
import { renderShowcase } from './shell';
import './styles.css';

const root = document.getElementById('showcase');

if (!root) {
  throw new Error('Missing renderer showcase root element.');
}

renderShowcase(root, rendererShowcaseEntries, {
  versions: __FRAMEWORK_VERSIONS__,
  build: __BUILD_INFO__
});
mountMicrofrontends(root, rendererShowcaseEntries);
