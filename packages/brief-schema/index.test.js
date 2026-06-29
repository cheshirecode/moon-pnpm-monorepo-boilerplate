import { describe, expect, it } from 'vitest';

import {
  SCHEMA_VERSION,
  brainstormSchema,
  findKilledHits,
  prospectSchema,
  validateBrainstorm,
  validateProspect
} from './index.js';

const baseMetadata = {
  generatedAt: '2026-06-29T18:30:00.000Z',
  knowledgeVersion: 'test-knowledge',
  schemaVersion: SCHEMA_VERSION,
  worklogRefs: ['sales-eng-r01', 'sales-eng-r02', 'sales-eng-r03']
};

describe('brief schema', () => {
  it('loads both JSON schema assets', () => {
    expect(prospectSchema.title).toBe('ProspectBrief');
    expect(brainstormSchema.title).toBe('BrainstormBrief');
  });

  it('validates prospect briefs', () => {
    const prospect = {
      ...baseMetadata,
      buyerTier: 'api-platform',
      demoPath: 'API embed demo',
      fitScore: 'HIGH',
      gtmMotion: 'Technical validation',
      honestScope: ['No custom integrations in this demo'],
      mode: 'prospect',
      pitchBullets: ['Use existing API primitives'],
      provisionChecklist: ['Create demo token'],
      recommendedTemplate: 'api-embed',
      risks: ['Scope creep']
    };

    expect(validateProspect(prospect)).toBe(true);
    expect(validateProspect({ ...prospect, fitScore: 'MAYBE' })).toBe(false);
    expect(validateProspect.errors?.[0]?.instancePath).toBe('/fitScore');
  });

  it('validates brainstorm briefs', () => {
    const brainstorm = {
      ...baseMetadata,
      capabilitiesToPitch: ['background removal'],
      landmines: ['avoid overpromising workflow automation'],
      liveDemoOption: 'catalog background removal',
      mode: 'brainstorm',
      questionsToAsk: ['What is the current asset volume?'],
      suggestedOpening: 'Lead with an existing live demo'
    };

    expect(validateBrainstorm(brainstorm)).toBe(true);
    expect(validateBrainstorm({ ...brainstorm, capabilitiesToPitch: [] })).toBe(
      false
    );
    expect(validateBrainstorm.errors?.[0]?.instancePath).toBe(
      '/capabilitiesToPitch'
    );
  });

  it('finds killed-scope phrase hits with word boundaries', () => {
    const killedScope = {
      patterns: [
        { pattern: 'step runner registry' },
        { pattern: 'api' },
        { pattern: 'run' }
      ]
    };

    expect(
      findKilledHits('We will ship a step runner registry next week', killedScope)
    ).toEqual([{ matched: 'step runner registry', pattern: 'step runner registry' }]);
    expect(findKilledHits('The catalog-bg-remove demo is live', killedScope)).toEqual(
      []
    );
  });
});
