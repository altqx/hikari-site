import { describe, expect, test } from 'bun:test';
import { gunzipSync, gzipSync } from 'node:zlib';
import { handleIngest, type IngestOptions } from '../../ingest/worker';

interface Seen {
  url: string;
  method: string;
  headers: Headers;
  body: Uint8Array | null;
}

// A stand-in for PostHog: records what reached it and answers with `reply`.
function upstream(reply: () => Response = () => new Response('{"status":1}', { status: 200 })) {
  const seen: Seen[] = [];
  const fakeFetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const body = init?.body ? new Uint8Array(await new Response(init.body as BodyInit).arrayBuffer()) : null;
    seen.push({
      url: String(input),
      method: init?.method ?? 'GET',
      headers: new Headers(init?.headers),
      body,
    });
    return reply();
  }) as typeof fetch;
  return { seen, fakeFetch };
}

const options = (fakeFetch: typeof fetch, extra: Partial<IngestOptions> = {}): IngestOptions => ({
  fetch: fakeFetch,
  maxBodyBytes: 1024,
  timeoutMs: 1000,
  ...extra,
});

const post = (path: string, body: BodyInit | null, headers: Record<string, string> = {}) =>
  new Request(`https://i.hikarisub.org${path}`, {
    method: 'POST',
    body,
    headers,
    duplex: 'half',
  } as RequestInit);

describe('allowlist', () => {
  test('forwards POST /batch/ and /i/v0/e/ with the same path and query', async () => {
    const { seen, fakeFetch } = upstream();
    expect((await handleIngest(post('/batch/?ver=1', '{}'), options(fakeFetch))).status).toBe(200);
    expect((await handleIngest(post('/i/v0/e/', '{}'), options(fakeFetch))).status).toBe(200);
    expect(seen.map((s) => s.url)).toEqual([
      'https://eu.i.posthog.com/batch/?ver=1',
      'https://eu.i.posthog.com/i/v0/e/',
    ]);
  });

  test('forwards the OPTIONS preflight of an allowed path, without a body', async () => {
    const { seen, fakeFetch } = upstream(() => new Response(null, { status: 204 }));
    const preflight = new Request('https://i.hikarisub.org/batch/', { method: 'OPTIONS' });
    expect((await handleIngest(preflight, options(fakeFetch))).status).toBe(204);
    expect(seen[0]).toMatchObject({ method: 'OPTIONS', body: null });
  });

  test('everything else is a plain 404 and never reaches PostHog', async () => {
    const { seen, fakeFetch } = upstream();
    const requests = [
      new Request('https://i.hikarisub.org/batch/'),
      new Request('https://i.hikarisub.org/decide/', { method: 'POST', body: '{}' }),
      new Request('https://i.hikarisub.org/batch', { method: 'POST', body: '{}' }),
      new Request('https://i.hikarisub.org/', { method: 'POST', body: '{}' }),
      new Request('https://i.hikarisub.org/i/v0/e/', { method: 'PUT', body: '{}' }),
    ];
    for (const request of requests) {
      const response = await handleIngest(request, options(fakeFetch));
      expect(response.status).toBe(404);
      expect(response.headers.get('content-type')).toStartWith('text/plain');
    }
    expect(seen).toHaveLength(0);
  });
});

describe('headers', () => {
  test('drops cookies, CF-* and X-Forwarded-* and the client address; keeps the rest', async () => {
    const { seen, fakeFetch } = upstream();
    await handleIngest(
      post('/batch/', '{}', {
        'Content-Type': 'application/json',
        'User-Agent': 'HikariSub/0.1.0',
        Cookie: 'a=b',
        'CF-Connecting-IP': '203.0.113.7',
        'CF-IPCountry': 'PL',
        'CF-Ray': 'abc',
        'X-Forwarded-For': '203.0.113.7',
        'X-Forwarded-Proto': 'https',
        'X-Real-IP': '203.0.113.7',
        'True-Client-IP': '203.0.113.7',
        Forwarded: 'for=203.0.113.7',
      }),
      options(fakeFetch),
    );
    const names = [...seen[0].headers.keys()];
    expect(
      names.filter((n) => /^(cookie|cf-|x-forwarded-|x-real-ip|true-client-ip|forwarded)/.test(n)),
    ).toEqual([]);
    expect(seen[0].headers.get('content-type')).toBe('application/json');
    expect(seen[0].headers.get('user-agent')).toBe('HikariSub/0.1.0');
  });

  test("returns PostHog's status and body, without stale encoding, length or cookies", async () => {
    const { fakeFetch } = upstream(
      () =>
        new Response('{"type":"authentication_error"}', {
          status: 401,
          headers: {
            'Content-Type': 'application/json',
            'Content-Encoding': 'gzip',
            'Content-Length': '999',
            'Set-Cookie': 'x=y',
            'CF-Ray': 'abc',
          },
        }),
    );
    const response = await handleIngest(post('/batch/', '{}'), options(fakeFetch));
    expect(response.status).toBe(401);
    expect(await response.text()).toBe('{"type":"authentication_error"}');
    expect(response.headers.get('content-type')).toBe('application/json');
    for (const name of ['content-encoding', 'content-length', 'set-cookie', 'cf-ray']) {
      expect(response.headers.has(name)).toBe(false);
    }
  });
});

describe('body', () => {
  test('a gzip body goes through byte for byte, with its Content-Type and Content-Encoding', async () => {
    const { seen, fakeFetch } = upstream();
    const json = JSON.stringify({ api_key: 'phc_x', batch: [{ event: 'app_started' }] });
    const gz = gzipSync(json);
    await handleIngest(
      post('/batch/', gz, {
        'Content-Type': 'application/json',
        'Content-Encoding': 'gzip',
        'Content-Length': String(gz.byteLength),
      }),
      options(fakeFetch),
    );
    expect(seen[0].headers.get('content-encoding')).toBe('gzip');
    expect(seen[0].headers.get('content-type')).toBe('application/json');
    expect(Buffer.from(seen[0].body ?? []).equals(Buffer.from(gz))).toBe(true);
    expect(gunzipSync(seen[0].body ?? new Uint8Array()).toString()).toBe(json);
  });

  test('a declared length over the cap is refused with 413 before PostHog is asked', async () => {
    const { seen, fakeFetch } = upstream();
    const big = new Uint8Array(2048);
    const response = await handleIngest(
      post('/batch/', big, { 'Content-Length': String(big.byteLength) }),
      options(fakeFetch),
    );
    expect(response.status).toBe(413);
    expect(seen).toHaveLength(0);
  });

  test('a streamed body without a length is stopped with 413 once it passes the cap', async () => {
    const { fakeFetch } = upstream();
    const chunks = [new Uint8Array(600), new Uint8Array(600)];
    const stream = new ReadableStream<Uint8Array>({
      pull(controller) {
        const next = chunks.shift();
        if (next) controller.enqueue(next);
        else controller.close();
      },
    });
    const request = post('/batch/', stream);
    expect(request.headers.has('content-length')).toBe(false);
    expect((await handleIngest(request, options(fakeFetch))).status).toBe(413);
  });

  test('a streamed body under the cap goes through whole', async () => {
    const { seen, fakeFetch } = upstream();
    const stream = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(new Uint8Array([1, 2, 3]));
        controller.close();
      },
    });
    expect((await handleIngest(post('/batch/', stream), options(fakeFetch))).status).toBe(200);
    expect([...(seen[0].body ?? [])]).toEqual([1, 2, 3]);
  });
});

describe('timeout and errors', () => {
  test('PostHog not answering in time gives 504', async () => {
    const hanging = ((_input: RequestInfo | URL, init?: RequestInit) =>
      new Promise<Response>((_resolve, reject) => {
        init?.signal?.addEventListener('abort', () => reject(init.signal?.reason));
      })) as typeof fetch;
    const response = await handleIngest(post('/batch/', '{}'), options(hanging, { timeoutMs: 50 }));
    expect(response.status).toBe(504);
  });

  test('PostHog unreachable gives 502', async () => {
    const failing = (async (_input: RequestInfo | URL, _init?: RequestInit): Promise<Response> => {
      throw new TypeError('network down');
    }) as typeof fetch;
    expect((await handleIngest(post('/batch/', '{}'), options(failing))).status).toBe(502);
  });
});
