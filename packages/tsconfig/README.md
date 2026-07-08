# @cheshirecode/tsconfig

Shared TypeScript configs for Cheshire Code packages.

## Install

```sh
pnpm add -D @cheshirecode/tsconfig
```

## Usage

```json
{
  "extends": "@cheshirecode/tsconfig/dom.json",
  "compilerOptions": {
    "outDir": "dist"
  }
}
```

## Available configs

- `base.json` — strict defaults shared across all targets
- `dom.json` — extends base, adds DOM lib
- `node.json` — extends base, adds Node types
- `node-types.json` — extends node, for type declaration emission

## Consumers

Consumed by 13+ packages across the monorepo that extend @cheshirecode/tsconfig/base, /dom, or /node.

## License

MIT
