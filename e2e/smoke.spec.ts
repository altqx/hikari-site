import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { expect, test } from '@playwright/test';

// A guide still marked draft: true, as /en/docs/<path>, or none once every guide is written.
function aDraftPage() {
  const root = 'content/docs';
  for (const file of readdirSync(root, { recursive: true, encoding: 'utf8' }).sort()) {
    if (!file.endsWith('.mdx')) continue;
    const front = readFileSync(join(root, file), 'utf8').split(/^---$/m)[1] ?? '';
    if (/^draft:\s*true\s*$/m.test(front)) return `/en/docs/${file.replace(/\.mdx$/, '')}`;
  }
}

test('the root redirects to the English homepage', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveURL(/\/en$/);
  await expect(page.getByRole('heading', { level: 1, name: 'HikariSub' })).toBeVisible();
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
});

test('a guide renders with its page actions', async ({ page }) => {
  await page.goto('/en/docs');
  await expect(page.getByRole('heading', { level: 1, name: 'HikariSub guides' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Edit this page on GitHub' })).toHaveAttribute(
    'href',
    'https://github.com/altqx/hikari-site/edit/main/content/docs/index.mdx',
  );
  await expect(page.getByRole('link', { name: 'Report a problem' })).toHaveAttribute(
    'href',
    /^https:\/\/github\.com\/altqx\/hikari\/issues\/new\?/,
  );
});

test('draft pages are left out of the production build', async ({ page }) => {
  const draft = aDraftPage();
  test.skip(!draft, 'every guide is published');
  const response = await page.goto(draft as string);
  expect(response?.status()).toBe(404);
});

test('search finds a guide', async ({ page }) => {
  await page.goto('/en/docs');
  await page
    .getByRole('button', { name: /search/i })
    .first()
    .click();
  const dialog = page.getByRole('dialog');
  await dialog.getByRole('combobox', { name: 'Search' }).fill('typesetting');
  await expect(dialog.getByText('HikariSub guides')).toBeVisible();
});

test('the theme toggle switches between light and dark', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'light' });
  await page.goto('/en/docs');
  const html = page.locator('html');
  await expect(html).not.toHaveClass(/dark/);
  await page
    .getByRole('button', { name: /toggle theme/i })
    .first()
    .click();
  await expect(html).toHaveClass(/dark/);
});

test('unknown paths show the not-found page', async ({ page }) => {
  const response = await page.goto('/en/docs/no-such-page');
  expect(response?.status()).toBe(404);
  await expect(page.getByText(/not found/i).first()).toBeVisible();
});

test('an ASS preview renders the line live', async ({ page }) => {
  await page.goto('/en/docs');
  const preview = page.locator('figure[data-ass-preview]');
  await preview.scrollIntoViewIfNeeded();
  await expect(preview).toHaveAttribute('data-ass-preview', 'live', { timeout: 20_000 });
  // The canvas holds only the subtitles, so any opaque pixel is the rendered line.
  await expect
    .poll(() =>
      page.getByTestId('ass-preview-canvas').evaluate((canvas: HTMLCanvasElement) => {
        const copy = document.createElement('canvas');
        copy.width = canvas.width;
        copy.height = canvas.height;
        const context = copy.getContext('2d');
        if (!context) return 0;
        context.drawImage(canvas, 0, 0);
        const { data } = context.getImageData(0, 0, copy.width, copy.height);
        let visible = 0;
        for (let i = 3; i < data.length; i += 4) if (data[i] > 0) visible++;
        return visible;
      }),
    )
    .toBeGreaterThan(1000);
});

test('with reduced motion an ASS preview shows its still', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/en/docs');
  const preview = page.locator('figure[data-ass-preview]');
  await preview.scrollIntoViewIfNeeded();
  await expect(preview).toHaveAttribute('data-ass-preview', 'still');
  const still = preview.getByRole('img', { name: /^The line rendered:/ });
  await expect(still).toHaveAttribute('src', (await preview.getAttribute('data-still')) ?? '');
  await expect.poll(() => still.evaluate((image: HTMLImageElement) => image.naturalWidth)).toBe(1280);
  await expect(page.getByTestId('ass-preview-canvas')).toHaveCount(0);
});

test('the credits page links the shipped licences', async ({ page }) => {
  await page.goto('/en/docs/credits');
  await expect(page.getByRole('heading', { level: 1, name: 'Credits' })).toBeVisible();
  const notices = await page.request.get('/licenses/akarisub.txt');
  expect(notices.ok()).toBe(true);
  expect(await notices.text()).toContain('libass');
});

test('the homepage has a Download button for the app', async ({ page }) => {
  await page.goto('/en');
  await expect(page.getByTestId('download-button')).toHaveAttribute(
    'href',
    /^https:\/\/github\.com\/altqx\/hikari\/releases/,
  );
});

test('the reference pages list the commands and settings of the docs export', async ({ page }) => {
  await page.goto('/en/docs/reference/hotkeys');
  const help = page.getByTestId('hotkeys-Global').getByRole('row', { name: /^User guide/ });
  await expect(help.locator('kbd')).toHaveText('F1');
  await expect(help).toContainText('Help › User guide');
  await page.goto('/en/docs/reference/settings');
  await expect(
    page.getByTestId('settings-general').getByRole('row', { name: /Tab name length/ }),
  ).toContainText('20 to 150 characters');
});

test('search finds a setting that only the generated reference lists', async ({ page }) => {
  await page.goto('/en/docs');
  await page
    .getByRole('button', { name: /search/i })
    .first()
    .click();
  const dialog = page.getByRole('dialog');
  await dialog.getByRole('combobox', { name: 'Search' }).fill('Tab name length');
  await expect(dialog.getByText('Tab name length').first()).toBeVisible();
});

test('a clip plays in view, with an AV1 source and an H.264 fallback', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'light' });
  await page.goto('/en/docs/typesetting/visual-tools');
  const clip = page.locator('[data-clip]:visible');
  await expect(clip).toHaveCount(1);
  const sources = clip.locator('video source');
  await expect(sources).toHaveCount(2);
  await expect(sources.nth(0)).toHaveAttribute('type', /codecs="av01\./);
  await expect(sources.nth(1)).toHaveAttribute('type', /codecs="avc1\./);
  for (const source of await sources.all()) {
    const response = await page.request.get((await source.getAttribute('src')) ?? '');
    expect(response.ok()).toBe(true);
    expect(response.headers()['content-type']).toContain('video/mp4');
  }
  await expect(clip.locator('video')).toHaveAttribute('poster', /perspective-light/);
  await clip.scrollIntoViewIfNeeded();
  await expect(clip).toHaveAttribute('data-clip', 'playing', { timeout: 10_000 });
  await page.evaluate(() => window.scrollTo(0, 0));
  await expect(clip).toHaveAttribute('data-clip', 'paused');
});

test('with reduced motion a clip shows its still until Play is pressed', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/en/docs/typesetting/visual-tools');
  const clip = page.locator('[data-clip]:visible');
  await clip.scrollIntoViewIfNeeded();
  await page.waitForTimeout(1000);
  await expect(clip).toHaveAttribute('data-clip', 'paused');
  expect(await clip.locator('video').evaluate((video: HTMLVideoElement) => video.currentTime)).toBe(0);
  await clip.getByRole('button', { name: 'Play clip' }).click();
  await expect(clip).toHaveAttribute('data-clip', 'playing', { timeout: 10_000 });
  await clip.getByRole('button', { name: 'Pause clip' }).click();
  await expect(clip).toHaveAttribute('data-clip', 'paused');
});
