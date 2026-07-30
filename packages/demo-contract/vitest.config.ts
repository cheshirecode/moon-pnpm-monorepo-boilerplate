import { defineConfig } from 'vitest/config';

import { packageTestConfig } from '@cheshirecode/vitest-config';

export default defineConfig(packageTestConfig({ environment: 'node' }));
