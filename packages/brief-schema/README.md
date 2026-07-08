# @cheshirecode/brief-schema

AJV validators and JSON schemas for prospect and brainstorm briefs.

## Install

```sh
pnpm add @cheshirecode/brief-schema
```

## Usage

```js
import { validateProspect, validateBrainstorm } from '@cheshirecode/brief-schema';

const valid = validateProspect({ name: 'Acme', url: 'https://example.com' });
if (!valid) {
  console.error(validateProspect.errors);
}
```

## Consumers

Used by sales engineering workflows to validate prospect and brainstorm briefs against JSON schemas before processing.

## License

MIT
