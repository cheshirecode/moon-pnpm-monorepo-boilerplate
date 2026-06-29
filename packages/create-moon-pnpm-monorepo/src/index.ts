import { chmod, mkdir, readdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

export interface CreateMonorepoOptions {
  name: string;
  directory?: string;
  force?: boolean;
}

export interface CreateMonorepoResult {
  name: string;
  directory: string;
  files: string[];
}

export async function createMonorepo({
  name,
  directory,
  force = false
}: CreateMonorepoOptions): Promise<CreateMonorepoResult> {
  const repoName = normalizePackageName(name);
  const targetDir = resolve(directory ?? repoName);
  await assertWritableTarget(targetDir, force);
  await mkdir(targetDir, { recursive: true });

  const files = templateFiles(repoName);

  for (const [path, content] of files) {
    const outputPath = resolve(targetDir, path);
    await mkdir(resolve(outputPath, '..'), { recursive: true });
    await writeFile(outputPath, content, path.endsWith('.json') ? 'utf8' : 'utf8');

    if (path.startsWith('scripts/') && path.endsWith('.sh')) {
      await chmod(outputPath, 0o755);
    }
  }

  return {
    name: repoName,
    directory: targetDir,
    files: files.map(([path]) => path)
  };
}

export function normalizePackageName(name: string): string {
  const normalized = name
    .trim()
    .toLowerCase()
    .replace(/^@/, '')
    .replace(/[^a-z0-9._/-]+/g, '-')
    .replace(/\/+/g, '/')
    .replace(/-+/g, '-')
    .replace(/(^-|-$)/g, '');

  if (!normalized || normalized === '.' || normalized === '..') {
    throw new Error(`Invalid monorepo name: ${name}`);
  }

  return normalized;
}

async function assertWritableTarget(targetDir: string, force: boolean): Promise<void> {
  try {
    const entries = await readdir(targetDir);

    if (entries.length > 0 && !force) {
      throw new Error(`Target directory is not empty: ${targetDir}`);
    }
  } catch (error) {
    if (isNodeError(error) && error.code === 'ENOENT') {
      return;
    }

    throw error;
  }
}

function templateFiles(repoName: string): Array<[string, string]> {
  return [
    ['package.json', json(rootPackageJson(repoName))],
    ['pnpm-workspace.yaml', pnpmWorkspaceYaml()],
    ['README.md', readme(repoName)],
    ['AGENTS.md', agentsMd()],
    ['.gitignore', gitignore()],
    ['.changeset/config.json', json(changesetConfig())],
    ['.moon/workspace.yml', moonWorkspace()],
    ['.moon/toolchains.yml', moonToolchains()],
    ['.moon/tasks/node.yml', moonNodeTasks()],
    ['scripts/check.sh', checkScript()],
    ['scripts/pack-publishable.mjs', packScript()],
    ['scripts/dogfood.mjs', dogfoodScript()],
    ['tests/smoke.test.js', rootSmokeTest()],
    ['.github/actions/setup/action.yml', setupAction()],
    ['.github/workflows/main.yml', mainWorkflow()],
    ['.github/workflows/publish.yml', publishWorkflow()],
    ['packages/example-lib/package.json', json(examplePackageJson(repoName))],
    ['packages/example-lib/moon.yml', exampleMoon()],
    ['packages/example-lib/tsconfig.json', json(exampleTsconfig())],
    ['packages/example-lib/vitest.config.ts', exampleVitestConfig()],
    ['packages/example-lib/src/index.ts', exampleSource()],
    ['packages/example-lib/src/index.test.ts', exampleTest()]
  ];
}

function json(value: unknown): string {
  return `${JSON.stringify(value, null, 2)}\n`;
}

function rootPackageJson(repoName: string): Record<string, unknown> {
  return {
    name: repoName,
    private: true,
    engines: {
      node: '>=24.11.0'
    },
    packageManager: 'pnpm@11.9.0',
    workspaces: ['packages/*'],
    scripts: {
      setup: 'scripts/check.sh setup',
      moon: 'moon',
      'lint:fast': 'scripts/check.sh lint-fast',
      lint: 'scripts/check.sh lint',
      typecheck: 'scripts/check.sh typecheck',
      build: 'scripts/check.sh build',
      test: 'scripts/check.sh test',
      coverage: 'scripts/check.sh coverage',
      ci: 'scripts/check.sh ci',
      dogfood: 'scripts/check.sh dogfood',
      changeset: 'changeset',
      'version-packages': 'changeset version',
      pack: 'scripts/check.sh pack',
      'publish-packages': 'changeset publish'
    },
    devDependencies: {
      '@changesets/cli': '^2.31.0',
      '@moonrepo/cli': '^2.3.5',
      '@types/node': '^24.10.2',
      '@vitest/coverage-v8': '^4.1.9',
      oxlint: '^1.71.0',
      typescript: '^6.0.3',
      vitest: '^4.1.9'
    }
  };
}

function changesetConfig(): Record<string, unknown> {
  return {
    $schema: 'https://unpkg.com/@changesets/config@3.1.1/schema.json',
    changelog: '@changesets/cli/changelog',
    commit: false,
    fixed: [],
    linked: [],
    access: 'public',
    baseBranch: 'main',
    updateInternalDependencies: 'patch',
    ignore: []
  };
}

function examplePackageJson(repoName: string): Record<string, unknown> {
  return {
    name: `${repoName}-example-lib`,
    version: '0.0.0',
    description: 'Small package used to verify the generated monorepo toolchain.',
    type: 'module',
    private: false,
    license: 'MIT',
    engines: {
      node: '>=24.11.0'
    },
    files: ['dist'],
    main: './dist/index.js',
    module: './dist/index.js',
    types: './dist/index.d.ts',
    exports: {
      '.': {
        types: './dist/index.d.ts',
        import: './dist/index.js'
      }
    },
    scripts: {
      build: 'rm -rf dist && tsc -p tsconfig.json',
      test: 'vitest run',
      coverage: 'vitest run --coverage',
      typecheck: 'tsc -p tsconfig.json --noEmit',
      lint: 'oxlint src --ignore-path ../../.gitignore --quiet'
    },
    devDependencies: {
      '@types/node': '^24.10.2',
      '@vitest/coverage-v8': '^4.1.9',
      typescript: '^6.0.3',
      vitest: '^4.1.9'
    }
  };
}

function pnpmWorkspaceYaml(): string {
  return `packages:
  - "packages/*"

minimumReleaseAgeExclude:
  - "@moonrepo/cli@2.3.5"
  - "@moonrepo/core-linux-arm64-gnu@2.3.5"
  - "@moonrepo/core-linux-arm64-musl@2.3.5"
  - "@moonrepo/core-linux-x64-gnu@2.3.5"
  - "@moonrepo/core-linux-x64-musl@2.3.5"
  - "@moonrepo/core-macos-arm64@2.3.5"
  - "@moonrepo/core-macos-x64@2.3.5"
  - "@moonrepo/core-windows-x64-msvc@2.3.5"
`;
}

function readme(repoName: string): string {
  return `# ${repoName}

A clean moon + pnpm + Changesets monorepo.

## Quick Start

\`\`\`sh
corepack enable
corepack prepare pnpm@11.9.0 --activate
pnpm install
pnpm run ci
pnpm run dogfood all
\`\`\`

Requires Node.js \`>=24.11.0\`.

## What Is Included

- pnpm workspaces for local package linking.
- moonrepo for package task orchestration.
- Changesets for versioning and npm publishing.
- oxlint for fast lint checks.
- A small \`packages/example-lib\` package so CI, pack, dogfood, and publish dry-runs work immediately.

Replace \`packages/example-lib\` with your own packages when the real monorepo shape is ready.
`;
}

function agentsMd(): string {
  return `# AGENTS.md

Scope: this file applies to the entire repository.

Use the repo-owned scripts as the source of truth:

\`\`\`sh
scripts/check.sh setup
scripts/check.sh ci
scripts/check.sh dogfood all
\`\`\`

Keep package-specific framework choices inside \`packages/*\`. The root stays framework-neutral.
Use Node.js \`>=24.11.0\`, pnpm \`11.9.0\`, moon, Changesets, and oxlint.
`;
}

function gitignore(): string {
  return `node_modules/
dist/
coverage/
.artifacts/
.moon/cache/
*.tsbuildinfo
*.tgz
.env
.env.*
!.env.example
`;
}

function moonWorkspace(): string {
  return `projects:
  - "packages/*"

pipeline:
  installDependencies: false

vcs:
  defaultBranch: "main"
  provider: "github"
`;
}

function moonToolchains(): string {
  return `javascript:
  packageManager: "pnpm"
  inferTasksFromScripts: false

node: {}
pnpm: {}
`;
}

function moonNodeTasks(): string {
  return `implicitInputs:
  - "package.json"

fileGroups:
  sources:
    - "src/**/*"
    - "lib/**/*"
    - "index.{js,ts,mjs,cjs}"
    - "*.{js,ts,mjs,cjs}"
  tests:
    - "**/*.test.{js,ts,jsx,tsx,mjs}"
  configs:
    - "*.config.{js,cjs,mjs,ts}"
    - "tsconfig*.json"
    - "package.json"

tasks:
  lint:
    command: "pnpm run --if-present lint"
    inputs:
      - "@group(sources)"
      - "@group(tests)"
      - "@group(configs)"
    options:
      cache: true
      runInCI: "affected"

  build:
    command: "pnpm run --if-present build"
    inputs:
      - "@group(sources)"
      - "@group(configs)"
    options:
      cache: true
      runInCI: "affected"

  test:
    command: "pnpm run --if-present test"
    deps:
      - target: "^:build"
        optional: true
        cacheStrategy: "outputs"
    inputs:
      - "@group(sources)"
      - "@group(tests)"
      - "@group(configs)"
    options:
      cache: true
      runInCI: "affected"

  coverage:
    command: "pnpm run --if-present coverage"
    deps:
      - target: "^:build"
        optional: true
        cacheStrategy: "outputs"
    inputs:
      - "@group(sources)"
      - "@group(tests)"
      - "@group(configs)"
    outputs:
      - "coverage/**/*"
    options:
      cache: false
      runInCI: true

  typecheck:
    command: "pnpm run --if-present typecheck"
    deps:
      - target: "^:build"
        optional: true
        cacheStrategy: "outputs"
    inputs:
      - "@group(sources)"
      - "@group(configs)"
    options:
      cache: true
      runInCI: "affected"
`;
}

function checkScript(): string {
  return `#!/usr/bin/env bash
set -euo pipefail

repo_root="$(cd "$(dirname "\${BASH_SOURCE[0]}")/.." && pwd)"

run() {
  (cd "$repo_root" && "$@")
}

has_git_head() {
  run git rev-parse --verify HEAD >/dev/null 2>&1
}

case "\${1:-}" in
  setup)
    run corepack enable
    run corepack prepare pnpm@11.9.0 --activate
    run pnpm install --frozen-lockfile
    ;;
  lint-fast)
    run pnpm exec oxlint packages tests --ignore-path .gitignore --quiet
    ;;
  lint)
    if has_git_head; then
      run pnpm exec moon run :lint
    else
      run pnpm -r --if-present lint
    fi
    ;;
  typecheck)
    if has_git_head; then
      run pnpm exec moon run :typecheck
    else
      run pnpm -r --if-present typecheck
    fi
    ;;
  build)
    if has_git_head; then
      run pnpm exec moon run :build
    else
      run pnpm -r --if-present build
    fi
    ;;
  test)
    if has_git_head; then
      run pnpm exec moon run :test
    else
      run pnpm -r --if-present test
    fi
    run pnpm exec vitest run
    ;;
  ci)
    "$repo_root/scripts/check.sh" lint-fast
    if has_git_head; then
      run pnpm exec moon ci :lint :typecheck :build :test
    else
      run pnpm -r --if-present lint
      run pnpm -r --if-present typecheck
      run pnpm -r --if-present build
      run pnpm -r --if-present test
    fi
    run pnpm exec vitest run
    ;;
  coverage)
    run pnpm exec moon run :coverage
    ;;
  coverage-package)
    package="\${2:-}"
    if [[ -z "$package" || ! -d "$repo_root/packages/$package" ]]; then
      echo "Unknown package: $package" >&2
      exit 2
    fi
    run pnpm exec moon run "$package:coverage"
    ;;
  pack)
    run node scripts/pack-publishable.mjs
    ;;
  dogfood)
    run node scripts/dogfood.mjs "\${2:-packages}"
    ;;
  -h|--help|help|"")
    echo "Usage: scripts/check.sh setup|lint-fast|lint|typecheck|build|test|ci|coverage|coverage-package|pack|dogfood"
    ;;
  *)
    echo "Unknown command: $1" >&2
    exit 2
    ;;
esac
`;
}

function packScript(): string {
  return `import { mkdir, readFile, readdir, rm } from 'node:fs/promises';
import { basename, join, resolve } from 'node:path';
import { spawn } from 'node:child_process';

const root = resolve(import.meta.dirname, '..');
const packagesDir = join(root, 'packages');
const outDir = join(root, '.artifacts', 'release');
const packageDirs = await readdir(packagesDir, { withFileTypes: true });
const publishable = [];

for (const entry of packageDirs) {
  if (!entry.isDirectory()) continue;
  const packageDir = join(packagesDir, entry.name);
  const packageJson = JSON.parse(await readFile(join(packageDir, 'package.json'), 'utf8'));
  if (packageJson.private === true) continue;
  publishable.push({ dir: packageDir, name: packageJson.name ?? entry.name });
}

if (publishable.length === 0) throw new Error('No publishable workspace packages found.');

await rm(outDir, { recursive: true, force: true });
await mkdir(outDir, { recursive: true });

for (const pkg of publishable) {
  await run('pnpm', ['pack', '--pack-destination', outDir], pkg.dir);
}

console.log(\`Packed \${publishable.length} publishable package(s) into \${outDir}:\`);
for (const pkg of publishable) console.log(\`- \${pkg.name} (\${basename(pkg.dir)})\`);

function run(command, args, cwd) {
  return new Promise((resolveRun, reject) => {
    const child = spawn(command, args, { cwd, stdio: 'inherit', shell: false });
    child.on('error', reject);
    child.on('exit', (code) => code === 0 ? resolveRun() : reject(new Error(\`\${command} \${args.join(' ')} exited with \${code}\`)));
  });
}
`;
}

function dogfoodScript(): string {
  return `import { mkdir, mkdtemp, readdir, rm, stat, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { basename, dirname, join, relative, resolve } from 'node:path';
import { spawn } from 'node:child_process';

const root = resolve(import.meta.dirname, '..');
const releaseDir = join(root, '.artifacts', 'release');
const dogfoodDir = join(root, '.artifacts', 'dogfood');
const mode = process.argv[2] ?? 'packages';

await run('scripts/check.sh', ['build'], root);
await run('scripts/check.sh', ['pack'], root);

const tarballs = (await readdir(releaseDir)).filter((file) => file.endsWith('.tgz')).map((file) => join(releaseDir, file)).sort();
const packages = [];

for (const tarball of tarballs) {
  const packageJson = JSON.parse(await runCapture('tar', ['-xOf', tarball, 'package/package.json'], root));
  packages.push({ name: packageJson.name, version: packageJson.version, tarball, spec: \`file:\${tarball}\`, tarballBytes: (await stat(tarball)).size });
}

if (mode === 'packages' || mode === 'all') {
  await dogfoodPackages(packages);
}

if (mode === 'release' || mode === 'all') {
  for (const pkg of packages) {
    const accessArgs = pkg.name.startsWith('@') ? ['--access', 'public'] : [];
    await run('npm', ['publish', '--dry-run', '--ignore-scripts', ...accessArgs, pkg.tarball], root);
  }
}

await mkdir(dogfoodDir, { recursive: true });
await writeFile(join(dogfoodDir, 'report.json'), JSON.stringify({
  mode,
  generatedAt: new Date().toISOString(),
  packages: packages.map((pkg) => ({ name: pkg.name, version: pkg.version, tarballPath: relative(root, pkg.tarball), tarballBytes: pkg.tarballBytes }))
}, null, 2) + '\\n');
console.log(\`Dogfood \${mode} passed for \${packages.length} publishable package(s).\`);

async function dogfoodPackages(packages) {
  const consumerDir = await mkdtemp(join(tmpdir(), 'moon-pnpm-dogfood-'));
  try {
    await writeFile(join(consumerDir, 'package.json'), JSON.stringify({
      name: 'moon-pnpm-generated-dogfood-consumer',
      private: true,
      type: 'module',
      scripts: { dogfood: 'node dogfood.mjs' },
      dependencies: Object.fromEntries(packages.map((pkg) => [pkg.name, pkg.spec]))
    }, null, 2));
    await writeFile(join(consumerDir, 'pnpm-workspace.yaml'), 'packages: []\\n');
    await writeFile(join(consumerDir, 'dogfood.mjs'), \`import assert from 'node:assert/strict';\\nconst pkg = await import('\${packages[0]?.name ?? ''}');\\nassert.equal(typeof pkg.greet, 'function');\\nassert.equal(pkg.greet('dogfood'), 'hello, dogfood');\\n\`);
    await run('corepack', ['enable'], consumerDir);
    await run('corepack', ['prepare', 'pnpm@11.9.0', '--activate'], consumerDir);
    await run('pnpm', ['install'], consumerDir);
    await run('pnpm', ['run', 'dogfood'], consumerDir);
  } finally {
    await rm(consumerDir, { recursive: true, force: true });
  }
}

function run(command, args, cwd) {
  return new Promise((resolveRun, reject) => {
    const child = spawn(command, args, { cwd, stdio: 'inherit', shell: false, env: { ...process.env, COREPACK_ENABLE_DOWNLOAD_PROMPT: '0' } });
    child.on('error', reject);
    child.on('exit', (code) => code === 0 ? resolveRun() : reject(new Error(\`\${command} \${args.map((arg) => basename(arg) || arg).join(' ')} exited with \${code}\`)));
  });
}

function runCapture(command, args, cwd) {
  return new Promise((resolveRun, reject) => {
    const child = spawn(command, args, { cwd, stdio: ['ignore', 'pipe', 'inherit'], shell: false });
    let output = '';
    child.stdout.on('data', (chunk) => { output += chunk; });
    child.on('error', reject);
    child.on('exit', (code) => code === 0 ? resolveRun(output) : reject(new Error(\`\${command} \${args.join(' ')} exited with \${code}\`)));
  });
}
`;
}

function rootSmokeTest(): string {
  return `import { describe, expect, it } from 'vitest';

describe('workspace smoke', () => {
  it('runs root tests', () => {
    expect(1 + 1).toBe(2);
  });
});
`;
}

function setupAction(): string {
  return `name: setup
description: "Install Node.js, pnpm, dependencies, and warm moon caches"
inputs:
  node-version:
    required: false
    default: "24.x"
  registry-url:
    required: false
    default: "https://registry.npmjs.org"
runs:
  using: "composite"
  steps:
    - uses: actions/setup-node@v6.4.0
      with:
        node-version: \${{ inputs.node-version }}
        registry-url: \${{ inputs.registry-url }}
    - shell: bash
      run: |
        corepack enable
        corepack prepare pnpm@11.9.0 --activate
    - shell: bash
      run: pnpm install --frozen-lockfile
`;
}

function mainWorkflow(): string {
  return `name: ci

on:
  pull_request:
  push:
    branches: [main]
  workflow_dispatch:

permissions:
  contents: read

jobs:
  checks:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v6
        with:
          persist-credentials: false
      - uses: ./.github/actions/setup
      - run: scripts/check.sh ci
      - run: git diff --exit-code

  package-dogfood:
    needs: [checks]
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v6
        with:
          persist-credentials: false
      - uses: ./.github/actions/setup
      - run: scripts/check.sh dogfood packages
`;
}

function publishWorkflow(): string {
  return `name: publish

on:
  workflow_dispatch:
    inputs:
      publish_to_npm:
        description: "Publish packages to npm after validation"
        required: true
        type: boolean
        default: false

permissions:
  contents: write
  pull-requests: write

jobs:
  publish:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v6
        with:
          fetch-depth: 0
          persist-credentials: \${{ inputs.publish_to_npm }}
      - uses: ./.github/actions/setup
        with:
          registry-url: https://registry.npmjs.org
      - run: scripts/check.sh ci
      - run: scripts/check.sh dogfood all
      - name: Create or update release PR
        if: inputs.publish_to_npm && github.ref == 'refs/heads/main'
        uses: changesets/action@v1
        with:
          version: pnpm run version-packages
          publish: pnpm run publish-packages
        env:
          GITHUB_TOKEN: \${{ secrets.GITHUB_TOKEN }}
          NPM_TOKEN: \${{ secrets.NPM_AUTH_TOKEN }}
`;
}

function exampleMoon(): string {
  return `language: "typescript"
layer: "library"
stack: "frontend"
tags:
  - "isomorphic"

tasks:
  build:
    outputs:
      - "dist/**/*"
`;
}

function exampleTsconfig(): Record<string, unknown> {
  return {
    compilerOptions: {
      declaration: true,
      declarationMap: true,
      lib: ['ESNext'],
      module: 'NodeNext',
      moduleResolution: 'NodeNext',
      outDir: 'dist',
      rootDir: 'src',
      skipLibCheck: true,
      strict: true,
      target: 'ES2022',
      types: ['node']
    },
    include: ['src'],
    exclude: ['src/**/*.test.ts']
  };
}

function exampleVitestConfig(): string {
  return `import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
    coverage: {
      reporter: ['text', 'lcov']
    }
  }
});
`;
}

function exampleSource(): string {
  return `export function greet(name = 'world'): string {
  return \`hello, \${name}\`;
}
`;
}

function exampleTest(): string {
  return `import { describe, expect, it } from 'vitest';

import { greet } from './index.js';

describe('greet', () => {
  it('greets a caller', () => {
    expect(greet('dogfood')).toBe('hello, dogfood');
  });
});
`;
}

function isNodeError(error: unknown): error is NodeJS.ErrnoException {
  return error instanceof Error && 'code' in error;
}
