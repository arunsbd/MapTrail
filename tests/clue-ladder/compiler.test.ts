import { describe, expect, it } from 'vitest';
import { readFileSync, mkdtempSync, unlinkSync, rmdirSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { compileLadder, cumulativeCandidates, publishManifest } from '../../lib/clue-ladder/compile';
import { validateManifest, validateLadder } from '../../lib/clue-ladder/validate';
import { contentDigest } from '../../lib/clue-ladder/integrity';
import { dataset, fresh, fact, clue } from './helpers';
describe('three audited fixtures', () => {
    it.each([['US-AL', 5193088, 341154200000, 0, 2407], ['US-CO', 6012561, 584323900000, 4, 14433], ['US-RI', 1114521, 83956000000, 0, 812]] as const)('preserves %s source values', (state, pop, gdp, parks, highpoint) => {
        expect(fact(state, 'population.resident_estimate').value).toBe(pop);
        expect(fact(state, 'economy.gdp_current_usd').value).toBe(gdp);
        expect(fact(state, 'nps.formal_national_park_count').value).toBe(parks);
        expect(fact(state, 'physical.highest_point').value).toBe(highpoint);
    });
    it.each(['CO', 'RI'])('validates the exact %s sample and its first four intersections', code => {
        const audit = JSON.parse(readFileSync('data/clue-ladder/review/audited-examples.json', 'utf8'));
        const ladder = (audit.sampleLadders[code] as string[]).map(clue);
        expect(validateLadder(ladder, dataset)).toEqual([]);
        expect(cumulativeCandidates(ladder, dataset.universe).slice(0, 4)).toEqual(audit.earlyCounts[code]);
    });
    it('preserves Alabama expectations but refuses to certify its incomplete sample', () => {
        const audit = JSON.parse(readFileSync('data/clue-ladder/review/audited-examples.json', 'utf8'));
        const ladder = (audit.sampleLadders.AL as string[]).map(clue);
        expect(cumulativeCandidates(ladder, dataset.universe).slice(0, 4)).toEqual([19, 5, 2, 1]);
        expect(validateLadder(ladder, dataset)).toContainEqual(expect.objectContaining({ code: 'LADDER_APPROVAL', path: 'al.industry.mfg-14-16' }));
        expect(clue('al.industry.mfg-14-16').review.status).toBe('draft');
    });
    it('keeps only three researched state pools and climate facts unapproved', () => {
        expect(dataset.states.map(s => s.stateId)).toEqual(['US-AL', 'US-CO', 'US-RI']);
        expect(dataset.universe).toHaveLength(50);
        expect(dataset.facts.filter(f => f.metricId.startsWith('climate')).every(f => f.quality.status === 'draft')).toBe(true);
        expect(dataset.clues.some(c => c.category === 'climate')).toBe(false);
    });
});
describe('deterministic compilation and manifests', () => {
    it.each(['US-AL', 'US-CO', 'US-RI'] as const)('compiles %s deterministically', state => {
        const a = compileLadder(dataset, state, 'repeatable'), b = compileLadder(dataset, state, 'repeatable');
        expect(a).toEqual(b);
        expect(a.orderedClueIds).toHaveLength(10);
        expect(validateManifest(a, dataset)).toEqual([]);
        expect(Object.isFrozen(a)).toBe(true);
        expect(Object.isFrozen(a.orderedClueIds)).toBe(true);
        expect(Object.isFrozen(a.scoring.maxByRung)).toBe(true);
        const clues = a.orderedClueIds.map(clue);
        expect(clues.every(c => c.review.status === 'approved')).toBe(true);
        const counts = cumulativeCandidates(clues, dataset.universe);
        expect(counts.at(-1)).toBe(1);
        expect(counts.every((n, i) => !i || n <= counts[i - 1])).toBe(true);
    });
    it('varies order with seeds while preserving constraints across seeds', () => {
        const ladders = ['one', 'two', 'three', 'four'].map(seed => compileLadder(dataset, 'US-CO', seed));
        expect(new Set(ladders.map(m => m.orderedClueIds.join(','))).size).toBeGreaterThan(1);
        for (const m of ladders)
            expect(validateManifest(m, dataset)).toEqual([]);
    }, 15000);
    it('supports 8 and 9 rungs without moving visual clues before rung 9', () => {
        for (const length of [8, 9]) {
            const m = compileLadder(dataset, 'US-AL', 'short', { length });
            expect(m.orderedClueIds).toHaveLength(length);
            expect(validateManifest(m, dataset)).toEqual([]);
        }
    });
    it('does not depend on fact/clue file ordering', () => {
        const d = fresh();
        d.facts.reverse();
        d.clues.reverse();
        expect(contentDigest(d)).toBe(contentDigest(dataset));
        expect(compileLadder(d, 'US-CO', 'order')).toEqual(compileLadder(dataset, 'US-CO', 'order'));
    });
    it('rejects unknown states, short pools, and empty seeds', () => {
        expect(() => compileLadder(dataset, 'US-AK', 'x')).toThrow('POOL_NOT_PUBLISHABLE');
        expect(() => compileLadder(dataset, 'US-AL', '')).toThrow('SEED');
    });
    it('rejects mutable snapshot aliases and changed input content', () => {
        const manifest = compileLadder(dataset, 'US-RI', 'frozen');
        expect(validateManifest({ ...manifest, dataSnapshotId: 'current' }, dataset).some(e => e.code === 'MANIFEST_SNAPSHOT')).toBe(true);
        const changed = fresh();
        changed.clues[0].render.text = { en: 'Revised text' };
        expect(validateManifest(manifest, changed).some(e => e.code === 'MANIFEST_INTEGRITY')).toBe(true);
        expect(validateManifest(manifest, dataset)).toEqual([]);
    });
    it('publishes idempotently and cannot overwrite an old manifest', () => {
        const dir = mkdtempSync(join(tmpdir(), 'maptrail-manifest-'));
        try {
            const path = join(dir, 'puzzle.json'), first = compileLadder(dataset, 'US-RI', 'first'), second = compileLadder(dataset, 'US-RI', 'second');
            publishManifest(path, first, dataset);
            const original = readFileSync(path, 'utf8');
            publishManifest(path, first, dataset);
            expect(() => publishManifest(path, second, dataset)).toThrow('MANIFEST_IMMUTABLE');
            expect(readFileSync(path, 'utf8')).toBe(original);
        }
        finally {
            if (existsSync(join(dir, 'puzzle.json')))
                unlinkSync(join(dir, 'puzzle.json'));
            rmdirSync(dir);
        }
    });
});
