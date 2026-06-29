import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import Ajv from 'ajv';
import addFormats from 'ajv-formats';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export const SCHEMA_VERSION = '1.0.0';

export const prospectSchema = JSON.parse(
  fs.readFileSync(path.join(__dirname, 'prospect.schema.json'), 'utf8')
);
export const brainstormSchema = JSON.parse(
  fs.readFileSync(path.join(__dirname, 'brainstorm.schema.json'), 'utf8')
);

const ajv = new Ajv({ allErrors: true, strict: false });
addFormats(ajv);

export const validateProspect = ajv.compile(prospectSchema);
export const validateBrainstorm = ajv.compile(brainstormSchema);

export function findKilledHits(text, killedScope) {
  const lower = text.toLowerCase();
  const hits = [];

  for (const entry of killedScope.patterns ?? []) {
    const pattern = String(entry.pattern ?? '').toLowerCase().trim();

    if (pattern.length < 5) {
      continue;
    }

    const escaped = pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const re = pattern.includes(' ')
      ? new RegExp(escaped, 'i')
      : new RegExp(`\\b${escaped}\\b`, 'i');

    if (re.test(lower)) {
      hits.push({ matched: pattern, pattern: entry.pattern });
    }
  }

  return hits;
}
