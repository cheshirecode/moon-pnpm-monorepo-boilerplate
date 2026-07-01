import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import App from './App';

// manual
import './styles/reset.css';
import './styles/index.css';
// uno
import 'virtual:uno.css';

createRoot(document.getElementById('root') as Element).render(
  <StrictMode>
    <App />
  </StrictMode>
);
