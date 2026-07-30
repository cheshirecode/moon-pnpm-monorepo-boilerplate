# @cheshirecode/object-utils

Object manipulation utilities.

## Usage

```js
import { deepMerge, deepClone, deepEqual, pick, omit } from '@cheshirecode/object-utils';

const merged = deepMerge({ a: 1, b: { c: 2 } }, { b: { d: 3 } });
```

## API

- `deepClone(value)` — deep clone objects, arrays, Date, RegExp, Map, Set
- `deepMerge(target, ...sources)` — deep merge (immutable, returns new object)
- `deepEqual(a, b)` — deep equality comparison
- `pick(object, keys)` — pick specified keys
- `omit(object, keys)` — omit specified keys