import type { UserConfig } from 'vitest/config';

export const configDefaults: Readonly<{
  exclude: string[];
}>;

export const coverageConfigDefaults: Readonly<{
  exclude: string[];
}>;

export function packageTestConfig(options?: Record<string, unknown>): UserConfig;
export function domPackageTestConfig(options?: Record<string, unknown>): UserConfig;
export function rootSmokeTestConfig(): UserConfig;
export function viteAppTestConfig(options?: Record<string, unknown>): NonNullable<UserConfig['test']>;
