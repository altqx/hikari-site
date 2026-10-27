import { createFileRoute, notFound, Outlet } from '@tanstack/react-router';
import { i18n } from '@/lib/i18n';

export const Route = createFileRoute('/$lang')({
  beforeLoad: ({ params }) => {
    if (!(i18n.languages as readonly string[]).includes(params.lang)) throw notFound();
  },
  component: Outlet,
});
