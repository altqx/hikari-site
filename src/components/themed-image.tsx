import type { ComponentProps } from 'react';

/** A light and a dark screenshot; the one matching the site theme shows. */
export function ThemedImage({
  light,
  dark,
  alt,
  className = '',
  ...props
}: Omit<ComponentProps<'img'>, 'src'> & { light: string; dark: string; alt: string }) {
  return (
    <>
      <img src={light} alt={alt} className={`dark:hidden ${className}`} {...props} />
      <img src={dark} alt={alt} className={`hidden dark:block ${className}`} {...props} />
    </>
  );
}
