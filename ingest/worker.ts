// The entry module of hikari-ingest: only the default export, as workerd requires.
// The logic and its settings are in proxy.ts.
import { handleIngest, maxBodyBytes, timeoutMs } from './proxy';

export default {
  fetch(request: Request): Promise<Response> {
    return handleIngest(request, {
      fetch: (input, init) => fetch(input, init),
      maxBodyBytes,
      timeoutMs,
    });
  },
};
