import { createFileRoute, Link } from '@tanstack/react-router';
import { HomeLayout } from 'fumadocs-ui/layouts/home';
import { baseOptions } from '@/lib/layout.shared';

// Placeholder until the homepage design (#2) is approved.
export const Route = createFileRoute('/$lang/')({
  component: Home,
});

function Home() {
  const { lang } = Route.useParams();

  return (
    <HomeLayout {...baseOptions(lang)}>
      <main className="flex flex-col flex-1 items-center justify-center gap-4 px-4 py-16 text-center">
        <h1 className="text-3xl font-semibold">HikariSub</h1>
        <p className="max-w-md text-fd-muted-foreground">
          A subtitle editor and player for everything from quick fixes to full typesetting.
        </p>
        <Link
          to="/$lang/docs/$"
          params={{ lang, _splat: '' }}
          className="rounded-lg bg-fd-primary px-4 py-2 text-sm font-medium text-fd-primary-foreground"
        >
          Read the guides
        </Link>
      </main>
    </HomeLayout>
  );
}
