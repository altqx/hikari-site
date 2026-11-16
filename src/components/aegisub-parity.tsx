'use client';

import { useSyncExternalStore } from 'react';
import parity from '@/assets/aegisub-parity.json';
import {
  allRows,
  areaSummary,
  countRows,
  type Inline,
  inlineRuns,
  type ParityData,
  type ParityFilter,
  type ParityRow,
  type ParityStatus,
  shows,
  statusLabel,
  statusMeaning,
  statusOrder,
} from '@/lib/parity';

export const parityData = parity as ParityData;

const pluginGuide = '/en/docs/plugins/using-plugins#keyframe-generator';

// One filter for every area table on the page.
let filter: ParityFilter = 'all';
const listeners = new Set<() => void>();
function setFilter(next: ParityFilter) {
  filter = next;
  for (const listener of listeners) listener();
}
function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
function useFilter(): ParityFilter {
  return useSyncExternalStore(
    subscribe,
    () => filter,
    () => 'all',
  );
}

function Runs({ cell, plugin }: { cell: string; plugin?: boolean }) {
  return inlineRuns(cell).map((run: Inline, i) => {
    const key = `${i}-${run.text}`;
    if (run.kind === 'code') return <code key={key}>{run.text}</code>;
    if (run.kind === 'strong')
      return plugin ? (
        <a key={key} href={pluginGuide}>
          {run.text}
        </a>
      ) : (
        <strong key={key}>{run.text}</strong>
      );
    return <span key={key}>{run.text}</span>;
  });
}

export function StatusPill({ status }: { status: ParityStatus }) {
  return <span className={`parity-pill parity-${status}`}>{statusLabel[status]}</span>;
}

const filters: { id: ParityFilter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'not-yet', label: 'Not yet only' },
  { id: 'better', label: 'Better only' },
];

/** The counts, what each status means, and the filter for the tables below. */
export function ParitySummary() {
  const current = useFilter();
  const counts = countRows(allRows(parityData));
  return (
    <div className="not-prose my-6 flex flex-col gap-4" data-testid="parity-summary">
      <div className="flex flex-wrap gap-x-5 gap-y-2 rounded-xl border bg-fd-card px-4 py-3">
        {statusOrder
          .filter((status) => counts[status] > 0)
          .map((status) => (
            <span key={status} className="inline-flex items-center gap-1.5 text-sm">
              <StatusPill status={status} />
              <span className="font-semibold">{counts[status]}</span>
            </span>
          ))}
      </div>
      <dl className="grid grid-cols-1 gap-x-3 gap-y-1 text-sm sm:grid-cols-[max-content_1fr]">
        {statusOrder
          .filter((status) => counts[status] > 0)
          .map((status) => (
            <div key={status} className="contents">
              <dt>
                <StatusPill status={status} />
              </dt>
              <dd className="mb-2 text-fd-muted-foreground sm:mb-0">{statusMeaning[status]}</dd>
            </div>
          ))}
      </dl>
      <fieldset className="flex flex-wrap gap-2">
        <legend className="sr-only">Show</legend>
        {filters.map((option) => (
          <button
            key={option.id}
            type="button"
            aria-pressed={current === option.id}
            onClick={() => setFilter(option.id)}
            className={`rounded-full border px-3 py-0.5 text-[13px] ${
              current === option.id
                ? 'border-fd-primary font-medium text-fd-primary'
                : 'text-fd-muted-foreground hover:text-fd-foreground'
            }`}
          >
            {option.label}
          </button>
        ))}
      </fieldset>
    </div>
  );
}

function Row({ row }: { row: ParityRow }) {
  return (
    <tr className={`parity-row-${row.status}`} data-status={row.status}>
      <td className="parity-feature">
        <Runs cell={row.feature} />
      </td>
      <td>
        <StatusPill status={row.status} /> <Runs cell={row.text} plugin={row.plugin} />
        {row.why && (
          <>
            {' '}
            <a href={row.why}>Why</a>
          </>
        )}
      </td>
      <td className={row.where ? 'parity-where' : 'parity-where parity-nowhere'}>
        {row.where ? <Runs cell={row.where} /> : '—'}
      </td>
    </tr>
  );
}

/** One area's rows: the Aegisub feature, how HikariSub compares, and where it is. */
export function ParityTable({ area }: { area: string }) {
  const current = useFilter();
  const found = parityData.areas.find((candidate) => candidate.slug === area);
  if (!found) throw new Error(`No parity area ${area}`);
  const rows = found.rows.filter((row) => shows(current, row));
  return (
    <div className="not-prose my-4" data-testid={`parity-${area}`}>
      <p className="mb-2.5 text-[13px] text-fd-muted-foreground">{areaSummary(found.rows)}</p>
      <table className="parity-table" aria-label={found.name}>
        <colgroup>
          <col className="w-[30%]" />
          <col className="w-[44%]" />
          <col className="w-[26%]" />
        </colgroup>
        <thead>
          <tr>
            <th scope="col">In Aegisub</th>
            <th scope="col">In HikariSub</th>
            <th scope="col">Where</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <Row key={row.feature} row={row} />
          ))}
          {rows.length === 0 && (
            <tr>
              <td colSpan={3} className="text-fd-muted-foreground">
                Nothing in this area for this filter.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

/** How many Aegisub features were checked. */
export function ParityCount() {
  return <>{allRows(parityData).length}</>;
}

/** How many Aegisub features aren't in HikariSub yet. */
export function ParityNotYet() {
  return <>{countRows(allRows(parityData))['not-yet']}</>;
}

/** What the rows were checked against, and where to report a wrong one. */
export function ParityCheckedAt() {
  return (
    <p className="text-sm text-fd-muted-foreground">
      Checked against HikariSub <code>{parityData.checkedAt}</code> and Aegisub 3.5. Something wrong or
      missing here? <a href="https://github.com/altqx/hikari-site/issues/new">Report it</a>.
    </p>
  );
}

/** "173 Aegisub features checked · 54 not yet", from the data. */
export function parityCounts() {
  const rows = allRows(parityData);
  return { checked: rows.length, notYet: countRows(rows)['not-yet'] };
}
