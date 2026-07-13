import { readdir, readFile } from 'node:fs/promises';
import { join, relative } from 'node:path';
import { describe, expect, it } from 'vitest';

const srcDir = import.meta.dirname;

async function walk(dir: string): Promise<string[]> {
  const entries = await readdir(dir, { withFileTypes: true });
  const files: string[] = [];
  for (const entry of entries) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await walk(path)));
    } else if (entry.name.endsWith('.ts') && !entry.name.endsWith('.test.ts')) {
      files.push(path);
    }
  }
  return files;
}

describe('hono-base import boundary', () => {
  it('source graph contains no node:* or @hono/node-server imports', async () => {
    const files = await walk(srcDir);
    const violations: string[] = [];
    for (const file of files) {
      const content = await readFile(file, 'utf8');
      if (/from\s+['"]node:/.test(content)) {
        violations.push(`${relative(srcDir, file)}: node:* import`);
      }
      if (/from\s+['"]@hono\/node-server['"]/.test(content)) {
        violations.push(`${relative(srcDir, file)}: @hono/node-server import`);
      }
    }
    expect(violations).toEqual([]);
  });
});
