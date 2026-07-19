import { createHash } from 'node:crypto';
import { mkdtemp, readFile, readdir, rm } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { tmpdir } from 'node:os';
import { spawn } from 'node:child_process';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const generatorDir = join(root, 'packages', 'create-moon-pnpm-monorepo');
const errors = [];

async function run(cmd, args, cwd) {
  return new Promise((resolveRun, reject) => {
    const child = spawn(cmd, args, { cwd, stdio: 'pipe', shell: false, env: { ...process.env } });
    let stdout = '', stderr = '';
    child.stdout.on('data', (d) => stdout += d);
    child.stderr.on('data', (d) => stderr += d);
    child.on('error', reject);
    child.on('exit', (code) => code === 0 ? resolveRun(stdout) : reject(new Error(`${cmd} ${args.join(' ')} exited ${code}: ${stderr}`)));
  });
}

async function collectFiles(dir, base = dir) {
  const files = [];
  if (!existsSync(dir)) return files;
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    if (entry.name === 'node_modules' || entry.name === '.git') continue;
    if (entry.name === 'cache' && dir.endsWith('.moon')) continue;
    const p = join(dir, entry.name);
    if (entry.isDirectory()) files.push(...await collectFiles(p, base));
    else files.push({ rel: relative(base, p), content: await readFile(p) });
  }
  return files;
}

async function fileMap(dir) {
  const files = await collectFiles(dir);
  const map = new Map();
  for (const f of files) {
    const hash = createHash('sha256').update(f.content).digest('hex');
    map.set(f.rel.replaceAll(sep, '/'), hash);
  }
  return map;
}

async function buildGenerator() {
  await run('pnpm', ['exec', 'moon', 'run', 'create-moon-pnpm-monorepo:build'], root);
}

async function generateViaSource(parentDir, name) {
  const sourceDir = join(generatorDir, 'src');
  const { createMonorepo } = await import(join(sourceDir, 'index.ts'));
  const target = join(parentDir, name + '-source');
  const result = await createMonorepo({ name, directory: target });
  return { target, files: result.files };
}

async function generateViaCli(parentDir, name) {
  const target = join(parentDir, name + '-cli');
  await run('node', [join(generatorDir, 'dist', 'cli.js'), '--name', name, '--directory', target], root);
  return { target };
}

async function compareDirs(sourceDir, cliDir) {
  const sourceMap = await fileMap(sourceDir);
  const cliMap = await fileMap(cliDir);
  const allKeys = new Set([...sourceMap.keys(), ...cliMap.keys()]);
  for (const key of [...allKeys].sort()) {
    if (!sourceMap.has(key)) errors.push(`CLI-only file: ${key}`);
    else if (!cliMap.has(key)) errors.push(`source-only file: ${key}`);
    else if (sourceMap.get(key) !== cliMap.get(key)) errors.push(`content mismatch: ${key}`);
  }
}

async function checkSpecificFiles(dir) {
  const mustExist = [
    '.github/workflows/main.yml',
    '.github/workflows/publish.yml',
    '.github/workflows/release-pr.yml',
    '.github/actions/setup/action.yml',
    '.moon/workspace.yml',
    '.moon/toolchains.yml',
    '.moon/tasks/node.yml',
    'scripts/check.sh',
    'packages/hono-base/src/index.ts',
    'packages/app-react/src/server/app.tsx'
  ];
  for (const f of mustExist) {
    if (!existsSync(join(dir, f))) errors.push(`generated repo missing: ${f}`);
  }
}

// Guard the drift class where a generated file (check.sh, a workflow, package.json,
// another script) references scripts/<name> that templateFiles() never emits — which
// fails at generated-repo runtime with MODULE_NOT_FOUND. The source-vs-CLI diff above
// can't catch it (both paths agree on the same dangling reference), and dogfood catches
// it only slowly, buried in subprocess output. This is a fast, explicit fail.
async function checkReferencedScriptsExist(dir) {
  const files = await collectFiles(dir);
  const present = new Set(files.map((f) => f.rel.replaceAll(sep, '/')));
  const scriptRef = /scripts\/[\w.-]+\.(?:mjs|sh)/g;
  for (const f of files) {
    const rel = f.rel.replaceAll(sep, '/');
    const scannable = /^scripts\/.+\.(?:mjs|sh)$/.test(rel) || /\.ya?ml$/.test(rel) || rel.endsWith('package.json');
    if (!scannable) continue;
    for (const ref of f.content.toString('utf8').match(scriptRef) ?? []) {
      if (!present.has(ref)) errors.push(`generated ${rel} references ${ref}, which is not scaffolded`);
    }
  }
}

async function checkNoNewRepoChanges(beforeStatus) {
  const afterStatus = await run('git', ['status', '--porcelain'], root);
  const before = new Set(beforeStatus.trim().split('\n').filter((l) => l.trim()));
  const after = new Set(afterStatus.trim().split('\n').filter((l) => l.trim()));
  const newChanges = [...after].filter((l) => !before.has(l));
  if (newChanges.length > 0) {
    errors.push(`generator drift introduced repo changes: ${newChanges.join(', ')}`);
  }
}

const beforeStatus = await run('git', ['status', '--porcelain'], root);
const parentDir = await mkdtemp(join(tmpdir(), 'generator-drift-'));
try {
  await buildGenerator();
  const name = 'drift-test-repo';
  const sourceResult = await generateViaSource(parentDir, name);
  const cliResult = await generateViaCli(parentDir, name);
  await compareDirs(sourceResult.target, cliResult.target);
  await checkSpecificFiles(sourceResult.target);
  await checkReferencedScriptsExist(sourceResult.target);
  await checkNoNewRepoChanges(beforeStatus);
} finally {
  await rm(parentDir, { recursive: true, force: true });
}

if (errors.length > 0) {
  console.error('Generator drift check failed:');
  for (const e of errors) console.error(`- ${e}`);
  process.exit(1);
}
console.log('Generator drift check passed: source API and built CLI produce identical output.');

