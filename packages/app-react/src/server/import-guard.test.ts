import { readdir, readFile } from 'node:fs/promises';
import { join, relative } from 'node:path';
import { describe, expect, it } from 'vitest';

const packageSrc = join(import.meta.dirname, '..');

async function walk(dir: string): Promise<string[]> {
  const entries = await readdir(dir, { withFileTypes: true });
  const files: string[] = [];
  for (const entry of entries) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await walk(path)));
    } else if (entry.name.endsWith('.ts') || entry.name.endsWith('.tsx')) {
      if (!entry.name.endsWith('.test.ts') && !entry.name.endsWith('.test.tsx')) {
        files.push(path);
      }
    }
  }
  return files;
}

const BROWSER_FORBIDDEN = [
  'node:',
  '@hono/node-server',
  './server/app',
  './server/node',
  '../server/app',
  '../server/node'
];

describe('app-react browser graph import boundary', () => {
  it('client and microfrontend entries contain no Node-only or server-only imports', async () => {
    const browserEntries = [
      join(packageSrc, 'entry-hydration.tsx'),
      join(packageSrc, 'entry-microfrontend.tsx'),
      join(packageSrc, 'shared', 'AppTree.tsx'),
      join(packageSrc, 'client', 'ErrorBoundary.tsx')
    ];

    const violations: string[] = [];
    for (const file of browserEntries) {
      const content = await readFile(file, 'utf8');
      for (const forbidden of BROWSER_FORBIDDEN) {
        if (content.includes(forbidden)) {
          violations.push(`${relative(packageSrc, file)}: imports ${forbidden}`);
        }
      }
    }
    expect(violations).toEqual([]);
  });
});