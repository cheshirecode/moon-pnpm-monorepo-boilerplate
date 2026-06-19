import {
  mkdir,
  mkdtemp,
  readdir,
  rename,
  rm,
  stat,
  writeFile
} from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { basename, dirname, join, relative, resolve } from 'node:path';
import { spawn } from 'node:child_process';

const root = resolve(import.meta.dirname, '..');
const releaseDir = join(root, '.artifacts', 'release');
const dogfoodDir = join(root, '.artifacts', 'dogfood');
const reportPath = process.env.DOGFOOD_REPORT
  ? resolve(root, process.env.DOGFOOD_REPORT)
  : join(dogfoodDir, 'report.json');
const mode = process.argv[2] ?? 'packages';
const validModes = new Set(['packages', 'release', 'all']);

if (!validModes.has(mode) || process.argv.includes('-h') || process.argv.includes('--help')) {
  usage();
  process.exit(validModes.has(mode) ? 0 : 2);
}

await run('scripts/check.sh', ['build'], root);
await run('scripts/check.sh', ['pack'], root);

const tarballs = await getTarballs();
const packages = await getPackedPackages(tarballs);
const report = {
  mode,
  generatedAt: new Date().toISOString(),
  packages: packages.map((pkg) => ({
    name: pkg.name,
    version: pkg.version,
    tarballPath: pkg.tarballPath,
    tarballBytes: pkg.tarballBytes
  })),
  checks: {
    packageConsumption: 'skipped',
    releaseDryRun: 'skipped'
  }
};

if (mode === 'packages' || mode === 'all') {
  await dogfoodPackages(packages);
  report.checks.packageConsumption = 'passed';
}

if (mode === 'release' || mode === 'all') {
  await dogfoodRelease(packages);
  report.checks.releaseDryRun = 'passed';
}

await writeReport(report);
console.log(`Dogfood ${mode} passed for ${tarballs.length} publishable package(s).`);
console.log(`Wrote dogfood report to ${relative(root, reportPath)}.`);

function usage() {
  console.log(`Usage: scripts/dogfood.mjs [packages|release|all]

Modes:
  packages  Pack packages, install tarballs in a temp external consumer, and import/use them.
  release   Pack packages and run npm publish --dry-run for each tarball.
  all       Run package-consumption and release dry-run dogfood.
`);
}

async function getTarballs() {
  const files = await readdir(releaseDir);
  const tarballs = files
    .filter((file) => file.endsWith('.tgz'))
    .map((file) => join(releaseDir, file))
    .sort();

  if (tarballs.length === 0) {
    throw new Error(`No package tarballs found in ${releaseDir}.`);
  }

  return tarballs;
}

async function getPackedPackages(tarballs) {
  const packages = [];

  for (const tarball of tarballs) {
    const packageJson = JSON.parse(
      await runCapture('tar', ['-xOf', tarball, 'package/package.json'], root)
    );

    packages.push({
      name: packageJson.name,
      version: packageJson.version,
      tarball,
      tarballPath: relative(root, tarball),
      tarballBytes: (await stat(tarball)).size,
      spec: `file:${tarball}`
    });
  }

  return packages;
}

async function dogfoodPackages(packages) {
  const consumerDir = await mkdtemp(join(tmpdir(), 'moon-pnpm-dogfood-'));
  const dependencies = Object.fromEntries(
    packages.map((pkg) => [pkg.name, pkg.spec])
  );

  try {
    await writeFile(
      join(consumerDir, 'package.json'),
      JSON.stringify(
        {
          name: 'moon-pnpm-monorepo-boilerplate-dogfood-consumer',
          private: true,
          type: 'module',
          scripts: {
            dogfood: 'node dogfood.mjs'
          },
          dependencies
        },
        null,
        2
      )
    );

    await writeFile(join(consumerDir, 'pnpm-workspace.yaml'), workspaceYaml(dependencies));
    await writeFile(join(consumerDir, 'dogfood.mjs'), consumerScript());

    await run('corepack', ['enable'], consumerDir);
    await run('corepack', ['prepare', 'pnpm@11.8.0', '--activate'], consumerDir);
    await run('pnpm', ['install'], consumerDir);
    await run('pnpm', ['run', 'dogfood'], consumerDir);
  } finally {
    if (process.env.DOGFOOD_KEEP_TEMP !== '1') {
      await rm(consumerDir, { recursive: true, force: true });
    } else {
      console.log(`Kept dogfood consumer at ${consumerDir}`);
    }
  }
}

function workspaceYaml(dependencies) {
  const overrides = Object.entries(dependencies)
    .map(([name, spec]) => `  ${JSON.stringify(name)}: ${JSON.stringify(spec)}`)
    .join('\n');

  return `packages: []\n\noverrides:\n${overrides}\n`;
}

async function dogfoodRelease(packages) {
  for (const pkg of packages) {
    if (await isAlreadyPublished(pkg)) {
      console.log(`Skipping npm publish dry-run for ${pkg.name}@${pkg.version}; version already exists.`);
      continue;
    }

    const accessArgs = pkg.name.startsWith('@') ? ['--access', 'public'] : [];
    await run(
      'npm',
      ['publish', '--dry-run', '--ignore-scripts', ...accessArgs, pkg.tarball],
      root
    );
  }
}

async function isAlreadyPublished(pkg) {
  try {
    await runQuiet('npm', ['view', `${pkg.name}@${pkg.version}`, 'version', '--json'], root);
    return true;
  } catch {
    return false;
  }
}

async function writeReport(report) {
  await mkdir(dirname(reportPath), { recursive: true });
  await writeFile(`${reportPath}.tmp`, `${JSON.stringify(report, null, 2)}\n`);
  await rename(`${reportPath}.tmp`, reportPath);
}

function consumerScript() {
  return `import assert from 'node:assert/strict';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { mkdtemp } from 'node:fs/promises';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const require = createRequire(import.meta.url);
const execFileAsync = promisify(execFile);

const clipboard = await import('@fieryeagle/browser-clipboard');
assert.equal(typeof clipboard.copyToClipboard, 'function');
assert.equal(typeof clipboard.createCopyToClipboard, 'function');
const copied = await clipboard.copyToClipboard('dogfood', {
  navigator: {
    clipboard: {
      async writeText(value) {
        assert.equal(value, 'dogfood');
      }
    }
  }
});
assert.equal(copied, true);

const PKCEWrapper = (await import('@fieryeagle/pkce')).default;
const storage = new Map();
const pkce = new PKCEWrapper({
  authz_uri: 'https://example.test/authorize',
  token_uri: 'https://example.test/token',
  redirect_uri: 'https://example.test/callback',
  requested_scopes: 'openid profile',
  storage: {
    getItem: (key) => storage.get(key) ?? null,
    setItem: (key, value) => storage.set(key, String(value)),
    removeItem: (key) => storage.delete(key)
  }
});
assert.match(pkce.getAuthorizeUrl({ state: 'dogfood-state' }), /^https:\\/\\/example\\.test\\/authorize\\?/);

const measure = require('measure-hook');
assert.equal(typeof measure, 'function');
const finish = measure(1000);
assert.equal(typeof finish(), 'number');

const eslintConfig = require('@fieryeagle/eslint-config-react');
assert.equal(Array.isArray(eslintConfig), true);
assert.ok(eslintConfig.length > 0);

const flattenWorkspacePackage = await import('@cheshirecode/flatten-workspace');
assert.equal(typeof flattenWorkspacePackage.flattenWorkspace, 'function');
const workspaceDir = await mkdtemp(join(tmpdir(), 'flatten-workspace-dogfood-'));
await mkdir(join(workspaceDir, 'packages', 'core'), { recursive: true });
await mkdir(join(workspaceDir, 'packages', 'tools'), { recursive: true });
await writeFile(join(workspaceDir, 'package.json'), JSON.stringify({
  private: true,
  workspaces: ['packages/*'],
  keep: { value: true }
}));
await writeFile(join(workspaceDir, 'packages', 'core', 'package.json'), JSON.stringify({
  dependencies: { vite: '^8.0.16' },
  devDependencies: { vitest: '^4.1.9' }
}));
await writeFile(join(workspaceDir, 'packages', 'tools', 'package.json'), JSON.stringify({
  dependencies: { oxlint: '^1.70.0', vite: '^8.0.15' }
}));
const flattened = await flattenWorkspacePackage.flattenWorkspace({
  root: workspaceDir,
  location: 'packages',
  blacklist: ['oxlint'],
  outFile: 'package.flattened.json'
});
assert.deepEqual(flattened, {
  private: true,
  keep: { value: true },
  dependencies: { vite: '^8.0.15' },
  devDependencies: { vitest: '^4.1.9' }
});
assert.deepEqual(JSON.parse(await readFile(join(workspaceDir, 'package.flattened.json'), 'utf8')), flattened);
const { stdout } = await execFileAsync('pnpm', [
  'exec',
  'flatten-workspace',
  '--root',
  workspaceDir,
  '--location',
  'packages',
  '--blacklist',
  'oxlint'
]);
assert.deepEqual(JSON.parse(stdout), flattened);

const bootstrapPackage = await import('@cheshirecode/create-moon-pnpm-monorepo');
assert.equal(typeof bootstrapPackage.createMonorepo, 'function');
const bootstrapParent = await mkdtemp(join(tmpdir(), 'moon-pnpm-bootstrap-dogfood-'));
const bootstrapDir = join(bootstrapParent, 'generated-monorepo');
const bootstrapResult = await bootstrapPackage.createMonorepo({
  name: 'generated-monorepo',
  directory: bootstrapDir
});
assert.equal(bootstrapResult.name, 'generated-monorepo');
assert.ok(bootstrapResult.files.includes('packages/example-lib/src/index.ts'));
await execFileAsync('corepack', ['enable'], { cwd: bootstrapDir });
await execFileAsync('corepack', ['prepare', 'pnpm@11.8.0', '--activate'], { cwd: bootstrapDir });
await execFileAsync('pnpm', ['install'], { cwd: bootstrapDir });
await execFileAsync('scripts/check.sh', ['ci'], { cwd: bootstrapDir });
await execFileAsync('scripts/check.sh', ['dogfood', 'all'], { cwd: bootstrapDir });

console.log('External package consumption dogfood passed.');
`;
}

function run(command, args, cwd) {
  return new Promise((resolveRun, reject) => {
    const child = spawn(command, args, {
      cwd,
      stdio: 'inherit',
      shell: false,
      env: {
        ...process.env,
        COREPACK_ENABLE_DOWNLOAD_PROMPT: '0'
      }
    });

    child.on('error', reject);
    child.on('exit', (code) => {
      if (code === 0) {
        resolveRun();
      } else {
        reject(
          new Error(`${command} ${args.map((arg) => basename(arg) || arg).join(' ')} exited with ${code}`)
        );
      }
    });
  });
}

function runCapture(command, args, cwd) {
  return new Promise((resolveRun, reject) => {
    const child = spawn(command, args, {
      cwd,
      stdio: ['ignore', 'pipe', 'inherit'],
      shell: false
    });
    let output = '';

    child.stdout.on('data', (chunk) => {
      output += chunk;
    });
    child.on('error', reject);
    child.on('exit', (code) => {
      if (code === 0) {
        resolveRun(output);
      } else {
        reject(new Error(`${command} ${args.join(' ')} exited with ${code}`));
      }
    });
  });
}

function runQuiet(command, args, cwd) {
  return new Promise((resolveRun, reject) => {
    const child = spawn(command, args, {
      cwd,
      stdio: ['ignore', 'pipe', 'pipe'],
      shell: false,
      env: {
        ...process.env,
        COREPACK_ENABLE_DOWNLOAD_PROMPT: '0'
      }
    });

    child.on('error', reject);
    child.on('exit', (code) => {
      if (code === 0) {
        resolveRun();
      } else {
        reject(new Error(`${command} ${args.join(' ')} exited with ${code}`));
      }
    });
  });
}
