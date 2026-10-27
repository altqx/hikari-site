import { loader } from 'fumadocs-core/source';
import { pageSchema } from 'fumadocs-core/source/schema';
import { defineDocs } from 'fumadocs-mdx/macro';
import { z } from 'zod';
import { i18n } from './i18n';
import { showDrafts } from './shared';

export const docs = defineDocs({
  dir: 'content/docs',
  docs: {
    async: true,
    schema: pageSchema.extend({
      draft: z.boolean().default(false),
    }),
  },
});

type Collection = ReturnType<typeof docs.toFumadocsSource>;

function dirname(path: string) {
  const slash = path.lastIndexOf('/');
  return slash === -1 ? '' : path.slice(0, slash);
}

/** Drops draft pages, and folders left with no pages. */
export function withoutDrafts(collection: Collection): Collection {
  const pages = collection.files.filter((file) => file.type === 'page' && !file.data.draft);
  const dirs = new Set<string>(['']);
  for (const page of pages) {
    for (let dir = dirname(page.path); dir !== ''; dir = dirname(dir)) dirs.add(dir);
  }
  const metas = collection.files.filter((file) => file.type === 'meta' && dirs.has(dirname(file.path)));

  return { ...collection, files: [...pages, ...metas] };
}

const collection = docs.toFumadocsSource();

export const source = loader({
  i18n,
  baseUrl: '/docs',
  source: showDrafts ? collection : withoutDrafts(collection),
});
