# @cheshirecode/input-validation

Framework-neutral text input validation and sanitization helpers.

## Install

```sh
pnpm add @cheshirecode/input-validation
```

## Usage

```js
import { validateTextInput } from '@cheshirecode/input-validation';

const result = validateTextInput('user input', { maxLength: 100 });
if (!result.isValid) {
  console.error(result.error);
}
```

## License

MIT
