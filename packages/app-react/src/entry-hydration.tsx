import { StrictMode } from 'react';
import { hydrateRoot } from 'react-dom/client';

import AppTree from './shared/AppTree';

import './styles/reset.css';
import './styles/index.css';
import 'virtual:uno.css';

const root = document.getElementById('root');

if (root) {
  hydrateRoot(
    root,
    <StrictMode>
      <AppTree />
    </StrictMode>
  );
}
