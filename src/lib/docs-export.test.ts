import { describe, expect, test } from 'bun:test';
import {
  commandsIn,
  docsAssetName,
  formatValue,
  keyChords,
  menuPath,
  parseDocsExport,
  pickDocsRelease,
  type Setting,
  settingsOn,
} from './docs-export';
import type { GitHubRelease } from './downloads';

function release(tag: string, names: string[], options: Partial<GitHubRelease> = {}): GitHubRelease {
  return {
    tag_name: tag,
    draft: false,
    prerelease: tag.includes('-'),
    published_at: '2026-11-03T00:00:00Z',
    html_url: `https://github.com/altqx/hikari/releases/tag/${tag}`,
    assets: ['hikarisub-update.json', ...names].map((name) => ({
      name,
      browser_download_url: `https://github.com/altqx/hikari/releases/download/${tag}/${name}`,
    })),
    ...options,
  };
}

function files(overrides: Record<string, unknown> = {}) {
  return {
    'meta.json': {
      schema: 1,
      application: 'HikariSub',
      version: '0.1.0-beta.1',
      commit: 'abc',
      site: '',
      files: [],
    },
    'commands.json': {
      commands: [
        {
          id: 5112,
          symbol: 'GLOBAL_HELP',
          name: 'User guide',
          context: 'Global',
          defaultKeys: [],
          menus: [],
        },
      ],
    },
    'settings.json': {
      pages: [{ id: 'general', name: 'General' }],
      settings: [{ key: 'program.language', page: 'general', section: 'Language' }],
    },
    'guide-links.json': { site: 'https://hikarisub.altqx.com', home: '/en/docs', links: [] },
    ...overrides,
  };
}

describe('pickDocsRelease', () => {
  test('takes the zip of the newest release, betas included', () => {
    const picked = pickDocsRelease([
      release('v0.1.0', [docsAssetName('0.1.0')]),
      release('v0.2.0-beta.1', [docsAssetName('0.2.0-beta.1')]),
    ]);
    expect(picked?.version).toBe('0.2.0-beta.1');
    expect(picked?.url).toEndWith('/v0.2.0-beta.1/hikarisub-docs-0.2.0-beta.1.zip');
  });

  test('nothing when the newest release has no zip, or there is no Qt release', () => {
    expect(pickDocsRelease([release('v0.1.0-beta.1', [])])).toBeUndefined();
    expect(pickDocsRelease([release('v0.0.2', [docsAssetName('0.0.2')])])).toBeUndefined();
    expect(pickDocsRelease([])).toBeUndefined();
  });
});

describe('parseDocsExport', () => {
  test('reads the four files', () => {
    const data = parseDocsExport(files(), '0.1.0-beta.1');
    expect(data.commands.commands[0].name).toBe('User guide');
    expect(data.guideLinks.home).toBe('/en/docs');
  });

  test('refuses another schema, another version or a broken file', () => {
    expect(() => parseDocsExport(files({ 'meta.json': { schema: 2, application: 'HikariSub' } }))).toThrow(
      'schema 2',
    );
    expect(() => parseDocsExport(files(), '0.1.0')).toThrow('not 0.1.0');
    expect(() => parseDocsExport(files({ 'commands.json': { commands: [] } }))).toThrow('no commands');
    expect(() =>
      parseDocsExport(
        files({ 'guide-links.json': { home: '/en/docs', links: [{ id: 'Grid', path: 'en/docs' }] } }),
      ),
    ).toThrow('Grid');
  });

  test('says when the app has a window or a Settings page the pages have no section for', () => {
    const commands = {
      commands: [{ id: 1, symbol: 'X', name: 'X', context: 'Styles', defaultKeys: [], menus: [] }],
    };
    expect(() => parseDocsExport(files({ 'commands.json': commands }))).toThrow('Styles');
    const settings = { pages: [{ id: 'spelling', name: 'Spelling' }], settings: [] };
    expect(() => parseDocsExport(files({ 'settings.json': settings }))).toThrow('spelling');
    const orphan = { pages: [{ id: 'general', name: 'General' }], settings: [{ key: 'a.b', page: 'video' }] };
    expect(() => parseDocsExport(files({ 'settings.json': orphan }))).toThrow('a.b');
  });
});

test('menuPath and keyChords read the export as the guides write it', () => {
  expect(menuPath('Subtitles > Conversion > Convert to SRT')).toBe('Subtitles › Conversion › Convert to SRT');
  expect(keyChords('Ctrl+Shift+S')).toEqual([['Ctrl', 'Shift', 'S']]);
  expect(keyChords('Ctrl+K, Ctrl+C')).toEqual([
    ['Ctrl', 'K'],
    ['Ctrl', 'C'],
  ]);
  expect(keyChords('Ctrl++')).toEqual([['Ctrl', '+']]);
});

test('commandsIn and settingsOn keep one window or page, in order', () => {
  const command = (id: number, name: string, context: string) => ({
    id,
    symbol: String(id),
    name,
    context,
    defaultKeys: [],
    menus: [],
  });
  const list = [
    command(1, 'Save', 'Global'),
    command(2, 'Delete', 'Subtitles'),
    command(3, 'Open', 'Global'),
  ];
  expect(commandsIn(list, 'Global').map((c) => c.name)).toEqual(['Open', 'Save']);
  const setting = (key: string, page: string, section: string) => ({ key, page, section }) as Setting;
  const settings = [
    setting('a', 'general', 'Tabs'),
    setting('b', 'video', 'Player'),
    setting('c', 'general', 'Language'),
  ];
  expect(settingsOn(settings, 'general')).toEqual([
    { title: 'Tabs', settings: [settings[0]] },
    { title: 'Language', settings: [settings[2]] },
  ]);
});

test('formatValue shows a default as the Settings window does', () => {
  const base = {
    key: 'k',
    page: 'p',
    section: 's',
    label: 'l',
    hint: '',
    control: 'check',
    type: 'bool',
  } as const;
  expect(formatValue({ ...base, default: true })).toBe('On');
  expect(
    formatValue({
      ...base,
      control: 'choice',
      type: 'int',
      default: 1,
      values: [{ value: 1, label: 'DirectSound' }],
    }),
  ).toBe('DirectSound');
  expect(formatValue({ ...base, control: 'number', type: 'int', default: 40, unit: 'ms' })).toBe('40');
  expect(formatValue({ ...base, control: 'text', type: 'string', default: '' })).toBe('None');
  expect(formatValue({ ...base, control: 'choice', type: 'string', default: '', values: [] })).toBe(
    'Automatic',
  );
  expect(formatValue({ ...base, control: 'number', type: 'int', default: 0, min: 20, max: 150 })).toBe('Off');
  expect(formatValue({ ...base, control: 'text', type: 'stringList', default: [] })).toBe('None');
});
