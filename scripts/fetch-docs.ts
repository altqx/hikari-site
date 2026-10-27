// Writes src/generated/docs-export/ from the docs zip of hikari's newest release, the
// data the Hotkeys and Settings reference pages and the guide-link check read. Until a
// release carries the zip, it copies the pinned export in src/assets/docs-export/.
// Runs before every build; a release whose zip is missing files or unreadable fails it.
//
//   bun scripts/fetch-docs.ts            # fetch, or fail
//   bun scripts/fetch-docs.ts --offline  # dev: no network; keep or copy the pinned export
import { existsSync } from 'node:fs';
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { type DocsSource, docsFiles, parseDocsExport, pickDocsRelease } from '../src/lib/docs-export';
import { appRepo, type GitHubRelease } from '../src/lib/downloads';

const output = 'src/generated/docs-export';
const pinned = 'src/assets/docs-export';
const offline = process.argv.includes('--offline');

async function readFiles(dir: string) {
  const files = {} as Record<(typeof docsFiles)[number], unknown>;
  for (const name of docsFiles) files[name] = JSON.parse(await readFile(join(dir, name), 'utf8'));
  return files;
}

async function write(dir: string, source: DocsSource, version?: string) {
  const files = await readFiles(dir);
  const data = parseDocsExport(files, version);
  await mkdir(output, { recursive: true });
  for (const name of docsFiles)
    await writeFile(join(output, name), `${JSON.stringify(files[name], null, 2)}\n`);
  await writeFile(join(output, 'source.json'), `${JSON.stringify(source, null, 2)}\n`);
  const from = source.kind === 'release' ? source.tag : `the pinned export (${data.meta.commit.slice(0, 9)})`;
  console.log(
    `fetch-docs: ${data.commands.commands.length} commands, ${data.settings.settings.length} settings, ` +
      `${data.guideLinks.links.length} guide links from ${from}`,
  );
}

if (offline) {
  if (existsSync(join(output, 'source.json'))) {
    console.log(`fetch-docs: offline, kept ${output}`);
  } else {
    await write(pinned, { kind: 'fixture' });
  }
  process.exit(0);
}

const token = process.env.GITHUB_TOKEN ?? process.env.GH_TOKEN;
const headers: Record<string, string> = {
  Accept: 'application/vnd.github+json',
  'User-Agent': 'hikari-site',
  ...(token ? { Authorization: `Bearer ${token}` } : {}),
};

async function get(url: string, accept?: string) {
  const response = await fetch(url, { headers: accept ? { ...headers, Accept: accept } : headers });
  if (!response.ok) throw new Error(`${url}: HTTP ${response.status}`);
  return response;
}

const releases: GitHubRelease[] = [];
for (let page = 1; page <= 4; page++) {
  const batch = (await (
    await get(`https://api.github.com/repos/${appRepo}/releases?per_page=50&page=${page}`)
  ).json()) as GitHubRelease[];
  releases.push(...batch);
  if (batch.length < 50) break;
}

const choice = pickDocsRelease(releases);
if (!choice) {
  await write(pinned, { kind: 'fixture' });
} else {
  const dir = await mkdtemp(join(tmpdir(), 'hikari-docs-'));
  try {
    const zip = join(dir, 'docs.zip');
    await writeFile(
      zip,
      new Uint8Array(await (await get(choice.url, 'application/octet-stream')).arrayBuffer()),
    );
    const unzip = Bun.spawnSync(['unzip', '-q', '-o', zip, ...docsFiles, '-d', join(dir, 'files')]);
    if (unzip.exitCode !== 0) throw new Error(`${choice.url}: unzip failed: ${unzip.stderr.toString()}`);
    await write(
      join(dir, 'files'),
      { kind: 'release', tag: choice.release.tag_name, url: choice.url },
      choice.version,
    );
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}
