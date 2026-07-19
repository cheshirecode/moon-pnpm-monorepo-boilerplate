import { existsSync } from 'node:fs';
import { readdir, readFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import { join, resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const packagesDir = join(root, 'packages');
const showcaseDir = join(packagesDir, 'renderer-showcase');
const registryPath = join(showcaseDir, 'src', 'registry.ts');
const clientPackageIds = new Set([
  'app-react',
  'app-preact',
  'app-vue',
  'app-svelte',
  'app-solidjs'
]);
const staticPackageIds = new Set(['app-astro']);
const expectedRendererApps = [
  'app-react',
  'app-preact',
  'app-astro',
  'app-vue',
  'app-svelte',
  'app-solidjs'
];

export async function verifyRendererShowcase(options = {}) {
  const errors = [];
  const registryIds = await readRegistryIds();
  const expectedIds = await deriveRendererAppIds();

  if (JSON.stringify(registryIds) !== JSON.stringify(expectedIds)) {
    errors.push(
      `renderer-showcase registry ${JSON.stringify(registryIds)} does not match expected ${JSON.stringify(expectedIds)}`
    );
  }

  const showcasePackage = await readPackageJson('renderer-showcase');
  if (showcasePackage.private !== true) {
    errors.push('renderer-showcase must stay private');
  }
  if (!existsSync(join(showcaseDir, 'moon.yml'))) {
    errors.push('renderer-showcase is missing moon.yml');
  }

  const showcaseDeps = {
    ...(showcasePackage.dependencies ?? {}),
    ...(showcasePackage.devDependencies ?? {})
  };
  if (showcaseDeps['@cheshirecode/microfrontend-host'] !== 'workspace:^') {
    errors.push('renderer-showcase must depend on @cheshirecode/microfrontend-host via workspace:^');
  }

  for (const id of expectedRendererApps) {
    if (showcaseDeps[id] !== 'workspace:^') {
      errors.push(`renderer-showcase must declare ${id} as workspace:^ dependency`);
    }
  }

  const declaredAppDeps = expectedRendererApps.filter(
    (id) => showcaseDeps[id] === 'workspace:^'
  );
  if (declaredAppDeps.length !== expectedRendererApps.length) {
    errors.push(
      `renderer-showcase must declare exactly ${expectedRendererApps.length} renderer app workspace deps; found ${declaredAppDeps.length}`
    );
  }

  for (const id of expectedIds) {
    const packageJson = await readPackageJson(id);
    const exports = packageJson.exports ?? {};
    if (clientPackageIds.has(id) && exports['./microfrontend'] === undefined) {
      errors.push(`${id} must export ./microfrontend`);
    }
    if (staticPackageIds.has(id) && exports['./demo'] === undefined) {
      errors.push(`${id} must export ./demo`);
    }
  }

  if (options.dist) {
    errors.push(...(await verifyDist(expectedIds)));
  }

  return errors;
}

async function deriveRendererAppIds() {
  const entries = await readdir(packagesDir, { withFileTypes: true });
  const ids = [];

  for (const entry of entries) {
    if (!entry.isDirectory() || !entry.name.startsWith('app-')) {
      continue;
    }

    const packageJson = await readPackageJson(entry.name);
    const moon = await readText(join(packagesDir, entry.name, 'moon.yml'));
    const isRendererApp =
      packageJson.private === true &&
      moon.includes('layer: "application"') &&
      moon.includes('stack: "frontend"');

    if (isRendererApp) {
      ids.push(entry.name);
    }
  }

  return ids.sort(sortRendererApps);
}

async function readRegistryIds() {
  const registry = await readFile(registryPath, 'utf8');
  const match = registry.match(/rendererShowcasePackageIds\s*=\s*\[([\s\S]*?)\]\s*as const/);

  if (!match) {
    throw new Error('Unable to find rendererShowcasePackageIds in registry.ts');
  }

  return [...match[1].matchAll(/'([^']+)'/g)].map((entry) => entry[1]);
}

async function verifyDist(expectedIds) {
  const distDir = join(showcaseDir, 'dist');
  const errors = [];

  if (!existsSync(join(distDir, 'index.html'))) {
    return ['renderer-showcase dist/index.html is missing; run renderer-showcase:build first'];
  }

  const distText = await readAllText(distDir);
  const expectedSnippets = [
    'Renderer Showcase',
    'React renderer',
    'Preact renderer',
    'Astro is represented as a static tile',
    'Vue renderer',
    'Svelte renderer',
    'SolidJS renderer',
    ...expectedIds
  ];

  for (const snippet of expectedSnippets) {
    if (!distText.includes(snippet)) {
      errors.push(`renderer-showcase dist is missing ${snippet}`);
    }
  }

  return errors;
}

async function readAllText(dir) {
  const chunks = [];

  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) {
      chunks.push(await readAllText(path));
      continue;
    }

    chunks.push(await readText(path));
  }

  return chunks.join('\n');
}

async function readPackageJson(dirName) {
  return JSON.parse(await readFile(join(packagesDir, dirName, 'package.json'), 'utf8'));
}

async function readText(path) {
  return readFile(path, 'utf8');
}

function sortRendererApps(a, b) {
  const order = ['app-react', 'app-preact', 'app-astro', 'app-vue', 'app-svelte', 'app-solidjs'];
  return order.indexOf(a) - order.indexOf(b);
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const dist = process.argv.includes('--dist');
  const errors = await verifyRendererShowcase({ dist });

  if (errors.length > 0) {
    console.error('Renderer showcase verification failed:');
    for (const error of errors) {
      console.error(`- ${error}`);
    }
    process.exit(1);
  }

  console.log(`Renderer showcase verification passed${dist ? ' with dist smoke check' : ''}.`);
}
