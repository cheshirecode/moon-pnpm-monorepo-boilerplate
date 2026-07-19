import { describe, it, expect } from 'vitest';
import { resolve } from 'node:path';
import { spawn } from 'node:child_process';

const root = resolve(import.meta.dirname, '..');

function runAsync(cmd, args, cwd) {
  return new Promise((resolveRun, reject) => {
    const child = spawn(cmd, args, { cwd, stdio: 'pipe', shell: false, env: { ...process.env } });
    let stdout = '', stderr = '';
    child.stdout.on('data', (d) => stdout += d);
    child.stderr.on('data', (d) => stderr += d);
    child.on('error', reject);
    child.on('exit', (code) => code === 0 ? resolveRun(stdout) : reject(new Error(`${cmd} exited ${code}: ${stderr}`)));
  });
}

describe('generator-drift', () => {
  it('source API and built CLI produce identical output', async () => {
    const output = await runAsync('node', ['scripts/generator-drift.mjs'], root);
    expect(output).toContain('passed');
  }, 60000);

  it('leaves no new git changes after run', async () => {
    const before = await runAsync('git', ['status', '--porcelain'], root);
    await runAsync('node', ['scripts/generator-drift.mjs'], root);
    const after = await runAsync('git', ['status', '--porcelain'], root);
    const beforeSet = new Set(before.trim().split('\n').filter(Boolean));
    const afterSet = new Set(after.trim().split('\n').filter(Boolean));
    const newChanges = [...afterSet].filter((l) => !beforeSet.has(l));
    expect(newChanges).toEqual([]);
  }, 60000);
});
