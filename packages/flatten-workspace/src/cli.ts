#!/usr/bin/env node
import { parseArgs } from 'node:util';

import { flattenWorkspace } from './index.js';

const { values } = parseArgs({
  options: {
    root: {
      type: 'string',
      default: '.'
    },
    location: {
      type: 'string',
      default: '.'
    },
    props: {
      type: 'string',
      default: ''
    },
    blacklist: {
      type: 'string',
      default: ''
    },
    'package-file-name': {
      type: 'string',
      default: 'package.json'
    },
    'out-file': {
      type: 'string'
    },
    silent: {
      type: 'boolean',
      default: false
    },
    help: {
      type: 'boolean',
      short: 'h',
      default: false
    }
  },
  allowPositionals: false
});

if (values.help) {
  console.log(`Usage: flatten-workspace [options]

Options:
  --root <path>               Workspace root directory.
  --location <path>           Directory to scan, relative to root.
  --props <list>              Extra comma-separated object fields to flatten.
  --blacklist <list>          Comma-separated dependency keys to omit.
  --package-file-name <name>  Manifest file name to read.
  --out-file <path>           Write JSON output relative to root.
  --silent                    Do not print JSON output.
  -h, --help                  Show this help message.
`);
  process.exit(0);
}

const flattened = await flattenWorkspace({
  root: values.root,
  location: values.location,
  props: values.props,
  blacklist: values.blacklist,
  packageFileName: values['package-file-name'],
  outFile: values['out-file']
});

if (!values.silent) {
  console.log(JSON.stringify(flattened, null, 2));
}
