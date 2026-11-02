// The site moved to hikarisub.org. This Worker answers on the old host and on www
// with a permanent redirect to the same path and query there, so links in shipped
// releases (such as /en/docs/... from the 0.1.0 betas) keep working.
export const siteOrigin = 'https://hikarisub.org';

export function redirectTarget(requestUrl: string): string {
  const { pathname, search } = new URL(requestUrl);
  return `${siteOrigin}${pathname}${search}`;
}

export default {
  fetch(request: Request): Response {
    return new Response(null, { status: 301, headers: { Location: redirectTarget(request.url) } });
  },
};
