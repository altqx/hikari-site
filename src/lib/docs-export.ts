// The app's docs export (`HikariSub --export-docs`, hikari's src/app/docs_export.cpp on qt,
// schema 1): the commands the Hotkeys page lists, the Settings window's controls, and the
// page F1 opens for each panel and window. Releases attach it as hikarisub-docs-<version>.zip.
// Pure functions only: scripts/fetch-docs.ts does the network part at build time.

import type { GitHubRelease, ReleaseChoice } from './downloads';
import { pickReleases } from './downloads';

export const docsSchema = 1;
export const docsFiles = ['meta.json', 'commands.json', 'settings.json', 'guide-links.json'] as const;

export function docsAssetName(version: string) {
  return `hikarisub-docs-${version}.zip`;
}

export interface DocsMeta {
  schema: number;
  application: string;
  version: string;
  commit: string;
  site: string;
  files: string[];
}

export interface Command {
  id: number;
  symbol: string;
  name: string;
  /** The window the command works in: Global, Grid, Audio, Video, ... */
  context: string;
  defaultKeys: { context: string; keys: string }[];
  /** Its places, such as "File > Save" or "Grid menu > Insert > Insert before". */
  menus: string[];
}

export interface SettingValue {
  value: string | number | boolean;
  label: string;
}

export interface Setting {
  key: string;
  page: string;
  section: string;
  label: string;
  hint: string;
  control: string;
  type: 'bool' | 'int' | 'string' | 'stringList';
  default: unknown;
  min?: number;
  max?: number;
  unit?: string;
  values?: SettingValue[];
  /** Set when only one platform's Settings window shows it. */
  platform?: string;
}

export interface GuideLinks {
  site: string;
  home: string;
  links: { kind: 'panel' | 'window'; id: string; path: string }[];
}

/** Where the export came from: a release's zip, or the pinned fixture until a release has one. */
export type DocsSource = { kind: 'release'; tag: string; url: string } | { kind: 'fixture' };

export interface DocsExport {
  meta: DocsMeta;
  commands: { commands: Command[] };
  settings: { pages: { id: string; name: string }[]; settings: Setting[] };
  guideLinks: GuideLinks;
}

// The reference pages have a heading for each; parseDocsExport fails on a new one, so
// the build says when a page needs another section.
export const hotkeyContexts = ['Global', 'Subtitles', 'Editor', 'Video', 'Audio'] as const;
export const settingsPages = [
  'general',
  'appearance',
  'lineEditor',
  'grid',
  'video',
  'audio',
  'conversion',
  'subtitleProperties',
  'automation',
  'hotkeys',
  'updates',
] as const;

/** The newest Qt release with its docs zip, if it carries one. */
export function pickDocsRelease(releases: GitHubRelease[]): (ReleaseChoice & { url: string }) | undefined {
  const picked = pickReleases(releases);
  const choice = picked.beta ?? picked.stable;
  if (!choice) return undefined;
  const asset = choice.release.assets.find((a) => a.name === docsAssetName(choice.version));
  return asset && { ...choice, url: asset.browser_download_url };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/** Checks the four files enough that the pages can trust them; throws on anything off. */
export function parseDocsExport(
  files: Record<(typeof docsFiles)[number], unknown>,
  version?: string,
): DocsExport {
  const meta = files['meta.json'];
  if (!isRecord(meta) || meta.schema !== docsSchema) {
    throw new Error(`meta.json: unknown schema ${String(isRecord(meta) ? meta.schema : meta)}`);
  }
  if (meta.application !== 'HikariSub') throw new Error(`meta.json is for ${String(meta.application)}`);
  if (version && meta.version !== version)
    throw new Error(`meta.json says ${String(meta.version)}, not ${version}`);
  const commands = files['commands.json'];
  if (!isRecord(commands) || !Array.isArray(commands.commands) || commands.commands.length === 0) {
    throw new Error('commands.json lists no commands');
  }
  for (const command of commands.commands as Command[]) {
    if (!(hotkeyContexts as readonly string[]).includes(command.context)) {
      throw new Error(
        `commands.json: ${command.symbol} is in ${command.context}, which the Hotkeys page has no section for`,
      );
    }
  }
  const settings = files['settings.json'];
  if (!isRecord(settings) || !Array.isArray(settings.pages) || !Array.isArray(settings.settings)) {
    throw new Error('settings.json has no pages or settings');
  }
  const pages = new Set((settings.pages as { id: string }[]).map((page) => page.id));
  for (const page of pages) {
    if (!(settingsPages as readonly string[]).includes(page)) {
      throw new Error(`settings.json: the page ${page} has no section on the Settings reference`);
    }
  }
  for (const setting of settings.settings as Setting[]) {
    if (!pages.has(setting.page)) throw new Error(`settings.json: ${setting.key} is on no page`);
  }
  const links = files['guide-links.json'];
  if (!isRecord(links) || typeof links.home !== 'string' || !Array.isArray(links.links)) {
    throw new Error('guide-links.json has no links');
  }
  for (const link of links.links as GuideLinks['links']) {
    if (!link.path.startsWith('/')) throw new Error(`guide-links.json: ${link.id} has the path ${link.path}`);
  }
  return {
    meta: meta as unknown as DocsMeta,
    commands: commands as unknown as DocsExport['commands'],
    settings: settings as unknown as DocsExport['settings'],
    guideLinks: links as unknown as GuideLinks,
  };
}

/** The menu path the app writes ("File > Save") as the guides write it ("File › Save"). */
export function menuPath(place: string) {
  return place.split(' > ').join(' › ');
}

/** A Qt key sequence ("Ctrl+Shift+S", "Ctrl+K, Ctrl+C") as its keys, chord by chord. */
export function keyChords(keys: string): string[][] {
  return keys
    .split(', ')
    .map((chord) => (chord.endsWith('++') ? [...chord.slice(0, -2).split('+'), '+'] : chord.split('+')));
}

/** The commands of one window, by name. */
export function commandsIn(commands: Command[], context: string) {
  return commands.filter((c) => c.context === context).sort((a, b) => a.name.localeCompare(b.name, 'en'));
}

/** One Settings page's settings by section, in the window's order. */
export function settingsOn(settings: Setting[], page: string) {
  const sections = new Map<string, Setting[]>();
  for (const setting of settings) {
    if (setting.page === page)
      sections.set(setting.section, [...(sections.get(setting.section) ?? []), setting]);
  }
  return [...sections.entries()].map(([title, list]) => ({ title, settings: list }));
}

/** A setting's value as the Settings window shows it: a choice by its label, a check as On or Off. */
export function formatValue(setting: Setting, value: unknown = setting.default): string {
  const entry = setting.values?.find((v) => v.value === value);
  if (entry) return entry.label;
  if (typeof value === 'boolean') return value ? 'On' : 'Off';
  if (Array.isArray(value)) return value.length === 0 ? 'None' : value.join(', ');
  // An empty choice is the app's own pick: the system's language, the default device.
  if (value === '' || value === null || value === undefined)
    return setting.control === 'choice' ? 'Automatic' : 'None';
  // Below its range, a number turns the feature off (Tab name length 0: names are not shortened).
  if (typeof value === 'number' && setting.min !== undefined && value < setting.min) return 'Off';
  // The unit is plural ("edits"), so it goes with the range, not the value.
  return String(value);
}
