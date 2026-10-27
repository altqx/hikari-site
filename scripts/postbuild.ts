import { copyFile, mkdir, writeFile } from 'node:fs/promises';

const out = '.output/public';

// Cloudflare serves 404.html for unknown paths (wrangler.jsonc, not_found_handling).
// The SPA shell renders the not-found page on the client.
await copyFile(`${out}/_shell.html`, `${out}/404.html`);

// Builds with drafts are previews: keep them out of search engines.
if (process.env.VITE_SHOW_DRAFTS === '1') {
  await writeFile(`${out}/_headers`, '/*\n  X-Robots-Tag: noindex\n');
}

// AkariSub's WebAssembly bundles libass, FreeType, HarfBuzz, FriBidi and more; ship their
// notices with it (linked from the Credits page).
await mkdir(`${out}/licenses`, { recursive: true });
await copyFile('node_modules/akarisub/dist/COPYRIGHT', `${out}/licenses/akarisub.txt`);
