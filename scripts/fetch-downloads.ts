// Writes src/generated/downloads.json from hikari's newest releases and their
// update manifests. Runs before every build; a failure fails the build, so the site
// never shows stale or empty download links by accident.
//
//   bun scripts/fetch-downloads.ts            # fetch, or fail
//   bun scripts/fetch-downloads.ts --offline  # dev: no network; keep or write empty data
import { existsSync } from 'node:fs';
import { mkdir, writeFile } from 'node:fs/promises';
import {
  appRepo,
  type Downloads,
  type GitHubRelease,
  manifestName,
  parseManifest,
  pickReleases,
  type ReleaseChoice,
  toChannel,
} from '../src/lib/downloads';

const output = 'src/generated/downloads.json';
const offline = process.argv.includes('--offline');

async function write(data: Downloads) {
  await mkdir('src/generated', { recursive: true });
  await writeFile(output, `${JSON.stringify(data, null, 2)}\n`);
}

if (offline) {
  const kept = existsSync(output);
  if (!kept) await write({});
  console.log(`fetch-downloads: offline, ${kept ? 'kept' : 'wrote empty'} ${output}`);
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

// The app's update check reads 50 releases to a page, four pages at most.
const releases: GitHubRelease[] = [];
for (let page = 1; page <= 4; page++) {
  const batch = (await (
    await get(`https://api.github.com/repos/${appRepo}/releases?per_page=50&page=${page}`)
  ).json()) as GitHubRelease[];
  releases.push(...batch);
  if (batch.length < 50) break;
}

async function channel(choice?: ReleaseChoice) {
  if (!choice) return undefined;
  const asset = choice.release.assets.find((a) => a.name === manifestName);
  if (!asset) throw new Error(`${choice.release.tag_name} has no ${manifestName}`);
  const manifest = parseManifest(
    await (await get(asset.browser_download_url, 'application/octet-stream')).json(),
  );
  return toChannel(choice, manifest);
}

const picked = pickReleases(releases);
const data: Downloads = { stable: await channel(picked.stable), beta: await channel(picked.beta) };
await write(data);
console.log(
  `fetch-downloads: stable ${data.stable?.version ?? 'none'}, beta ${data.beta?.version ?? 'none'} (${releases.length} releases read)`,
);
