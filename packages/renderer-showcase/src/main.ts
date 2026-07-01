import {
  mountMicrofrontends,
  renderHostShell
} from '@cheshirecode/microfrontend-host';

import { rendererShowcaseEntries } from './registry';
import './styles.css';

const root = document.getElementById('showcase');

if (!root) {
  throw new Error('Missing renderer showcase root element.');
}

renderHostShell(root, rendererShowcaseEntries);
mountMicrofrontends(root, rendererShowcaseEntries);
