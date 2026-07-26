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
const args = process.argv.slice(2);
const mode = args.find((arg) => !arg.startsWith('-')) ?? 'packages';
const skipBuild = args.includes('--skip-build');
const validModes = new Set(['packages', 'release', 'all']);

if (!validModes.has(mode) || process.argv.includes('-h') || process.argv.includes('--help')) {
  usage();
  process.exit(validModes.has(mode) ? 0 : 2);
}

// With --skip-build the caller (e.g. the consolidated `ci` job via `check.sh full`)
// has already built every package in-process, so dist is present and no build-manifest
// verification is needed.
if (!skipBuild) {
  await run('scripts/check.sh', ['build'], root);
}
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
    build: skipBuild ? 'skipped' : 'passed',
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
  packages  Build, pack, install tarballs in a temp external consumer, and import/use them.
  release   Build, pack, and run npm publish --dry-run for each tarball.
  all       Run package-consumption and release dry-run dogfood.

Flags:
  --skip-build  Reuse already-built package artifacts and only pack/dogfood them.
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
          packageManager: 'pnpm@11.10.0',
          scripts: {
            dogfood: 'node dogfood.mjs'
          },
          dependencies,
          devDependencies: {
            react: '^19.2.7',
            'react-dom': '^19.2.7'
          }
        },
        null,
        2
      )
    );

    await writeFile(join(consumerDir, 'pnpm-workspace.yaml'), workspaceYaml(dependencies));
    await writeFile(join(consumerDir, 'dogfood.mjs'), consumerScript());

    await run('corepack', ['enable'], consumerDir);
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

const clipboard = await import('@cheshirecode/browser-clipboard');
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

const PKCEWrapper = (await import('@cheshirecode/pkce')).default;
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

const measure = require('@cheshirecode/measure-hook');
assert.equal(typeof measure, 'function');
const finish = measure(1000);
assert.equal(typeof finish(), 'number');

const eslintConfig = require('@cheshirecode/eslint-config-react');
assert.equal(Array.isArray(eslintConfig), true);
assert.ok(eslintConfig.length > 0);

const browserUtils = await import('@cheshirecode/browser-utils');
assert.equal(browserUtils.pascalToSeparatedWords('fontFamily'), 'font-family');
assert.deepEqual(browserUtils.deepFilter(['os-windows', 'os-linux'], 'os-linux'), [
  'os-linux'
]);
assert.deepEqual(browserUtils.getIntervals([], 100), [25, 50, 100]);
assert.equal(browserUtils.isEmptyObject({ a: undefined, b: null }), true);

const dogfoodParams = browserUtils
  .createUrlSearchParams('?keep=1', { 'foo-bar': 2 })
  .toUnderscoredKeys();
assert.equal(dogfoodParams.toString(), 'keep=1&foo_bar=2');
assert.deepEqual(dogfoodParams.entriesAsObj(), { keep: '1', foo_bar: '2' });

const tsconfigBase = await import('@cheshirecode/tsconfig/base.json', {
  with: { type: 'json' }
});
const tsconfigNodeTypes = await import('@cheshirecode/tsconfig/node-types.json', {
  with: { type: 'json' }
});
assert.equal(tsconfigBase.default.compilerOptions.module, 'NodeNext');
assert.equal(tsconfigNodeTypes.default.compilerOptions.types[0], 'node');
const tsconfigDom = await import('@cheshirecode/tsconfig/dom.json', {
  with: { type: 'json' }
});
const tsconfigNode = await import('@cheshirecode/tsconfig/node.json', {
  with: { type: 'json' }
});
assert.equal(tsconfigDom.default.compilerOptions.lib[0], 'DOM');
assert.equal(tsconfigNode.default.compilerOptions.lib[0], 'ESNext');

const demoContract = await import('@cheshirecode/demo-contract');
const vueDemo = demoContract.createRendererDemoContract('Vue');
assert.equal(vueDemo.slug, 'vue-renderer');
assert.equal(vueDemo.emailValidation, 'valid');
assert.match(demoContract.formatRendererDemo(vueDemo), /Vue renderer/);

const microfrontendHost = await import('@cheshirecode/microfrontend-host');
const registry = microfrontendHost.createMicrofrontendRegistry([
  { id: 'dogfood-static', title: 'Dogfood static', kind: 'static', render: () => 'ok' }
]);
assert.equal(registry[0].id, 'dogfood-static');
assert.equal(microfrontendHost.microfrontendMountId('dogfood-static'), 'microfrontend-dogfood-static');

const honoBase = await import('@cheshirecode/hono-base');
assert.equal(typeof honoBase.createBaseApp, 'function');
const honoApp = honoBase.createBaseApp({ version: '0.0.0', serviceName: 'dogfood' });
const honoHealthz = await honoApp.request('/healthz');
assert.equal(honoHealthz.status, 200);
assert.deepEqual(await honoHealthz.json(), { status: 'ok' });
const honoVersion = await honoApp.request('/version');
assert.equal(honoVersion.status, 200);
assert.deepEqual(await honoVersion.json(), { name: 'dogfood', version: '0.0.0' });

assert.equal(browserUtils.validateEmail('person@example.test'), undefined);
assert.equal(browserUtils.validateRequired('', 'Name'), 'Name is required');
const composedValidator = browserUtils.composeValidators(
  (value) => browserUtils.validateRequired(value, 'Name'),
  (value) => browserUtils.validateMinLength(value, 3, 'Name')
);
assert.equal(composedValidator('Al'), 'Name must be at least 3 characters');

const inputValidation = await import('@cheshirecode/input-validation');
assert.deepEqual(inputValidation.validateChatMessage('hello'), {
  isValid: true,
  sanitizedValue: 'hello'
});
assert.equal(
  inputValidation.validateChatMessage('<script>alert(1)</script>').isValid,
  false
);
assert.equal(inputValidation.sanitizeTextInput('<b>hello</b>'), 'hello');

assert.equal(
  browserUtils.buildQueryUrl('https://example.test/path?keep=1', { room: 'alpha' }),
  'https://example.test/path?keep=1&room=alpha'
);
assert.equal(browserUtils.getQueryParam('room', '?room=alpha'), 'alpha');
const replacedUrls = [];
const replacedUrl = browserUtils.replaceQueryUrl(
  { room: 'beta' },
  {
    href: 'https://example.test/path?keep=1',
    history: {
      replaceState(_state, _title, url) {
        replacedUrls.push(url);
      }
    }
  }
);
assert.equal(
  replacedUrl.toString(),
  'https://example.test/path?keep=1&room=beta'
);
assert.deepEqual(replacedUrls, ['https://example.test/path?keep=1&room=beta']);

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
  dependencies: { oxlint: '^1.72.0', vite: '^8.0.15' }
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
assert.ok(bootstrapResult.files.includes('packages/hono-base/src/index.ts'));
await execFileAsync('corepack', ['enable'], { cwd: bootstrapDir });
await execFileAsync('pnpm', ['install'], { cwd: bootstrapDir });
await execFileAsync('scripts/check.sh', ['ci'], { cwd: bootstrapDir });
await execFileAsync('scripts/check.sh', ['dogfood', 'all'], { cwd: bootstrapDir });

const binBootstrapParent = await mkdtemp(join(tmpdir(), 'moon-pnpm-bin-dogfood-'));
const binBootstrapDir = join(binBootstrapParent, 'bin-generated-monorepo');
await execFileAsync('pnpm', [
  'exec',
  'create-moon-pnpm-monorepo',
  '--name',
  'bin-generated-monorepo',
  '--directory',
  binBootstrapDir
]);
assert.ok(
  await readFile(join(binBootstrapDir, 'packages', 'hono-base', 'src', 'index.ts'), 'utf8')
    .then(() => true).catch(() => false),
  'bin-generated monorepo is missing packages/hono-base/src/index.ts'
);
await execFileAsync('corepack', ['enable'], { cwd: binBootstrapDir });
await execFileAsync('pnpm', ['install'], { cwd: binBootstrapDir });
await execFileAsync('scripts/check.sh', ['ci'], { cwd: binBootstrapDir });
await execFileAsync('scripts/check.sh', ['dogfood', 'all'], { cwd: binBootstrapDir });

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
