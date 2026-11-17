// Writes src/assets/aegisub-parity.json from CX7's parity.md (altqx/hikari#810), for the
// Coming from Aegisub page and the homepage count. Only the public columns are kept: the
// area, the Aegisub feature, the status with its sentence, where it is in HikariSub, and
// the decision a "different on purpose" row links to.
//
//   bun scripts/parity.ts path/to/parity.md
import { readFileSync, writeFileSync } from 'node:fs';
import { type ParityData, type ParityRow, type ParityStatus, slugify } from '../src/lib/parity';

const decisionsUrl = 'https://github.com/altqx/hikari/blob/main/docs/compatibility-decisions.md';
const statuses: [string, ParityStatus][] = [
  ['different on purpose', 'different'],
  ['not yet', 'not-yet'],
  ['not planned', 'not-planned'],
  ['unverified', 'unverified'],
  ['better', 'better'],
  ['same', 'same'],
];

function cells(line: string): string[] {
  return line
    .split(/(?<!\\)\|/)
    .slice(1, -1)
    .map((cell) => cell.trim());
}

function sentence(text: string): string {
  // Footnote marks and decision dates stay in parity.md.
  const clean = text
    .replace(/\[\^[a-z0-9]+\]/g, '')
    .replace(/ \(\d{4}-\d{2}-\d{2}\)/g, '')
    .trim();
  if (!clean) return '';
  const first = clean.split(/\s/)[0] ?? '';
  // x86_64 and other identifiers keep their case.
  const capital = /^[a-z][a-z'-]*[,.;:]?$/.test(first) ? clean[0].toUpperCase() + clean.slice(1) : clean;
  return /[.!?]$/.test(capital) ? capital : `${capital}.`;
}

function parseStatus(cell: string): { status: ParityStatus; text: string; plugin?: boolean } {
  for (const [word, status] of statuses) {
    if (!cell.startsWith(word)) continue;
    const rest = cell.slice(word.length);
    if (rest === '') return { status, text: '' };
    if (rest.startsWith(': ')) return { status, text: sentence(rest.slice(2)) };
    // "same, with the official **Keyframe generator** plugin (separate install)"
    if (rest.startsWith(', ')) {
      const text = sentence(rest.slice(2));
      return { status, text, plugin: /official \*\*.+\*\* plugin/.test(rest) };
    }
  }
  throw new Error(`No status in: ${cell}`);
}

function decision(...columns: string[]): string | undefined {
  for (const column of columns) {
    const anchor = column.match(/compatibility-decisions\.md#([a-z0-9-]+)/)?.[1];
    if (anchor) return `${decisionsUrl}#${anchor}`;
  }
  return undefined;
}

const [path] = process.argv.slice(2);
if (!path) throw new Error('Usage: bun scripts/parity.ts path/to/parity.md');
const source = readFileSync(path, 'utf8');
const commit = source.match(/`main` at `([0-9a-f]{7,40})`/)?.[1];
if (!commit) throw new Error('parity.md names no app commit');

const data: ParityData = { checkedAt: commit, areas: [] };
let inAegisub = false;
for (const line of source.split('\n')) {
  if (line.startsWith('## ')) inAegisub = line === '## Aegisub features';
  if (!inAegisub) continue;
  if (line.startsWith('### ')) {
    const name = line.slice(4).trim();
    data.areas.push({ name, slug: slugify(name), rows: [] });
    continue;
  }
  if (!line.startsWith('|') || line.startsWith('| Feature') || line.startsWith('| ---')) continue;
  const row = cells(line);
  if (row.length !== 6) throw new Error(`Expected 6 cells: ${line}`);
  const [feature, , hikari, where, evidence, change] = row;
  const area = data.areas.at(-1);
  if (!area) throw new Error(`Row before any area: ${line}`);
  const { status, text, plugin } = parseStatus(hikari);
  const entry: ParityRow = { feature, status, text, where: where === '—' ? '' : where };
  if (plugin) entry.plugin = true;
  if (status === 'different') {
    const why = decision(evidence, change);
    if (why) entry.why = why;
  }
  for (const value of [entry.feature, entry.text, entry.where])
    if (/\]\(|<[a-z]/i.test(value)) throw new Error(`Links or HTML in a public cell: ${value}`);
  area.rows.push(entry);
}

writeFileSync(
  new URL('../src/assets/aegisub-parity.json', import.meta.url),
  `${JSON.stringify(data, null, 2)}\n`,
);
const total = data.areas.reduce((sum, area) => sum + area.rows.length, 0);
console.log(`${total} rows in ${data.areas.length} areas, checked at ${commit}`);
