import type { ValidateFunction } from 'ajv';

export interface KilledScopePattern {
  pattern?: unknown;
}

export interface KilledScope {
  patterns?: KilledScopePattern[];
}

export interface KilledHit {
  matched: string;
  pattern: unknown;
}

export const SCHEMA_VERSION: '1.0.0';
export const prospectSchema: Record<string, unknown>;
export const brainstormSchema: Record<string, unknown>;
export const validateProspect: ValidateFunction;
export const validateBrainstorm: ValidateFunction;
export function findKilledHits(text: string, killedScope: KilledScope): KilledHit[];
