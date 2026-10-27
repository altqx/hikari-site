import { uiTranslations } from 'fumadocs-ui/i18n';
import type { BaseLayoutProps } from 'fumadocs-ui/layouts/shared';
import { i18n } from './i18n';
import { appName, appRepoUrl } from './shared';

export const translations = i18n
  .translations()
  .extend(uiTranslations())
  .add({
    en: {
      displayName: 'English',
    },
  });

export function baseOptions(locale: string): BaseLayoutProps {
  return {
    nav: {
      title: (
        <>
          <img src="/favicon.png" alt="" width={22} height={22} />
          {appName}
        </>
      ),
      url: `/${locale}`,
    },
    links: [
      { text: 'Guides', url: `/${locale}/docs`, active: 'nested-url' },
      { text: 'Download', url: `/${locale}#download`, active: 'none' },
    ],
    githubUrl: appRepoUrl,
  };
}
