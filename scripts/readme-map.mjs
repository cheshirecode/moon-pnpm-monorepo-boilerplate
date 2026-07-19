import { readFile, writeFile, readdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import { join, resolve } from 'node:path';

const BEGIN = '<!-- BEGIN readme-map -->';
const END = '<!-- END readme-map -->';
const RENDERER_ORDER = ['app-react', 'app-preact', 'app-astro', 'app-vue', 'app-svelte', 'app-solidjs'];
const root = resolve(import.meta.dirname, '..');

export function escapeHtml(s) {
  return String(s)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

export function findMarkerRegion(readme) {
  const begin = readme.indexOf(BEGIN);
  const end = readme.indexOf(END);
  if (begin === -1 || end === -1)
    return { ok: false, error: `README.md missing generated-region markers. Add:\n${BEGIN}\n...\n${END}` };
  if (end <= begin)
    return { ok: false, error: 'README.md end marker appears before begin marker.' };
  if (readme.indexOf(BEGIN, begin + 1) !== -1)
    return { ok: false, error: 'README.md has multiple begin markers.' };
  if (readme.indexOf(END, end + 1) !== -1)
    return { ok: false, error: 'README.md has multiple end markers.' };
  return { ok: true, begin, end };
}

export async function generateReadmeMap(rootDir = root) {
  const meta = JSON.parse(await readFile(join(rootDir, 'scripts', 'readme-map.json'), 'utf8'));
  const inv = await loadInventory(rootDir);
  validate(meta, inv);
  return render(meta, inv);
}

export async function checkReadmeMap(rootDir = root) {
  const readme = await readFile(join(rootDir, 'README.md'), 'utf8');
  const region = findMarkerRegion(readme);
  if (!region.ok) return { ok: false, message: region.error };
  const current = readme.slice(region.begin + BEGIN.length, region.end).replace(/^\n+/, '').replace(/\n+$/, '');
  const generated = await generateReadmeMap(rootDir);
  if (current === generated) return { ok: true, message: 'README workspace map is up to date.' };
  return { ok: false, message: 'README.md workspace map is out of date.\nFix: scripts/check.sh readme-map --write' };
}

export async function writeReadmeMap(rootDir = root) {
  const readmePath = join(rootDir, 'README.md');
  const readme = await readFile(readmePath, 'utf8');
  const region = findMarkerRegion(readme);
  if (!region.ok) return { ok: false, message: region.error };
  const generated = await generateReadmeMap(rootDir);
  await writeFile(readmePath, readme.slice(0, region.begin + BEGIN.length) + '\n' + generated + '\n' + readme.slice(region.end), 'utf8');
  return { ok: true, message: 'README.md workspace map updated.' };
}

export async function loadInventory(rootDir) {
  const pkgDir = join(rootDir, 'packages');
  const iconDir = join(rootDir, 'docs', 'assets', 'package-icons');
  const dirs = (await readdir(pkgDir, { withFileTypes: true }))
    .filter((e) => e.isDirectory()).map((e) => e.name).sort();
  const icons = new Set();
  if (existsSync(iconDir)) {
    for (const entry of await readdir(iconDir))
      if (entry.endsWith('.svg')) icons.add(entry.slice(0, -4));
  }
  const packages = new Map();
  const nameToDir = new Map();
  for (const dir of dirs) {
    const pj = JSON.parse(await readFile(join(pkgDir, dir, 'package.json'), 'utf8'));
    const moonPath = join(pkgDir, dir, 'moon.yml');
    const moon = existsSync(moonPath) ? await readFile(moonPath, 'utf8') : '';
    const info = {
      dir,
      name: pj.name ?? dir,
      private: pj.private === true,
      description: pj.description ?? '',
      dependencies: pj.dependencies ?? {},
      layer: yamlField(moon, 'layer'),
      stack: yamlField(moon, 'stack'),
      language: yamlField(moon, 'language')
    };
    packages.set(dir, info);
    nameToDir.set(info.name, dir);
  }
  return { packages, nameToDir, dirs, icons };
}

export function validate(meta, inv) {
  const g = classify(meta, inv);
  const rendererSet = new Set([...g.rendererApps, ...g.host]);
  const sharedSet = new Set(meta.sharedRuntime);
  const toolingSet = new Set(meta.tooling);
  const errors = [];
  for (const dir of inv.dirs)
    if (!meta.packages[dir]) errors.push(`Package "${dir}" is missing from scripts/readme-map.json.`);
  for (const dir of Object.keys(meta.packages))
    if (!inv.packages.has(dir)) errors.push(`scripts/readme-map.json references unknown package "${dir}".`);
  for (const dir of inv.dirs) {
    if (rendererSet.has(dir)) continue;
    if (!sharedSet.has(dir) && !toolingSet.has(dir))
      errors.push(`Package "${dir}" is not classified. Add it to "sharedRuntime" or "tooling" in scripts/readme-map.json.`);
  }
  for (const dir of sharedSet) {
    if (toolingSet.has(dir)) errors.push(`"${dir}" appears in both "sharedRuntime" and "tooling".`);
    if (rendererSet.has(dir)) errors.push(`Renderer "${dir}" must not appear in "sharedRuntime".`);
    if (!inv.packages.has(dir)) errors.push(`"sharedRuntime" references unknown package "${dir}".`);
  }
  for (const dir of toolingSet) {
    if (rendererSet.has(dir)) errors.push(`Renderer "${dir}" must not appear in "tooling".`);
    if (!inv.packages.has(dir)) errors.push(`"tooling" references unknown package "${dir}".`);
  }
  for (const dir of g.rendererApps) {
    const p = meta.packages[dir] ?? {};
    for (const f of ['technology', 'techName', 'subtag', 'role'])
      if (!p[f]) errors.push(`Renderer app "${dir}" is missing "${f}" in scripts/readme-map.json.`);
  }
  for (const dir of inv.dirs) {
    const p = meta.packages[dir] ?? {};
    if (p.nodeId && !/^[a-zA-Z][a-zA-Z0-9_-]*$/.test(p.nodeId))
      errors.push(`Invalid nodeId "${p.nodeId}" for "${dir}".`);
  }
  const seenIds = new Map();
  for (const dir of inv.dirs) {
    const id = nodeId(meta, dir);
    if (seenIds.has(id))
      errors.push(`Duplicate nodeId "${id}" for "${dir}" and "${seenIds.get(id)}".`);
    else
      seenIds.set(id, dir);
  }
  for (const dir of inv.dirs) {
    const p = meta.packages[dir] ?? {};
    const icon = p.technology && p.techName
      ? p.technology
      : inv.packages.get(dir).language === 'javascript' ? 'javascript' : 'typescript';
    if (!inv.icons.has(icon))
      errors.push(`Icon "${icon}.svg" for "${dir}" not found in docs/assets/package-icons/.`);
  }
  if (errors.length) throw new Error(`readme-map validation failed:\n${errors.map((e) => `  - ${e}`).join('\n')}`);
}

function yamlField(content, field) {
  const m = content.match(new RegExp(`^${field}:\\s*"?([^"\\n]+?)"?\\s*$`, 'm'));
  return m ? m[1] : null;
}

function isRenderer(info, dir) {
  if (dir === 'renderer-showcase') return info.layer === 'application';
  return info.layer === 'application' && info.stack === 'frontend';
}

function classify(meta, inv) {
  const rendererApps = [];
  const host = [];
  for (const dir of inv.dirs) {
    if (!isRenderer(inv.packages.get(dir), dir)) continue;
    (dir === 'renderer-showcase' ? host : rendererApps).push(dir);
  }
  rendererApps.sort((a, b) => {
    const ia = RENDERER_ORDER.indexOf(a);
    const ib = RENDERER_ORDER.indexOf(b);
    return (ia < 0 ? Infinity : ia) - (ib < 0 ? Infinity : ib);
  });
  return { rendererApps, host, sharedRuntime: meta.sharedRuntime, tooling: meta.tooling };
}

function render(meta, inv) {
  const g = classify(meta, inv);
  return [
    section('Renderer surface', `${cap(word(g.rendererApps.length))} private framework apps are embedded by one private showcase host.`, table(meta, inv, [...g.rendererApps, ...g.host])),
    section('Shared runtime graph', 'Publishable packages connected by internal runtime dependencies.', table(meta, inv, g.sharedRuntime)),
    section('Tooling and standalone', 'CLIs, shared configuration, and packages without an internal runtime edge.', table(meta, inv, g.tooling)),
    mermaid(meta, inv, g)
  ].join('\n\n');
}

function section(heading, desc, table) {
  return `### ${heading}\n\n${desc}\n\n${table}`;
}

function cap(s) { return s.charAt(0).toUpperCase() + s.slice(1); }

function word(n) {
  const w = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve'];
  return n < w.length ? w[n] : String(n);
}

function table(meta, inv, dirs) {
  const rows = dirs.map((d) => row(meta, inv, d)).join('\n');
  return `<table>\n  <thead>\n    <tr><th>Technology</th><th>Package</th><th>Role</th></tr>\n  </thead>\n  <tbody>\n${rows}\n  </tbody>\n</table>`;
}

function row(meta, inv, dir) {
  const info = inv.packages.get(dir);
  const p = meta.packages[dir] ?? {};
  const { icon, techName } = p.technology && p.techName
    ? { icon: p.technology, techName: p.techName }
    : info.language === 'javascript'
      ? { icon: 'javascript', techName: 'JavaScript' }
      : { icon: 'typescript', techName: 'TypeScript' };
  const subtag = p.subtag ?? (info.language === 'javascript' ? 'JS' : 'TS');
  const role = p.role ?? info.description;
  const tech = `<img src="docs/assets/package-icons/${escapeHtml(icon)}.svg" alt="" width="20" height="20"> ${escapeHtml(techName)}`;
  const pkg = `<a href="packages/${escapeHtml(dir)}/"><code>${escapeHtml(info.name)}</code></a><br><sub>${escapeHtml(subtag)}</sub>`;
  return `    <tr><td>${tech}</td><td>${pkg}</td><td>${escapeHtml(role)}</td></tr>`;
}

function nodeId(meta, dir) {
  return (meta.packages[dir] ?? {}).nodeId ?? dir;
}

function mermaid(meta, inv, g) {
  const parts = ['flowchart TB'];
  parts.push(subgraph('renderer', 'Renderer surface', [...g.host, ...g.rendererApps], meta, inv, false));
  parts.push(subgraph('runtime', 'Shared runtime', g.sharedRuntime, meta, inv, true));
  parts.push(subgraph('tooling', 'Tooling and standalone', g.tooling, meta, inv, true));
  const embeds = g.rendererApps.map((d) => `  ${nodeId(meta, g.host[0])} -. embeds .-> ${nodeId(meta, d)}`);
  if (embeds.length) parts.push(embeds.join('\n'));
  const order = [...g.rendererApps, ...g.host, ...g.sharedRuntime, ...g.tooling];
  const idx = new Map(order.map((d, i) => [d, i]));
  const deps = [];
  for (const dir of order) {
    const info = inv.packages.get(dir);
    const src = nodeId(meta, dir);
    const targets = Object.entries(info.dependencies)
      .filter(([, v]) => v.startsWith('workspace:'))
      .map(([name]) => inv.nameToDir.get(name))
      .filter(Boolean)
      .sort((a, b) => (idx.get(a) ?? Infinity) - (idx.get(b) ?? Infinity));
    for (const t of targets) deps.push(`  ${src} --> ${nodeId(meta, t)}`);
  }
  if (deps.length) parts.push(deps.join('\n'));
  return '```mermaid\n' + parts[0] + '\n' + parts.slice(1).join('\n\n') + '\n```';
}

function subgraph(id, label, dirs, meta, inv, quoted) {
  const nodes = dirs.map((dir) => {
    const name = inv.packages.get(dir).name;
    const nid = nodeId(meta, dir);
    return quoted
      ? `    ${nid}["${name.replaceAll('"', '&quot;')}"]`
      : `    ${nid}[${name}]`;
  });
  return `  subgraph ${id}[${label}]\n${nodes.join('\n')}\n  end`;
}

async function main() {
  const args = process.argv.slice(2);
  const unknown = args.filter((a) => a !== '--write');
  if (unknown.length) {
    console.error(`Unknown argument: ${unknown[0]}\nUsage: scripts/check.sh readme-map [--write]`);
    process.exit(2);
  }
  const result = args.includes('--write') ? await writeReadmeMap(root) : await checkReadmeMap(root);
  if (result.ok) console.log(result.message);
  else { console.error(result.message); process.exit(1); }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) await main();
