import { Image } from 'lucide-react';

/**
 * Stands in for a screenshot until the beta.4 recapture (CX7, altqx/hikari#810). It says what
 * the picture will show, so the page reads the same before and after.
 */
export function ShotPlaceholder({
  shows,
  caption,
  aspect = '16 / 9',
  className = 'my-6',
}: {
  /** What the picture will show. */
  shows: string;
  caption?: string;
  aspect?: string;
  /** Margins; inside a tile, none. */
  className?: string;
}) {
  return (
    <figure className={`not-prose ${className}`} data-testid="shot-placeholder">
      <div
        className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed bg-fd-muted/40 p-6 text-center text-sm text-fd-muted-foreground"
        style={{ aspectRatio: aspect }}
      >
        <Image className="size-6 opacity-60" aria-hidden />
        <span className="max-w-[46ch]">{shows}</span>
        <span className="text-xs opacity-80">Picture coming with the beta.4 screenshots.</span>
      </div>
      {caption && <figcaption className="mt-2.5 text-xs text-fd-muted-foreground">{caption}</figcaption>}
    </figure>
  );
}
