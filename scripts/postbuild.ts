import { copyFile, readdir, writeFile } from 'node:fs/promises';
import { robotsTxt, sitemapXml } from '../src/lib/seo';

const out = '.output/public';

// Cloudflare serves 404.html for unknown paths (wrangler.jsonc, not_found_handling).
// The SPA shell renders the not-found page on the client.
await copyFile(`${out}/_shell.html`, `${out}/404.html`);

// Builds with drafts are previews: keep them out of search engines.
const preview = process.env.VITE_SHOW_DRAFTS === '1';

// sitemap.xml lists every pre-rendered page (each is a folder with an index.html), and
// robots.txt points at it.
const pages = (await readdir(out, { recursive: true }))
  .filter((file) => file.endsWith('/index.html') && !file.startsWith('api/'))
  .map((file) => `/${file.slice(0, -'/index.html'.length)}`);
await writeFile(`${out}/sitemap.xml`, sitemapXml(pages));
await writeFile(`${out}/robots.txt`, robotsTxt(preview));

if (preview) {
  await writeFile(`${out}/_headers`, '/*\n  X-Robots-Tag: noindex\n');
}
