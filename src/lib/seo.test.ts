import { describe, expect, test } from 'bun:test';
import { canonicalUrl, pageHead, robotsTxt, sitemapXml } from './seo';

describe('canonical links', () => {
  test('are absolute on hikarisub.org, without a trailing slash', () => {
    expect(canonicalUrl('/en/docs/help/faq')).toBe('https://hikarisub.org/en/docs/help/faq');
    expect(canonicalUrl('/en/docs/')).toBe('https://hikarisub.org/en/docs');
    expect(canonicalUrl('/en')).toBe('https://hikarisub.org/en');
    expect(canonicalUrl('/')).toBe('https://hikarisub.org');
  });

  test('pageHead gives the canonical link and matching Open Graph tags', () => {
    const head = pageHead({ path: '/en/docs/help/faq', title: 'FAQ | HikariSub', description: 'Answers.' });
    expect(head.links).toEqual([{ rel: 'canonical', href: 'https://hikarisub.org/en/docs/help/faq' }]);
    expect(head.meta).toContainEqual({
      property: 'og:url',
      content: 'https://hikarisub.org/en/docs/help/faq',
    });
    expect(head.meta).toContainEqual({ property: 'og:title', content: 'FAQ | HikariSub' });
    expect(head.meta).toContainEqual({ name: 'description', content: 'Answers.' });
    expect(pageHead({ path: '/en', title: 'HikariSub' }).meta.some((m) => 'name' in m)).toBe(false);
  });
});

describe('sitemap and robots', () => {
  test('the sitemap lists each page once, sorted', () => {
    const xml = sitemapXml(['/en/docs/b', '/en', '/en/docs/a', '/en/docs/a/']);
    expect(xml).toStartWith('<?xml version="1.0" encoding="UTF-8"?>\n<urlset');
    expect(xml.match(/<loc>/g)).toHaveLength(3);
    expect(xml.indexOf('/en/docs/a<')).toBeLessThan(xml.indexOf('/en/docs/b<'));
  });

  test('robots points at the sitemap, and previews disallow everything', () => {
    expect(robotsTxt(false)).toContain('Sitemap: https://hikarisub.org/sitemap.xml');
    expect(robotsTxt(true)).toBe('User-agent: *\nDisallow: /\n');
  });
});
