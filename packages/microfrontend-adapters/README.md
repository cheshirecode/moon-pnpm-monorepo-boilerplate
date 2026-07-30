# @cheshirecode/microfrontend-adapters

Framework-agnostic microfrontend mount adapter factory.

## Usage

```js
import { createMount } from '@cheshirecode/microfrontend-adapters';
import { createRoot } from 'react-dom/client';
import { StrictMode, createElement } from 'react';
import App from './App';

const mount = createMount(
  (container) => {
    const root = createRoot(container);
    root.render(createElement(StrictMode, null, createElement(App)));
    return root;
  },
  (root) => root.unmount()
);

const unmount = mount(document.getElementById('root'));
```

## API

- `createMount(renderFn, cleanupFn?)` — returns a `(container: Element) => () => void` function

The `renderFn` receives the container and returns any value. The optional `cleanupFn` receives the return value of `renderFn` for teardown.