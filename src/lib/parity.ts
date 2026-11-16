// HikariSub against Aegisub 3.5, feature by feature: the data behind Coming from Aegisub and
// the homepage count. src/assets/aegisub-parity.json is written by scripts/parity.ts from
// CX7's parity.md (altqx/hikari#810).

export type ParityStatus = 'same' | 'better' | 'different' | 'not-yet' | 'unverified';

export interface ParityRow {
  /** The Aegisub feature, with `code` and **bold** marks. */
  feature: string;
  status: ParityStatus;
  /** One sentence: what is better, missing or different. Empty for a plain "same". */
  text: string;
  /** Where it is in HikariSub; empty when it isn't there. */
  where: string;
  /** Same only with HikariSub's official plugin (Keyframe generator). */
  plugin?: boolean;
  /** For "different on purpose": the decision behind it. */
  why?: string;
}

export interface ParityArea {
  name: string;
  slug: string;
  rows: ParityRow[];
}

export interface ParityData {
  /** The HikariSub commit the rows were checked against. */
  checkedAt: string;
  areas: ParityArea[];
}

export const statusOrder: ParityStatus[] = ['same', 'better', 'different', 'not-yet', 'unverified'];

export const statusLabel: Record<ParityStatus, string> = {
  same: 'Same',
  better: 'Better',
  different: 'Different on purpose',
  'not-yet': 'Not yet',
  unverified: 'Not checked yet',
};

export const statusMeaning: Record<ParityStatus, string> = {
  same: 'HikariSub does what Aegisub does, perhaps in another place.',
  better: 'The same, plus something you can check, named in the row.',
  different: 'We chose to do it another way. The row links to why.',
  'not-yet': 'Missing, or only partly there. The row says what is missing.',
  unverified: "We haven't checked it yet.",
};

/** Heading ids as Fumadocs makes them from the area names. */
export function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9 -]/g, '')
    .trim()
    .replace(/ /g, '-');
}

export function countRows(rows: ParityRow[]): Record<ParityStatus, number> {
  const counts: Record<ParityStatus, number> = {
    same: 0,
    better: 0,
    different: 0,
    'not-yet': 0,
    unverified: 0,
  };
  for (const row of rows) counts[row.status] += 1;
  return counts;
}

export function allRows(data: ParityData): ParityRow[] {
  return data.areas.flatMap((area) => area.rows);
}

/** "6 same · 3 better · 5 not yet": the statuses an area has, in order. */
export function areaSummary(rows: ParityRow[]): string {
  const counts = countRows(rows);
  return statusOrder
    .filter((status) => counts[status] > 0)
    .map((status) => `${counts[status]} ${statusLabel[status].toLowerCase()}`)
    .join(' · ');
}

export type ParityFilter = 'all' | 'not-yet' | 'better';

export function shows(filter: ParityFilter, row: ParityRow): boolean {
  return filter === 'all' || row.status === filter;
}

export type Inline = { kind: 'text' | 'code' | 'strong'; text: string };

/** Splits a cell into plain text, `code` and **bold** runs. */
export function inlineRuns(cell: string): Inline[] {
  const runs: Inline[] = [];
  const pattern = /`([^`]+)`|\*\*([^*]+)\*\*/g;
  let last = 0;
  for (const match of cell.matchAll(pattern)) {
    const at = match.index ?? 0;
    if (at > last) runs.push({ kind: 'text', text: cell.slice(last, at) });
    runs.push(match[1] !== undefined ? { kind: 'code', text: match[1] } : { kind: 'strong', text: match[2] });
    last = at + match[0].length;
  }
  if (last < cell.length) runs.push({ kind: 'text', text: cell.slice(last) });
  return runs;
}
