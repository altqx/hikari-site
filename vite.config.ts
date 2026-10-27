import { readFileSync } from 'node:fs';
import tailwindcss from '@tailwindcss/vite';
import { tanstackStart } from '@tanstack/react-start/plugin/vite';
import react from '@vitejs/plugin-react';
import { fumadocsMdx } from 'fumadocs-mdx/vite';
import { nitro } from 'nitro/vite';
import { defineConfig, type Plugin } from 'vite';

// Production builds leave draft pages out of the page tree (src/lib/source.ts), but the
// MDX of every page is still compiled into a chunk. This empties a draft's body before
// fumadocs-mdx compiles it, so unpublished text never ships.
function dropDraftBodies(): Plugin {
  return {
    name: 'hikari-site:drop-draft-bodies',
    apply: 'build',
    transform: {
      order: 'pre',
      filter: { id: /[\\/]content[\\/]docs[\\/].*\.mdx(\?.*)?$/ },
      handler(code) {
        if (process.env.VITE_SHOW_DRAFTS === '1') return null;
        const frontmatter = /^---\r?\n([\s\S]*?)\r?\n---\r?\n/.exec(code);
        if (!frontmatter || !/^draft:\s*true\s*$/m.test(frontmatter[1])) return null;
        return { code: frontmatter[0], map: null };
      },
    },
  };
}

// AkariSub's WebAssembly bundles libass, FreeType, HarfBuzz, FriBidi and more; their notices
// ship beside it, linked from the Credits page. Emitted with the client build, so the
// prerender crawl finds the file.
function akariSubNotices(): Plugin {
  return {
    name: 'hikari-site:akarisub-notices',
    apply: 'build',
    applyToEnvironment: (environment) => environment.name === 'client',
    generateBundle() {
      this.emitFile({
        type: 'asset',
        fileName: 'licenses/akarisub.txt',
        source: readFileSync('node_modules/akarisub/dist/COPYRIGHT'),
      });
    },
  };
}

export default defineConfig({
  server: {
    port: 3000,
  },
  plugins: [
    dropDraftBodies(),
    akariSubNotices(),
    fumadocsMdx(),
    tailwindcss(),
    tanstackStart({
      // Fully static: every page is pre-rendered, the rest is a client-side shell.
      spa: {
        enabled: true,
        prerender: {
          enabled: true,
          crawlLinks: true,
        },
      },
      // Crawl each page once. A link with a #fragment or ?query names the same
      // file, and two crawls writing one file at once can leave it empty.
      prerender: {
        filter: ({ path }) => !/[?#]/.test(path),
      },
      pages: [{ path: '/en' }, { path: '/en/docs' }, { path: '/api/search' }],
    }),
    react(),
    nitro(),
  ],
  resolve: {
    tsconfigPaths: true,
    alias: {
      tslib: 'tslib/tslib.es6.js',
    },
  },
});
