import { Bug, SquarePen } from 'lucide-react';
import { editUrl, reportUrl } from '@/lib/shared';

export function PageActions({ path, url, title }: { path: string; url: string; title: string }) {
  const linkClass =
    'inline-flex items-center gap-1.5 text-sm text-fd-muted-foreground transition-colors hover:text-fd-foreground';

  return (
    <div className="flex flex-wrap gap-x-6 gap-y-2 border-t pt-4">
      <a href={editUrl(path)} className={linkClass} target="_blank" rel="noreferrer noopener">
        <SquarePen className="size-4" />
        Edit this page on GitHub
      </a>
      <a href={reportUrl(url, title)} className={linkClass} target="_blank" rel="noreferrer noopener">
        <Bug className="size-4" />
        Report a problem
      </a>
    </div>
  );
}
