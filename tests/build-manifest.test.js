import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { resolve, join } from 'node:path';
import { mkdtemp, mkdir, writeFile, rm, readFile, appendFile } from 'node:fs/promises';
import { existsSync, unlinkSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { spawn } from 'node:child_process';

const root = resolve(import.meta.dirname, '..');
const manifestPath = join(root, '.artifacts', 'build-manifest.json');

function runAsync(cmd, args, cwd) {
  return new Promise((resolveRun, reject) => {
    const child = spawn(cmd, args, { cwd, stdio: 'pipe', shell: false });
    let stdout = '', stderr = '';
    child.stdout.on('data', (d) => stdout += d);
    child.stderr.on('data', (d) => stderr += d);
    child.on('error', reject);
    child.on('exit', (code) => code === 0 ? resolveRun(stdout) : reject(new Error(`${cmd} exited ${code}: ${stderr}`)));
  });
}

describe('build-manifest', () => {
  describe('create + verify round-trip', () => {
    it('creates and verifies a manifest with real dist files', async () => {
      await runAsync('node', ['scripts/build-manifest.mjs', 'create'], root);
      expect(existsSync(manifestPath)).toBe(true);
      const manifest = JSON.parse(await readFile(manifestPath, 'utf8'));
      expect(manifest.entries.length).toBeGreaterThan(0);
      const output = await runAsync('node', ['scripts/build-manifest.mjs', 'verify'], root);
      expect(output).toContain('OK');
    });
  });

  describe('tamper detection', () => {
    let tamperedFile;

    beforeEach(async () => {
      await runAsync('node', ['scripts/build-manifest.mjs', 'create'], root);
      const manifest = JSON.parse(await readFile(manifestPath, 'utf8'));
      const entry = manifest.entries.find((e) => e.path.endsWith('.js'));
      if (!entry) return;
      tamperedFile = join(root, entry.path);
      await appendFile(tamperedFile, ' tampered');
    });

    afterEach(async () => {
      if (tamperedFile) {
        await runAsync('pnpm', ['exec', 'moon', 'run', 'create-moon-pnpm-monorepo:build'], root).catch(() => {});
      }
    });

    it('detects tampered dist file', async () => {
      if (!tamperedFile) return;
      await expect(runAsync('node', ['scripts/build-manifest.mjs', 'verify'], root)).rejects.toThrow(/tampered/);
    });
  });

  describe('missing file detection', () => {
    let removedFile;

    beforeEach(async () => {
      await runAsync('node', ['scripts/build-manifest.mjs', 'create'], root);
      const manifest = JSON.parse(await readFile(manifestPath, 'utf8'));
      const distEntry = manifest.entries.find((e) => e.path.includes('/dist/'));
      if (!distEntry) return;
      removedFile = join(root, distEntry.path);
      if (existsSync(removedFile)) unlinkSync(removedFile);
    });

    afterEach(async () => {
      await runAsync('pnpm', ['exec', 'moon', 'run', 'create-moon-pnpm-monorepo:build'], root).catch(() => {});
    });

    it('detects missing dist file', async () => {
      if (!removedFile) return;
      await expect(runAsync('node', ['scripts/build-manifest.mjs', 'verify'], root)).rejects.toThrow(/missing/);
    });
  });

  describe('extra file detection', () => {
    let extraFile;

    beforeEach(async () => {
      await runAsync('node', ['scripts/build-manifest.mjs', 'create'], root);
      const manifest = JSON.parse(await readFile(manifestPath, 'utf8'));
      const distEntry = manifest.entries.find((e) => e.path.includes('/dist/'));
      if (!distEntry) return;
      const dir = join(root, distEntry.path, '..');
      extraFile = join(dir, 'extra-test-file.js');
      await writeFile(extraFile, 'extra content');
    });

    afterEach(async () => {
      if (extraFile && existsSync(extraFile)) unlinkSync(extraFile);
    });

    it('detects extra dist file not in manifest', async () => {
      if (!extraFile) return;
      await expect(runAsync('node', ['scripts/build-manifest.mjs', 'verify'], root)).rejects.toThrow(/extra/);
    });
  });

  describe('zero entries rejection', () => {
    it('rejects empty manifest', async () => {
      const emptyManifest = { generatedAt: '2025-01-01T00:00:00Z', entries: [] };
      await mkdir(join(root, '.artifacts'), { recursive: true });
      await writeFile(manifestPath, JSON.stringify(emptyManifest, null, 2) + '\n');
      await expect(runAsync('node', ['scripts/build-manifest.mjs', 'verify'], root)).rejects.toThrow(/empty/);
      await runAsync('node', ['scripts/build-manifest.mjs', 'create'], root);
    });
  });
});
