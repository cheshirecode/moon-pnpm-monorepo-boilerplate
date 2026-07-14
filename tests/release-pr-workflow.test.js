import { describe, it, expect } from 'vitest';
import { resolve, join } from 'node:path';
import { readFile } from 'node:fs/promises';

const root = resolve(import.meta.dirname, '..');
const workflowPath = join(root, '.github', 'workflows', 'release-pr.yml');

describe('release-pr workflow', () => {
  it('triggers only on push to main', async () => {
    const content = await readFile(workflowPath, 'utf8');
    expect(content).toMatch(/^on:\n  push:\n    branches:\n      - main\n/m);
    expect(content).not.toMatch(/workflow_dispatch:/);
    expect(content).not.toMatch(/pull_request:/);
  });

  it('uses least privilege contents and pull-requests write', async () => {
    const content = await readFile(workflowPath, 'utf8');
    expect(content).toContain('contents: write');
    expect(content).toContain('pull-requests: write');
    const permissionsBlock = content.slice(
      content.indexOf('permissions:'),
      content.indexOf('concurrency:')
    );
    expect(permissionsBlock).not.toContain('packages: write');
    expect(permissionsBlock).not.toContain('id-token: write');
  });

  it('does not cancel in-progress version operations', async () => {
    const content = await readFile(workflowPath, 'utf8');
    expect(content).toContain('cancel-in-progress: false');
    expect(content).toMatch(/group: release-pr-\$\{\{ github\.ref \}\}/);
  });

  it('uses the pinned changesets action with version command only', async () => {
    const content = await readFile(workflowPath, 'utf8');
    expect(content).toContain('uses: changesets/action@v1.9.0');
    expect(content).toContain('version: pnpm run version-packages');
  });

  it('never publishes or receives an npm token', async () => {
    const content = await readFile(workflowPath, 'utf8');
    expect(content).not.toContain('publish:');
    expect(content).not.toContain('NPM_TOKEN');
    expect(content).not.toContain('NPM_AUTH_TOKEN');
    expect(content).not.toContain('NODE_AUTH_TOKEN');
  });

  it('checks out full history and uses the setup composite action', async () => {
    const content = await readFile(workflowPath, 'utf8');
    expect(content).toContain('fetch-depth: 0');
    expect(content).toContain('persist-credentials: true');
    expect(content).toContain('uses: ./.github/actions/setup');
  });
});
