import defaultMdxComponents from 'fumadocs-ui/mdx';
import type { MDXComponents } from 'mdx/types';
import { AssPreview } from './ass-preview';
import { DownloadTable } from './download-table';
import { ThemedImage } from './themed-image';

export function getMDXComponents(components?: MDXComponents) {
  return {
    ...defaultMdxComponents,
    AssPreview,
    DownloadTable,
    ThemedImage,
    ...components,
  } satisfies MDXComponents;
}

export const useMDXComponents = getMDXComponents;

declare global {
  type MDXProvidedComponents = ReturnType<typeof getMDXComponents>;
}
