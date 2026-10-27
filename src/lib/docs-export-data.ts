import commands from '@/generated/docs-export/commands.json';
import guideLinks from '@/generated/docs-export/guide-links.json';
import meta from '@/generated/docs-export/meta.json';
import settings from '@/generated/docs-export/settings.json';
import source from '@/generated/docs-export/source.json';
import type { DocsExport, DocsSource } from './docs-export';

// Written at build time by scripts/fetch-docs.ts.
export const docsExport = { meta, commands, settings, guideLinks } as DocsExport;
export const docsSource = source as DocsSource;
