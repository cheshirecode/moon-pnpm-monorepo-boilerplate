# New Package Tasks

## Task 1: @cheshirecode/vitest-config
- Extract vitest.shared.mjs into a publishable package
- Export: `packageTestConfig`, `domPackageTestConfig`, `rootSmokeTestConfig`, `viteAppTestConfig`
- Consumers: packages/*/vitest.config.ts import from this instead of ../../vitest.shared.mjs
- Status: pending

## Task 2: @cheshirecode/async-utils
- Async utility helpers: timeout, retry, debounce, throttle, delay
- Pure functions, no dependencies
- Status: pending

## Task 3: @cheshirecode/object-utils
- Object utilities: deepMerge, deepClone, deepEqual, pick, omit
- Pure functions, no dependencies
- Status: pending

## Task 4: @cheshirecode/error-utils
- Error types, error boundary patterns, error reporting helpers
- Framework-agnostic base with framework adapters
- Status: pending

## Task 5: @cheshirecode/eslint-config-base
- General (non-React) ESLint config with prettier
- Pairs with eslint-config-react
- Status: pending
