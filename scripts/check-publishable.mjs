import { spawn } from 'node:child_process';
import { mkdir, readFile, readdir, rm } from 'node:fs/promises';
import { basename, join, resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const packagesDir = join(root, 'packages');
const outDir = join(root, '.artifacts', 'release');
const args = process.argv.slice(2);
const skipBuild = args.includes('--skip-build');

if (!skipBuild) {
  await run('scripts/check.sh', ['build'], root);
}

const packageDirs = await readdir(packagesDir, { withFileTypes: true });
const publishable = [];

for (const entry of packageDirs) {
  if (!entry.isDirectory()) continue;
  const packageJsonPath = join(packagesDir, entry.name, 'package.json');
  const packageJson = JSON.parse(await readFile(packageJsonPath, 'utf8'));
  if (packageJson.private === true) continue;
  publishable.push({ dir: join(packagesDir, entry.name), name: packageJson.name, dirName: entry.name, packageJson });
}

if (publishable.length === 0) {
  throw new Error('No publishable workspace packages found.');
}

await rm(outDir, { recursive: true, force: true });
await mkdir(outDir, { recursive: true });

const errors = [];

for (const pkg of publishable) {
  await run('pnpm', ['pack', '--pack-destination', outDir], pkg.dir);
}

const tarballs = (await readdir(outDir)).filter((f) => f.endsWith('.tgz')).sort();

for (const tarball of tarballs) {
  const tarballPath = join(outDir, tarball);
  const contents = await listTarball(tarballPath);
  const pkgName = tarball.replace(/\.tgz$/, '');

  if (!contents.includes('package/README.md')) {
    errors.push(`${tarball}: tarball is missing README.md`);
  }

  if (!contents.includes('package/package.json')) {
    errors.push(`${tarball}: tarball is missing package.json`);
  }

  const packageJson = JSON.parse(
    await runCapture('tar', ['-xOf', tarballPath, 'package/package.json'], root)
  );

  if (!packageJson.license) {
    errors.push(`${tarball}: tarball package.json has no license field`);
  }

  if (packageJson.exports) {
    for (const [exportKey, exportValue] of Object.entries(packageJson.exports)) {
      const paths = exportPaths(exportValue);
      for (const path of paths) {
        const tarballPath = `package/${path.replace(/^\.\//, '')}`;
        if (!contents.includes(tarballPath)) {
          errors.push(`${tarball}: exports["${exportKey}"] path ${path} not found in tarball`);
        }
      }
    }
  }

  if (packageJson.bin) {
    const binEntries = typeof packageJson.bin === 'string'
      ? { [packageJson.name]: packageJson.bin }
      : packageJson.bin;
    for (const [binName, binPath] of Object.entries(binEntries)) {
      const tarballPath = `package/${binPath.replace(/^\.\//, '')}`;
      if (!contents.includes(tarballPath)) {
        errors.push(`${tarball}: bin["${binName}"] path ${binPath} not found in tarball`);
      }
    }
  }
}

if (errors.length > 0) {
  console.error('Publishable package check failed:');
  for (const error of errors) {
    console.error(`- ${error}`);
  }
  process.exit(1);
}

console.log(`Publishable package check passed for ${publishable.length} package(s).`);
console.log(`Packed ${tarballs.length} tarball(s) into ${outDir}.`);

function exportPaths(exportValue) {
  if (typeof exportValue === 'string') return [exportValue];
  if (exportValue === null || typeof exportValue !== 'object') return [];
  const paths = [];
  for (const field of ['types', 'import', 'require', 'browser', 'node', 'default']) {
    const value = exportValue[field];
    if (typeof value === 'string') paths.push(value);
  }
  return paths;
}

function listTarball(tarballPath) {
  return runCapture('tar', ['-tf', tarballPath], root).then((out) => out.trim().split('\n'));
}

function run(command, args, cwd) {
  return new Promise((resolveRun, reject) => {
    const child = spawn(command, args, { cwd, stdio: 'inherit', shell: false });
    child.on('error', reject);
    child.on('exit', (code) => {
      if (code === 0) resolveRun();
      else reject(new Error(`${command} ${args.join(' ')} exited with ${code}`));
    });
  });
}

function runCapture(command, args, cwd) {
  return new Promise((resolveRun, reject) => {
    const child = spawn(command, args, { cwd, stdio: ['ignore', 'pipe', 'inherit'], shell: false });
    let output = '';
    child.stdout.on('data', (chunk) => (output += chunk));
    child.on('error', reject);
    child.on('exit', (code) => {
      if (code === 0) resolveRun(output);
      else reject(new Error(`${command} ${args.join(' ')} exited with ${code}`));
    });
  });
}
