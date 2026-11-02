// hikari-ingest: HikariSub's usage data endpoint on i.hikarisub.org. It forwards the
// two PostHog capture paths to PostHog's EU ingestion host and nothing else, so DNS
// blockers that follow CNAMEs see a plain Worker instead of PostHog's proxy.
// It logs nothing: no bodies, no IPs (wrangler.jsonc turns observability off).

export const upstreamOrigin = 'https://eu.i.posthog.com';
export const allowedPaths: ReadonlySet<string> = new Set(['/batch/', '/i/v0/e/']);
export const maxBodyBytes = 1024 * 1024;
export const timeoutMs = 10_000;

export interface IngestOptions {
  fetch: typeof fetch;
  maxBodyBytes: number;
  timeoutMs: number;
}

const droppedRequestHeaders = new Set([
  'cookie',
  'host',
  'forwarded',
  'x-real-ip',
  'true-client-ip',
  'accept-encoding',
  'connection',
  'keep-alive',
  'transfer-encoding',
]);

// Cookies, Cloudflare's own headers and anything carrying the client's address stay here.
export function forwardedRequestHeaders(headers: Headers): Headers {
  const out = new Headers();
  headers.forEach((value, name) => {
    const key = name.toLowerCase();
    if (droppedRequestHeaders.has(key) || key.startsWith('cf-') || key.startsWith('x-forwarded-')) return;
    out.set(name, value);
  });
  return out;
}

// The runtime decodes PostHog's response body, so its encoding and length no longer apply.
const droppedResponseHeaders = new Set([
  'content-encoding',
  'content-length',
  'transfer-encoding',
  'set-cookie',
]);

export function returnedResponseHeaders(headers: Headers): Headers {
  const out = new Headers();
  headers.forEach((value, name) => {
    const key = name.toLowerCase();
    if (droppedResponseHeaders.has(key) || key.startsWith('cf-')) return;
    out.append(name, value);
  });
  return out;
}

const plain = (status: number, text: string) =>
  new Response(text, { status, headers: { 'Content-Type': 'text/plain; charset=utf-8' } });

class BodyTooLarge extends Error {}

// Counts the bytes of a body without a Content-Length and stops it past the cap.
function capped(body: ReadableStream<Uint8Array>, limit: number, onTooLarge: () => void) {
  let seen = 0;
  return body.pipeThrough(
    new TransformStream<Uint8Array, Uint8Array>({
      transform(chunk, controller) {
        seen += chunk.byteLength;
        if (seen > limit) {
          onTooLarge();
          controller.error(new BodyTooLarge());
          return;
        }
        controller.enqueue(chunk);
      },
    }),
  );
}

export async function handleIngest(request: Request, options: IngestOptions): Promise<Response> {
  const url = new URL(request.url);
  const method = request.method.toUpperCase();
  if (!allowedPaths.has(url.pathname) || (method !== 'POST' && method !== 'OPTIONS')) {
    return plain(404, 'Not found');
  }

  const length = request.headers.get('content-length');
  if (length !== null && Number(length) > options.maxBodyBytes) return plain(413, 'Payload too large');

  let tooLarge = false;
  let body: ReadableStream<Uint8Array> | null = null;
  if (method === 'POST' && request.body) {
    // A body with a Content-Length goes through untouched; one without is counted on the way.
    body =
      length !== null
        ? request.body
        : capped(request.body, options.maxBodyBytes, () => {
            tooLarge = true;
          });
  }

  const signal = AbortSignal.timeout(options.timeoutMs);
  let upstream: Response;
  try {
    upstream = await options.fetch(`${upstreamOrigin}${url.pathname}${url.search}`, {
      method,
      headers: forwardedRequestHeaders(request.headers),
      body,
      signal,
      redirect: 'manual',
      // Needed to stream a request body outside Workers (Bun, Node); Workers ignore it.
      duplex: 'half',
    } as RequestInit);
  } catch (error) {
    if (tooLarge || error instanceof BodyTooLarge) return plain(413, 'Payload too large');
    if (signal.aborted) return plain(504, 'Gateway timeout');
    return plain(502, 'Bad gateway');
  }

  return new Response(upstream.body, {
    status: upstream.status,
    statusText: upstream.statusText,
    headers: returnedResponseHeaders(upstream.headers),
  });
}

export default {
  fetch(request: Request): Promise<Response> {
    return handleIngest(request, { fetch, maxBodyBytes, timeoutMs });
  },
};
