#!/usr/bin/env node
import { parseArgs } from 'node:util';

import { createMonorepo } from './index.js';

const { positionals, values } = parseArgs({
  options: {
    name: {
      type: 'string',
      short: 'n'
    },
    directory: {
      type: 'string',
      short: 'd'
    },
    force: {
      type: 'boolean',
      short: 'f',
      default: false
    },
    help: {
      type: 'boolean',
      short: 'h',
      default: false
    }
  },
  allowPositionals: true
});

if (values.help) {
  console.log(`Usage: create-moon-pnpm-monorepo <name> [--directory <path>] [--force]

Options:
  -n, --name <name>       Package-safe monorepo name. Defaults to the positional name.
  -d, --directory <path>  Destination directory. Defaults to ./<name>.
  -f, --force             Allow writing into an existing directory.
  -h, --help              Show this help message.
`);
  process.exit(0);
}

const name = values.name ?? positionals[0];

if (!name) {
  console.error('A monorepo name is required.');
  process.exit(2);
}

const result = await createMonorepo({
  name,
  directory: values.directory,
  force: values.force
});

console.log(`Created ${result.name} at ${result.directory}`);
