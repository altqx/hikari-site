// Checks that every internal href/src/data-still in the built HTML resolves to a file in the
// output, the way Cloudflare serves it (wrangler.jsonc: drop-trailing-slash), or to
// a rule in _redirects whose target resolves, and that no page was written empty.
import { existsSync, readFileSync } from 'node:fs';
import { glob } from 'node:fs/promises';
import { join } from 'node:path';

const root = process.argv[2] ?? '.output/public';

const redirects = new Map<string, string>();
const splatRedirects: [string, string][] = [];
const redirectsFile = join(root, '_redirects');
if (existsSync(redirectsFile)) {
  for (const line of readFileSync(redirectsFile, 'utf8').split('\n')) {
    const [from, to] = line.trim().split(/\s+/);
    if (!from || from.startsWith('#') || !to) continue;
    if (from.endsWith('/*')) splatRedirects.push([from.slice(0, -1), to.replace(':splat', '')]);
    else redirects.set(from, to);
  }
}

function servesFile(path: string) {
  const clean = path.replace(/\/$/, '');
  return [clean, `${clean}.html`, `${clean}/index.html`].some((p) => p && existsSync(join(root, p)));
}

function resolves(path: string, depth = 0): boolean {
  if (servesFile(path) || (path === '/' && existsSync(join(root, 'index.html')))) return true;
  if (depth > 3) return false;
  const target = redirects.get(path.replace(/(.)\/$/, '$1'));
  if (target) return resolves(target, depth + 1);
  for (const [prefix, to] of splatRedirects) {
    if (path.startsWith(prefix)) return resolves(to + path.slice(prefix.length), depth + 1);
  }
  return false;
}

const broken: string[] = [];
let checked = 0;
for await (const file of glob('**/*.html', { cwd: root })) {
  if (file === '_shell.html' || file === '404.html') continue;
  const html = readFileSync(join(root, file), 'utf8');
  if (!html.includes('</html>')) broken.push(`${file}: the page is empty or cut short`);
  // data-still: the static image of an <AssPreview>, made by scripts/render-stills.ts.
  for (const [, url] of html.matchAll(/\s(?:href|src|data-still)="([^"]*)"/g)) {
    if (!url.startsWith('/') || url.startsWith('//')) continue;
    const path = decodeURI(url.split(/[?#]/)[0]);
    checked++;
    if (!resolves(path)) broken.push(`${file}: ${url}`);
  }
}

// The pages the app's User guide (F1, the ? buttons) opens, from its docs export
// (scripts/fetch-docs.ts). A path with no guide at all fails. A guide that is still a
// draft is left out of production builds; those are listed, as pages still to write.
const guideLinksFile = 'src/generated/docs-export/guide-links.json';
const drafts: string[] = [];
let guidePaths = 0;
if (existsSync(guideLinksFile)) {
  const map = JSON.parse(readFileSync(guideLinksFile, 'utf8')) as {
    home: string;
    links: { kind: string; id: string; path: string }[];
  };
  for (const { kind, id, path } of [{ kind: 'home', id: 'home', path: map.home }, ...map.links]) {
    guidePaths++;
    if (resolves(path)) continue;
    const source = join('content/docs', `${path.replace(/^\/en\/docs\/?/, '') || 'index'}.mdx`);
    const isDraft =
      existsSync(source) && /^draft:\s*true\s*$/m.test(readFileSync(source, 'utf8').split(/^---$/m)[1] ?? '');
    (isDraft ? drafts : broken).push(`guide-links.json (${kind} ${id}): ${path}`);
  }
}

if (broken.length > 0) {
  console.error(`Broken internal links (${broken.length}):\n${broken.join('\n')}`);
  process.exit(1);
}
console.log(`Checked ${checked} internal links: all resolve.`);
console.log(`User guide pages: ${guidePaths - drafts.length} of ${guidePaths} in this build.`);
if (drafts.length > 0) {
  console.log(`Still drafts, so F1 finds no page there yet (${drafts.length}):\n${drafts.join('\n')}`);
}
