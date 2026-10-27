import { expect, test } from '@playwright/test';

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
  const response = await page.goto('/en/docs/basics/grid');
  expect(response?.status()).toBe(404);
});

test('search finds a guide', async ({ page }) => {
  await page.goto('/en/docs');
  await page.getByRole('button', { name: /search/i }).first().click();
  const dialog = page.getByRole('dialog');
  await dialog.getByRole('combobox', { name: 'Search' }).fill('typesetting');
  await expect(dialog.getByText('HikariSub guides')).toBeVisible();
});

test('the theme toggle switches between light and dark', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'light' });
  await page.goto('/en/docs');
  const html = page.locator('html');
  await expect(html).not.toHaveClass(/dark/);
  await page.getByRole('button', { name: /toggle theme/i }).first().click();
  await expect(html).toHaveClass(/dark/);
});

test('unknown paths show the not-found page', async ({ page }) => {
  const response = await page.goto('/en/docs/no-such-page');
  expect(response?.status()).toBe(404);
  await expect(page.getByText(/not found/i).first()).toBeVisible();
});
