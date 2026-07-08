import { configDefaults, coverageConfigDefaults } from 'vitest/config';

const lcovTextCoverage = {
  reporter: ['text', 'lcov'],
  thresholds: {
    lines: 50,
    functions: 50,
    branches: 40,
    statements: 50
  }
};

const appCoverage = {
  reporter: ['text', 'lcov', 'html'],
  provider: 'v8',
  thresholds: {
    lines: 40,
    functions: 40,
    branches: 30,
    statements: 40
  }
};

export function packageTestConfig(options = {}) {
  const {
    environment,
    include = ['src/**/*.test.ts'],
    globals,
    exclude,
    coverage = lcovTextCoverage,
    ...rest
  } = options;

  return {
    test: {
      ...(environment ? { environment } : {}),
      ...(globals === undefined ? {} : { globals }),
      include,
      ...(exclude ? { exclude } : {}),
      coverage,
      ...rest
    }
  };
}

export function domPackageTestConfig(options = {}) {
  return packageTestConfig({
    environment: 'happy-dom',
    ...options
  });
}

export function rootSmokeTestConfig() {
  return {
    test: {
      include: ['tests/**/*.test.js']
    }
  };
}

export function viteAppTestConfig(options = {}) {
  const {
    environment = 'happy-dom',
    globals = true,
    include = ['**/*(*.)?{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    exclude = configDefaults.exclude,
    coverage = appCoverage,
    ...rest
  } = options;

  return {
    globals,
    environment,
    include,
    exclude,
    coverage,
    ...rest
  };
}

export { configDefaults, coverageConfigDefaults };
