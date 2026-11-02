import { appName, siteUrl } from './shared';

export const siteDescription =
  'A subtitle editor and player for everything from quick fixes to full typesetting. ASS, SRT and other formats, with frame-accurate video, for Windows and Linux.';

// public/og-image.jpg: the homepage hero (light), with its "Subtitles: Jibrill" credit in the image.
export const siteImage = {
  url: `${siteUrl}/og-image.jpg`,
  width: 1200,
  height: 630,
  alt: 'HikariSub in the Editing layout: the video with karaoke subtitles, the Audio panel, the Line editor and the Grid',
};

export function canonicalUrl(path: string): string {
  const trimmed = path.length > 1 ? path.replace(/\/+$/, '') : path;
  return `${siteUrl}${trimmed === '/' ? '' : trimmed}`;
}

// The canonical link and the page's own Open Graph tags. The site-wide ones are in __root.tsx.
export function pageHead({
  path,
  title,
  description,
}: {
  path: string;
  title: string;
  description?: string;
}) {
  const url = canonicalUrl(path);
  return {
    meta: [
      { title },
      ...(description ? [{ name: 'description', content: description }] : []),
      { property: 'og:title', content: title },
      ...(description ? [{ property: 'og:description', content: description }] : []),
      { property: 'og:url', content: url },
    ],
    links: [{ rel: 'canonical', href: url }],
  };
}

export const siteHeadMeta = [
  { property: 'og:site_name', content: appName },
  { property: 'og:type', content: 'website' },
  { property: 'og:image', content: siteImage.url },
  { property: 'og:image:width', content: String(siteImage.width) },
  { property: 'og:image:height', content: String(siteImage.height) },
  { property: 'og:image:alt', content: siteImage.alt },
  { name: 'twitter:card', content: 'summary_large_image' },
];

const escapeXml = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

export function sitemapXml(paths: string[]): string {
  const urls = [...new Set(paths.map(canonicalUrl))].sort();
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...urls.map((url) => `  <url><loc>${escapeXml(url)}</loc></url>`),
    '</urlset>',
    '',
  ].join('\n');
}

// Builds with drafts are previews, which stay out of search engines.
export function robotsTxt(preview: boolean): string {
  return preview
    ? 'User-agent: *\nDisallow: /\n'
    : `User-agent: *\nAllow: /\n\nSitemap: ${siteUrl}/sitemap.xml\n`;
}
