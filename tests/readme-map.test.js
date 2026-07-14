import { describe, it, expect } from 'vitest';
import { resolve, join } from 'node:path';
import { readFile, writeFile, mkdtemp, mkdir } from 'node:fs/promises';
import { rmSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import {
  generateReadmeMap,
  checkReadmeMap,
  writeReadmeMap,
  findMarkerRegion,
  escapeHtml,
  loadInventory,
  validate
} from '../scripts/readme-map.mjs';

const root = resolve(import.meta.dirname, '..');
const BEGIN = '<!-- BEGIN readme-map -->';
const END = '<!-- END readme-map -->';

describe('readme-map', () => {
  it('generates all three tables and the mermaid graph', async () => {
    const content = await generateReadmeMap(root);
    expect(content).toContain('### Renderer surface');
    expect(content).toContain('### Shared runtime graph');
    expect(content).toContain('### Tooling and standalone');
    expect(content).toContain('```mermaid');
    for (const dir of ['app-react', 'app-preact', 'app-astro', 'app-vue', 'app-svelte', 'app-solidjs', 'renderer-showcase'])
      expect(content).toContain(`packages/${dir}/`);
    expect(content).toContain('showcase -. embeds .-> react');
    expect(content).toContain('contract --> utils');
    expect(content).toContain('pkce --> clipboard');
  });

  it('passes check when README is in sync', async () => {
    expect((await checkReadmeMap(root)).ok).toBe(true);
  });

  it('detects drift when generated region is stale', async () => {
    const readme = await readFile(resolve(root, 'README.md'), 'utf8');
    const drifted = readme.replace('React renderer demo', 'STALE');
    const region = findMarkerRegion(drifted);
    expect(region.ok).toBe(true);
    const current = drifted.slice(region.begin + BEGIN.length, region.end).replace(/^\n+/, '').replace(/\n+$/, '');
    const generated = await generateReadmeMap(root);
    expect(current).not.toBe(generated);
  });

  it('rejects missing markers', () => {
    expect(findMarkerRegion('no markers here').ok).toBe(false);
  });

  it('rejects duplicate begin markers', () => {
    expect(findMarkerRegion(`${BEGIN}\nA\n${BEGIN}\nB\n${END}`).ok).toBe(false);
  });

  it('rejects misordered markers', () => {
    expect(findMarkerRegion(`${END}\nA\n${BEGIN}`).ok).toBe(false);
  });

  it('escapes HTML special characters', () => {
    expect(escapeHtml('<script>')).toBe('&lt;script&gt;');
    expect(escapeHtml('a & b')).toBe('a &amp; b');
    expect(escapeHtml('"quoted"')).toBe('&quot;quoted&quot;');
  });

  it('rejects unknown package in metadata', async () => {
    const meta = JSON.parse(await readFile(resolve(root, 'scripts', 'readme-map.json'), 'utf8'));
    meta.packages['nonexistent'] = { nodeId: 'x' };
    const inv = await loadInventory(root);
    expect(() => validate(meta, inv)).toThrow('unknown package');
  });

  it('rejects unclassified package', async () => {
    const meta = JSON.parse(await readFile(resolve(root, 'scripts', 'readme-map.json'), 'utf8'));
    const inv = await loadInventory(root);
    const target = meta.sharedRuntime[0];
    meta.sharedRuntime = meta.sharedRuntime.filter((d) => d !== target);
    meta.tooling = meta.tooling.filter((d) => d !== target);
    expect(() => validate(meta, inv)).toThrow('not classified');
  });

  it('rejects unknown CLI args with exit 2', () => {
    const result = spawnSync('node', ['scripts/readme-map.mjs', '--bad'], { cwd: root, encoding: 'utf8' });
    expect(result.status).toBe(2);
  });

  it('rejects duplicate nodeId across packages', async () => {
    const meta = JSON.parse(await readFile(resolve(root, 'scripts', 'readme-map.json'), 'utf8'));
    const inv = await loadInventory(root);
    meta.packages['tsconfig'].nodeId = 'host';
    expect(() => validate(meta, inv)).toThrow('Duplicate nodeId');
  });

  it('rejects technology icon not found in docs/assets/package-icons', async () => {
    const meta = JSON.parse(await readFile(resolve(root, 'scripts', 'readme-map.json'), 'utf8'));
    const inv = await loadInventory(root);
    meta.packages['app-react'].technology = 'nonexistent';
    expect(() => validate(meta, inv)).toThrow('Icon "nonexistent.svg"');
  });

  it('writes updated content into a minimal fixture README', async () => {
    const tmp = await mkdtemp(join(tmpdir(), 'readme-map-write-'));
    try {
      await mkdir(join(tmp, 'packages', 'demo-pkg'), { recursive: true });
      await mkdir(join(tmp, 'scripts'), { recursive: true });
      await mkdir(join(tmp, 'docs', 'assets', 'package-icons'), { recursive: true });
      await writeFile(join(tmp, 'packages', 'demo-pkg', 'package.json'), JSON.stringify({ name: 'demo-pkg', private: false, description: 'Demo.' }), 'utf8');
      await writeFile(join(tmp, 'docs', 'assets', 'package-icons', 'typescript.svg'), '<svg/>', 'utf8');
      const meta = { sharedRuntime: [], tooling: ['demo-pkg'], packages: { 'demo-pkg': { role: 'Demo role.' } } };
      await writeFile(join(tmp, 'scripts', 'readme-map.json'), JSON.stringify(meta), 'utf8');
      const stale = `# t\n\n## Workspace map\n\n${BEGIN}\nSTALE\n${END}\n\nAfter.\n`;
      await writeFile(join(tmp, 'README.md'), stale, 'utf8');
      const result = await writeReadmeMap(tmp);
      expect(result.ok).toBe(true);
      const written = await readFile(join(tmp, 'README.md'), 'utf8');
      expect(written).toContain('Demo role.');
      expect(written).toContain(BEGIN);
      expect(written).toContain(END);
      expect(written).toContain('After.');
      expect((await checkReadmeMap(tmp)).ok).toBe(true);
    } finally {
      rmSync(tmp, { recursive: true, force: true });
    }
  });
});
