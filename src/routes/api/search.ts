import { createFileRoute } from '@tanstack/react-router';
import type { StructuredData } from 'fumadocs-core/mdx-plugins';
import { createFromSource } from 'fumadocs-core/search/server';
import { referenceSearchRows } from '@/lib/docs-export';
import { docsExport } from '@/lib/docs-export-data';
import { source } from '@/lib/source';

type Page = ReturnType<typeof source.getPages>[number];

const references: Record<string, 'hotkeys' | 'settings'> = {
  'reference/hotkeys': 'hotkeys',
  'reference/settings': 'settings',
};

// The page's text, as Fumadocs indexes it by default. The Hotkeys and Settings reference
// build their tables from the docs export, so their rows are added under their section.
async function buildIndex(page: Page) {
  let structuredData: StructuredData = await page.data.structuredData();
  const reference = references[page.slugs.join('/')];
  if (reference) {
    const ids = new Map(structuredData.headings.map((heading) => [heading.content, heading.id]));
    const rows = referenceSearchRows(docsExport, reference).map((row) => ({
      heading: ids.get(row.section),
      content: row.content,
    }));
    // A new object: the loaded one is the compiled page's own.
    structuredData = { ...structuredData, contents: [...structuredData.contents, ...rows] };
  }
  return {
    title: page.data.title,
    description: page.data.description,
    url: page.url,
    id: page.url,
    structuredData,
  };
}

// Static Orama index, built at build time and searched in the browser.
const server = createFromSource(source, { buildIndex });

export const Route = createFileRoute('/api/search')({
  server: {
    handlers: {
      GET: () => server.staticGET(),
    },
  },
});
