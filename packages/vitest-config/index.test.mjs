import { describe, it, expect } from 'vitest';
import { packageTestConfig, domPackageTestConfig, rootSmokeTestConfig, viteAppTestConfig } from './index.mjs';

describe('packageTestConfig', () => {
  it('returns a vitest config object with test section', () => {
    const config = packageTestConfig();
    expect(config).toHaveProperty('test');
    expect(config.test).toHaveProperty('include');
    expect(config.test).toHaveProperty('coverage');
  });

  it('accepts environment option', () => {
    const config = packageTestConfig({ environment: 'node' });
    expect(config.test.environment).toBe('node');
  });

  it('accepts globals option', () => {
    const config = packageTestConfig({ globals: true });
    expect(config.test.globals).toBe(true);
  });
});

describe('domPackageTestConfig', () => {
  it('uses happy-dom environment', () => {
    const config = domPackageTestConfig();
    expect(config.test.environment).toBe('happy-dom');
  });
});

describe('rootSmokeTestConfig', () => {
  it('includes tests from tests/ directory', () => {
    const config = rootSmokeTestConfig();
    expect(config.test.include).toEqual(['tests/**/*.test.js']);
  });
});

describe('viteAppTestConfig', () => {
  it('sets globals and environment', () => {
    const config = viteAppTestConfig();
    expect(config.globals).toBe(true);
    expect(config.environment).toBe('happy-dom');
  });

  it('accepts overrides', () => {
    const config = viteAppTestConfig({ environment: 'jsdom' });
    expect(config.environment).toBe('jsdom');
  });
});

describe('re-exports', () => {
  it('re-exports configDefaults and coverageConfigDefaults', async () => {
    const mod = await import('./index.mjs');
    expect(mod).toHaveProperty('configDefaults');
    expect(mod).toHaveProperty('coverageConfigDefaults');
  });
});