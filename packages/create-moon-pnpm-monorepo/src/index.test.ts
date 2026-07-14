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
    await access(join(target, '.github', 'workflows', 'release-pr.yml'));

    const releasePrWorkflow = await readFile(
      join(target, '.github', 'workflows', 'release-pr.yml'),
      'utf8'
    );
    expect(releasePrWorkflow).toMatch(/^on:\n  push:\n    branches:\n      - main\n/m);
    expect(releasePrWorkflow).not.toMatch(/workflow_dispatch:/);
    expect(releasePrWorkflow).not.toMatch(/pull_request:/);
    expect(releasePrWorkflow).toContain('contents: write');
    expect(releasePrWorkflow).toContain('pull-requests: write');
    expect(releasePrWorkflow).toMatch(/group: release-pr-\$\{\{ github\.ref \}\}/);
    expect(releasePrWorkflow).toContain('cancel-in-progress: false');
    expect(releasePrWorkflow).toContain('fetch-depth: 0');
    expect(releasePrWorkflow).toContain('persist-credentials: true');
    expect(releasePrWorkflow).toContain('uses: ./.github/actions/setup');
    expect(releasePrWorkflow).toContain('uses: changesets/action@v1.9.0');
    expect(releasePrWorkflow).toContain('version: pnpm run version-packages');
    expect(releasePrWorkflow).not.toContain('publish:');
    expect(releasePrWorkflow).not.toContain('NPM_TOKEN');
    expect(releasePrWorkflow).not.toContain('NPM_AUTH_TOKEN');
    expect(releasePrWorkflow).not.toContain('NODE_AUTH_TOKEN');

    const publishWorkflow = await readFile(
      join(target, '.github', 'workflows', 'publish.yml'),
      'utf8'
    );
    expect(publishWorkflow).toContain('workflow_dispatch:');
    expect(publishWorkflow).toContain('publish_to_npm:');
    expect(publishWorkflow).toContain('contents: write');
    expect(publishWorkflow).not.toContain('pull-requests: write');
    expect(publishWorkflow).toMatch(/group: publish-\$\{\{ github\.ref \}\}/);
    expect(publishWorkflow).toContain('cancel-in-progress: false');
    expect(publishWorkflow).toContain('fetch-depth: 0');
    expect(publishWorkflow).toContain('persist-credentials: ${{ inputs.publish_to_npm }}');
    expect(publishWorkflow).toContain('uses: ./.github/actions/setup');
    expect(publishWorkflow).toContain('scripts/check.sh ci');
    expect(publishWorkflow).toContain('scripts/check.sh dogfood all');
    expect(publishWorkflow).toContain('Refuse pending changesets');
    expect(publishWorkflow).toContain("find .changeset -name '*.md'");
    expect(publishWorkflow).toContain('Merge the release PR before publishing.');
    expect(publishWorkflow).toContain('uses: changesets/action@v1.9.0');
    expect(publishWorkflow).toContain('publish: pnpm run publish-packages');
    expect(publishWorkflow).not.toMatch(/version:\s*pnpm run version-packages/);
    expect(publishWorkflow).toContain('NPM_TOKEN: ${{ secrets.NPM_AUTH_TOKEN }}');
    expect(publishWorkflow).toContain("github.ref == 'refs/heads/main'");
    expect(publishWorkflow).toContain("github.ref != 'refs/heads/main'");

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
