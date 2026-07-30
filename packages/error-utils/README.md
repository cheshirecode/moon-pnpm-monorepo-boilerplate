# @cheshirecode/error-utils

Framework-agnostic error types and error handling helpers.

## Usage

```js
import { AppError, NetworkError, createErrorBoundary } from '@cheshirecode/error-utils';

throw new NetworkError('API unreachable', { status: 503 });
```

## API

- `AppError` — base error class with code, status, meta, cause
- `NetworkError` — network errors (status 0, code NETWORK_ERROR)
- `AuthError` — auth errors (status 401, code AUTH_ERROR)
- `ValidationError` — validation errors (status 400, code VALIDATION_ERROR)
- `NotFoundError` — not found errors (status 404, code NOT_FOUND)
- `isAppError(error)` — type guard for AppError instances
- `getErrorMessage(error, fallback?)` — safe message extraction
- `getErrorCode(error)` — extract code or UNKNOWN
- `createErrorBoundary(fn, { onError })` — wraps async fn with error handler
- `withErrorLogging(fn, logger?)` — wraps fn with error logging
- `tryOrDefault(fn, defaultValue)` — try/catch with fallback