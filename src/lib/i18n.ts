import { defineI18n } from 'fumadocs-core/i18n';

// Fumadocs hides the language switcher while only one language exists.
export const i18n = defineI18n({
  defaultLanguage: 'en',
  languages: ['en'],
  hideLocale: 'never',
});
