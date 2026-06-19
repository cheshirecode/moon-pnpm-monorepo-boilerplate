import { readdir, readFile, writeFile } from 'node:fs/promises';
import { join, relative, resolve } from 'node:path';

export type PackageJson = Record<string, unknown>;

export interface FlattenPackagesOptions {
  main?: PackageJson;
  packages?: PackageJson[];
  props?: string | string[];
  blacklist?: string | string[];
}

export interface FlattenWorkspaceOptions extends FlattenPackagesOptions {
  root?: string;
  location?: string;
  defaultProps?: string | string[];
  packageFileName?: string;
  outFile?: string;
}

function toList(value: string | string[] | undefined): string[] {
  if (Array.isArray(value)) {
    return value.filter(Boolean);
  }

  return String(value ?? '')
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean);
}

function isRecord(value: unknown): value is PackageJson {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

export function filterObjectByKey(
  obj: PackageJson = {},
  blacklist?: string | string[],
  condition: (entryKey: string, blacklistKey: string) => boolean = (entryKey, blacklistKey) =>
    !blacklistKey || !entryKey.includes(blacklistKey)
): PackageJson {
  return Object.fromEntries(
    Object.entries(obj).filter(([entryKey]) => {
      const blacklistKeys = toList(blacklist);

      return blacklistKeys.length === 0
        ? true
        : blacklistKeys.every((blacklistKey) => condition(entryKey, blacklistKey));
    })
  );
}

export function filterObjectPropsByKey(
  obj: PackageJson = {},
  props?: string | string[],
  blacklist?: string | string[],
  condition?: (entryKey: string, blacklistKey: string) => boolean
): PackageJson {
  const propList = toList(props);
  const blacklistList = toList(blacklist);

  if (propList.length === 0 || blacklistList.length === 0) {
    return obj;
  }

  return propList.reduce<PackageJson>((nextObj, prop) => {
    if (!isRecord(nextObj[prop])) {
      return nextObj;
    }

    return {
      ...nextObj,
      [prop]: blacklistList.reduce(
        (value, key) => filterObjectByKey(value, key, condition),
        nextObj[prop]
      )
    };
  }, obj);
}

export function pickMerge(props?: string | string[], ...objects: unknown[]): PackageJson {
  const records = objects.filter(isRecord);

  return toList(props)
    .filter((prop) => records.some((record) => Object.hasOwn(record, prop)))
    .reduce<PackageJson>((merged, prop) => {
      return {
        ...merged,
        [prop]: records.reduce<PackageJson>((value, record) => {
          const nextValue = record[prop];
          if (nextValue !== undefined && !isRecord(nextValue)) {
            throw new TypeError(`Expected value of key ${prop} to be an object.`);
          }

          return {
            ...value,
            ...(nextValue ?? {})
          };
        }, {})
      };
    }, {});
}

export function flattenPackages({
  main = {},
  packages = [],
  props,
  blacklist
}: FlattenPackagesOptions = {}): PackageJson {
  const filteredPackages = pickMerge(
    props,
    ...[main, ...packages].map((pkg) => filterObjectPropsByKey(pkg, props, blacklist))
  );
  const { author: _author, workspaces: _workspaces, ...mainWithoutWorkspaceFields } = main;

  return {
    ...mainWithoutWorkspaceFields,
    ...filteredPackages
  };
}

export async function flattenWorkspace({
  root = '.',
  location = '.',
  defaultProps = ['dependencies', 'devDependencies'],
  props,
  blacklist,
  packageFileName = 'package.json',
  outFile
}: FlattenWorkspaceOptions = {}): Promise<PackageJson> {
  const rootDir = resolve(root);
  const rootPackagePath = join(rootDir, packageFileName);
  const packageFiles = await findPackageFiles(resolve(rootDir, location), packageFileName);
  const main = await readPackageJson(rootPackagePath, {});
  const packages = await Promise.all(
    packageFiles
      .filter((packagePath) => packagePath !== rootPackagePath)
      .map((packagePath) => readPackageJson(packagePath, {}))
  );
  const flattened = flattenPackages({
    main,
    packages,
    props: [...toList(props), ...toList(defaultProps)],
    blacklist
  });

  if (outFile) {
    await writeFile(resolve(rootDir, outFile), `${JSON.stringify(flattened, null, 2)}\n`, 'utf8');
  }

  return flattened;
}

async function findPackageFiles(startDir: string, packageFileName: string): Promise<string[]> {
  const entries = await readdir(startDir, { withFileTypes: true });
  const files = await Promise.all(
    entries.map(async (entry) => {
      const path = join(startDir, entry.name);

      if (entry.isDirectory()) {
        if (entry.name === 'node_modules' || entry.name === '.git') {
          return [];
        }

        return findPackageFiles(path, packageFileName);
      }

      return entry.isFile() && entry.name === packageFileName ? [path] : [];
    })
  );

  return files.flat().sort((a, b) => relative(startDir, a).localeCompare(relative(startDir, b)));
}

async function readPackageJson(path: string, fallback: PackageJson): Promise<PackageJson> {
  try {
    return JSON.parse(await readFile(path, 'utf8'));
  } catch (error) {
    if (isNodeError(error) && error.code === 'ENOENT') {
      return fallback;
    }

    throw error;
  }
}

function isNodeError(error: unknown): error is NodeJS.ErrnoException {
  return error instanceof Error && 'code' in error;
}
