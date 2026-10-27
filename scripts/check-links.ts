// Checks that every internal href/src in the built HTML resolves to a file in the
// output, the way Cloudflare serves it (wrangler.jsonc: drop-trailing-slash), or to
// a rule in _redirects whose target resolves.
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
  for (const [, url] of html.matchAll(/\s(?:href|src)="([^"]*)"/g)) {
    if (!url.startsWith('/') || url.startsWith('//')) continue;
    const path = decodeURI(url.split(/[?#]/)[0]);
    checked++;
    if (!resolves(path)) broken.push(`${file}: ${url}`);
  }
}

if (broken.length > 0) {
  console.error(`Broken internal links (${broken.length}):\n${broken.join('\n')}`);
  process.exit(1);
}
console.log(`Checked ${checked} internal links: all resolve.`);
