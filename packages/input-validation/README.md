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

## Consumers

Framework-neutral validation and sanitization for text inputs. Ready for direct consumer use in any browser or Node app.

## License

MIT
