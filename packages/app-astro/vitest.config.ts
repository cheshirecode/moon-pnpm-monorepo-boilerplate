import { defineConfig } from 'vitest/config';

import { packageTestConfig } from '../../vitest.shared.mjs';

export default defineConfig(packageTestConfig({ environment: 'node', include: ['tests/**/*.test.ts'] }));
