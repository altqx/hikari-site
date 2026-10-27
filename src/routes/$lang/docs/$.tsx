import { createFileRoute, notFound } from '@tanstack/react-router';
import { createServerFn } from '@tanstack/react-start';
import { staticFunctionMiddleware } from '@tanstack/start-static-server-functions';
import { useFumadocsLoader } from 'fumadocs-core/source/client';
import { DocsLayout } from 'fumadocs-ui/layouts/docs';
import { DocsBody, DocsDescription, DocsPage, DocsTitle } from 'fumadocs-ui/layouts/docs/page';
import { Suspense, use } from 'react';
import { useMDXComponents } from '@/components/mdx';
import { PageActions } from '@/components/page-actions';
import { baseOptions } from '@/lib/layout.shared';
import { appName } from '@/lib/shared';
import { docs, source } from '@/lib/source';

export const Route = createFileRoute('/$lang/docs/$')({
  component: Page,
  loader: async ({ params }) => {
    const slugs = params._splat?.split('/').filter(Boolean) ?? [];
    // Unknown pages have no pre-rendered loader data, so check before fetching it.
    if (!source.getPage(slugs, params.lang)) throw notFound();
    const data = await loader({ data: { slugs, lang: params.lang } });
    await docs.getPage(data.path)?.preload();
    return data;
  },
  head: ({ loaderData }) => ({
    meta: loaderData
      ? [
          { title: `${loaderData.title} | ${appName}` },
          ...(loaderData.description ? [{ name: 'description', content: loaderData.description }] : []),
        ]
      : [],
  }),
});

const loader = createServerFn({ method: 'GET' })
  .validator((params: { slugs: string[]; lang: string }) => params)
  .middleware([staticFunctionMiddleware])
  .handler(async ({ data: { slugs, lang } }) => {
    const page = source.getPage(slugs, lang);
    if (!page) throw notFound();

    return {
      path: page.path,
      url: page.url,
      title: page.data.title,
      description: page.data.description,
      pageTree: await source.serializePageTree(source.getPageTree(lang)),
    };
  });

function Content({ path, url }: { path: string; url: string }) {
  const page = docs.getPage(path);
  if (!page) throw new Error(`unknown page: ${path}`);

  const { toc } = use(page.load());
  const MDX = page.body;

  return (
    <DocsPage toc={toc}>
      {page.draft && (
        <p className="rounded-md border border-dashed px-3 py-2 text-sm text-fd-muted-foreground">
          Draft: shown in previews only.
        </p>
      )}
      <DocsTitle>{page.title}</DocsTitle>
      <DocsDescription>{page.description}</DocsDescription>
      <DocsBody>
        <MDX components={useMDXComponents()} />
      </DocsBody>
      <PageActions path={path} url={url} title={page.title} />
    </DocsPage>
  );
}

function Page() {
  const { lang } = Route.useParams();
  const { pageTree, path, url } = useFumadocsLoader(Route.useLoaderData());

  return (
    <DocsLayout {...baseOptions(lang)} tree={pageTree}>
      <Suspense>
        <Content path={path} url={url} />
      </Suspense>
    </DocsLayout>
  );
}
