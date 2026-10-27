/**
 * An animated light and dark image that shows a still frame instead with reduced motion.
 * A stand-in for the muted clips (#5) until they are captured.
 */
export function MotionImage({
  light,
  dark,
  lightStill,
  darkStill,
  alt,
  width,
  height,
}: {
  light: string;
  dark: string;
  lightStill: string;
  darkStill: string;
  alt: string;
  width: number;
  height: number;
}) {
  const image = 'w-full rounded-lg border';
  return (
    <>
      <picture className="dark:hidden">
        <source media="(prefers-reduced-motion: reduce)" srcSet={lightStill} />
        <img src={light} alt={alt} width={width} height={height} className={image} />
      </picture>
      <picture className="hidden dark:block">
        <source media="(prefers-reduced-motion: reduce)" srcSet={darkStill} />
        <img src={dark} alt={alt} width={width} height={height} className={image} />
      </picture>
    </>
  );
}
