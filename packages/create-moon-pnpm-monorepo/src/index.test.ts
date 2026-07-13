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
  it('writes a clean monorepo with hono-base and app-react', async () => {
    const parent = await mkdtemp(join(tmpdir(), 'create-moon-pnpm-monorepo-'));
    const target = join(parent, 'generated');
    const result = await createMonorepo({
      name: 'Generated Repo',
      directory: target
    });

    expect(result.name).toBe('generated-repo');
    expect(result.files).toContain('scripts/check.sh');
    expect(result.files).toContain('packages/hono-base/src/index.ts');
    expect(result.files).toContain('packages/app-react/src/server/app.tsx');
    expect(result.files).toContain('packages/app-react/src/entry-microfrontend.tsx');
    await access(join(target, '.github', 'workflows', 'main.yml'));
    await access(join(target, '.github', 'workflows', 'publish.yml'));

    const rootPackage = JSON.parse(await readFile(join(target, 'package.json'), 'utf8'));
    expect(rootPackage.name).toBe('generated-repo');
    expect(rootPackage.scripts.ci).toBe('scripts/check.sh ci');
    expect(rootPackage.devDependencies.typescript).toBe('^7.0.2');

    const honoBasePackage = JSON.parse(
      await readFile(join(target, 'packages', 'hono-base', 'package.json'), 'utf8')
    );
    expect(honoBasePackage.name).toBe('generated-repo-hono-base');
    expect(honoBasePackage.private).toBe(false);
    expect(honoBasePackage.devDependencies.typescript).toBe('^7.0.2');

    const appReactPackage = JSON.parse(
      await readFile(join(target, 'packages', 'app-react', 'package.json'), 'utf8')
    );
    expect(appReactPackage.private).toBe(true);
    expect(appReactPackage.dependencies['generated-repo-hono-base']).toBe('workspace:^');

    const workspace = await readFile(join(target, 'pnpm-workspace.yaml'), 'utf8');
    expect(workspace).toContain('typescript: "^7.0.2"');

    const moonTasks = await readFile(join(target, '.moon', 'tasks', 'node.yml'), 'utf8');
    const buildTask = moonTasks.slice(moonTasks.indexOf('  build:'), moonTasks.indexOf('  test:'));
    expect(buildTask).toContain('target: "^:build"');

    const check = await readFile(join(target, 'scripts', 'check.sh'), 'utf8');
    const setup = check.slice(check.indexOf('  setup)'), check.indexOf('  lint-fast)'));
    expect(setup).toContain('if [[ -f "$repo_root/pnpm-lock.yaml" ]]');
    expect(setup).toContain('pnpm install --frozen-lockfile');
    expect(setup).toContain('pnpm install --no-frozen-lockfile');
  });
});
