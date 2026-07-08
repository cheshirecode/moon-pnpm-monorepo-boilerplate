# @cheshirecode/eslint-config-react

[![npm version](https://badge.fury.io/js/@cheshirecode%2Feslint-config-react.svg)](https://badge.fury.io/js/@cheshirecode%2Feslint-config-react)

Shared ESLint flat config for React and TypeScript projects.

## Usage

Install the config package and create `eslint.config.cjs`:

```js
module.exports = require('@cheshirecode/eslint-config-react');
```

The package carries its own ESLint 10, TypeScript ESLint, React Hooks, React
Refresh, and globals dependencies so consuming projects do not need to repeat
that tooling stack.
