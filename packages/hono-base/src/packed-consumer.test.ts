import { mkdtemp, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { isAbsolute, join, resolve } from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { describe, expect, it } from 'vitest';

const execFileAsync = promisify(execFile);
const repoRoot = resolve(import.meta.dirname, '..', '..', '..');
const rawTarball = process.env.PACKED_TARBALL;
const tarball = rawTarball
  ? isAbsolute(rawTarball)
    ? rawTarball
    : resolve(repoRoot, rawTarball)
  : undefined;

const itPacked = tarball ? it : it.skip;

describe('hono-base packed consumer', () => {
  itPacked('imports and invokes routes from a clean tarball install', async () => {
    const consumerDir = await mkdtemp(join(tmpdir(), 'hono-base-packed-'));
    await writeFile(
      join(consumerDir, 'package.json'),
      JSON.stringify({
        name: 'hono-base-packed-consumer',
        private: true,
        type: 'module',
        dependencies: { '@cheshirecode/hono-base': `file:${tarball}` }
      })
    );
    await execFileAsync('pnpm', ['install', '--no-frozen-lockfile'], {
      cwd: consumerDir
    });

    const { createBaseApp } = await import(
      join(consumerDir, 'node_modules', '@cheshirecode', 'hono-base', 'dist', 'index.js')
    );

    const app = createBaseApp({ version: '0.0.0' });
    const healthz = await app.request('/healthz');
    expect(healthz.status).toBe(200);
    expect(await healthz.json()).toEqual({ status: 'ok' });

    const versionRes = await app.request('/version');
    expect(versionRes.status).toBe(200);
    expect(await versionRes.json()).toEqual({ name: 'hono-base', version: '0.0.0' });
  });

  itPacked('packed dependency graph has no node:* or adapter dependency', async () => {
    const { stdout } = await execFileAsync('tar', [
      '-xOf',
      tarball!,
      'package/package.json'
    ]);
    const pkg = JSON.parse(stdout);
    const deps = Object.keys(pkg.dependencies ?? {});
    expect(deps).not.toContain('node:*');
    expect(deps).not.toContain('@hono/node-server');
  });
});
