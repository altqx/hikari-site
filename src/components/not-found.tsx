import { useParams } from '@tanstack/react-router';
import { HomeLayout } from 'fumadocs-ui/layouts/home';
import { DefaultNotFound } from 'fumadocs-ui/layouts/home/not-found';
import { i18n } from '@/lib/i18n';
import { baseOptions } from '@/lib/layout.shared';

export function NotFound() {
  const { lang = i18n.defaultLanguage } = useParams({ strict: false });

  return (
    <HomeLayout {...baseOptions(lang)}>
      <DefaultNotFound />
    </HomeLayout>
  );
}
