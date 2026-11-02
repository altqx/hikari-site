// The entry module of hikari-site-redirect: only the default export, as workerd requires.
import { redirectTarget } from './target';

export default {
  fetch(request: Request): Response {
    return new Response(null, { status: 301, headers: { Location: redirectTarget(request.url) } });
  },
};
