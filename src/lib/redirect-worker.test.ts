import { describe, expect, test } from 'bun:test';
import worker, { redirectTarget } from '../../redirect/worker';

describe('redirect worker', () => {
  test('keeps the path and the query', () => {
    expect(redirectTarget('https://hikarisub.altqx.com/en/docs/help/faq?x=1&y=2#top')).toBe(
      'https://hikarisub.org/en/docs/help/faq?x=1&y=2',
    );
    expect(redirectTarget('https://www.hikarisub.org/')).toBe('https://hikarisub.org/');
    expect(redirectTarget('http://hikarisub.altqx.com/en/docs/get-started/moving-from-legacy')).toBe(
      'https://hikarisub.org/en/docs/get-started/moving-from-legacy',
    );
  });

  test('answers with a permanent redirect and no body', async () => {
    const response = worker.fetch(new Request('https://hikarisub.altqx.com/en/docs?a=b'));
    expect(response.status).toBe(301);
    expect(response.headers.get('Location')).toBe('https://hikarisub.org/en/docs?a=b');
    expect(await response.text()).toBe('');
  });
});
