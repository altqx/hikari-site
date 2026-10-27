import defaultMdxComponents from 'fumadocs-ui/mdx';
import type { MDXComponents } from 'mdx/types';
import { AnnotatedImage } from './annotated-image';
import { AssPreview } from './ass-preview';
import { DownloadTable } from './download-table';
import { MotionImage } from './motion-image';
import { ThemedClip } from './themed-clip';
import { ThemedImage } from './themed-image';

export function getMDXComponents(components?: MDXComponents) {
  return {
    ...defaultMdxComponents,
    AnnotatedImage,
    AssPreview,
    DownloadTable,
    MotionImage,
    ThemedClip,
    ThemedImage,
    ...components,
  } satisfies MDXComponents;
}

export const useMDXComponents = getMDXComponents;

declare global {
  type MDXProvidedComponents = ReturnType<typeof getMDXComponents>;
}
