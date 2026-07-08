# @cheshirecode/browser-clipboard

Browser clipboard helpers with textarea fallback.

## Install

```sh
pnpm add @cheshirecode/browser-clipboard
```

## Usage

```js
import { copyToClipboard } from '@cheshirecode/browser-clipboard';

const button = document.querySelector('button');
button.addEventListener('click', () => copyToClipboard('text to copy'));
```

## License

MIT
