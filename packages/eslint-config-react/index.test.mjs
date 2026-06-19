import { ESLint } from 'eslint';
import { describe, expect, it } from 'vitest';

import config from './index.js';

const fixtureConfig = config.map((entry) =>
  entry.ignores
    ? {
        ...entry,
        ignores: entry.ignores.filter((pattern) => pattern !== '**/fails/**')
      }
    : entry
);

const eslint = new ESLint({
  overrideConfig: fixtureConfig,
  overrideConfigFile: true
});

describe('@fieryeagle/eslint-config-react', () => {
  it('accepts passing fixtures', async () => {
    const results = await eslint.lintFiles(['passes/**/*.ts*']);

    expect(
      results.map((result) => [result.filePath, result.messages])
    ).toEqual(results.map((result) => [result.filePath, []]));
  });

  it('reports failing fixtures', async () => {
    const results = await eslint.lintFiles(['fails/**/*.ts*']);

    expect(results.every((result) => result.messages.length > 0)).toBe(true);
  });
});
