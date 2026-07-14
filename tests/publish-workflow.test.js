import { describe, it, expect } from 'vitest';
import { resolve, join } from 'node:path';
import { readFile } from 'node:fs/promises';

const root = resolve(import.meta.dirname, '..');
const workflowPath = join(root, '.github', 'workflows', 'publish.yml');

describe('publish workflow', () => {
  it('triggers only on manual workflow_dispatch', async () => {
    const content = await readFile(workflowPath, 'utf8');
    expect(content).toMatch(/^on:\n  workflow_dispatch:\n/m);
    expect(content).not.toMatch(/^\s+push:/m);
    expect(content).not.toMatch(/^\s+pull_request:/m);
  });

  it('keeps the publish_to_npm safety gate', async () => {
    const content = await readFile(workflowPath, 'utf8');
    expect(content).toContain('publish_to_npm:');
    expect(content).toContain('type: boolean');
    expect(content).toContain('default: false');
  });

  it('uses least privilege contents write only', async () => {
    const content = await readFile(workflowPath, 'utf8');
    expect(content).toContain('contents: write');
    const permissionsBlock = content.slice(
      content.indexOf('permissions:'),
      content.indexOf('concurrency:')
    );
    expect(permissionsBlock).not.toContain('pull-requests: write');
    expect(permissionsBlock).not.toContain('packages: write');
    expect(permissionsBlock).not.toContain('id-token: write');
  });

  it('does not cancel in-progress publish operations', async () => {
    const content = await readFile(workflowPath, 'utf8');
    expect(content).toContain('cancel-in-progress: false');
    expect(content).toMatch(/group: publish-\$\{\{ github\.ref \}\}/);
  });

  it('preserves validation and dogfood steps', async () => {
    const content = await readFile(workflowPath, 'utf8');
    expect(content).toContain('scripts/check.sh ci');
    expect(content).toContain('scripts/check.sh dogfood all');
  });

  it('refuses pending changesets before publishing', async () => {
    const content = await readFile(workflowPath, 'utf8');
    expect(content).toContain('Refuse pending changesets');
    expect(content).toContain("find .changeset -name '*.md'");
    expect(content).toContain('Merge the release PR before publishing.');
    expect(content).toContain('exit 1');
  });

  it('uses the pinned changesets action with publish command only', async () => {
    const content = await readFile(workflowPath, 'utf8');
    expect(content).toContain('uses: changesets/action@v1.9.0');
    expect(content).toContain('publish: pnpm run publish-packages');
    expect(content).not.toMatch(/version:\s*pnpm run version-packages/);
  });

  it('gates publish and skip-explanation on publish_to_npm and main branch', async () => {
    const content = await readFile(workflowPath, 'utf8');
    expect(content).toContain("inputs.publish_to_npm && github.ref == 'refs/heads/main'");
    expect(content).toContain("inputs.publish_to_npm && github.ref != 'refs/heads/main'");
  });

  it('receives NPM_TOKEN for publishing but not version', async () => {
    const content = await readFile(workflowPath, 'utf8');
    expect(content).toContain('NPM_TOKEN: ${{ secrets.NPM_AUTH_TOKEN }}');
    expect(content).toContain('GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}');
  });

  it('checks out full history with conditional credentials', async () => {
    const content = await readFile(workflowPath, 'utf8');
    expect(content).toContain('fetch-depth: 0');
    expect(content).toContain('persist-credentials: ${{ inputs.publish_to_npm }}');
    expect(content).toContain('uses: ./.github/actions/setup');
  });
});
