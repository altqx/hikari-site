import { describe, expect, test } from 'bun:test';
import { readFileSync } from 'node:fs';
import parity from '@/assets/aegisub-parity.json';
import { allRows, areaSummary, countRows, inlineRuns, type ParityData, shows, slugify } from './parity';

const data = parity as ParityData;
const rows = allRows(data);
const page = readFileSync(
  new URL('../../content/docs/get-started/coming-from-aegisub.mdx', import.meta.url),
  'utf8',
);

describe('Coming from Aegisub data', () => {
  test('every row has a status, and every gap says what is missing', () => {
    for (const row of rows) {
      expect(row.feature.length).toBeGreaterThan(0);
      if (
        row.status === 'not-yet' ||
        row.status === 'not-planned' ||
        row.status === 'better' ||
        row.status === 'different'
      )
        expect(row.text.length).toBeGreaterThan(0);
      expect(`${row.feature} ${row.text} ${row.where}`).not.toMatch(/\]\(|\[\^/);
    }
  });

  test('only "different on purpose" rows link to a decision, on altqx/hikari', () => {
    for (const row of rows) {
      if (row.why) {
        expect(row.status).toBe('different');
        expect(row.why).toStartWith(
          'https://github.com/altqx/hikari/blob/main/docs/compatibility-decisions.md#',
        );
      }
    }
  });

  test('keyframe generation is the same with the official plugin (gate 2 Q6)', () => {
    const keyframes = rows.find((row) => row.feature.startsWith('Keyframe generation'));
    expect(keyframes?.status).toBe('same');
    expect(keyframes?.plugin).toBe(true);
  });

  test('the counts add up', () => {
    const counts = countRows(rows);
    expect(Object.values(counts).reduce((a, b) => a + b, 0)).toBe(rows.length);
  });

  test('the page has one heading and table for each area, in order', () => {
    const headings = [...page.matchAll(/^## (.+)$/gm)].map((m) => m[1]);
    const tables = [...page.matchAll(/<ParityTable area="([^"]+)" \/>/g)].map((m) => m[1]);
    expect(headings).toEqual(data.areas.map((area) => area.name));
    expect(tables).toEqual(data.areas.map((area) => area.slug));
    for (const area of data.areas) expect(slugify(area.name)).toBe(area.slug);
  });
});

describe('parity helpers', () => {
  test('slugify matches Fumadocs heading ids', () => {
    expect(slugify('Find, replace and checks')).toBe('find-replace-and-checks');
    expect(slugify('Settings, hotkeys and shell')).toBe('settings-hotkeys-and-shell');
  });

  test('areaSummary lists the statuses an area has', () => {
    expect(
      areaSummary([
        { feature: 'a', status: 'same', text: '', where: '' },
        { feature: 'b', status: 'not-yet', text: 'x', where: '' },
        { feature: 'c', status: 'same', text: '', where: '' },
      ]),
    ).toBe('2 same · 1 not yet');
  });

  test('the filter shows all, or one status', () => {
    const row = { feature: 'a', status: 'better' as const, text: 'x', where: '' };
    expect(shows('all', row)).toBe(true);
    expect(shows('better', row)).toBe(true);
    expect(shows('not-yet', row)).toBe(false);
  });

  test('inlineRuns splits code and bold', () => {
    expect(inlineRuns('Open `.y4m` with **Keyframe generator** now')).toEqual([
      { kind: 'text', text: 'Open ' },
      { kind: 'code', text: '.y4m' },
      { kind: 'text', text: ' with ' },
      { kind: 'strong', text: 'Keyframe generator' },
      { kind: 'text', text: ' now' },
    ]);
  });
});
