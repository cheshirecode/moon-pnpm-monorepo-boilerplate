import { mkdir, mkdtemp, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

import {
  filterObjectByKey,
  filterObjectPropsByKey,
  flattenPackages,
  flattenWorkspace,
  pickMerge
} from './index.js';

describe('object helpers', () => {
  it('filters object keys only when the value matches the condition', () => {
    const sample = { one: 2, two: 3, nested: { one: 2 } };

    expect(filterObjectByKey({}, 'two')).toEqual({});
    expect(filterObjectByKey(sample, 'two')).toEqual({ one: 2, nested: { one: 2 } });
    expect(filterObjectByKey(sample, 'two', () => true)).toEqual(sample);
  });

  it('filters selected object props by blacklist', () => {
    const sample = {
      plain: 2,
      dependencies: { vite: '^8.0.16' },
      devDependencies: { vitest: '^4.1.9' }
    };

    expect(filterObjectPropsByKey(sample)).toEqual(sample);
    expect(filterObjectPropsByKey(sample, ['dependencies'], ['vite'])).toEqual({
      plain: 2,
      dependencies: {},
      devDependencies: { vitest: '^4.1.9' }
    });
  });

  it('merges selected object props from left to right', () => {
    expect(pickMerge(['dependencies'], { dependencies: { vite: '^8.0.16' } }, {
      dependencies: { typescript: '^6.0.3' }
    })).toEqual({
      dependencies: { vite: '^8.0.16', typescript: '^6.0.3' }
    });
  });
});

describe('flattenPackages', () => {
  it('preserves root metadata while dropping workspace-only fields', () => {
    expect(
      flattenPackages({
        main: {
          private: true,
          workspaces: ['packages/*'],
          dummyProps: { value: true }
        },
        packages: [
          {
            dependencies: { vite: '^8.0.16' },
            devDependencies: { vitest: '^4.1.9' }
          }
        ],
        props: ['dependencies', 'devDependencies']
      })
    ).toEqual({
      private: true,
      dummyProps: { value: true },
      dependencies: { vite: '^8.0.16' },
      devDependencies: { vitest: '^4.1.9' }
    });
  });

  it('omits blacklisted dependency keys', () => {
    expect(
      flattenPackages({
        main: { dependencies: { vite: '^8.0.16', react: '^19.2.3' } },
        packages: [{ devDependencies: { vitest: '^4.1.9' } }],
        props: ['dependencies', 'devDependencies'],
        blacklist: ['react', 'vitest']
      })
    ).toEqual({
      dependencies: { vite: '^8.0.16' },
      devDependencies: {}
    });
  });
});

describe('flattenWorkspace', () => {
  it('flattens package manifests from a workspace directory', async () => {
    const root = await mkdtemp(join(tmpdir(), 'flatten-workspace-'));
    await writeFile(
      join(root, 'package.json'),
      JSON.stringify({
        private: true,
        workspaces: ['packages/*'],
        dummyProps: { 'dummyProps-key': 'dummyProps-value' }
      })
    );
    await mkdir(join(root, 'packages', 'core'), { recursive: true });
    await mkdir(join(root, 'packages', 'lint'), { recursive: true });
    await writeFile(
      join(root, 'packages', 'core', 'package.json'),
      JSON.stringify({
        dependencies: {
          webpack: '^4.8.1',
          'webpack-cli': '^4.0.0'
        },
        devDependencies: {
          '@rntw/eslint-config-lint': '0.1.0',
          'webpack-bundle-analyzer': '^2.13.1',
          'webpack-dev-server': '^3.1.4'
        }
      })
    );
    await writeFile(
      join(root, 'packages', 'lint', 'package.json'),
      JSON.stringify({
        devDependencies: {
          'babel-eslint': '^8.0.2',
          eslint: '4.18.2',
          'eslint-config-prettier': '2.9.0',
          prettier: '^1.13.4'
        }
      })
    );

    const result = await flattenWorkspace({
      root,
      location: 'packages',
      blacklist: ['webpack-cli'],
      outFile: 'package.flattened.json'
    });

    expect(result).toEqual({
      private: true,
      dummyProps: { 'dummyProps-key': 'dummyProps-value' },
      dependencies: {
        webpack: '^4.8.1'
      },
      devDependencies: {
        '@rntw/eslint-config-lint': '0.1.0',
        'webpack-bundle-analyzer': '^2.13.1',
        'webpack-dev-server': '^3.1.4',
        'babel-eslint': '^8.0.2',
        eslint: '4.18.2',
        'eslint-config-prettier': '2.9.0',
        prettier: '^1.13.4'
      }
    });
    expect(JSON.parse(await readFile(join(root, 'package.flattened.json'), 'utf8'))).toEqual(result);
  });
});
