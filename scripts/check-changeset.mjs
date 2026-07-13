import { spawn } from 'node:child_process';
import { readFile, readdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join, resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const packagesDir = join(root, 'packages');
const ignoredPackages = new Set([
  'app-react',
  'app-preact',
  'app-astro',
  'app-vue',
  'app-svelte',
  'app-solidjs',
  'renderer-showcase'
]);

const baseRef = process.env.CHANGESET_BASE_REF ?? 'origin/main';
const changedFiles = await getChangedFiles(baseRef);

const changedPublishable = changedFiles.filter(
  (file) => file.startsWith('packages/') && !isIgnoredPackage(file)
);

if (changedPublishable.length === 0) {
  console.log('No publishable package files changed; changeset check skipped.');
  process.exit(0);
}

const hasChangeset = changedFiles.some(
  (file) => file.startsWith('.changeset/') && file.endsWith('.md')
);

if (!hasChangeset) {
  console.error('Changeset check failed:');
  console.error(`Publishable package files were modified but no changeset was added.`);
  console.error(`Run \`pnpm changeset\` to add one, or mark the change as patch-only.`);
  console.error('');
  console.error('Changed publishable files:');
  for (const file of changedPublishable.slice(0, 20)) {
    console.error(`  ${file}`);
  }
  if (changedPublishable.length > 20) {
    console.error(`  ... and ${changedPublishable.length - 20} more`);
  }
  process.exit(1);
}

console.log(`Changeset check passed: ${changedPublishable.length} publishable file(s) changed with changeset.`);

function isIgnoredPackage(file) {
  const parts = file.split('/');
  if (parts.length < 2) return true;
  return ignoredPackages.has(parts[1]);
}

async function getChangedFiles(ref) {
  const outputs = await Promise.all([
    runGit(['diff', '--name-only', `${ref}...HEAD`]),
    runGit(['diff', '--name-only']),
    runGit(['diff', '--name-only', '--cached']),
    runGit(['ls-files', '--others', '--exclude-standard'])
  ]);

  return [...new Set(outputs.flatMap((output) => output.split('\n').filter(Boolean)))];
}

function runGit(args) {
  return new Promise((resolveRun, reject) => {
    const child = spawn('git', args, {
      cwd: root,
      stdio: ['ignore', 'pipe', 'pipe'],
      shell: false
    });

    let output = '';
    child.stdout.on('data', (chunk) => (output += chunk));
    child.on('error', reject);
    child.on('exit', (code) => resolveRun(code === 0 ? output.trim() : ''));
  });
}
