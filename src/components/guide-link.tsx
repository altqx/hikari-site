import { Link } from '@tanstack/react-router';
import type { ReactNode } from 'react';
import { source } from '@/lib/source';

/**
 * Links to a guide once it is published. Until then (a draft, left out of production)
 * the children render without a link, so the homepage never links to a missing page.
 */
export function GuideLink({
  lang,
  guide,
  className,
  children,
}: {
  lang: string;
  guide: string;
  className?: string;
  children: (published: boolean) => ReactNode;
}) {
  if (!source.getPage(guide.split('/'), lang)) return <div className={className}>{children(false)}</div>;
  return (
    <Link to="/$lang/docs/$" params={{ lang, _splat: guide }} className={className}>
      {children(true)}
    </Link>
  );
}
