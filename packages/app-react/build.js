#!/usr/bin/env node

import { execSync } from 'node:child_process';
import { resolve } from 'node:path';

const packageDir = resolve(import.meta.dirname);

console.log('Building app-react...');

// Build server
console.log('Building server...');
execSync('pnpm build:server', { cwd: packageDir, stdio: 'inherit' });

// Build client for production
console.log('Building client for production...');
execSync('pnpm build:client:production', { cwd: packageDir, stdio: 'inherit' });

console.log('Build complete!');