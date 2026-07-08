# @cheshirecode/browser-utils

Framework-neutral string, form, URL, filtering, and browser utility helpers.

## Install

```sh
pnpm add @cheshirecode/browser-utils
```

## Usage

```js
import { toCamel, validateEmail, createUrlSearchParams } from '@cheshirecode/browser-utils';

const camel = toCamel('hello-world'); // 'helloWorld'
const valid = validateEmail('test@example.com'); // true
```

## Consumers

Consumed by @cheshirecode/demo-contract and the renderer demo apps for string, form, URL, and filtering utilities.

## License

MIT
