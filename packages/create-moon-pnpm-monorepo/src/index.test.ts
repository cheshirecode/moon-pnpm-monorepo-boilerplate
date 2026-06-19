import { access, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { mkdtemp } from 'node:fs/promises';
import { describe, expect, it } from 'vitest';

import { createMonorepo, normalizePackageName } from './index.js';

describe('normalizePackageName', () => {
  it('normalizes user-provided names into package-safe names', () => {
    expect(normalizePackageName('My Monorepo')).toBe('my-monorepo');
    expect(normalizePackageName('@scope/My Monorepo')).toBe('scope/my-monorepo');
  });
});

describe('createMonorepo', () => {
  it('writes a clean monorepo with one verification package', async () => {
    const parent = await mkdtemp(join(tmpdir(), 'create-moon-pnpm-monorepo-'));
    const target = join(parent, 'generated');
    const result = await createMonorepo({
      name: 'Generated Repo',
      directory: target
    });

    expect(result.name).toBe('generated-repo');
    expect(result.files).toContain('scripts/check.sh');
    expect(result.files).toContain('packages/example-lib/src/index.ts');
    await access(join(target, '.github', 'workflows', 'main.yml'));
    await access(join(target, '.github', 'workflows', 'publish.yml'));

    const rootPackage = JSON.parse(await readFile(join(target, 'package.json'), 'utf8'));
    expect(rootPackage.name).toBe('generated-repo');
    expect(rootPackage.scripts.ci).toBe('scripts/check.sh ci');

    const examplePackage = JSON.parse(
      await readFile(join(target, 'packages', 'example-lib', 'package.json'), 'utf8')
    );
    expect(examplePackage.name).toBe('generated-repo-example-lib');
    expect(examplePackage.private).toBe(false);
  });
});
