import { createHash } from 'node:crypto';
import { readFile, readdir, writeFile, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join, resolve, relative } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const packagesDir = join(root, 'packages');
const args = process.argv.slice(2);
const command = args[0];

async function collectDistFiles(dir) {
  const files = [];
  if (!existsSync(dir)) return files;
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const p = join(dir, entry.name);
    if (entry.isDirectory()) files.push(...await collectDistFiles(p));
    else files.push(p);
  }
  return files;
}

async function collectAllDistFiles() {
  const allFiles = [];
  const packageDirs = await readdir(packagesDir, { withFileTypes: true });
  for (const entry of packageDirs) {
    if (!entry.isDirectory()) continue;
    const distDir = join(packagesDir, entry.name, 'dist');
    const distFiles = await collectDistFiles(distDir);
    allFiles.push(...distFiles);
  }
  return allFiles;
}

async function createManifest() {
  const entries = [];
  const allFiles = await collectAllDistFiles();
  for (const file of allFiles) {
    const rel = relative(root, file);
    const content = await readFile(file);
    const hash = createHash('sha256').update(content).digest('hex');
    entries.push({ path: rel, sha256: hash, size: content.length });
  }
  entries.sort((a, b) => a.path.localeCompare(b.path));
  const manifest = { generatedAt: new Date().toISOString(), entries };
  const manifestPath = join(root, '.artifacts', 'build-manifest.json');
  await mkdir(join(root, '.artifacts'), { recursive: true });
  await writeFile(manifestPath, JSON.stringify(manifest, null, 2) + '\n');
  console.log(`Build manifest: ${entries.length} files at ${manifestPath}`);
  return manifestPath;
}

async function verifyManifest() {
  const manifestPath = join(root, '.artifacts', 'build-manifest.json');
  if (!existsSync(manifestPath)) {
    console.error('Build manifest not found at .artifacts/build-manifest.json');
    process.exit(1);
  }
  const manifest = JSON.parse(await readFile(manifestPath, 'utf8'));
  const errors = [];
  if (!manifest.entries || manifest.entries.length === 0) {
    console.error('Build manifest is empty — no dist files recorded.');
    process.exit(1);
  }
  const manifestPaths = new Set(manifest.entries.map((e) => e.path));
  for (const entry of manifest.entries) {
    const filePath = join(root, entry.path);
    if (!existsSync(filePath)) {
      errors.push(`missing: ${entry.path}`);
      continue;
    }
    const content = await readFile(filePath);
    const hash = createHash('sha256').update(content).digest('hex');
    if (hash !== entry.sha256) {
      errors.push(`tampered: ${entry.path} (expected ${entry.sha256.slice(0, 12)}, got ${hash.slice(0, 12)})`);
    }
  }
  const actualFiles = await collectAllDistFiles();
  for (const file of actualFiles) {
    const rel = relative(root, file);
    if (!manifestPaths.has(rel)) {
      errors.push(`extra: ${rel} (not in manifest)`);
    }
  }
  if (errors.length > 0) {
    console.error('Build manifest verification failed:');
    for (const e of errors) console.error(`- ${e}`);
    process.exit(1);
  }
  console.log(`Build manifest verified: ${manifest.entries.length} files OK.`);
}

if (command === 'create') {
  await createManifest();
} else if (command === 'verify') {
  await verifyManifest();
} else {
  console.log('Usage: node scripts/build-manifest.mjs create|verify');
  process.exit(2);
}
