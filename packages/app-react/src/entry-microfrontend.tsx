import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import AppTree from './shared/AppTree';

export function mount(container: Element): () => void {
  const root = createRoot(container);

  root.render(
    <StrictMode>
      <AppTree />
    </StrictMode>
  );

  return () => root.unmount();
}