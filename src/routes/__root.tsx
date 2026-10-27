import { createRootRoute, HeadContent, Outlet, Scripts, useParams } from '@tanstack/react-router';
import { i18nProvider } from 'fumadocs-ui/i18n';
import { RootProvider } from 'fumadocs-ui/provider/tanstack';
import SearchDialog from '@/components/search';
import { i18n } from '@/lib/i18n';
import { translations } from '@/lib/layout.shared';
import { appName } from '@/lib/shared';
import appCss from '@/styles/app.css?url';

// Cloudflare Web Analytics: no cookies, so no banner. Off when the token is unset.
const beaconToken = import.meta.env.VITE_CF_BEACON_TOKEN;

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { title: appName },
      { name: 'theme-color', media: '(prefers-color-scheme: light)', content: '#ffffff' },
      { name: 'theme-color', media: '(prefers-color-scheme: dark)', content: '#0a0a0a' },
    ],
    links: [
      { rel: 'stylesheet', href: appCss },
      { rel: 'icon', href: '/favicon.png', type: 'image/png' },
    ],
    scripts: beaconToken
      ? [
          {
            src: 'https://static.cloudflareinsights.com/beacon.min.js',
            defer: true,
            'data-cf-beacon': JSON.stringify({ token: beaconToken }),
          },
        ]
      : [],
  }),
  component: RootComponent,
});

function RootComponent() {
  const { lang = i18n.defaultLanguage } = useParams({ strict: false });

  return (
    <html lang={lang} suppressHydrationWarning>
      <head>
        <HeadContent />
      </head>
      <body className="flex flex-col min-h-screen">
        <RootProvider search={{ SearchDialog }} i18n={i18nProvider(translations, lang)}>
          <Outlet />
        </RootProvider>
        <Scripts />
      </body>
    </html>
  );
}
