# @cheshirecode/async-utils

Lightweight async utility helpers.

## Usage

```js
import { timeout, delay, retry, debounce, throttle } from '@cheshirecode/async-utils';

// Retry with exponential backoff
const data = await retry(() => fetchData(), { tries: 3, baseDelay: 200 });
```

## API

- `timeout(ms, options?)` — promise that resolves after ms (or rejects with `rejectWith`)
- `delay(ms, value?)` — promise that resolves with value after ms
- `retry(fn, options?)` — retries async fn with exponential backoff
- `debounce(fn, wait?)` — returns debounced function with `.cancel()` and `.flush()`
- `throttle(fn, wait?)` — returns throttled function with `.cancel()`