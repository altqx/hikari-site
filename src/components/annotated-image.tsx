import { ThemedImage } from './themed-image';

/**
 * A light and dark screenshot with numbered pins over it. Each pin is placed by percent of
 * the image; the legend that explains the numbers goes beside it in the MDX.
 */
export function AnnotatedImage({
  light,
  dark,
  alt,
  width,
  height,
  pins,
}: {
  light: string;
  dark: string;
  alt: string;
  width: number;
  height: number;
  /** [left %, top %] of each pin, numbered from 1. */
  pins: [number, number][];
}) {
  return (
    <div className="not-prose relative my-6">
      <ThemedImage
        light={light}
        dark={dark}
        alt={alt}
        width={width}
        height={height}
        className="w-full rounded-lg border"
      />
      {pins.map(([left, top], index) => (
        <span
          key={`${left},${top}`}
          aria-hidden
          className="absolute grid size-6 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border-2 border-fd-card bg-fd-primary text-xs font-semibold text-fd-primary-foreground shadow"
          style={{ left: `${left}%`, top: `${top}%` }}
        >
          {index + 1}
        </span>
      ))}
    </div>
  );
}
