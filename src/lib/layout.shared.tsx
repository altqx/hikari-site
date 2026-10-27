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

export function baseOptions(_locale: string): BaseLayoutProps {
  return {
    nav: {
      title: appName,
    },
    githubUrl: appRepoUrl,
  };
}
