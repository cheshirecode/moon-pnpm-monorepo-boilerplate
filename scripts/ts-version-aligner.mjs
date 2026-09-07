import { readFile, readdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join, resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const packagesDir = join(root, 'packages');
const errors = [];

async function discoverPackages() {
  const entries = await readdir(packagesDir, { withFileTypes: true });
  const packages = [];
  
  for (const entry of entries.filter((e) => e.isDirectory())) {
    const packageJsonPath = join(packagesDir, entry.name, 'package.json');
    
    if (!existsSync(packageJsonPath)) {
      continue;
    }
    
    try {
      const content = await readFile(packageJsonPath, 'utf8');
      const pkg = JSON.parse(content);
      packages.push({
        name: pkg.name || entry.name,
        dirName: entry.name,
        typescriptVersion: pkg.devDependencies?.typescript ?? null
      });
    } catch {
      errors.push(`Failed to parse ${entry.name}/package.json`);
    }
  }
  
  return packages.sort((a, b) => a.dirName.localeCompare(b.dirName));
}

async function check() {
  const packages = await discoverPackages();
  
  if (packages.length === 0) {
    console.log('No packages found.');
    process.exit(0);
  }
  
  const versionsByPackage = new Map();
  const versionGroups = new Map();
  
  for (const pkg of packages) {
    versionsByPackage.set(pkg.dirName, pkg.typescriptVersion);
    
    const version = pkg.typescriptVersion || 'not set';
    if (!versionGroups.has(version)) {
      versionGroups.set(version, []);
    }
    versionGroups.get(version).push(pkg.dirName);
  }
  
  const uniqueVersions = [...versionGroups.keys()].filter(v => v !== 'not set');
  
  if (uniqueVersions.length <= 1) {
    console.log(`TypeScript version alignment check passed for ${packages.length} package(s).`);
    console.log('');
    
    if (uniqueVersions.length === 1) {
      console.log(`All packages use TypeScript@${uniqueVersions[0]}`);
    } else if (versionGroups.has('not set')) {
      console.log('All packages with devDependencies.typescript use the same version');
      console.log('');
      console.log('Packages WITHOUT devDependencies.typescript:');
      for (const pkg of packages) {
        if (!pkg.typescriptVersion) {
          console.log(`  - ${pkg.dirName}`);
        }
      }
    } else {
      console.log('No packages define devDependencies.typescript');
    }
    
    process.exit(0);
  }
  
  // Mismatch detected
  console.error('TypeScript version mismatch detected:');
  console.error('');
  
  for (const [version, packagesUsingIt] of versionGroups) {
    if (version !== 'not set') {
      console.error(`TypeScript@${version}:`);
      for (const pkg of packagesUsingIt) {
        console.error(`  - ${pkg}`);
      }
      console.error('');
    }
  }
  
  const recommended = uniqueVersions.reduce((a, b) => {
    const countA = versionGroups.get(a).length;
    const countB = versionGroups.get(b).length;
    return countA >= countB ? a : b;
  });
  
  console.error(`Recommendation: align all packages to TypeScript@${recommended}`);
  console.error('');
  console.error(`Affected packages:`);
  for (const pkg of packages) {
    if (pkg.typescriptVersion && pkg.typescriptVersion !== recommended) {
      console.error(`  - ${pkg.dirName}: currently @${pkg.typescriptVersion}`);
    }
  }
  
  process.exit(1);
}

check().catch((err) => {
  console.error('ts-version-aligner failed:', err.message);
  process.exit(1);
});
