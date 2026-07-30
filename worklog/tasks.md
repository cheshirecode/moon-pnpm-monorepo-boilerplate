# Improvement Tasks

## Task 1: Migrate 10 packages to @cheshirecode/vitest-config
- Replace `../../vitest.shared.mjs` imports with `@cheshirecode/vitest-config`
- Add devDependency to each package
- Status: pending

## Task 2: Replace app-react custom timeout() with @cheshirecode/async-utils
- Add async-utils dependency to app-react
- Replace local timeout() with import from @cheshirecode/async-utils
- Status: pending

## Task 3: Use error-utils in renderer-showcase
- Add error-utils dependency to renderer-showcase
- Replace raw error handling with AppError/error helpers
- Status: pending
