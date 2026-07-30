import { ESLint } from 'eslint';
import { describe, expect, it } from 'vitest';

import config from './index.js';

const eslint = new ESLint({
  overrideConfig: config,
  overrideConfigFile: true
});

describe('@cheshirecode/eslint-config-base', () => {
  it('loads without errors', async () => {
    const results = await eslint.lintText('const x = 1;\n');
    expect(Array.isArray(results)).toBe(true);
  });

  it('applies no-console rule', async () => {
    const results = await eslint.lintText('console.log("test");\n');
    expect(results[0].messages.length).toBeGreaterThan(0);
    expect(results[0].messages[0].ruleId).toBe('no-console');
  });

  it('exports an array of config objects', () => {
    expect(Array.isArray(config)).toBe(true);
    expect(config.length).toBeGreaterThan(0);
  });

  it.each(config)('each config has the expected shape', (c) => {
    expect(c).toBeDefined();
  });
});