import { mkdir, readFile, readdir, rm } from 'node:fs/promises';
import { basename, join, resolve } from 'node:path';
import { spawn } from 'node:child_process';

const root = resolve(import.meta.dirname, '..');
const packagesDir = join(root, 'packages');
const outDir = join(root, '.artifacts', 'release');

const packageDirs = await readdir(packagesDir, { withFileTypes: true });
const publishable = [];

for (const entry of packageDirs) {
  if (!entry.isDirectory()) {
    continue;
  }

  const packageDir = join(packagesDir, entry.name);
  const packageJsonPath = join(packageDir, 'package.json');
  const packageJson = JSON.parse(await readFile(packageJsonPath, 'utf8'));

  if (packageJson.private === true) {
    continue;
  }

  publishable.push({
    dir: packageDir,
    name: packageJson.name ?? entry.name
  });
}

if (publishable.length === 0) {
  throw new Error('No publishable workspace packages found.');
}

await rm(outDir, { recursive: true, force: true });
await mkdir(outDir, { recursive: true });

for (const pkg of publishable) {
  await run('pnpm', ['pack', '--pack-destination', outDir], pkg.dir);
}

console.log(`Packed ${publishable.length} publishable package(s) into ${outDir}:`);
for (const pkg of publishable) {
  console.log(`- ${pkg.name} (${basename(pkg.dir)})`);
}

function run(command, args, cwd) {
  return new Promise((resolveRun, reject) => {
    const child = spawn(command, args, {
      cwd,
      stdio: 'inherit',
      shell: false
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
